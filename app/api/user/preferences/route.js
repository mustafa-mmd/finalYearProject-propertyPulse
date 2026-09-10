import connectDB from "@/config/database";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { apiSuccess, apiError, handleApiError } from "@/utils/apiResponse";
import { isSupportedCurrency, SUPPORTED_CURRENCIES } from "@/utils/currency";

export const dynamic = "force-dynamic";

// GET /api/user/preferences  — returns current user locale, currency, timezone
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return apiError("Unauthorised", { status: 401, code: "UNAUTHORISED" });

    await connectDB();
    const user = await User.findById(session.user.id)
      .select("preferences")
      .lean();

    if (!user) return apiError("User not found", { status: 404, code: "NOT_FOUND" });

    return apiSuccess({
      preferences: user.preferences,
      supportedCurrencies: SUPPORTED_CURRENCIES.map(({ code, symbol, name }) => ({ code, symbol, name })),
    });
  } catch (error) {
    return handleApiError(error, "GET /api/user/preferences");
  }
}

// PATCH /api/user/preferences  — update locale, currency, timezone, notification prefs
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return apiError("Unauthorised", { status: 401, code: "UNAUTHORISED" });

    const body = await request.json();
    const allowed = ["locale", "currency", "timezone", "emailNotifications", "inAppNotifications"];
    const updates = {};

    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "currency" && !isSupportedCurrency(body[key])) {
          return apiError(`Currency '${body[key]}' is not supported`, { status: 400, code: "INVALID_CURRENCY" });
        }
        updates[`preferences.${key}`] = key === "currency" ? String(body[key]).toUpperCase() : body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return apiError("No valid preference fields provided", { status: 400, code: "NO_UPDATES" });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updates },
      { new: true, select: "preferences" }
    ).lean();

    if (!user) return apiError("User not found", { status: 404, code: "NOT_FOUND" });

    return apiSuccess({ preferences: user.preferences });
  } catch (error) {
    return handleApiError(error, "PATCH /api/user/preferences");
  }
}
