import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, serverError } from "@/lib/api-response";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const { sectionId, label, fieldType, options, required, visible } = await req.json();
    if (!sectionId || !label || !fieldType) {
      return err("sectionId, label, fieldType are required");
    }

    // Generate stable fieldKey from label
    let fieldKey = slugify(label);

    // Ensure uniqueness within section
    const existing = await prisma.fieldDefinition.findFirst({
      where: { sectionId, fieldKey },
    });
    if (existing) {
      fieldKey = `${fieldKey}_${Date.now()}`;
    }

    const maxPos = await prisma.fieldDefinition.aggregate({
      where: { sectionId },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    const def = await prisma.fieldDefinition.create({
      data: {
        sectionId,
        fieldKey,
        label,
        fieldType,
        options: options ?? null,
        position,
        required: required ?? false,
        visible: visible ?? true,
      },
    });
    return ok(def, 201);
  } catch (e) {
    return serverError(e);
  }
}
