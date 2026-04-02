import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Plus } from "lucide-react";
import { formatDate, formatDateTime, fullName } from "@/lib/utils";
import { PeriodAssignment } from "@/components/contacts/period-assignment";

const typeLabel: Record<string, string> = {
  STUDENT: "Student",
  PARENT_GUARDIAN: "Parent / Guardian",
  OTHER: "Other",
};

const statusColor: Record<string, "default" | "success" | "warning" | "info"> = {
  SCHEDULED: "info",
  COMPLETED: "success",
  CANCELLED: "default",
  NO_SHOW: "warning",
};

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      account: true,
      school: {
        include: { periods: { orderBy: { position: "asc" } } },
      },
      subjects: { include: { subject: true } },
      contactPeriods: {
        include: { period: true },
        orderBy: { period: { position: "asc" } },
      },
      crmSessions: {
        orderBy: { date: "desc" },
        take: 20,
      },
    },
  });

  if (!contact) notFound();

  const isStudent = contact.type === "STUDENT";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/contacts"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-neutral-900">
                {fullName(contact.firstName, contact.lastName)}
              </h1>
              <Badge variant="secondary">{typeLabel[contact.type]}</Badge>
            </div>
            <Link href={`/accounts/${contact.accountId}`} className="text-sm text-neutral-500 hover:underline">
              {contact.account.name}
            </Link>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/contacts/${contact.id}/edit`}>
            <Edit className="h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {contact.email && <InfoRow label="Email" value={contact.email} />}
            {contact.phone && <InfoRow label="Phone" value={contact.phone} />}
            {isStudent && contact.school && <InfoRow label="School" value={contact.school.name} />}
            {isStudent && contact.subjects.length > 0 && (
              <div>
                <span className="text-neutral-500">Subjects</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {contact.subjects.map((cs) => (
                    <Badge key={cs.id} variant="outline">{cs.subject.name}</Badge>
                  ))}
                </div>
              </div>
            )}
            {contact.notes && (
              <div className="pt-2">
                <p className="text-neutral-500 mb-1">Notes</p>
                <p className="text-neutral-700 whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {isStudent && contact.school && (
          <PeriodAssignment
            contactId={contact.id}
            schoolPeriods={contact.school.periods}
            initialAssignments={contact.contactPeriods}
          />
        )}
      </div>

      {isStudent && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Sessions</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/sessions/new?contactId=${contact.id}`}>
                <Plus className="h-4 w-4" />
                New Session
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {contact.crmSessions.length === 0 ? (
              <p className="text-sm text-neutral-500">No sessions recorded yet.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {contact.crmSessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/sessions/${s.id}`}
                    className="flex items-center justify-between py-3 hover:bg-neutral-50 px-1 rounded"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {formatDateTime(s.date)}
                      </p>
                      {s.subject && (
                        <p className="text-xs text-neutral-500">{s.subject}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">{s.durationMins} min</span>
                      <Badge variant={statusColor[s.status] ?? "default"}>{s.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
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
