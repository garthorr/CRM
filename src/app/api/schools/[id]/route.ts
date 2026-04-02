import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, notFound, serverError } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id } = await params;

    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        periods: { orderBy: { position: "asc" } },
        contacts: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
      },
    });
    if (!school) return notFound();
    return ok(school);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id } = await params;

    const body = await req.json();
    const { name, address, city, state, phone, website, notes, customData } = body;

    const school = await prisma.school.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website }),
        ...(notes !== undefined && { notes }),
        ...(customData !== undefined && {
          customData: { ...(await getExistingCustomData(id)), ...customData },
        }),
      },
    });
    return ok(school);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id } = await params;

    await prisma.school.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}

async function getExistingCustomData(id: string) {
  const s = await prisma.school.findUnique({ where: { id }, select: { customData: true } });
  return (s?.customData as Record<string, unknown>) ?? {};
}
