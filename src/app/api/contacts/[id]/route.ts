import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, notFound, serverError } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        account: true,
        school: true,
        subjects: { include: { subject: true } },
        contactPeriods: { include: { period: true }, orderBy: { period: { position: "asc" } } },
        crmSessions: { orderBy: { date: "desc" }, take: 20 },
      },
    });
    if (!contact) return notFound();
    return ok(contact);
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
    const {
      firstName,
      lastName,
      email,
      phone,
      notes,
      schoolId,
      subjectIds,
      customData,
    } = body;

    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) return notFound();

    // Handle subjects replacement if provided
    if (subjectIds !== undefined) {
      await prisma.contactSubject.deleteMany({ where: { contactId: id } });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(notes !== undefined && { notes }),
        ...(schoolId !== undefined && { schoolId }),
        ...(customData !== undefined && {
          customData: { ...(existing.customData as object), ...customData },
        }),
        ...(subjectIds !== undefined && {
          subjects: {
            create: subjectIds.map((sid: string) => ({ subjectId: sid })),
          },
        }),
      },
      include: {
        account: true,
        school: true,
        subjects: { include: { subject: true } },
        contactPeriods: { include: { period: true } },
      },
    });
    return ok(contact);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id } = await params;

    await prisma.contact.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
