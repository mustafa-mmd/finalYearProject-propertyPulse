import { apiError, apiSuccess } from "@/utils/apiResponse";
import { reportOperationalError } from "@/utils/errorTracking";
import { checkRateLimit, getClientIp } from "@/utils/rateLimit";

export async function POST(request) {
  const rate = await checkRateLimit(`client-error:${getClientIp(request)}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return apiError("Too many reports", { status: 429, code: "RATE_LIMITED" });
  }

  const body = await request.json().catch(() => ({}));
  await reportOperationalError(null, {
    source: "CLIENT",
    context: "global-error-boundary",
    message: String(body.message || "Client rendering error").slice(0, 500),
    errorCode: String(body.digest || "").slice(0, 120),
    path: String(body.path || "").slice(0, 1000),
  });
  return apiSuccess({ recorded: true }, { status: 202 });
}
