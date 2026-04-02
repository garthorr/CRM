import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  // Load sessions for the current month +/- 2 months
  const now = new Date();
  const dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const dateTo = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  const sessions = await prisma.crmSession.findMany({
    where: {
      date: { gte: dateFrom, lte: dateTo },
    },
    include: {
      contact: {
        select: {
          firstName: true,
          lastName: true,
          account: { select: { name: true } },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  const events = sessions.map((s) => ({
    id: s.id,
    title: `${s.contact.firstName} ${s.contact.lastName}${s.subject ? ` — ${s.subject}` : ""}`,
    start: s.date,
    end: new Date(new Date(s.date).getTime() + s.durationMins * 60 * 1000),
    status: s.status,
    contactName: `${s.contact.firstName} ${s.contact.lastName}`,
    accountName: s.contact.account.name,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-neutral-900">Calendar</h1>
      <CalendarView events={events} />
    </div>
  );
}
