import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, RefreshCw } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { GmailSyncButton } from "@/components/gmail/gmail-sync-button";

export default async function EmailPage() {
  const threads = await prisma.emailThread.findMany({
    include: {
      account: { select: { id: true, name: true } },
    },
    orderBy: { lastMessageDate: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Email</h1>
        <GmailSyncButton />
      </div>

      {threads.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <Mail className="h-10 w-10 mx-auto mb-3" />
          <p className="font-medium">No email threads synced yet</p>
          <p className="text-sm mt-1">
            Click &ldquo;Sync Gmail&rdquo; to pull recent emails associated with your contacts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/accounts/${thread.accountId}`}
            >
              <Card className="hover:border-neutral-300 transition-colors cursor-pointer">
                <CardContent className="flex items-start justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900 text-sm truncate">
                        {thread.subject ?? "(No subject)"}
                      </p>
                      {thread.unread && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {thread.snippet}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {thread.account.name}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400 ml-4 shrink-0">
                    {formatRelative(thread.lastMessageDate)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
