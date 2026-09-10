import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import { requireActor } from "@/utils/authorization";
import { apiError, handleApiError } from "@/utils/apiResponse";

export async function GET(request, { params }) {
  try {
    const actor = await requireActor();
    const { userId } = await params;
    if (!mongoose.isValidObjectId(userId)) {
      return apiError("User not found", { status: 404, code: "NOT_FOUND" });
    }
    const canReadAll = actor.permissions.includes("properties.read");
    if (actor.id !== userId && !canReadAll) {
      return apiError("You cannot view another user's listings", { status: 403, code: "FORBIDDEN" });
    }

    await connectDB();
    const properties = await Property.find({ owner: userId, deletedAt: { $exists: false } })
      .sort({ updatedAt: -1 })
      .lean();
    return Response.json(properties, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error, "properties.user");
  }
}
