import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, serverError } from "@/lib/api-response";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; periodId: string }> }
) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { periodId } = await params;

    const { name } = await req.json();
    const period = await prisma.schoolPeriod.update({
      where: { id: periodId },
      data: { ...(name !== undefined && { name }) },
    });
    return ok(period);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; periodId: string }> }
) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { periodId } = await params;

    await prisma.schoolPeriod.delete({ where: { id: periodId } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
