import { auth } from "@/auth";
import { syncCalendarToSessions } from "@/lib/google/calendar";
import { ok, err, serverError } from "@/lib/api-response";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return err("Unauthorized", 401);

    const result = await syncCalendarToSessions(session.user.id);
    return ok(result);
  } catch (e) {
    return serverError(e);
  }
}
