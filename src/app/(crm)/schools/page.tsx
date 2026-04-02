import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, School } from "lucide-react";

export default async function SchoolsPage() {
  const schools = await prisma.school.findMany({
    include: {
      _count: { select: { contacts: true, periods: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Schools</h1>
        <Button asChild size="sm">
          <Link href="/schools/new">
            <Plus className="h-4 w-4" />
            New School
          </Link>
        </Button>
      </div>

      {schools.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <School className="h-10 w-10 mx-auto mb-3" />
          <p className="font-medium">No schools yet</p>
          <p className="text-sm mt-1">Add schools to assign students to them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {schools.map((school) => (
            <Link key={school.id} href={`/schools/${school.id}`}>
              <Card className="hover:border-neutral-300 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center">
                      <School className="h-4 w-4 text-neutral-500" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{school.name}</p>
                      {school.city && (
                        <p className="text-xs text-neutral-500">
                          {school.city}{school.state ? `, ${school.state}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{school._count.contacts} students</Badge>
                    <Badge variant="outline">{school._count.periods} periods</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
