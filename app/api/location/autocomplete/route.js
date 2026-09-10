import { autocompleteLocations, geocodingProviderStatus } from "@/utils/geocoding";
import { checkRateLimit } from "@/utils/rateLimit";
import { getSessionUser } from "@/utils/getSessionUser";

export const dynamic = "force-dynamic";

const clientIdentifier = (request, userId) => {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${userId || "anonymous"}:${ip}`;
};

export const GET = async (request) => {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.userId) {
      return Response.json(
        { message: "Authentication is required to search locations." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim().slice(0, 256);
    if (query.length < 3) {
      return Response.json({ suggestions: [] });
    }

    const rateLimit = await checkRateLimit({
      key: `location-autocomplete:${clientIdentifier(request, sessionUser.userId)}`,
      limit: 45,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return Response.json(
        {
          message: "Too many location searches. Please wait a moment.",
          retryAfter: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const proximity = (searchParams.get("proximity") || "")
      .trim()
      .slice(0, 60);
    const language = (searchParams.get("language") || "en")
      .trim()
      .slice(0, 20);
    const suggestions = await autocompleteLocations({
      query,
      proximity,
      language,
    });

    return Response.json(
      {
        suggestions,
        providers: geocodingProviderStatus(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      },
    );
  } catch (error) {
    console.error("[location/autocomplete] Request failed:", error);
    return Response.json(
      { message: "Location suggestions are temporarily unavailable." },
      { status: 503 },
    );
  }
};

