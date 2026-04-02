import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, notFound, serverError } from "@/lib/api-response";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id } = await params;

    const { name } = await req.json();
    const section = await prisma.fieldSection.update({
      where: { id },
      data: { ...(name !== undefined && { name }) },
      include: { fieldDefinitions: { orderBy: { position: "asc" } } },
    });
    return ok(section);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id } = await params;

    const section = await prisma.fieldSection.findUnique({ where: { id } });
    if (!section) return notFound();

    await prisma.fieldSection.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
