import { Suspense } from "react";
import SignInForm from "@/components/SignInForm";
export const metadata = { title: "Sign in | PropertyPulse" };
export default function SignInPage() { return <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-16"><div className="mx-auto max-w-md"><h1 className="text-center text-3xl font-bold">Welcome to PropertyPulse</h1><p className="mb-8 mt-2 text-center text-slate-600">Sign in securely to manage property activity.</p><Suspense fallback={<div className="rounded-2xl bg-white p-10">Loading…</div>}><SignInForm /></Suspense></div></main>; }
