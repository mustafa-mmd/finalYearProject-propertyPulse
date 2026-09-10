import connectDB from "@/config/database";
import User from "@/models/User";
import { requirePermission } from "@/utils/authorization";
import { apiSuccess, handleApiError } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await requirePermission("users.read");
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "25", 10)));
    const q = (searchParams.get("q") || "").trim().slice(0, 100);
    const status = searchParams.get("status");
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = {
      ...(q ? { $or: [{ name: new RegExp(escaped, "i") }, { email: new RegExp(escaped, "i") }] } : {}),
      ...(status ? { accountStatus: status } : { accountStatus: { $ne: "DELETED" } }),
    };

    await connectDB();
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name email image roles accountStatus verification security.mfaEnabled security.lastLoginAt createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);
    return apiSuccess({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleApiError(error, "admin.users.list");
  }
}
