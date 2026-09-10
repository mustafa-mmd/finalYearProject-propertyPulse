import connectDB from "@/config/database";
import SecurityEvent from "@/models/SecurityEvent";
import { requireActor } from "@/utils/authorization";
import { apiSuccess, handleApiError } from "@/utils/apiResponse";
export async function GET() { try { const actor = await requireActor(); await connectDB(); const items = await SecurityEvent.find({ userId: actor.id }).sort({ occurredAt: -1 }).limit(50).lean(); return apiSuccess(items); } catch (error) { return handleApiError(error, "auth.security-events"); } }
