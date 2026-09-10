import { resolveLocation } from "@/utils/geocoding";
import { checkRateLimit } from "@/utils/rateLimit";
import { getSessionUser } from "@/utils/getSessionUser";

export const dynamic = "force-dynamic";

const clientIdentifier = (request, userId) => {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${userId || "anonymous"}:${ip}`;
};

export const POST = async (request) => {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.userId) {
      return Response.json(
        { message: "Authentication is required to resolve locations." },
        { status: 401 },
      );
    }

    const rateLimit = await checkRateLimit({
      key: `location-resolve:${clientIdentifier(request, sessionUser.userId)}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return Response.json(
        {
          message: "Too many location requests. Please wait a moment.",
          retryAfter: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const body = await request.json();
    const location = await resolveLocation({
      query: body?.query,
      placeId: body?.placeId,
      latitude: body?.latitude,
      longitude: body?.longitude,
    });

    return Response.json(
      { location },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      },
    );
  } catch (error) {
    console.error("[location/resolve] Request failed:", error);
    return Response.json(
      {
        message:
          error.message === "No provider could resolve this location"
            ? "We could not resolve that address. You can still place the marker manually."
            : "Location resolution is temporarily unavailable.",
      },
      { status: 422 },
    );
  }
};

