import { google } from "googleapis";
import { getGoogleClient } from "./client";
import { prisma } from "@/lib/prisma";

export async function pushSessionToCalendar(
  userId: string,
  sessionId: string
): Promise<string | null> {
  const session = await prisma.crmSession.findUnique({
    where: { id: sessionId },
    include: {
      contact: { include: { account: true } },
    },
  });
  if (!session) return null;

  const auth = await getGoogleClient(userId);
  const calendar = google.calendar({ version: "v3", auth });

  const endTime = new Date(
    new Date(session.date).getTime() + session.durationMins * 60 * 1000
  );

  const eventBody = {
    summary: `Tutoring: ${session.contact.firstName} ${session.contact.lastName}${session.subject ? ` — ${session.subject}` : ""}`,
    description: session.notes ?? "",
    start: { dateTime: session.date.toISOString() },
    end: { dateTime: endTime.toISOString() },
  };

  let googleEventId: string | null = null;

  if (session.googleEventId) {
    // Update existing event
    try {
      await calendar.events.update({
        calendarId: "primary",
        eventId: session.googleEventId,
        requestBody: eventBody,
      });
      googleEventId = session.googleEventId;
    } catch {
      // Event may have been deleted; create new
      googleEventId = await createCalendarEvent(calendar, eventBody);
    }
  } else {
    googleEventId = await createCalendarEvent(calendar, eventBody);
  }

  if (googleEventId) {
    await prisma.crmSession.update({
      where: { id: sessionId },
      data: { googleEventId },
    });
  }

  return googleEventId;
}

async function createCalendarEvent(
  calendar: ReturnType<typeof google.calendar>,
  body: object
): Promise<string | null> {
  const resp = await calendar.events.insert({
    calendarId: "primary",
    requestBody: body,
    sendNotifications: false,
  });
  return resp.data.id ?? null;
}

export async function pullCalendarEvents(
  userId: string,
  dateFrom: Date,
  dateTo: Date
) {
  const auth = await getGoogleClient(userId);
  const calendar = google.calendar({ version: "v3", auth });

  const resp = await calendar.events.list({
    calendarId: "primary",
    timeMin: dateFrom.toISOString(),
    timeMax: dateTo.toISOString(),
    maxResults: 250,
    singleEvents: true,
    orderBy: "startTime",
  });

  return resp.data.items ?? [];
}

export async function syncCalendarToSessions(userId: string) {
  const now = new Date();
  const dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const dateTo = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  const events = await pullCalendarEvents(userId, dateFrom, dateTo);
  let synced = 0;

  for (const event of events) {
    if (!event.id) continue;

    // Find CRM session linked to this event
    const session = await prisma.crmSession.findFirst({
      where: { googleEventId: event.id },
    });

    if (!session) continue;

    // If event is cancelled, update session status
    if (event.status === "cancelled" && session.status === "SCHEDULED") {
      await prisma.crmSession.update({
        where: { id: session.id },
        data: { status: "CANCELLED" },
      });
      synced++;
    }
  }

  return { synced };
}
