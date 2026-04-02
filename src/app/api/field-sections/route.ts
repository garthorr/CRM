import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, serverError } from "@/lib/api-response";
import type { EntityType } from "@/generated/prisma/enums";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const entityType = req.nextUrl.searchParams.get("entityType") as EntityType | null;
    const sections = await prisma.fieldSection.findMany({
      where: entityType ? { entityType } : undefined,
      include: {
        fieldDefinitions: { orderBy: { position: "asc" } },
      },
      orderBy: { position: "asc" },
    });
    return ok(sections);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const { entityType, name } = await req.json();
    if (!entityType || !name) return err("entityType and name are required");

    const maxPos = await prisma.fieldSection.aggregate({
      where: { entityType },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    const section = await prisma.fieldSection.create({
      data: { entityType, name, position },
      include: { fieldDefinitions: true },
    });
    return ok(section, 201);
  } catch (e) {
    return serverError(e);
  }
}
