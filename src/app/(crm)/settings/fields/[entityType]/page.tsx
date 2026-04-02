import { prisma } from "@/lib/prisma";
import { FieldSettingsEditor } from "@/components/custom-fields/field-settings-editor";
import type { EntityType } from "@/generated/prisma/enums";

const entityLabels: Record<string, string> = {
  ACCOUNT: "Accounts",
  CONTACT: "Contacts",
  SCHOOL: "Schools",
  SESSION: "Sessions",
};

export default async function FieldSettingsPage({
  params,
}: {
  params: Promise<{ entityType: string }>;
}) {
  const { entityType } = await params;

  const sections = await prisma.fieldSection.findMany({
    where: { entityType: entityType as EntityType },
    include: { fieldDefinitions: { orderBy: { position: "asc" } } },
    orderBy: { position: "asc" },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Custom Fields</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage custom fields for {entityLabels[entityType] ?? entityType}.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["ACCOUNT", "CONTACT", "SCHOOL", "SESSION"].map((et) => (
          <a
            key={et}
            href={`/settings/fields/${et}`}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              et === entityType
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {entityLabels[et]}
          </a>
        ))}
      </div>

      <FieldSettingsEditor
        entityType={entityType as EntityType}
        initialSections={sections}
      />
    </div>
  );
}
