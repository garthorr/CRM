"use client";

import { useState } from "react";
import type { SchoolPeriod, ContactPeriod } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

interface Assignment {
  periodId: string;
  isFree: boolean;
  isPreferred: boolean;
}

interface PeriodAssignmentProps {
  contactId: string;
  schoolPeriods: SchoolPeriod[];
  initialAssignments: (ContactPeriod & { period: SchoolPeriod })[];
}

export function PeriodAssignment({
  contactId,
  schoolPeriods,
  initialAssignments,
}: PeriodAssignmentProps) {
  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    schoolPeriods.map((period) => {
      const existing = initialAssignments.find((a) => a.periodId === period.id);
      return {
        periodId: period.id,
        isFree: existing?.isFree ?? false,
        isPreferred: existing?.isPreferred ?? false,
      };
    })
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(periodId: string, field: "isFree" | "isPreferred") {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.periodId !== periodId) return a;
        const updated = { ...a, [field]: !a[field] };
        // isPreferred implies isFree
        if (field === "isPreferred" && updated.isPreferred) {
          updated.isFree = true;
        }
        return updated;
      })
    );
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const filtered = assignments.filter((a) => a.isFree || a.isPreferred);
    await fetch(`/api/contacts/${contactId}/periods`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtered),
    });
    setSaving(false);
    setSaved(true);
  }

  if (schoolPeriods.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">School Periods</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">
            No periods defined for this school yet. Edit the school to add periods.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Free Periods</CardTitle>
        <Button size="sm" variant="outline" onClick={save} disabled={saving}>
          <Save className="h-3.5 w-3.5" />
          {saved ? "Saved" : saving ? "Saving…" : "Save"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-3 text-xs font-medium text-neutral-400 pb-1 border-b">
            <span>Period</span>
            <span className="text-center">Free</span>
            <span className="text-center">Preferred</span>
          </div>
          {schoolPeriods.map((period) => {
            const a = assignments.find((x) => x.periodId === period.id)!;
            return (
              <div key={period.id} className="grid grid-cols-3 items-center py-1">
                <Label className="text-sm font-normal text-neutral-900">{period.name}</Label>
                <div className="flex justify-center">
                  <Checkbox
                    checked={a.isFree}
                    onCheckedChange={() => toggle(period.id, "isFree")}
                  />
                </div>
                <div className="flex justify-center">
                  <Checkbox
                    checked={a.isPreferred}
                    onCheckedChange={() => toggle(period.id, "isPreferred")}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
