import mongoose from "mongoose";
import connectDB from "@/config/database";
import Message from "@/models/Message";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function PUT(_request, { params }) {
  try {
    const actor = await requireActor(); const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return apiError("Message not found", { status: 404, code: "NOT_FOUND" });
    await connectDB();
    const message = await Message.findOneAndUpdate({ _id: id, recipient: actor.id }, [{ $set: { read: { $not: ["$read"] } } }], { new: true });
    if (!message) return apiError("Message not found", { status: 404, code: "NOT_FOUND" });
    return apiSuccess({ read: message.read });
  } catch (error) { return handleApiError(error, "messages.read-toggle"); }
}

export async function DELETE(_request, { params }) {
  try {
    const actor = await requireActor(); const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return apiError("Message not found", { status: 404, code: "NOT_FOUND" });
    await connectDB();
    const result = await Message.updateOne({ _id: id, $or: [{ recipient: actor.id }, { sender: actor.id }] }, { $addToSet: { deletedBy: actor.id } });
    if (!result.matchedCount) return apiError("Message not found", { status: 404, code: "NOT_FOUND" });
    return apiSuccess({ deleted: true });
  } catch (error) { return handleApiError(error, "messages.delete"); }
}
