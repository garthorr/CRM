import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, serverError } from "@/lib/api-response";
import type { ContactType } from "@/generated/prisma/enums";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const q = req.nextUrl.searchParams.get("q") ?? "";
    const type = req.nextUrl.searchParams.get("type") as ContactType | null;
    const accountId = req.nextUrl.searchParams.get("accountId");

    const contacts = await prisma.contact.findMany({
      where: {
        ...(q && {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }),
        ...(type && { type }),
        ...(accountId && { accountId }),
      },
      include: {
        account: true,
        school: true,
        subjects: { include: { subject: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
    return ok(contacts);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("Unauthorized", 401);

    const body = await req.json();
    const {
      accountId,
      type,
      firstName,
      lastName,
      email,
      phone,
      notes,
      schoolId,
      subjectIds,
      customData,
    } = body;

    if (!accountId || !type || !firstName || !lastName) {
      return err("accountId, type, firstName, lastName are required");
    }

    const contact = await prisma.contact.create({
      data: {
        accountId,
        type,
        firstName,
        lastName,
        email,
        phone,
        notes,
        schoolId: type === "STUDENT" ? schoolId : null,
        customData: customData ?? {},
        subjects:
          subjectIds?.length
            ? { create: subjectIds.map((sid: string) => ({ subjectId: sid })) }
            : undefined,
      },
      include: {
        account: true,
        school: true,
        subjects: { include: { subject: true } },
      },
    });
    return ok(contact, 201);
  } catch (e) {
    return serverError(e);
  }
}
