import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit } from "lucide-react";
import { PeriodManager } from "@/components/schools/period-manager";

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      periods: { orderBy: { position: "asc" } },
      contacts: {
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
    },
  });

  if (!school) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/schools"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{school.name}</h1>
            {school.city && (
              <p className="text-sm text-neutral-500">
                {school.city}{school.state ? `, ${school.state}` : ""}
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/schools/${school.id}/edit`}>
            <Edit className="h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">School Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {school.address && <InfoRow label="Address" value={school.address} />}
            {school.phone && <InfoRow label="Phone" value={school.phone} />}
            {school.website && <InfoRow label="Website" value={school.website} />}
            {school.notes && (
              <div>
                <p className="text-neutral-500 font-medium">Notes</p>
                <p className="text-neutral-700 mt-1 whitespace-pre-wrap">{school.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <PeriodManager schoolId={school.id} initialPeriods={school.periods} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Students at this School</CardTitle>
        </CardHeader>
        <CardContent>
          {school.contacts.length === 0 ? (
            <p className="text-sm text-neutral-500">No students assigned yet.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {school.contacts.map((c) => (
                <Link
                  key={c.id}
                  href={`/contacts/${c.id}`}
                  className="flex items-center py-2 hover:bg-neutral-50 px-1 rounded text-sm"
                >
                  <span className="font-medium text-neutral-900">
                    {c.firstName} {c.lastName}
                  </span>
                  {c.email && (
                    <span className="ml-2 text-neutral-400">· {c.email}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
