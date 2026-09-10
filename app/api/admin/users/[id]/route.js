import mongoose from "mongoose";
import connectDB from "@/config/database";
import User from "@/models/User";
import { ROLES } from "@/config/authorization";
import { requirePermission } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";

const STATUS_ACTIONS = Object.freeze({
  SUSPEND: "SUSPENDED",
  BAN: "BANNED",
  RESTORE: "ACTIVE",
});

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("User not found", { status: 404, code: "NOT_FOUND" });
    }
    const body = await request.json();
    const action = typeof body.action === "string" ? body.action.toUpperCase() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
    const permission = action === "SET_ROLES"
      ? "admins.manage"
      : action === "BAN"
        ? "users.ban"
        : "users.suspend";
    const actor = await requirePermission(permission);

    await connectDB();
    const user = await User.findById(id);
    if (!user) return apiError("User not found", { status: 404, code: "NOT_FOUND" });
    if (user._id.toString() === actor.id && ["SUSPEND", "BAN"].includes(action)) {
      return apiError("You cannot suspend or ban your own account", { status: 409, code: "SELF_ACTION_DENIED" });
    }
    const targetIsOwner = user.roles.includes("PLATFORM_OWNER");
    const actorIsOwner = actor.roles.includes("PLATFORM_OWNER");
    if (targetIsOwner && !actorIsOwner) {
      return apiError("Only a Platform Owner can modify another Platform Owner", { status: 403, code: "PROTECTED_ACCOUNT" });
    }

    let metadata;
    if (action === "SET_ROLES") {
      const roles = Array.isArray(body.roles)
        ? [...new Set(body.roles.map((role) => String(role).toUpperCase()))]
        : [];
      if (!roles.length || roles.some((role) => !ROLES.includes(role))) {
        return apiError("Select at least one valid role", { status: 422, code: "VALIDATION_ERROR" });
      }
      if (roles.includes("PLATFORM_OWNER")) {
        return apiError("PLATFORM_OWNER can only be assigned through server configuration", {
          status: 403,
          code: "PROTECTED_ROLE",
        });
      }
      const preservedOwnerRole = targetIsOwner ? ["PLATFORM_OWNER"] : [];
      metadata = { before: user.roles, after: [...new Set([...roles, ...preservedOwnerRole])] };
      user.roles = metadata.after;
    } else if (STATUS_ACTIONS[action]) {
      if (action !== "RESTORE" && reason.length < 10) {
        return apiError("Provide a clear reason for this account action", { status: 422, code: "VALIDATION_ERROR" });
      }
      metadata = { before: user.accountStatus, after: STATUS_ACTIONS[action] };
      user.accountStatus = STATUS_ACTIONS[action];
    } else {
      return apiError("Unsupported user action", { status: 422, code: "VALIDATION_ERROR" });
    }

    await user.save();
    await writeAuditLog({
      actor,
      action: `user.${action.toLowerCase()}`,
      targetType: "User",
      targetId: user._id,
      reason,
      metadata,
      request,
    });

    return apiSuccess({
      id: user._id.toString(),
      roles: user.roles,
      accountStatus: user.accountStatus,
    });
  } catch (error) {
    return handleApiError(error, "admin.users.update");
  }
}
