import { redirect } from "next/navigation";
import PropertyAddForm from "@/components/PropertyAddForm";
import connectDB from "@/config/database";
import OrganizationMember from "@/models/OrganizationMember";
import { organizationPermissions } from "@/config/organizations";
import { getActor } from "@/utils/authorization";

export const dynamic = "force-dynamic";

export default async function AddPropertyPage() {
  const actor = await getActor();
  if (!actor) redirect("/api/auth/signin?callbackUrl=/properties/add");
  await connectDB();
  const memberships = await OrganizationMember.find({ userId: actor.id, status: "ACTIVE" }).populate("organizationId", "name status deletedAt").lean();
  const organizations = memberships
    .filter((membership) => membership.organizationId && !membership.organizationId.deletedAt && organizationPermissions(membership.roles, membership.customPermissions).includes("listings.create"))
    .map((membership) => ({ id: membership.organizationId._id.toString(), name: membership.organizationId.name }));
  return <section className="bg-blue-50"><div className="container m-auto max-w-4xl py-16"><div className="m-4 mb-4 rounded-md border bg-white px-6 py-8 shadow-md md:m-0"><PropertyAddForm organizations={organizations} /></div></div></section>;
}
