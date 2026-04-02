import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, serverError } from "@/lib/api-response";

// PUT — replace all period assignments for a contact
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id: contactId } = await params;

    // body: [{ periodId, isFree, isPreferred }]
    const assignments = await req.json() as {
      periodId: string;
      isFree: boolean;
      isPreferred: boolean;
    }[];

    await prisma.$transaction([
      prisma.contactPeriod.deleteMany({ where: { contactId } }),
      prisma.contactPeriod.createMany({
        data: assignments.map((a) => ({
          contactId,
          periodId: a.periodId,
          isFree: a.isFree,
          isPreferred: a.isPreferred,
        })),
      }),
    ]);

    const updated = await prisma.contactPeriod.findMany({
      where: { contactId },
      include: { period: true },
      orderBy: { period: { position: "asc" } },
    });
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
