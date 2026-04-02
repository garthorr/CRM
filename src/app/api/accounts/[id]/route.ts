import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, notFound, serverError } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id } = await params;

    const account = await prisma.crmAccount.findUnique({
      where: { id },
      include: {
        contacts: {
          include: { school: true, subjects: { include: { subject: true } } },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        },
        emailThreads: {
          orderBy: { lastMessageDate: "desc" },
          take: 20,
        },
      },
    });
    if (!account) return notFound();
    return ok(account);
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
    const { name, notes, customData } = body;

    const existing = await prisma.crmAccount.findUnique({ where: { id } });
    if (!existing) return notFound();

    const account = await prisma.crmAccount.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(notes !== undefined && { notes }),
        ...(customData !== undefined && {
          customData: { ...(existing.customData as object), ...customData },
        }),
      },
    });
    return ok(account);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id } = await params;

    await prisma.crmAccount.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
