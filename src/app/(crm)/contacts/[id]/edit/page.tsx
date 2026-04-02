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

export default function EditContactPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [allSubjects, setAllSubjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", notes: "",
    schoolId: "", type: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  useEffect(() => {
    Promise.all([
      fetch(`/api/contacts/${id}`).then((r) => r.json()),
      fetch("/api/schools").then((r) => r.json()),
      fetch("/api/subjects").then((r) => r.json()),
    ]).then(([contact, schoolsRes, subjectsRes]) => {
      const d = contact.data;
      setForm({
        firstName: d.firstName ?? "",
        lastName: d.lastName ?? "",
        email: d.email ?? "",
        phone: d.phone ?? "",
        notes: d.notes ?? "",
        schoolId: d.schoolId ?? "",
        type: d.type ?? "",
      });
      setSelectedSubjects(d.subjects?.map((cs: { subjectId: string }) => cs.subjectId) ?? []);
      setSchools(schoolsRes.data ?? []);
      setAllSubjects(subjectsRes.data ?? []);
      setLoaded(true);
    });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        schoolId: form.type === "STUDENT" ? form.schoolId || null : null,
        subjectIds: form.type === "STUDENT" ? selectedSubjects : [],
      }),
    });
    if (res.ok) {
      router.push(`/contacts/${id}`);
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
          <Link href={`/contacts/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold text-neutral-900">Edit Contact</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Contact Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>First Name *</Label>
                <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Last Name *</Label>
                <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Phone</Label>
              <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>

            {form.type === "STUDENT" && (
              <>
                <div className="space-y-1">
                  <Label>School</Label>
                  <Select value={form.schoolId} onValueChange={(v) => set("schoolId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select school…" /></SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Subjects</Label>
                  <div className="flex flex-wrap gap-2">
                    {allSubjects.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          setSelectedSubjects((prev) =>
                            prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                          )
                        }
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          selectedSubjects.includes(s.id)
                            ? "bg-neutral-900 text-white border-neutral-900"
                            : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href={`/contacts/${id}`}>Cancel</Link>
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
