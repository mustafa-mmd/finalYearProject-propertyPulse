import mongoose from "mongoose";
import connectDB from "@/config/database";
import Commission from "@/models/Commission";
import Property from "@/models/Property";
import Reservation from "@/models/Reservation";
import SaleTransaction from "@/models/SaleTransaction";
import User from "@/models/User";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { requireActor } from "@/utils/authorization";
import { writeAuditLog } from "@/utils/audit";

const FINAL_STATES = new Set(["CLOSED", "CANCELLED", "FALLEN_THROUGH"]);

export async function PATCH(request, { params }) {
  try {
    const actor = await requireActor();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("Sale not found", { status: 404, code: "NOT_FOUND" });
    }

    const body = await request.json();
    await connectDB();
    const sale = await SaleTransaction.findById(id);
    if (!sale) return apiError("Sale not found", { status: 404, code: "NOT_FOUND" });

    const seller = sale.sellerId.toString() === actor.id;
    const buyer = sale.buyerId.toString() === actor.id;
    const canReview = actor.permissions.includes("properties.review");
    const canVerifyFinance = actor.permissions.includes("payments.read");
    if (!seller && !buyer && !canReview && !canVerifyFinance) {
      return apiError("Sale access denied", { status: 403, code: "FORBIDDEN" });
    }

    if (body.action === "milestone") {
      if (!seller && !buyer && !canReview) {
        return apiError("Only sale participants or a reviewer can update milestones", {
          status: 403,
          code: "FORBIDDEN",
        });
      }
      if (FINAL_STATES.has(sale.status)) {
        return apiError("A completed sale cannot be changed", {
          status: 409,
          code: "INVALID_TRANSITION",
        });
      }
      const milestone = sale.milestones.id(body.milestoneId);
      if (!milestone) {
        return apiError("Milestone not found", { status: 404, code: "NOT_FOUND" });
      }
      const statuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "WAIVED", "FAILED"];
      if (!statuses.includes(body.status)) {
        return apiError("Invalid milestone status", {
          status: 422,
          code: "VALIDATION_ERROR",
        });
      }
      if (body.status === "WAIVED" && !seller && !canReview) {
        return apiError("Only the seller or a reviewer can waive a milestone", {
          status: 403,
          code: "FORBIDDEN",
        });
      }

      milestone.status = body.status;
      milestone.notes = String(body.notes || "").slice(0, 1000);
      milestone.completedAt = body.status === "COMPLETED" ? new Date() : undefined;
      milestone.completedBy = body.status === "COMPLETED" ? actor.id : undefined;

      const allComplete = sale.milestones.every((item) =>
        ["COMPLETED", "WAIVED"].includes(item.status)
      );
      if (allComplete) {
        sale.status = "READY_TO_CLOSE";
      } else if (sale.status === "READY_TO_CLOSE") {
        sale.status = "CONVEYANCING";
      }
      await sale.save();
    } else if (body.action === "confirm_reservation") {
      if (!canVerifyFinance) {
        return apiError("A finance administrator must verify the deposit", {
          status: 403,
          code: "FINANCE_VERIFICATION_REQUIRED",
        });
      }
      const paymentReference = String(body.paymentReference || "").trim().slice(0, 200);
      if (paymentReference.length < 4) {
        return apiError("A verified payment reference is required", {
          status: 422,
          code: "VALIDATION_ERROR",
        });
      }
      const reservation = await Reservation.findOneAndUpdate(
        { saleTransactionId: sale._id, status: "PENDING_DEPOSIT" },
        { $set: { status: "RESERVED", reservedAt: new Date(), paymentReference, confirmedBy: actor.id, confirmedAt: new Date() } },
        { new: true }
      );
      if (!reservation) {
        return apiError("Reservation is not awaiting confirmation", {
          status: 409,
          code: "INVALID_TRANSITION",
        });
      }
      await Property.updateOne(
        { _id: sale.propertyId },
        { $set: { listingStatus: "RESERVED" } }
      );
      body.paymentReference = paymentReference;
    } else if (body.action === "commission") {
      const agent = mongoose.isValidObjectId(body.agentId)
        ? await User.findOne({ _id: body.agentId, accountStatus: "ACTIVE" }).select("_id").lean()
        : await User.findOne({ email: String(body.agentEmail || "").trim().toLowerCase(), accountStatus: "ACTIVE" }).select("_id").lean();
      if (!seller || !agent) {
        return apiError("Only the seller can define a commission for an active platform user", {
          status: 403,
          code: "FORBIDDEN",
        });
      }
      const rate = Number(body.rate);
      const amount = body.basis === "FIXED" ? rate : (sale.purchasePrice * rate) / 100;
      if (!Number.isFinite(amount) || amount < 0) {
        return apiError("Invalid commission", { status: 422, code: "VALIDATION_ERROR" });
      }
      await Commission.findOneAndUpdate(
        { saleTransactionId: sale._id, agentId: agent._id },
        {
          $set: {
            tenantId: sale.tenantId,
            basis: body.basis === "FIXED" ? "FIXED" : "PERCENTAGE",
            rate,
            currency: sale.currency,
            amount,
            status: "ESTIMATED",
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
    } else if (body.action === "commission_status") {
      if (!mongoose.isValidObjectId(body.commissionId)) return apiError("Commission not found", { status: 404, code: "NOT_FOUND" });
      const commission = await Commission.findOne({ _id: body.commissionId, saleTransactionId: sale._id });
      if (!commission) return apiError("Commission not found", { status: 404, code: "NOT_FOUND" });
      const transitions = { ESTIMATED: ["APPROVED", "CANCELLED"], APPROVED: ["PAYABLE", "CANCELLED"], PAYABLE: ["PAID", "CANCELLED"], PAID: [], CANCELLED: [] };
      if (!transitions[commission.status]?.includes(body.status)) return apiError("Invalid commission transition", { status: 409, code: "INVALID_TRANSITION" });
      if (body.status === "PAID" && !canVerifyFinance) return apiError("A finance administrator must confirm commission payment", { status: 403, code: "FINANCE_VERIFICATION_REQUIRED" });
      if (!["PAID"].includes(body.status) && !seller && !canVerifyFinance) return apiError("Commission access denied", { status: 403, code: "FORBIDDEN" });
      if (body.status === "PAID") {
        const reference = String(body.paymentReference || "").trim().slice(0, 200);
        if (reference.length < 4) return apiError("A verified payout reference is required", { status: 422, code: "VALIDATION_ERROR" });
        commission.paymentReference = reference; commission.paidAt = new Date();
      }
      if (body.status === "APPROVED") commission.approvedBy = actor.id;
      commission.status = body.status;
      await commission.save();
    } else if (body.action === "close") {
      const conveyancerReference = String(body.conveyancerReference || "").trim().slice(0, 200);
      const milestonesComplete = sale.milestones.every((milestone) =>
        ["COMPLETED", "WAIVED"].includes(milestone.status)
      );
      if ((!seller && !canReview) || sale.status !== "READY_TO_CLOSE" || !milestonesComplete) {
        return apiError("All required milestones must be complete before closure", {
          status: 409,
          code: "CLOSING_REQUIREMENTS",
        });
      }
      if (conveyancerReference.length < 5) {
        return apiError("A licensed conveyancer reference is required", {
          status: 422,
          code: "LEGAL_REFERENCE_REQUIRED",
        });
      }

      sale.status = "CLOSED";
      sale.closedAt = new Date();
      sale.closing = {
        conveyancerReference,
        confirmedBy: actor.id,
        confirmedAt: new Date(),
      };
      await sale.save();
      await Promise.all([
        Property.updateOne({ _id: sale.propertyId }, { $set: { listingStatus: "SOLD" } }),
        Reservation.updateOne(
          { saleTransactionId: sale._id },
          { $set: { status: "CONVERTED" } }
        ),
        Commission.updateMany(
          { saleTransactionId: sale._id, status: "APPROVED" },
          { $set: { status: "PAYABLE" } }
        ),
      ]);
    } else {
      return apiError("Unknown sale action", { status: 422, code: "VALIDATION_ERROR" });
    }

    await writeAuditLog({
      actor,
      action: `sale.${body.action}`,
      targetType: "SaleTransaction",
      targetId: sale._id,
      tenantId: sale.tenantId,
      metadata: {
        licensedConveyancerRequired: true,
        paymentReference: body.action === "confirm_reservation" ? body.paymentReference : undefined,
      },
      request,
    });

    return apiSuccess({
      id,
      status: sale.status,
      licensedConveyancerRequired: true,
    });
  } catch (error) {
    return handleApiError(error, "sales.update");
  }
}
