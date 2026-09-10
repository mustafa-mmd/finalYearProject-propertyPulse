import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Building from "@/models/Building";
import Expense from "@/models/Expense";
import Inspection from "@/models/Inspection";
import MaintenanceRequest from "@/models/MaintenanceRequest";
import OrganizationMember from "@/models/OrganizationMember";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import Vendor from "@/models/Vendor";
import WorkOrder from "@/models/WorkOrder";
import PropertyManagementConsole from "@/components/PropertyManagementConsole";
import { getActor } from "@/utils/authorization";
import { getOrganizationAccess } from "@/utils/tenantAuthorization";

export const dynamic = "force-dynamic";

export default async function PropertyManagementPage({ params }) {
  const actor = await getActor();
  const { id } = await params;
  if (!actor) redirect(`/api/auth/signin?callbackUrl=/organizations/${id}/property-management`);
  const access = await getOrganizationAccess(id, actor);
  if (!access) notFound();
  const allowed = (permission) => access.permissions.includes("*") || access.permissions.includes(permission);
  if (!allowed("maintenance.read")) redirect(`/organizations/${id}`);
  const [buildings, units, vendors, properties, maintenance, members, workOrders, inspections, expenses] = await Promise.all([
    Building.find({ tenantId: id, deletedAt: { $exists: false } }).sort({ name: 1 }).lean(),
    Unit.find({ tenantId: id, deletedAt: { $exists: false } }).populate("buildingId", "name").populate("propertyId", "name").sort({ unitNumber: 1 }).lean(),
    Vendor.find({ tenantId: id, deletedAt: { $exists: false } }).sort({ name: 1 }).lean(),
    Property.find({ tenantId: id, deletedAt: { $exists: false } }).select("name listingReference").sort({ name: 1 }).lean(),
    MaintenanceRequest.find({ tenantId: id, deletedAt: { $exists: false }, status: { $nin: ["RESOLVED", "CLOSED", "CANCELLED"] } }).select("title priority").sort({ priority: -1, createdAt: -1 }).lean(),
    OrganizationMember.find({ organizationId: id, status: "ACTIVE" }).populate("userId", "name email").lean(),
    WorkOrder.find({ tenantId: id }).populate("maintenanceRequestId", "title").populate("vendorId", "name").populate("assigneeId", "name").sort({ createdAt: -1 }).limit(100).lean(),
    Inspection.find({ tenantId: id }).populate("propertyId", "name").populate("inspectorId", "name").sort({ scheduledAt: -1 }).limit(100).lean(),
    allowed("finance.read") ? Expense.find({ tenantId: id }).populate("propertyId", "name").sort({ incurredAt: -1 }).limit(100).lean() : [],
  ]);
  const data = {
    buildings: buildings.map((item) => ({ id: item._id.toString(), name: item.name, reference: item.reference, status: item.status, address: item.address?.formattedAddress || item.address?.city || "" })),
    units: units.map((item) => ({ id: item._id.toString(), unitNumber: item.unitNumber, status: item.status, building: item.buildingId?.name || "Building", property: item.propertyId?.name || "" })),
    vendors: vendors.map((item) => ({ id: item._id.toString(), name: item.name, status: item.status, verificationStatus: item.verificationStatus, categories: item.categories || [] })),
    properties: properties.map((item) => ({ id: item._id.toString(), name: `${item.name}${item.listingReference ? ` (${item.listingReference})` : ""}` })),
    maintenance: maintenance.map((item) => ({ id: item._id.toString(), title: item.title, priority: item.priority })),
    members: members.filter((item) => item.userId).map((item) => ({ id: item.userId._id.toString(), name: item.userId.name || item.userId.email })),
    workOrders: workOrders.map((item) => ({ id: item._id.toString(), request: item.maintenanceRequestId?.title || "Maintenance work", vendor: item.vendorId?.name || "", assignee: item.assigneeId?.name || "", status: item.status, currency: item.currency, estimate: Number(item.estimate || 0) })),
    inspections: inspections.map((item) => ({ id: item._id.toString(), property: item.propertyId?.name || "Property", inspector: item.inspectorId?.name || "Inspector", type: item.type, status: item.status, scheduledAt: item.scheduledAt.toISOString() })),
    expenses: expenses.map((item) => ({ id: item._id.toString(), property: item.propertyId?.name || "Property", category: item.category, currency: item.currency, amount: Number(item.amount), status: item.status })),
  };
  return <main className="min-h-screen bg-slate-50 py-10"><div className="mx-auto max-w-7xl px-4"><Link href={`/organizations/${id}/dashboard`} className="text-sm font-semibold text-blue-700">&larr; Operations dashboard</Link><div className="my-6 rounded-3xl bg-slate-950 p-7 text-white"><p className="text-sm font-semibold text-blue-300">{access.organization.name}</p><h1 className="mt-2 text-3xl font-bold">Property management</h1><p className="mt-2 max-w-3xl text-slate-300">Manage buildings, units, contractors, inspections, work orders and operating expenses in one tenant-isolated workspace.</p></div><PropertyManagementConsole organizationId={id} data={data} canManage={allowed("maintenance.manage")} canManageFinance={allowed("finance.manage")} /></div></main>;
}
