import { redirect } from "next/navigation";
import MfaStepUp from "@/components/MfaStepUp";
import { getActor } from "@/utils/authorization";
import { normalizeInternalCallback } from "@/utils/pageAuthorization";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Security verification | PropertyPulse",
  description: "Complete multi-factor authentication for protected actions.",
};

export default async function MfaPage({ searchParams }) {
  const params = await searchParams;
  const callbackUrl = normalizeInternalCallback(params?.callbackUrl, "/admin");
  const actor = await getActor();
  if (!actor) {
    redirect("/auth/signin?callbackUrl=" + encodeURIComponent("/auth/mfa?callbackUrl=" + encodeURIComponent(callbackUrl)));
  }
  if (actor.mfaVerified || (!actor.mfaEnabled && !actor.mfaRequired)) {
    redirect(callbackUrl);
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-100 via-white to-blue-100 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
        <MfaStepUp callbackUrl={callbackUrl} mfaEnabled={actor.mfaEnabled} />
      </div>
    </main>
  );
}
