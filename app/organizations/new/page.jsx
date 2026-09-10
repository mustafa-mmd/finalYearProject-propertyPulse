import { redirect } from "next/navigation";
import OrganizationCreateForm from "@/components/OrganizationCreateForm";
import { getActor } from "@/utils/authorization";

export default async function NewOrganizationPage() {
  const actor = await getActor();
  if (!actor) redirect("/api/auth/signin?callbackUrl=/organizations/new");
  return <section className="mx-auto max-w-3xl px-4 py-10"><p className="text-sm font-semibold uppercase tracking-widest text-blue-600">New workspace</p><h1 className="mt-2 text-3xl font-bold">Create an organization</h1><p className="mt-2 mb-8 text-slate-600">Your workspace starts pending verification and can be completed without exposing owner-level platform access.</p><OrganizationCreateForm /></section>;
}
