"use client";

import { useState } from "react";
import type { EntityType, FieldType } from "@/generated/prisma/enums";
import type { FieldSection, FieldDefinition } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Edit, Eye, EyeOff, GripVertical, ChevronDown, ChevronRight,
} from "lucide-react";

type SectionWithDefs = FieldSection & { fieldDefinitions: FieldDefinition[] };

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "TEXT", label: "Text" },
  { value: "TEXTAREA", label: "Text Area" },
  { value: "NUMBER", label: "Number" },
  { value: "DATE", label: "Date" },
  { value: "SELECT", label: "Select (dropdown)" },
  { value: "MULTI_SELECT", label: "Multi-select" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "PHONE", label: "Phone" },
  { value: "EMAIL", label: "Email" },
  { value: "URL", label: "URL" },
];

interface FieldSettingsEditorProps {
  entityType: EntityType;
  initialSections: SectionWithDefs[];
}

export function FieldSettingsEditor({ entityType, initialSections }: FieldSettingsEditorProps) {
  const [sections, setSections] = useState<SectionWithDefs[]>(initialSections);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialSections.map((s) => [s.id, true]))
  );
  const [fieldDialog, setFieldDialog] = useState<{
    open: boolean;
    sectionId: string;
    field?: FieldDefinition;
  }>({ open: false, sectionId: "" });

  // ─── Section actions ───────────────────────────────────────────────────────

  async function addSection() {
    const name = prompt("Section name:");
    if (!name?.trim()) return;
    const res = await fetch("/api/field-sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, name: name.trim() }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setSections((prev) => [...prev, data]);
      setExpanded((e) => ({ ...e, [data.id]: true }));
    }
  }

  async function renameSection(id: string, currentName: string) {
    const name = prompt("Section name:", currentName);
    if (!name?.trim() || name === currentName) return;
    const res = await fetch(`/api/field-sections/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      setSections((prev) => prev.map((s) => (s.id === id ? { ...s, name: name.trim() } : s)));
    }
  }

  async function deleteSection(id: string) {
    if (!confirm("Delete this section and all its fields?")) return;
    const res = await fetch(`/api/field-sections/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSections((prev) => prev.filter((s) => s.id !== id));
    }
  }

  // ─── Field actions ─────────────────────────────────────────────────────────

  async function deleteField(sectionId: string, fieldId: string) {
    if (!confirm("Delete this field? Existing data in this field will become invisible but not deleted.")) return;
    const res = await fetch(`/api/field-definitions/${fieldId}`, { method: "DELETE" });
    if (res.ok) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, fieldDefinitions: s.fieldDefinitions.filter((f) => f.id !== fieldId) }
            : s
        )
      );
    }
  }

  async function toggleVisible(sectionId: string, field: FieldDefinition) {
    const res = await fetch(`/api/field-definitions/${field.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !field.visible }),
    });
    if (res.ok) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                fieldDefinitions: s.fieldDefinitions.map((f) =>
                  f.id === field.id ? { ...f, visible: !f.visible } : f
                ),
              }
            : s
        )
      );
    }
  }

  function onFieldSaved(sectionId: string, field: FieldDefinition, isNew: boolean) {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              fieldDefinitions: isNew
                ? [...s.fieldDefinitions, field]
                : s.fieldDefinitions.map((f) => (f.id === field.id ? field : f)),
            }
      )
    );
  }

  return (
    <div className="space-y-3">
      <Button size="sm" variant="outline" onClick={addSection}>
        <Plus className="h-4 w-4" />
        Add Section
      </Button>

      {sections.length === 0 && (
        <p className="text-sm text-neutral-400 py-6 text-center">
          No sections yet. Add a section to start defining custom fields.
        </p>
      )}

      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-neutral-300" />
              <button
                className="flex items-center gap-1 flex-1 text-left"
                onClick={() => setExpanded((e) => ({ ...e, [section.id]: !e[section.id] }))}
              >
                {expanded[section.id] ? (
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                )}
                <span className="font-medium text-neutral-900">{section.name}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {section.fieldDefinitions.length} fields
                </Badge>
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => renameSection(section.id, section.name)}
              >
                Rename
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-red-500 hover:text-red-700 text-xs"
                onClick={() => deleteSection(section.id)}
              >
                Delete
              </Button>
            </div>
          </CardHeader>

          {expanded[section.id] && (
            <CardContent className="px-4 pb-3 pt-0">
              {section.fieldDefinitions.length === 0 && (
                <p className="text-xs text-neutral-400 py-2">No fields yet.</p>
              )}
              <div className="space-y-1">
                {section.fieldDefinitions.map((field) => (
                  <div
                    key={field.id}
                    className={`flex items-center gap-2 py-1.5 px-2 rounded group ${
                      field.visible ? "" : "opacity-50"
                    }`}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-neutral-300" />
                    <span className="text-xs text-neutral-500 w-20 shrink-0">
                      {FIELD_TYPES.find((t) => t.value === field.fieldType)?.label ?? field.fieldType}
                    </span>
                    <span className="flex-1 text-sm font-medium text-neutral-900">{field.label}</span>
                    {field.required && <Badge variant="secondary" className="text-xs">required</Badge>}
                    <button
                      className="text-neutral-400 hover:text-neutral-600"
                      onClick={() => toggleVisible(section.id, field)}
                      title={field.visible ? "Hide field" : "Show field"}
                    >
                      {field.visible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      className="text-neutral-400 hover:text-neutral-700"
                      onClick={() => setFieldDialog({ open: true, sectionId: section.id, field })}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="text-neutral-300 hover:text-red-500"
                      onClick={() => deleteField(section.id, field.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="mt-2 text-xs text-neutral-500"
                onClick={() => setFieldDialog({ open: true, sectionId: section.id })}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Field
              </Button>
            </CardContent>
          )}
        </Card>
      ))}

      <FieldDefinitionDialog
        {...fieldDialog}
        onClose={() => setFieldDialog({ open: false, sectionId: "" })}
        onSaved={onFieldSaved}
      />
    </div>
  );
}

// ─── Field Definition Dialog ───────────────────────────────────────────────

interface FieldDefinitionDialogProps {
  open: boolean;
  sectionId: string;
  field?: FieldDefinition;
  onClose: () => void;
  onSaved: (sectionId: string, field: FieldDefinition, isNew: boolean) => void;
}

function FieldDefinitionDialog({
  open,
  sectionId,
  field,
  onClose,
  onSaved,
}: FieldDefinitionDialogProps) {
  const isNew = !field;
  const [label, setLabel] = useState(field?.label ?? "");
  const [fieldType, setFieldType] = useState<FieldType>(field?.fieldType ?? "TEXT");
  const [required, setRequired] = useState(field?.required ?? false);
  const [visible, setVisible] = useState(field?.visible ?? true);
  const [options, setOptions] = useState<string[]>(
    Array.isArray(field?.options) ? (field.options as { label: string }[]).map((o) => o.label) : []
  );
  const [saving, setSaving] = useState(false);

  // Reset state when dialog opens
  useState(() => {
    setLabel(field?.label ?? "");
    setFieldType(field?.fieldType ?? "TEXT");
    setRequired(field?.required ?? false);
    setVisible(field?.visible ?? true);
    setOptions(
      Array.isArray(field?.options) ? (field.options as { label: string }[]).map((o) => o.label) : []
    );
  });

  const needsOptions = fieldType === "SELECT" || fieldType === "MULTI_SELECT";

  async function handleSave() {
    if (!label.trim()) return;
    setSaving(true);

    const formattedOptions = needsOptions
      ? options.filter(Boolean).map((o) => ({ value: o.toLowerCase().replace(/\s+/g, "_"), label: o }))
      : null;

    let savedField: FieldDefinition;
    if (isNew) {
      const res = await fetch("/api/field-definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          label: label.trim(),
          fieldType,
          required,
          visible,
          options: formattedOptions,
        }),
      });
      const { data } = await res.json();
      savedField = data;
    } else {
      const res = await fetch(`/api/field-definitions/${field!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), required, visible, options: formattedOptions }),
      });
      const { data } = await res.json();
      savedField = data;
    }

    setSaving(false);
    onSaved(sectionId, savedField, isNew);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add Field" : "Edit Field"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Label *</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Grade Level"
              autoFocus
            />
          </div>

          {isNew && (
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={fieldType} onValueChange={(v) => setFieldType(v as FieldType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {needsOptions && (
            <div className="space-y-1">
              <Label>Options (one per line)</Label>
              <textarea
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-neutral-950"
                value={options.join("\n")}
                onChange={(e) => setOptions(e.target.value.split("\n"))}
                placeholder={"Option 1\nOption 2\nOption 3"}
              />
            </div>
          )}

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="required"
                checked={required}
                onCheckedChange={(v) => setRequired(Boolean(v))}
              />
              <Label htmlFor="required" className="font-normal">Required</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="visible"
                checked={visible}
                onCheckedChange={(v) => setVisible(Boolean(v))}
              />
              <Label htmlFor="visible" className="font-normal">Visible</Label>
            </div>
          </div>

          {!isNew && field && (
            <p className="text-xs text-neutral-400">
              Field key: <code className="bg-neutral-100 px-1 rounded">{field.fieldKey}</code>
              {" "}(immutable)
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !label.trim()}>
            {saving ? "Saving…" : isNew ? "Add Field" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
