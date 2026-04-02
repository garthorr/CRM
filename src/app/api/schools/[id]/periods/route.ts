import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, serverError } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id: schoolId } = await params;

    const { name } = await req.json();
    if (!name) return err("name is required");

    const maxPos = await prisma.schoolPeriod.aggregate({
      where: { schoolId },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    const period = await prisma.schoolPeriod.create({
      data: { schoolId, name, position },
    });
    return ok(period, 201);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);
    const { id: schoolId } = await params;

    // Bulk reorder: body is an array of { id, position }
    const items = await req.json() as { id: string; position: number }[];
    await prisma.$transaction(
      items.map((item) =>
        prisma.schoolPeriod.update({
          where: { id: item.id, schoolId },
          data: { position: item.position },
        })
      )
    );
    return ok({ reordered: true });
  } catch (e) {
    return serverError(e);
  }
}
