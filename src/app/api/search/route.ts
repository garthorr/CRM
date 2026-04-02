import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, serverError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const q = req.nextUrl.searchParams.get("q") ?? "";
    if (q.length < 2) return ok([]);

    const [accounts, contacts] = await Promise.all([
      prisma.crmAccount.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true },
        take: 5,
      }),
      prisma.contact.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          type: true,
          account: { select: { name: true } },
        },
        take: 5,
      }),
    ]);

    const results = [
      ...accounts.map((a) => ({ type: "account" as const, id: a.id, label: a.name })),
      ...contacts.map((c) => ({
        type: "contact" as const,
        id: c.id,
        label: `${c.firstName} ${c.lastName}`,
        sub: c.account.name,
        contactType: c.type,
      })),
    ];
    return ok(results);
  } catch (e) {
    return serverError(e);
  }
}
