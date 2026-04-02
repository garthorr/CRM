"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Users, RefreshCw } from "lucide-react";

export default function IntegrationsPage() {
  const [syncing, setSyncing] = useState<string | null>(null);

  async function triggerSync(endpoint: string, key: string) {
    setSyncing(key);
    try {
      await fetch(endpoint, { method: "POST" });
    } finally {
      setSyncing(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Integrations</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Connect Google Workspace to sync emails, calendar, and contacts.
        </p>
      </div>

      <IntegrationCard
        icon={<Mail className="h-5 w-5 text-red-500" />}
        title="Gmail"
        description="Sync email threads and associate them with accounts by matching contact email addresses."
        badgeLabel="Gmail API"
        onSync={() => triggerSync("/api/google/gmail/sync", "gmail")}
        syncing={syncing === "gmail"}
      />

      <IntegrationCard
        icon={<Calendar className="h-5 w-5 text-blue-500" />}
        title="Google Calendar"
        description="Push sessions to your Google Calendar and pull events back to sync status changes."
        badgeLabel="Calendar API"
        onSync={() => triggerSync("/api/google/calendar/sync", "calendar")}
        syncing={syncing === "calendar"}
      />

      <IntegrationCard
        icon={<Users className="h-5 w-5 text-green-500" />}
        title="Google Contacts"
        description="Import contacts from Google People to create new Accounts and Contacts."
        badgeLabel="People API"
        onSync={() => triggerSync("/api/google/contacts/import", "contacts")}
        syncing={syncing === "contacts"}
        syncLabel="Import Contacts"
      />

      <p className="text-xs text-neutral-400">
        Google integrations require signing in with Google and granting the necessary permissions.
        Tokens are stored securely and used only for the operations above.
      </p>
    </div>
  );
}

function IntegrationCard({
  icon,
  title,
  description,
  badgeLabel,
  onSync,
  syncing,
  syncLabel = "Sync Now",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badgeLabel: string;
  onSync: () => void;
  syncing: boolean;
  syncLabel?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Badge variant="outline">{badgeLabel}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button size="sm" variant="outline" onClick={onSync} disabled={syncing}>
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : syncLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
