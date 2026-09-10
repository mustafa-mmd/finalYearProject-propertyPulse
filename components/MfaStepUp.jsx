"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaArrowRight, FaCheckCircle, FaCopy, FaKey, FaLock, FaQrcode, FaRedo, FaShieldAlt } from "react-icons/fa";

export default function MfaStepUp({ callbackUrl, mfaEnabled }) {
  const router = useRouter();
  const { update } = useSession();
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!mfaEnabled) {
      let isMounted = true;
      fetch("/api/auth/mfa")
        .then((res) => res.json())
        .then((payload) => {
          if (isMounted && payload.data?.hasPending) {
            setSetup(payload.data);
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [mfaEnabled]);

  async function unlockSession(payload) {
    const refreshed = await update(payload);
    if (!refreshed?.user?.mfaVerified) {
      throw new Error("The verification code was not accepted. Check the code and try again.");
    }
    router.replace(callbackUrl);
    router.refresh();
  }

  async function verifySession(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await unlockSession(
        useRecovery
          ? { recoveryCode: recoveryCode.trim() }
          : { mfaCode: code.trim() },
      );
    } catch (requestError) {
      setError(requestError.message || "MFA verification failed.");
    } finally {
      setPending(false);
    }
  }

  async function startSetup(forceNew = false) {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceNew }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error?.message || "MFA setup could not start.");
      }
      setSetup(payload.data);
      setCode("");
    } catch (requestError) {
      setError(requestError.message || "MFA setup could not start.");
    } finally {
      setPending(false);
    }
  }

  async function confirmSetup(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/mfa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error?.message || "The code was not accepted.");
      }
      setRecoveryCodes(payload.data.recoveryCodes || []);
      setSetup(null);
      await unlockSession({ mfaCode: code.trim() });
    } catch (requestError) {
      setError(requestError.message || "MFA setup could not be completed.");
    } finally {
      setPending(false);
    }
  }

  const copySecret = () => {
    if (setup?.secret) {
      navigator.clipboard.writeText(setup.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reauthenticate = () =>
    signOut({
      callbackUrl:
        "/auth/signin?callbackUrl=" +
        encodeURIComponent("/auth/mfa?callbackUrl=" + encodeURIComponent(callbackUrl)),
    });

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
      <div className="bg-slate-950 px-6 py-7 text-white sm:px-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl shadow-lg shadow-blue-950/40">
          <FaShieldAlt aria-hidden="true" />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
          Protected administration
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Verify it is really you</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
          Administrative tools affect users, listings, and financial records. Complete this security step before continuing.
        </p>
      </div>

      <div className="p-6 sm:p-8">
        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {recoveryCodes.length > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <FaKey aria-hidden="true" />
              Save your recovery codes
            </div>
            <p className="mt-1 text-sm text-amber-800">Store these one-time codes offline. They will not be shown again.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm text-amber-950">
              {recoveryCodes.map((entry) => <code key={entry}>{entry}</code>)}
            </div>
          </div>
        )}

        {mfaEnabled && !setup ? (
          <form onSubmit={verifySession}>
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
              <FaLock className="shrink-0 text-blue-600" aria-hidden="true" />
              Open your authenticator app and enter the current six-digit code.
            </div>
            {useRecovery ? (
              <label className="mt-5 block text-sm font-bold text-slate-800">
                Recovery code
                <input
                  required
                  value={recoveryCode}
                  onChange={(event) => setRecoveryCode(event.target.value)}
                  autoComplete="one-time-code"
                  placeholder="xxxxxx-xxxxxx"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 font-mono outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            ) : (
              <label className="mt-5 block text-sm font-bold text-slate-800">
                Authenticator code
                <input
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="mt-2 h-14 w-full rounded-xl border border-slate-300 px-4 text-center font-mono text-2xl tracking-[0.45em] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            )}
            <button disabled={pending || (useRecovery ? !recoveryCode.trim() : code.length !== 6)} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {pending ? "Verifying..." : "Unlock admin tools"}
              {!pending && <FaArrowRight aria-hidden="true" />}
            </button>
            <button type="button" onClick={() => { setUseRecovery((value) => !value); setError(""); }} className="mt-3 w-full text-center text-sm font-semibold text-slate-600 hover:text-blue-700">
              {useRecovery ? "Use authenticator code instead" : "Use a recovery code"}
            </button>
          </form>
        ) : setup ? (
          <form onSubmit={confirmSetup}>
            <ol className="space-y-6">
              <li>
                <p className="font-bold text-slate-900">1. Scan QR code or copy secret key</p>
                
                {/* QR Code */}
                {setup.uri && (
                  <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-center">
                    {/* eslint-disable-next-html-element-for-img */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setup.uri)}`}
                      alt="Authenticator QR Code"
                      width={180}
                      height={180}
                      className="rounded-xl border border-white bg-white p-2 shadow-md"
                    />
                    <p className="mt-3 text-xs font-semibold text-slate-600">
                      Scan with Google Authenticator, Authy, or browser extension.
                    </p>
                  </div>
                )}

                {/* Secret Key Display with Copy Button */}
                <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <code className="font-mono text-xs font-bold text-slate-900 break-all select-all">
                    {setup.secret}
                  </code>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="ml-3 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                  >
                    <FaCopy className="text-[10px]" />
                    {copied ? "Copied!" : "Copy key"}
                  </button>
                </div>

                {/* Warning note for existing extension entries */}
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900">
                  <p className="font-bold">⚠️ Important setup note:</p>
                  <p className="mt-1">
                    If you already have a <em>&quot;propertyPulse&quot;</em> entry saved in your extension, <strong>delete the old entry first</strong> or click the ✏️ pencil icon in your extension to replace its secret key with the exact key above.
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Secret key is locked &amp; active</span>
                  <button
                    type="button"
                    onClick={() => startSetup(true)}
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                  >
                    <FaRedo className="text-[10px]" /> Generate fresh key
                  </button>
                </div>
              </li>

              <li>
                <p className="font-bold text-slate-900">2. Confirm the generated 6-digit code</p>
                <input
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="mt-3 h-14 w-full rounded-xl border border-slate-300 px-4 text-center font-mono text-2xl tracking-[0.45em] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </li>
            </ol>
            <button disabled={pending || code.length !== 6} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {pending ? "Confirming..." : "Enable MFA and continue"}
              {!pending && <FaCheckCircle aria-hidden="true" />}
            </button>
          </form>
        ) : (
          <div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Your administrative role requires multi-factor authentication. Set it up once using any standards-based authenticator application.
            </div>
            <button type="button" disabled={pending} onClick={() => startSetup(false)} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white disabled:cursor-wait disabled:opacity-60">
              <FaShieldAlt aria-hidden="true" />
              {pending ? "Preparing setup..." : "Set up authenticator"}
            </button>
          </div>
        )}

        <div className="mt-6 border-t border-slate-200 pt-5 text-center">
          <button type="button" onClick={reauthenticate} className="text-sm font-semibold text-slate-500 hover:text-blue-700">
            Sign in again with another account
          </button>
        </div>
      </div>
    </div>
  );
}
