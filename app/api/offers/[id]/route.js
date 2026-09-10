import crypto from "node:crypto";
import mongoose from "mongoose";
import connectDB from "@/config/database";
import Offer from "@/models/Offer";
import SaleTransaction from "@/models/SaleTransaction";
import Reservation from "@/models/Reservation";
import Invoice from "@/models/Invoice";
import Property from "@/models/Property";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { emitNotification, publishDomainEvent } from "@/utils/events";

export async function PATCH(request, { params }) {
  try {
    const actor = await requireActor(); const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return apiError("Offer not found", { status: 404, code: "NOT_FOUND" });
    const body = await request.json(); await connectDB(); const current = await Offer.findById(id);
    if (!current) return apiError("Offer not found", { status: 404, code: "NOT_FOUND" });
    const buyer = current.buyerId.toString() === actor.id, seller = current.sellerId.toString() === actor.id;
    if (!buyer && !seller) return apiError("Offer access denied", { status: 403, code: "FORBIDDEN" });

    if (body.action === "withdraw") {
      if (!buyer || !["SUBMITTED", "COUNTERED", "ACCEPTED"].includes(current.status)) return apiError("Offer cannot be withdrawn", { status: 409, code: "INVALID_TRANSITION" });
      current.status = "WITHDRAWN"; current.decidedAt = new Date(); await current.save();
    } else if (body.action === "reject") {
      if (current.submittedBy.toString() === actor.id || current.status !== "SUBMITTED") return apiError("Offer cannot be rejected", { status: 409, code: "INVALID_TRANSITION" });
      current.status = "REJECTED"; current.decisionReason = String(body.reason || "").slice(0, 1000); current.decidedAt = new Date(); await current.save();
    } else if (body.action === "counter") {
      if (current.status !== "SUBMITTED" || current.submittedBy.toString() === actor.id) return apiError("Wait for the other party to respond", { status: 409, code: "INVALID_TRANSITION" });
      const amount = Number(body.amount); if (!Number.isFinite(amount) || amount <= 0) return apiError("Enter a valid counter amount", { status: 422, code: "VALIDATION_ERROR" });
      current.status = "COUNTERED"; await current.save();
      const counter = await Offer.create({ tenantId: current.tenantId, propertyId: current.propertyId, buyerId: current.buyerId, sellerId: current.sellerId, parentOfferId: current._id, rootOfferId: current.rootOfferId || current._id, version: current.version + 1, submittedBy: actor.id, status: "SUBMITTED", currency: current.currency, amount, depositAmount: Number(body.depositAmount ?? current.depositAmount), financingType: current.financingType, financingContingency: current.financingContingency, inspectionContingency: current.inspectionContingency, proposedClosingDate: body.proposedClosingDate ? new Date(body.proposedClosingDate) : current.proposedClosingDate, expiresAt: body.expiresAt ? new Date(body.expiresAt) : current.expiresAt, message: String(body.message || "").slice(0, 3000) });
      await writeAuditLog({ actor, action: "offer.counter", targetType: "Offer", targetId: counter._id, tenantId: current.tenantId, metadata: { parentOfferId: current._id, amount }, request });
      await emitNotification({ recipientId: seller ? current.buyerId : current.sellerId, tenantId: current.tenantId, type: "OFFER_COUNTERED", title: "Counteroffer received", body: `A counteroffer of ${current.currency} ${amount.toLocaleString()} is ready for review.`, href: "/offers", dedupeKey: `offer-counter:${counter._id}`, channels: ["IN_APP", "EMAIL"] });
      await publishDomainEvent({ type: "offer.updated", aggregateType: "Offer", aggregateId: counter._id, tenantId: current.tenantId, eventId: `offer.countered:${counter._id}`, payload: { offerId: counter._id.toString(), propertyId: current.propertyId.toString(), status: counter.status, version: counter.version } });
      return apiSuccess({ id: counter._id.toString(), status: counter.status });
    } else if (body.action === "accept") {
      if (current.submittedBy.toString() === actor.id || current.status !== "SUBMITTED") return apiError("Offer cannot be accepted", { status: 409, code: "INVALID_TRANSITION" });
      const accepted = await Offer.findOneAndUpdate({ _id: current._id, status: "SUBMITTED" }, { $set: { status: "ACCEPTED", decidedAt: new Date() } }, { new: true });
      if (!accepted) return apiError("Offer was already updated", { status: 409, code: "CONFLICT" });
      await Offer.updateMany({ propertyId: current.propertyId, _id: { $ne: current._id }, status: "SUBMITTED" }, { $set: { status: "REJECTED", decisionReason: "Another offer was accepted", decidedAt: new Date() } });
      const transaction = await SaleTransaction.create({ tenantId: current.tenantId, propertyId: current.propertyId, acceptedOfferId: current._id, buyerId: current.buyerId, sellerId: current.sellerId, currency: current.currency, purchasePrice: current.amount, targetClosingDate: current.proposedClosingDate, milestones: [{ key: "deposit", label: "Deposit confirmed" }, { key: "inspection", label: "Property inspection" }, { key: "financing", label: "Financing approval" }, { key: "legal", label: "Legal and conveyancing review" }, { key: "closing", label: "Transfer and closing" }] });
      let depositInvoice;
      if (current.depositAmount > 0) depositInvoice = await Invoice.create({ tenantId: current.tenantId, invoiceNumber: `INV-DEP-${crypto.randomBytes(5).toString("hex").toUpperCase()}`, type: "DEPOSIT", propertyId: current.propertyId, payerId: current.buyerId, payeeId: current.sellerId, currency: current.currency, lineItems: [{ description: "Reservation deposit", quantity: 1, unitAmount: current.depositAmount, total: current.depositAmount }], subtotal: current.depositAmount, total: current.depositAmount, dueAt: new Date(Date.now() + 5 * 86_400_000) });
      const reservation = await Reservation.create({ tenantId: current.tenantId, propertyId: current.propertyId, saleTransactionId: transaction._id, buyerId: current.buyerId, sellerId: current.sellerId, currency: current.currency, depositAmount: current.depositAmount, depositInvoiceId: depositInvoice?._id, status: current.depositAmount > 0 ? "PENDING_DEPOSIT" : "RESERVED", expiresAt: new Date(Date.now() + 7 * 86_400_000), reservedAt: current.depositAmount > 0 ? undefined : new Date() });
      await Property.updateOne({ _id: current.propertyId }, { $set: { listingStatus: reservation.status === "RESERVED" ? "RESERVED" : "UNDER_OFFER" } });
      await writeAuditLog({ actor, action: "offer.accept", targetType: "SaleTransaction", targetId: transaction._id, tenantId: current.tenantId, metadata: { offerId: current._id, reservationId: reservation._id, amount: current.amount, externalLegalProcessRequired: true }, request });
      await emitNotification({ recipientId: current.submittedBy, tenantId: current.tenantId, type: "OFFER_ACCEPTED", title: "Offer accepted", body: "The sale is now under offer. Legal, banking and conveyancing steps must use licensed providers.", href: "/sales", dedupeKey: `offer-accepted:${current._id}`, channels: ["IN_APP", "EMAIL"] });
      await publishDomainEvent({ type: "offer.updated", aggregateType: "Offer", aggregateId: current._id, tenantId: current.tenantId, eventId: `offer.accepted:${current._id}`, payload: { offerId: current._id.toString(), propertyId: current.propertyId.toString(), status: "ACCEPTED", transactionId: transaction._id.toString() } });
      return apiSuccess({ id: current._id.toString(), status: "ACCEPTED", transactionId: transaction._id.toString(), reservationId: reservation._id.toString(), legalProviderRequired: true });
    } else if (body.action === "delete" || body.action === "remove") {
      current.deletedAt = new Date();
      await current.save();
      await writeAuditLog({ actor, action: "offer.delete", targetType: "Offer", targetId: current._id, tenantId: current.tenantId, request });
      return apiSuccess({ id, status: "DELETED" });
    } else return apiError("Unknown offer action", { status: 422, code: "VALIDATION_ERROR" });

    await writeAuditLog({ actor, action: `offer.${body.action}`, targetType: "Offer", targetId: current._id, tenantId: current.tenantId, request });
    return apiSuccess({ id, status: current.status });
  } catch (error) { return handleApiError(error, "offers.transition"); }
}

export async function DELETE(request, { params }) {
  try {
    const actor = await requireActor();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return apiError("Offer not found", { status: 404, code: "NOT_FOUND" });
    await connectDB();
    const current = await Offer.findById(id);
    if (!current) return apiError("Offer not found", { status: 404, code: "NOT_FOUND" });
    const buyer = current.buyerId.toString() === actor.id, seller = current.sellerId.toString() === actor.id;
    if (!buyer && !seller) return apiError("Offer access denied", { status: 403, code: "FORBIDDEN" });

    current.deletedAt = new Date();
    await current.save();
    await writeAuditLog({ actor, action: "offer.delete", targetType: "Offer", targetId: current._id, tenantId: current.tenantId, request });
    return apiSuccess({ id, status: "DELETED" });
  } catch (error) { return handleApiError(error, "offers.delete"); }
}
