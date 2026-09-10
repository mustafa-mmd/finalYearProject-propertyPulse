"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaGoogle } from "react-icons/fa";

export default function SignInForm() {
  const router = useRouter(); const params = useSearchParams(); const callbackUrl = params.get("callbackUrl") || "/";
  const [mode, setMode] = useState("password"); const [error, setError] = useState(""); const [notice, setNotice] = useState(params.get("verified") ? "Email verified. You can now sign in." : ""); const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError(""); const data = new FormData(event.currentTarget); const email = data.get("email");
    if (mode === "magic") {
      const response = await fetch("/api/auth/magic-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); const payload = await response.json();
      setNotice(payload.data?.previewUrl ? `Development link: ${payload.data.previewUrl}` : "If that account exists, a secure sign-in link is on its way."); setLoading(false); return;
    }
    const result = await signIn("credentials", { email, password: data.get("password"), totp: data.get("totp"), recoveryCode: data.get("recoveryCode"), redirect: false, callbackUrl });
    setLoading(false); if (result?.ok) { router.push(result.url || callbackUrl); router.refresh(); } else setError("Sign-in failed. Check your password, verification status, account lock, and MFA code.");
  };
  return <div className="rounded-2xl border bg-white p-6 shadow-xl sm:p-8"><button type="button" onClick={() => signIn("google", { callbackUrl })} className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 px-4 py-3 font-semibold hover:bg-slate-50"><FaGoogle />Continue with Google</button><div className="my-5 flex items-center gap-3 text-xs uppercase text-slate-400"><span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" /></div><div className="mb-4 grid grid-cols-2 rounded-lg bg-slate-100 p-1"><button onClick={() => setMode("password")} className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === "password" ? "bg-white shadow" : ""}`}>Password</button><button onClick={() => setMode("magic")} className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === "magic" ? "bg-white shadow" : ""}`}>Email link</button></div>{notice && <p className="mb-4 break-words rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}{error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold">Email<input required name="email" type="email" autoComplete="email" className="mt-1 w-full rounded-lg border px-3 py-3" /></label>{mode === "password" && <><label className="block text-sm font-semibold">Password<input required name="password" type="password" autoComplete="current-password" className="mt-1 w-full rounded-lg border px-3 py-3" /></label><label className="block text-sm font-semibold">Authenticator code <span className="font-normal text-slate-500">(if enabled)</span><input name="totp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="mt-1 w-full rounded-lg border px-3 py-3" /></label><label className="block text-sm font-semibold">Recovery code <span className="font-normal text-slate-500">(alternative)</span><input name="recoveryCode" className="mt-1 w-full rounded-lg border px-3 py-3" /></label></>}<button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-60">{loading ? "Please wait…" : mode === "magic" ? "Email me a secure link" : "Sign in"}</button></form><div className="mt-5 flex justify-between text-sm"><Link href="/auth/register" className="font-semibold text-blue-700">Create account</Link><Link href="/auth/forgot-password" className="text-slate-600 hover:text-blue-700">Forgot password?</Link></div></div>;
}
