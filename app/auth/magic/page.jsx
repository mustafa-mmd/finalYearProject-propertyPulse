import { Suspense } from "react"; import MagicLinkSignIn from "@/components/MagicLinkSignIn";
export default function MagicPage() { return <main className="min-h-screen bg-slate-50 px-4 py-20"><div className="mx-auto max-w-md"><Suspense fallback={<div>Loading…</div>}><MagicLinkSignIn /></Suspense></div></main>; }
