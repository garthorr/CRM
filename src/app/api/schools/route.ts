import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, serverError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const q = req.nextUrl.searchParams.get("q") ?? "";
    const schools = await prisma.school.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      include: { periods: { orderBy: { position: "asc" } }, _count: { select: { contacts: true } } },
      orderBy: { name: "asc" },
    });
    return ok(schools);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const body = await req.json();
    const { name, address, city, state, phone, website, notes, customData } = body;
    if (!name) return err("name is required");

    const school = await prisma.school.create({
      data: { name, address, city, state, phone, website, notes, customData: customData ?? {} },
    });
    return ok(school, 201);
  } catch (e) {
    return serverError(e);
  }
}
