import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, notFound, serverError } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id } = await params;

    const crmSession = await prisma.crmSession.findUnique({
      where: { id },
      include: {
        contact: {
          include: {
            account: true,
            school: true,
          },
        },
      },
    });
    if (!crmSession) return notFound();
    return ok(crmSession);
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
    const { date, durationMins, subject, status, notes, googleEventId, customData } = body;

    const existing = await prisma.crmSession.findUnique({ where: { id } });
    if (!existing) return notFound();

    const updated = await prisma.crmSession.update({
      where: { id },
      data: {
        ...(date !== undefined && { date: new Date(date) }),
        ...(durationMins !== undefined && { durationMins }),
        ...(subject !== undefined && { subject }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(googleEventId !== undefined && { googleEventId }),
        ...(customData !== undefined && {
          customData: { ...(existing.customData as object), ...customData },
        }),
      },
      include: {
        contact: {
          include: { account: true },
        },
      },
    });
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id } = await params;

    await prisma.crmSession.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
