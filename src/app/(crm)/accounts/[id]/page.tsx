import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Plus, UserCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await prisma.crmAccount.findUnique({
    where: { id },
    include: {
      contacts: {
        include: { school: true, subjects: { include: { subject: true } } },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
      emailThreads: { orderBy: { lastMessageDate: "desc" }, take: 10 },
    },
  });

  if (!account) notFound();

  const contactTypeLabel: Record<string, string> = {
    STUDENT: "Student",
    PARENT_GUARDIAN: "Parent/Guardian",
    OTHER: "Other",
  };

  const contactTypeBadge: Record<string, "default" | "secondary" | "info"> = {
    STUDENT: "info",
    PARENT_GUARDIAN: "secondary",
    OTHER: "default",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/accounts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{account.name}</h1>
            <p className="text-sm text-neutral-500">
              Account · Updated {formatDate(account.updatedAt)}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/accounts/${account.id}/edit`}>
            <Edit className="h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      {account.notes && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{account.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Contacts</CardTitle>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/contacts/new?accountId=${account.id}`}>
              <Plus className="h-4 w-4" />
              Add Contact
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {account.contacts.length === 0 ? (
            <p className="text-sm text-neutral-500">No contacts yet.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {account.contacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="flex items-center justify-between py-3 hover:bg-neutral-50 px-1 rounded transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <UserCircle className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {contact.email ?? contact.phone ?? "No contact info"}
                        {contact.school && ` · ${contact.school.name}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={contactTypeBadge[contact.type] ?? "default"}>
                    {contactTypeLabel[contact.type] ?? contact.type}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {account.emailThreads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-neutral-100">
              {account.emailThreads.map((thread) => (
                <div key={thread.id} className="py-3">
                  <p className="text-sm font-medium text-neutral-900">
                    {thread.subject ?? "(No subject)"}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                    {thread.snippet}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {formatDate(thread.lastMessageDate)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
