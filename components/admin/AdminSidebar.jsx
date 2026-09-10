"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaBuilding,
  FaClipboardCheck,
  FaCreditCard,
  FaExclamationTriangle,
  FaFlag,
  FaHome,
  FaLifeRing,
  FaListAlt,
  FaReceipt,
  FaShieldAlt,
  FaSlidersH,
  FaUsers,
  FaUserShield,
} from "react-icons/fa";

const ICONS = {
  "/admin": FaHome,
  "/admin/verifications": FaClipboardCheck,
  "/admin/listings": FaListAlt,
  "/admin/users": FaUsers,
  "/admin/organizations": FaBuilding,
  "/admin/payments": FaCreditCard,
  "/admin/subscriptions": FaReceipt,
  "/admin/reports": FaFlag,
  "/admin/fraud-cases": FaShieldAlt,
  "/admin/support": FaLifeRing,
  "/admin/feature-flags": FaSlidersH,
  "/admin/audit-logs": FaUserShield,
  "/admin/errors": FaExclamationTriangle,
};

export default function AdminSidebar({ items, actor }) {
  const pathname = usePathname();
  const groups = [...new Set(items.map((item) => item.group))];

  function isActive(href) {
    return href === "/admin" ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 lg:sticky lg:top-6">
      <div className="border-b border-slate-800 bg-gradient-to-br from-blue-600/25 to-transparent p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-950/50">
            <FaShieldAlt aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">Operations</p>
            <p className="font-black">PropertyPulse Admin</p>
          </div>
        </div>
      </div>

      <nav className="max-h-[calc(100vh-19rem)] space-y-5 overflow-y-auto p-4" aria-label="Administration">
        {groups.map((group) => (
          <div key={group}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{group}</p>
            <div className="space-y-1">
              {items.filter((item) => item.group === group).map((item) => {
                const Icon = ICONS[item.href] || FaHome;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "flex items-center gap-3 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-950/30"
                        : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    }
                  >
                    <Icon className={active ? "text-white" : "text-slate-500"} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-2xl bg-slate-900 p-3">
          <p className="truncate text-sm font-bold text-white">{actor.name || "Administrator"}</p>
          <p className="mt-0.5 truncate text-xs text-slate-400">{actor.email}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            MFA verified
          </div>
        </div>
        <Link href="/" className="mt-3 block text-center text-xs font-semibold text-slate-400 hover:text-white">
          Return to marketplace
        </Link>
      </div>
    </aside>
  );
}
