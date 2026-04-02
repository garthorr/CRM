import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function AccountsPage() {
  const accounts = await prisma.crmAccount.findMany({
    include: { _count: { select: { contacts: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Accounts</h1>
        <Button asChild size="sm">
          <Link href="/accounts/new">
            <Plus className="h-4 w-4" />
            New Account
          </Link>
        </Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {accounts.map((account) => (
            <Link key={account.id} href={`/accounts/${account.id}`}>
              <Card className="hover:border-neutral-300 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-neutral-500" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{account.name}</p>
                      <p className="text-xs text-neutral-500">
                        Updated {formatDate(account.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {account._count.contacts}{" "}
                    {account._count.contacts === 1 ? "contact" : "contacts"}
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

function EmptyState() {
  return (
    <div className="text-center py-16 text-neutral-400">
      <Users className="h-10 w-10 mx-auto mb-3" />
      <p className="font-medium">No accounts yet</p>
      <p className="text-sm mt-1">Create your first account to get started.</p>
    </div>
  );
}
