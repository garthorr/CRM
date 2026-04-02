import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCircle } from "lucide-react";

const typeLabel: Record<string, string> = {
  STUDENT: "Student",
  PARENT_GUARDIAN: "Parent/Guardian",
  OTHER: "Other",
};

const typeBadge: Record<string, "default" | "secondary" | "info"> = {
  STUDENT: "info",
  PARENT_GUARDIAN: "secondary",
  OTHER: "default",
};

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;

  const contacts = await prisma.contact.findMany({
    where: type ? { type: type as never } : undefined,
    include: {
      account: true,
      school: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Contacts</h1>
        <Button asChild size="sm">
          <Link href="/contacts/new">
            <Plus className="h-4 w-4" />
            New Contact
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        {[
          { label: "All", value: "" },
          { label: "Students", value: "STUDENT" },
          { label: "Parents/Guardians", value: "PARENT_GUARDIAN" },
          { label: "Other", value: "OTHER" },
        ].map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/contacts?type=${f.value}` : "/contacts"}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              (type ?? "") === f.value
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <UserCircle className="h-10 w-10 mx-auto mb-3" />
          <p className="font-medium">No contacts yet</p>
          <p className="text-sm mt-1">Add contacts to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {contacts.map((contact) => (
            <Link key={contact.id} href={`/contacts/${contact.id}`}>
              <Card className="hover:border-neutral-300 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center">
                      <UserCircle className="h-4 w-4 text-neutral-500" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {contact.account.name}
                        {contact.school && ` · ${contact.school.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.email && (
                      <span className="text-xs text-neutral-400 hidden sm:inline">
                        {contact.email}
                      </span>
                    )}
                    <Badge variant={typeBadge[contact.type] ?? "default"}>
                      {typeLabel[contact.type] ?? contact.type}
                    </Badge>
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
