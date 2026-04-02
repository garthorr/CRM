"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function EditSessionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    date: "",
    durationMins: "60",
    subject: "",
    status: "SCHEDULED",
    notes: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then(({ data }) => {
        setForm({
          date: format(new Date(data.date), "yyyy-MM-dd'T'HH:mm"),
          durationMins: String(data.durationMins),
          subject: data.subject ?? "",
          status: data.status,
          notes: data.notes ?? "",
        });
        setLoaded(true);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/sessions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        durationMins: parseInt(form.durationMins),
        date: new Date(form.date).toISOString(),
      }),
    });
    if (res.ok) {
      router.push(`/sessions/${id}`);
    } else {
      setSaving(false);
      alert("Failed to save.");
    }
  }

  if (!loaded) return <div className="p-6 text-neutral-400">Loading…</div>;

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/sessions/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold text-neutral-900">Edit Session</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Session Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Date & Time *</Label>
              <Input type="datetime-local" value={form.date} onChange={(e) => set("date", e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Duration (minutes)</Label>
                <Input type="number" min="15" step="15" value={form.durationMins} onChange={(e) => set("durationMins", e.target.value)} />
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
              <Label>Subject</Label>
              <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Session Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={8} />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href={`/sessions/${id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
