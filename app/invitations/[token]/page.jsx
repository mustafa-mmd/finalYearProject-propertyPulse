import { redirect } from "next/navigation";
import InvitationAcceptButton from "@/components/InvitationAcceptButton";
import { getActor } from "@/utils/authorization";

export default async function InvitationPage({ params }) {
  const { token } = await params;
  const actor = await getActor();
  if (!actor) redirect(`/api/auth/signin?callbackUrl=/invitations/${encodeURIComponent(token)}`);
  return <section className="mx-auto max-w-xl px-4 py-16"><div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Team invitation</p><h1 className="mt-3 text-3xl font-bold">Join the organization</h1><p className="my-5 text-slate-600">You are signed in as <strong>{actor.email}</strong>. The invitation can only be accepted by the invited email address.</p><InvitationAcceptButton token={token} /></div></section>;
}
