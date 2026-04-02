import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, serverError } from "@/lib/api-response";

// PATCH — bulk reorder sections for an entityType
// body: [{ id, position }]
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const items = await req.json() as { id: string; position: number }[];
    await prisma.$transaction(
      items.map((item) =>
        prisma.fieldSection.update({
          where: { id: item.id },
          data: { position: item.position },
        })
      )
    );
    return ok({ reordered: true });
  } catch (e) {
    return serverError(e);
  }
}
