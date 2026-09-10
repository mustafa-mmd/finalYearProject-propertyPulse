import connectDB from "@/config/database";
import Message from "@/models/Message";
import ConversationParticipant from "@/models/ConversationParticipant";
import ConversationMessage from "@/models/ConversationMessage";
import { requireActor } from "@/utils/authorization";
import { handleApiError } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireActor(); await connectDB();
    const memberships = await ConversationParticipant.find({ userId: actor.id, archivedAt: { $exists: false }, blockedAt: { $exists: false } }).select("conversationId lastReadAt createdAt").lean();
    const oldest = memberships.reduce((date, item) => { const read = item.lastReadAt || item.createdAt; return !date || read < date ? read : date; }, null);
    const recent = oldest ? await ConversationMessage.find({ conversationId: { $in: memberships.map((item) => item.conversationId) }, senderId: { $ne: actor.id }, createdAt: { $gt: oldest }, deletedAt: { $exists: false } }).select("conversationId createdAt").limit(2000).lean() : [];
    const readMap = new Map(memberships.map((item) => [item.conversationId.toString(), item.lastReadAt || item.createdAt]));
    const conversationUnread = recent.filter((item) => item.createdAt > readMap.get(item.conversationId.toString())).length;
    const legacyUnread = await Message.countDocuments({ recipient: actor.id, read: false, deletedBy: { $ne: actor.id } });
    return Response.json(conversationUnread + legacyUnread, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return handleApiError(error, "messages.unread-count"); }
}
