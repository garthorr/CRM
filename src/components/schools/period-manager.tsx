"use client";

import { useState } from "react";
import type { SchoolPeriod } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface PeriodManagerProps {
  schoolId: string;
  initialPeriods: SchoolPeriod[];
}

export function PeriodManager({ schoolId, initialPeriods }: PeriodManagerProps) {
  const [periods, setPeriods] = useState<SchoolPeriod[]>(initialPeriods);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function addPeriod() {
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch(`/api/schools/${schoolId}/periods`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setPeriods((prev) => [...prev, data]);
      setNewName("");
    }
    setAdding(false);
  }

  async function deletePeriod(periodId: string) {
    const res = await fetch(`/api/schools/${schoolId}/periods/${periodId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setPeriods((prev) => prev.filter((p) => p.id !== periodId));
    }
  }

  async function renamePeriod(periodId: string, name: string) {
    await fetch(`/api/schools/${schoolId}/periods/${periodId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setPeriods((prev) => prev.map((p) => (p.id === periodId ? { ...p, name } : p)));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">School Periods</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {periods.map((period) => (
          <PeriodRow
            key={period.id}
            period={period}
            onDelete={() => deletePeriod(period.id)}
            onRename={(name) => renamePeriod(period.id, name)}
          />
        ))}

        <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-100">
          <Input
            placeholder="e.g. Period 1, Block A…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPeriod()}
            className="flex-1"
          />
          <Button size="sm" onClick={addPeriod} disabled={adding || !newName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PeriodRow({
  period,
  onDelete,
  onRename,
}: {
  period: SchoolPeriod;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(period.name);

  function handleBlur() {
    if (name.trim() && name !== period.name) {
      onRename(name.trim());
    } else {
      setName(period.name);
    }
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-2 group py-1">
      <GripVertical className="h-4 w-4 text-neutral-300 shrink-0" />
      {editing ? (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleBlur();
            if (e.key === "Escape") { setName(period.name); setEditing(false); }
          }}
          autoFocus
          className="h-7 text-sm"
        />
      ) : (
        <span
          className="flex-1 text-sm text-neutral-900 cursor-pointer hover:text-neutral-600"
          onClick={() => setEditing(true)}
        >
          {period.name}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
