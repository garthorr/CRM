import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const statusColor: Record<string, "default" | "success" | "warning" | "info"> = {
  SCHEDULED: "info",
  COMPLETED: "success",
  CANCELLED: "default",
  NO_SHOW: "warning",
};

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const sessions = await prisma.crmSession.findMany({
    where: status ? { status: status as never } : undefined,
    include: {
      contact: {
        select: {
          firstName: true,
          lastName: true,
          account: { select: { name: true } },
        },
      },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Sessions</h1>
        <Button asChild size="sm">
          <Link href="/sessions/new">
            <Plus className="h-4 w-4" />
            New Session
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        {[
          { label: "All", value: "" },
          { label: "Scheduled", value: "SCHEDULED" },
          { label: "Completed", value: "COMPLETED" },
          { label: "Cancelled", value: "CANCELLED" },
          { label: "No Show", value: "NO_SHOW" },
        ].map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/sessions?status=${f.value}` : "/sessions"}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              (status ?? "") === f.value
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <BookOpen className="h-10 w-10 mx-auto mb-3" />
          <p className="font-medium">No sessions yet</p>
          <p className="text-sm mt-1">Log your first tutoring session.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {sessions.map((session) => (
            <Link key={session.id} href={`/sessions/${session.id}`}>
              <Card className="hover:border-neutral-300 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-neutral-900">
                      {session.contact.firstName} {session.contact.lastName}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {session.contact.account.name} · {formatDateTime(session.date)} · {session.durationMins} min
                    </p>
                    {session.subject && (
                      <p className="text-xs text-neutral-500 mt-0.5">{session.subject}</p>
                    )}
                  </div>
                  <Badge variant={statusColor[session.status] ?? "default"}>
                    {session.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
