import { redirect } from "next/navigation";
import MobileAuthorization from "@/components/MobileAuthorization";
import { getActor } from "@/utils/authorization";
export const dynamic = "force-dynamic";
export default async function MobileAuthorizePage({ searchParams }) { const query = await searchParams; const actor = await getActor(); const callback = `/mobile/authorize${query.code ? `?code=${encodeURIComponent(query.code)}` : ""}`; if (!actor) redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(callback)}`); return <main className="mx-auto max-w-xl px-4 py-12"><p className="text-sm font-bold uppercase tracking-wider text-blue-700">Secure mobile sign-in</p><h1 className="mt-2 text-3xl font-bold">Authorize a mobile device</h1><MobileAuthorization initialCode={query.code || ""} /></main>; }
