import { AuthorizationError } from "@/utils/authorization";
import { reportOperationalError } from "@/utils/errorTracking";

export function apiSuccess(data, { status = 200, headers = {} } = {}) {
  return Response.json(
    { success: true, data },
    { status, headers: { "Cache-Control": "no-store", ...headers } }
  );
}

export function apiError(message, { status = 400, code = "BAD_REQUEST", details } = {}) {
  return Response.json(
    { success: false, error: { code, message, ...(details ? { details } : {}) } },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export function handleApiError(error, context = "api") {
  if (error instanceof AuthorizationError) {
    return apiError(error.message, { status: error.status, code: error.code });
  }

  if (error?.name === "ValidationError") {
    return apiError("Validation failed", {
      status: 422,
      code: "VALIDATION_ERROR",
      details: Object.values(error.errors || {}).map((entry) => entry.message),
    });
  }

  if (error?.code === 11000) {
    return apiError("A record with these details already exists", {
      status: 409,
      code: "CONFLICT",
    });
  }

  console.error(`[${context}] Request failed`, {
    name: error?.name,
    code: error?.code,
  });
  void reportOperationalError(error, { context, source: "API" });
  return apiError("The request could not be completed", {
    status: 500,
    code: "INTERNAL_ERROR",
  });
}
