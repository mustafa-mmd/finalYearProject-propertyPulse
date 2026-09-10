import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

export async function getSessionUser() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    return {
      user: session.user,
      userId: session.user.id,
    };
  } catch (error) {
    // Static page collection has no real request session. Keep runtime
    // failures observable without producing a false production-build alarm.
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      console.error("[auth] Could not resolve the current user", {
        name: error?.name,
        code: error?.code,
      });
    }
    return null;
  }
}
