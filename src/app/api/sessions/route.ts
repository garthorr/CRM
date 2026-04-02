import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, serverError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const contactId = req.nextUrl.searchParams.get("contactId");
    const status = req.nextUrl.searchParams.get("status");
    const dateFrom = req.nextUrl.searchParams.get("dateFrom");
    const dateTo = req.nextUrl.searchParams.get("dateTo");

    const sessions = await prisma.crmSession.findMany({
      where: {
        ...(contactId && { contactId }),
        ...(status && { status: status as never }),
        ...(dateFrom || dateTo
          ? {
              date: {
                ...(dateFrom && { gte: new Date(dateFrom) }),
                ...(dateTo && { lte: new Date(dateTo) }),
              },
            }
          : {}),
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            account: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });
    return ok(sessions);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const body = await req.json();
    const { contactId, date, durationMins, subject, status, notes, googleEventId, customData } = body;
    if (!contactId || !date) return err("contactId and date are required");

    const crmSession = await prisma.crmSession.create({
      data: {
        contactId,
        date: new Date(date),
        durationMins: durationMins ?? 60,
        subject,
        status: status ?? "SCHEDULED",
        notes,
        googleEventId,
        customData: customData ?? {},
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            account: { select: { id: true, name: true } },
          },
        },
      },
    });
    return ok(crmSession, 201);
  } catch (e) {
    return serverError(e);
  }
}
