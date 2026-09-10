"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "react-toastify";

export default function SecuritySettings({ initialSecurity }) {
  const { data: session, update } = useSession();
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [setup, setSetup] = useState(null);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sessionResponse, eventResponse] = await Promise.all([
        fetch("/api/auth/sessions"),
        fetch("/api/auth/security-events"),
      ]);
      const [sessionPayload, eventPayload] = await Promise.all([
        sessionResponse.json(),
        eventResponse.json(),
      ]);
      if (sessionResponse.ok) setSessions(sessionPayload.data || []);
      if (eventResponse.ok) setEvents(eventPayload.data || []);
    } catch {
      toast.error("Security activity could not be loaded.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function startMfa() {
    setPending(true);
    try {
      const response = await fetch("/api/auth/mfa", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "MFA setup could not start.");
      setSetup(payload.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  async function confirmMfa() {
    setPending(true);
    try {
      const response = await fetch("/api/auth/mfa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Code was not accepted.");
      const refreshed = await update({ mfaCode: code });
      if (!refreshed?.user?.mfaVerified) {
        throw new Error("MFA was enabled, but this session could not be verified. Sign in again.");
      }
      setRecoveryCodes(payload.data.recoveryCodes || []);
      setSetup(null);
      setCode("");
      toast.success("Multi-factor authentication is enabled.");
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  async function verifySession() {
    setPending(true);
    try {
      const refreshed = await update({ mfaCode: code });
      if (!refreshed?.user?.mfaVerified) throw new Error("The authenticator code was not accepted.");
      setCode("");
      toast.success("Administrative actions are unlocked for this session.");
      window.location.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  async function revoke(id, current) {
    setPending(true);
    try {
      const response = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Session could not be revoked.");
      if (current) return signOut({ callbackUrl: "/auth/signin" });
      await load();
      toast.success("Session revoked.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-10 space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Multi-factor authentication</h2>
        <p className="mt-1 text-sm text-slate-600">Use any standards-based authenticator app. Privileged accounts must complete MFA before administrative actions.</p>

        {session?.user?.mfaRequired && !session?.user?.mfaVerified && initialSecurity.mfaEnabled && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">Enter a current code to unlock privileged actions in this session.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" className="h-11 rounded-lg border px-3 font-mono tracking-widest" />
              <button type="button" disabled={pending || code.length !== 6} onClick={verifySession} className="rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{pending ? "Verifying..." : "Verify session"}</button>
            </div>
          </div>
        )}

        {!initialSecurity.mfaEnabled && !setup && (
          <button type="button" disabled={pending} onClick={startMfa} className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{pending ? "Preparing..." : "Set up authenticator"}</button>
        )}

        {setup && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="font-semibold">1. Add this secret to your authenticator app</p>
            <code className="mt-2 block break-all rounded bg-white p-3 text-sm">{setup.secret}</code>
            <details className="mt-2 text-xs text-slate-500"><summary>Advanced setup URI</summary><code className="mt-1 block break-all">{setup.uri}</code></details>
            <p className="mt-4 font-semibold">2. Confirm the six-digit code</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" className="h-11 rounded-lg border px-3 font-mono tracking-widest" />
              <button type="button" disabled={pending || code.length !== 6} onClick={confirmMfa} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{pending ? "Confirming..." : "Confirm"}</button>
            </div>
          </div>
        )}

        {recoveryCodes.length > 0 && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <h3 className="font-bold text-red-900">Save these one-time recovery codes now</h3>
            <p className="text-sm text-red-800">They are shown only once. Store them offline.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm">{recoveryCodes.map((entry) => <code key={entry}>{entry}</code>)}</div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Active devices and sessions</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {sessions.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-semibold">{item.provider} {item.current && <span className="text-emerald-700">· current session</span>}</p>
                <p className="text-sm text-slate-500">Last active {new Date(item.lastSeenAt).toLocaleString()}</p>
              </div>
              {!item.revokedAt && <button type="button" disabled={pending} onClick={() => revoke(item.id, item.current)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Revoke</button>}
            </div>
          ))}
          {sessions.length === 0 && <p className="py-5 text-sm text-slate-500">No active sessions were returned.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Recent security activity</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {events.slice(0, 10).map((item) => (
            <div key={item._id} className="py-3">
              <p className="font-semibold">{item.type.replaceAll("_", " ")}</p>
              <p className="text-sm text-slate-500">{new Date(item.occurredAt).toLocaleString()}</p>
            </div>
          ))}
          {events.length === 0 && <p className="py-5 text-sm text-slate-500">No recent security events.</p>}
        </div>
      </section>
    </div>
  );
}
