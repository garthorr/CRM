import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, serverError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
    return ok(subjects);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const { name } = await req.json();
    if (!name) return err("name is required");

    const subject = await prisma.subject.create({ data: { name } });
    return ok(subject, 201);
  } catch (e) {
    return serverError(e);
  }
}
