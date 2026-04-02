"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function GmailSyncButton() {
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  async function sync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/google/gmail/sync", { method: "POST" });
      const { data } = await res.json();
      router.refresh();
      if (data?.synced !== undefined) {
        alert(`Synced ${data.synced} threads.`);
      }
    } catch {
      alert("Sync failed. Make sure you are signed in with Google.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={sync} disabled={syncing}>
      <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing…" : "Sync Gmail"}
    </Button>
  );
}
