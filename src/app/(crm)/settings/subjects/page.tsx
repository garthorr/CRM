"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import type { Subject } from "@/types";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => r.json())
      .then(({ data }) => setSubjects(data ?? []));
  }, []);

  async function add() {
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setSubjects((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    }
    setAdding(false);
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold text-neutral-900">Subjects</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage Subjects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {subjects.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-neutral-900">{s.name}</span>
            </div>
          ))}
          <div className="flex gap-2 pt-3 border-t">
            <Input
              placeholder="Add subject…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Button size="sm" onClick={add} disabled={adding || !newName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
