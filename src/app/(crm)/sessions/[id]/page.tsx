import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const statusColor: Record<string, "default" | "success" | "warning" | "info"> = {
  SCHEDULED: "info",
  COMPLETED: "success",
  CANCELLED: "default",
  NO_SHOW: "warning",
};

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await prisma.crmSession.findUnique({
    where: { id },
    include: {
      contact: { include: { account: true, school: true } },
    },
  });

  if (!session) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/sessions"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              {session.contact.firstName} {session.contact.lastName}
            </h1>
            <p className="text-sm text-neutral-500">
              {formatDateTime(session.date)} · {session.durationMins} min
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusColor[session.status] ?? "default"}>{session.status}</Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/sessions/${session.id}/edit`}>
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 space-y-2 text-sm">
            <InfoRow label="Student" value={`${session.contact.firstName} ${session.contact.lastName}`} />
            <InfoRow label="Account" value={session.contact.account.name} />
            {session.contact.school && <InfoRow label="School" value={session.contact.school.name} />}
            {session.subject && <InfoRow label="Subject" value={session.subject} />}
            <InfoRow label="Duration" value={`${session.durationMins} minutes`} />
          </CardContent>
        </Card>
        <div />
      </div>

      {session.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Session Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
              {session.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-neutral-500 w-20 shrink-0">{label}</span>
      <span className="text-neutral-900">{value}</span>
    </div>
  );
}
