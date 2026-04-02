import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const [accountCount, contactCount, sessionCount, upcomingSessions] =
    await Promise.all([
      prisma.crmAccount.count(),
      prisma.contact.count({ where: { type: "STUDENT" } }),
      prisma.crmSession.count({ where: { status: "COMPLETED" } }),
      prisma.crmSession.findMany({
        where: {
          status: "SCHEDULED",
          date: { gte: new Date() },
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
        take: 10,
      }),
    ]);

  const statusColor: Record<string, "default" | "success" | "warning" | "info"> = {
    SCHEDULED: "info",
    COMPLETED: "success",
    CANCELLED: "secondary" as never,
    NO_SHOW: "warning",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Accounts" value={accountCount} href="/accounts" />
        <StatCard title="Active Students" value={contactCount} href="/contacts?type=STUDENT" />
        <StatCard title="Sessions Completed" value={sessionCount} href="/sessions?status=COMPLETED" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <p className="text-sm text-neutral-500">No upcoming sessions.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {upcomingSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between py-3 hover:bg-neutral-50 px-2 rounded"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {s.contact.firstName} {s.contact.lastName}
                    </p>
                    <p className="text-xs text-neutral-500">{s.contact.account.name}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-sm text-neutral-700">{formatDate(s.date)}</p>
                      {s.subject && (
                        <p className="text-xs text-neutral-500">{s.subject}</p>
                      )}
                    </div>
                    <Badge variant={statusColor[s.status] ?? "default"}>{s.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-neutral-300 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-500">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-neutral-900">{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
