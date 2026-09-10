import { Suspense } from "react"; import { redirect } from "next/navigation"; import ConversationInbox from "@/components/ConversationInbox"; import { getActor } from "@/utils/authorization";
export const dynamic = "force-dynamic";
export default async function MessagesPage() { const actor = await getActor(); if (!actor) redirect("/auth/signin?callbackUrl=/messages"); return <main className="min-h-screen bg-slate-100 px-4 py-8"><div className="mx-auto max-w-7xl"><Suspense fallback={<div>Loading…</div>}><ConversationInbox /></Suspense></div></main>; }
