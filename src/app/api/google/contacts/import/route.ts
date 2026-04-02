import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { listGoogleContacts, importGoogleContacts } from "@/lib/google/contacts";
import { ok, err, serverError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return err("Unauthorized", 401);

    const contacts = await listGoogleContacts(session.user.id);
    return ok(contacts);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return err("Unauthorized", 401);

    const { contacts } = await req.json();
    if (!Array.isArray(contacts)) return err("contacts array required");

    const imported = await importGoogleContacts(session.user.id, contacts);
    return ok({ imported });
  } catch (e) {
    return serverError(e);
  }
}
