"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

function NewSessionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preContactId = searchParams.get("contactId") ?? "";

  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [form, setForm] = useState({
    contactId: preContactId,
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    durationMins: "60",
    subject: "",
    status: "SCHEDULED",
    notes: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  useEffect(() => {
    fetch("/api/contacts?type=STUDENT")
      .then((r) => r.json())
      .then(({ data }) => setStudents(data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        durationMins: parseInt(form.durationMins),
        date: new Date(form.date).toISOString(),
      }),
    });
    if (res.ok) {
      const { data } = await res.json();
      router.push(`/sessions/${data.id}`);
    } else {
      setSaving(false);
      alert("Failed to create session.");
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sessions"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold text-neutral-900">New Session</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Session Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Student *</Label>
              <Select value={form.contactId} onValueChange={(v) => set("contactId", v)} required>
                <SelectTrigger><SelectValue placeholder="Select student…" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="date">Date & Time *</Label>
              <Input
                id="date"
                type="datetime-local"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  value={form.durationMins}
                  onChange={(e) => set("durationMins", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="NO_SHOW">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
                placeholder="e.g. Algebra 2, Essay Review…"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Session Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={6}
                placeholder="What did you cover? Homework assigned? Progress notes…"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href="/sessions">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create Session"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <NewSessionForm />
    </Suspense>
  );
}
