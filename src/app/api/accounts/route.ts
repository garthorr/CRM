import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, serverError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const q = req.nextUrl.searchParams.get("q") ?? "";
    const accounts = await prisma.crmAccount.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      include: {
        _count: { select: { contacts: true } },
      },
      orderBy: { name: "asc" },
    });
    return ok(accounts);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const body = await req.json();
    const { name, notes, customData } = body;
    if (!name) return err("name is required");

    const account = await prisma.crmAccount.create({
      data: { name, notes, customData: customData ?? {} },
    });
    return ok(account, 201);
  } catch (e) {
    return serverError(e);
  }
}
