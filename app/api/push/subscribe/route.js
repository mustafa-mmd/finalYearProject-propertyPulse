import connectDB from "@/config/database";
import PushSubscription from "@/models/PushSubscription";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { apiSuccess, apiError, handleApiError } from "@/utils/apiResponse";
import { getVapidPublicKey } from "@/utils/webPush";

export const dynamic = "force-dynamic";

// GET /api/push/subscribe — returns the VAPID public key for the browser
export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return apiError("Web push is not configured on this server", {
      status: 503,
      code: "PUSH_NOT_CONFIGURED",
    });
  }
  return apiSuccess({ publicKey });
}

// POST /api/push/subscribe — register a new push subscription
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return apiError("Unauthorised", { status: 401, code: "UNAUTHORISED" });

    const body = await request.json();
    const { endpoint, keys, expirationTime, userAgent } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return apiError("Invalid push subscription object", { status: 400, code: "INVALID_SUBSCRIPTION" });
    }

    await connectDB();
    await PushSubscription.findOneAndUpdate(
      { userId: session.user.id, endpoint },
      {
        $set: {
          keys,
          active: true,
          userAgent: userAgent?.slice(0, 512) ?? null,
          expirationTime: expirationTime ? new Date(expirationTime) : null,
          lastUsedAt: null,
        },
      },
      { upsert: true, new: true }
    );

    return apiSuccess({ registered: true });
  } catch (error) {
    return handleApiError(error, "POST /api/push/subscribe");
  }
}

// DELETE /api/push/subscribe — remove a push subscription
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return apiError("Unauthorised", { status: 401, code: "UNAUTHORISED" });

    const { endpoint } = await request.json();
    if (!endpoint) return apiError("endpoint is required", { status: 400, code: "MISSING_ENDPOINT" });

    await connectDB();
    await PushSubscription.deleteOne({ userId: session.user.id, endpoint });

    return apiSuccess({ removed: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/push/subscribe");
  }
}
