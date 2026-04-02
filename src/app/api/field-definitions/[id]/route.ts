import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, serverError } from "@/lib/api-response";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id } = await params;

    const { label, options, required, visible, position } = await req.json();

    const def = await prisma.fieldDefinition.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(options !== undefined && { options }),
        ...(required !== undefined && { required }),
        ...(visible !== undefined && { visible }),
        ...(position !== undefined && { position }),
      },
    });
    return ok(def);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id } = await params;

    await prisma.fieldDefinition.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
