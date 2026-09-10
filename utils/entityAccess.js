import mongoose from "mongoose";
import Property from "@/models/Property";
import Lease from "@/models/Lease";
import Offer from "@/models/Offer";
import SaleTransaction from "@/models/SaleTransaction";
import RentalApplication from "@/models/RentalApplication";
import Booking from "@/models/Booking";
import MaintenanceRequest from "@/models/MaintenanceRequest";
import { getOrganizationAccess } from "@/utils/tenantAuthorization";

const ids = (...values) => [...new Set(values.flat().filter(Boolean).map((value) => value.toString()))];

export async function resolveEntityAccess(entityType, entityId, actor) {
  if (!mongoose.isValidObjectId(entityId)) return null;
  let entity; let participants = []; let tenantId; let writable = false;
  if (entityType === "PROPERTY") { entity = await Property.findById(entityId).lean(); participants = ids(entity?.owner); writable = participants.includes(actor.id); }
  if (entityType === "LEASE") { entity = await Lease.findById(entityId).lean(); participants = ids(entity?.landlordId, entity?.tenantUserIds); writable = participants.includes(actor.id); }
  if (entityType === "OFFER") { entity = await Offer.findById(entityId).lean(); participants = ids(entity?.buyerId, entity?.sellerId); writable = participants.includes(actor.id); }
  if (entityType === "SALE") { entity = await SaleTransaction.findById(entityId).lean(); participants = ids(entity?.buyerId, entity?.sellerId); writable = participants.includes(actor.id); }
  if (entityType === "APPLICATION") { entity = await RentalApplication.findById(entityId).lean(); participants = ids(entity?.applicantId, entity?.ownerId); writable = participants.includes(actor.id); }
  if (entityType === "BOOKING") { entity = await Booking.findById(entityId).lean(); participants = ids(entity?.guestId, entity?.ownerId); writable = participants.includes(actor.id); }
  if (entityType === "MAINTENANCE") { entity = await MaintenanceRequest.findById(entityId).lean(); participants = ids(entity?.requesterId, entity?.ownerId, entity?.assignedTo); writable = participants.includes(actor.id); }
  if (entityType === "ORGANIZATION") { const access = await getOrganizationAccess(entityId, actor); if (!access) return null; entity = access.organization; tenantId = entity._id; participants = [actor.id]; writable = access.permissions.includes("*") || access.permissions.includes("organization.update"); }
  if (entityType === "USER") { entity = { _id: actor.id }; participants = [actor.id]; writable = entityId === actor.id; }
  if (!entity) return null;
  tenantId ||= entity.tenantId;
  const global = actor.permissions?.includes("properties.read") || actor.permissions?.includes("support.manage");
  return { entity, tenantId, participantIds: participants, canRead: global || participants.includes(actor.id), canWrite: global || writable };
}
