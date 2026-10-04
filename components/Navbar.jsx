"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import logo from "@/assets/images/logo.png";
import UnreadMessageCount from "@/components/UnreadMessageCount";
import UserAvatar from "@/components/UserAvatar";
import { useTranslation } from "@/context/I18nContext";
import { canAccessAdmin } from "@/config/admin";
import {
  FaHeart,
  FaBookmark,
  FaHistory,
  FaBalanceScale,
  FaKey,
  FaClipboardList,
  FaCalendarCheck,
  FaHandshake,
  FaFileContract,
  FaTools,
  FaFileInvoiceDollar,
  FaCreditCard,
  FaBell,
  FaUser,
  FaCog,
  FaShieldAlt,
  FaBuilding,
  FaHeadset,
  FaSignOutAlt,
  FaTachometerAlt,
  FaBars,
  FaTimes,
  FaEnvelope,
  FaChevronRight,
  FaPlus,
} from "react-icons/fa";

function buildProfileGroups(isAdmin) {
  return [
    {
      label: "Dashboard",
      items: [
        { href: "/owner",   label: "Owner Dashboard",   icon: FaTachometerAlt, desc: "Manage your listings" },
        { href: "/tenant",  label: "Tenant Portal",     icon: FaKey,           desc: "Your rental activity" },
        ...(isAdmin ? [{ href: "/admin", label: "Admin Panel", icon: FaShieldAlt, desc: "Platform management", accent: true }] : []),
      ],
    },
    {
      label: "My Activity",
      items: [
        { href: "/properties/saved",           label: "Saved Properties",   icon: FaHeart },
        { href: "/searches",                   label: "Saved Searches",     icon: FaBookmark },
        { href: "/properties/recently-viewed", label: "Recently Viewed",    icon: FaHistory },
        { href: "/properties/compare",         label: "Compare Properties", icon: FaBalanceScale },
      ],
    },
    {
      label: "Owner Tools",
      items: [
        { href: "/properties/add",      label: "List a Property",     icon: FaPlus },
        { href: "/bookings",            label: "Manage Bookings",      icon: FaCalendarCheck },
        { href: "/rental-applications", label: "Rental Applications", icon: FaClipboardList },
        { href: "/offers",              label: "Offers & Bids",        icon: FaHandshake },
        { href: "/owner/import",        label: "Bulk Import",          icon: FaBuilding },
      ],
    },
    {
      label: "Tenant Tools",
      items: [
        { href: "/viewings",    label: "Schedule Viewings",   icon: FaCalendarCheck },
        { href: "/leases",      label: "Lease Agreements",    icon: FaFileContract },
        { href: "/maintenance", label: "Maintenance Hub",     icon: FaTools },
        { href: "/invoices",    label: "Invoices & Receipts", icon: FaFileInvoiceDollar },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/payments",      label: "Payment Centre",  icon: FaCreditCard },
        { href: "/organizations", label: "Organizations",   icon: FaBuilding },
        { href: "/notifications", label: "Notifications",   icon: FaBell },
        { href: "/profile",       label: "Edit Profile",    icon: FaUser },
        { href: "/settings",      label: "Settings",        icon: FaCog },
        { href: "/support",       label: "Help & Support",  icon: FaHeadset },
      ],
    },
  ];
}

function DropdownItem({ item, onClick, pathname }) {
  const Icon = item.icon;
  const active = pathname === item.href;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
        active
          ? "bg-blue-50 text-blue-700"
          : item.accent
          ? "text-violet-700 hover:bg-violet-50"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm transition-colors ${
          active
            ? "bg-blue-100 text-blue-600"
            : item.accent
            ? "bg-violet-100 text-violet-600 group-hover:bg-violet-200"
            : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
        }`}
      >
        <Icon aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium leading-tight">{item.label}</span>
        {item.desc && (
          <span className="block truncate text-xs text-slate-400">{item.desc}</span>
        )}
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAuthenticated = status === "authenticated" && Boolean(session?.user?.id);
  const canAdmin = isAuthenticated && canAccessAdmin(session?.user?.permissions || []);

  const primary = [
    { href: "/", label: t("nav.home") },
    { href: "/properties", label: t("nav.properties") },
    { href: "/properties/search-results", label: "Search" },
    ...(isAuthenticated ? [{ href: "/properties/add", label: t("nav.addProperty") }] : []),
    ...(canAdmin ? [{ href: "/admin", label: t("nav.admin") }] : []),
  ];

  const profileGroups = buildProfileGroups(canAdmin);

  useEffect(() => {
    if (!profileOpen) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

  useEffect(() => {
    setProfileOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const planLabel = session?.user?.plan || session?.user?.subscriptionPlan || null;
  const planBadgeClass =
    planLabel === "PROFESSIONAL"
      ? "bg-violet-100 text-violet-700"
      : planLabel === "AGENCY"
      ? "bg-amber-100 text-amber-700"
      : planLabel === "ENTERPRISE"
      ? "bg-slate-800 text-white"
      : planLabel === "LANDLORD"
      ? "bg-blue-100 text-blue-700"
      : "bg-slate-100 text-slate-500";

  const navLink = (item, mobile = false) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setMobileOpen(false)}
      className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-all ${
        pathname === item.href || (item.href === "/admin" && pathname.startsWith("/admin"))
          ? "bg-slate-100/80 text-blue-700 shadow-sm ring-1 ring-slate-200/50"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      } ${mobile ? "block w-full text-base rounded-xl mt-1" : ""}`}
    >
      {item.label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/75 backdrop-blur-xl transition-all shadow-[0_4px_30px_rgba(0,0,0,0.02)]" aria-label="Main navigation">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-20 items-center justify-between">

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : t("nav.openMenu")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden transition-colors"
          >
            {mobileOpen ? (
              <FaTimes className="text-xl" aria-hidden="true" />
            ) : (
              <FaBars className="text-xl" aria-hidden="true" />
            )}
          </button>

          {/* Logo + desktop nav links */}
          <div className="flex flex-1 items-center justify-center md:justify-start">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <Image className="h-10 w-auto" src={logo} alt="PropertyPulse" priority />
              <span className="hidden text-2xl font-black tracking-tight text-slate-900 md:block">
                PropertyPulse
              </span>
            </Link>
            <div className="ms-6 hidden gap-1 md:flex">
              {primary.map((item) => navLink(item))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {status === "loading" && (
              <div aria-hidden="true" className="hidden h-9 w-32 animate-pulse rounded-full bg-slate-200 md:block" />
            )}

            {status === "unauthenticated" && (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  href="/auth/signin"
                  className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  {t("nav.signIn")}
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                >
                  Sign up
                </Link>
              </div>
            )}

            {status === "authenticated" && session && (
              <>
                <Link
                  href="/messages"
                  aria-label={t("nav.messages")}
                  className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <FaEnvelope className="text-lg" aria-hidden="true" />
                  <UnreadMessageCount session={session} />
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    aria-label={t("nav.openUserMenu")}
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                    onClick={() => setProfileOpen((v) => !v)}
                    className={`flex items-center gap-2 rounded-full p-0.5 ring-2 ring-offset-2 ring-offset-white transition ${profileOpen ? "ring-blue-600" : "ring-transparent hover:ring-slate-300"}`}
                  >
                    <UserAvatar
                      src={session.user?.image}
                      alt={session.user?.name || "User"}
                      className="h-9 w-9 rounded-full object-cover"
                      width={72}
                      height={72}
                    />
                  </button>

                  {profileOpen && (
                    <div className="absolute end-0 z-50 mt-3 w-72 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none">

                      {/* User info header */}
                      <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 px-4 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={session.user?.image}
                            alt={session.user?.name || "User"}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-white/40"
                            width={96}
                            height={96}
                            priority
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {session.user?.name || "My Account"}
                            </p>
                            <p className="truncate text-xs text-blue-100">
                              {session.user?.email || ""}
                            </p>
                            {planLabel && (
                              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${planBadgeClass}`}>
                                {planLabel.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                        </div>
                        <Link
                          href="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="absolute right-3 top-3 rounded-full p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
                          aria-label="Edit profile"
                        >
                          <FaUser className="text-xs" aria-hidden="true" />
                        </Link>
                      </div>

                      {/* Quick actions bar */}
                      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50">
                        {[
                          { href: "/messages",      icon: FaEnvelope, label: "Messages" },
                          { href: "/notifications", icon: FaBell,     label: "Alerts" },
                          { href: "/settings",      icon: FaCog,      label: "Settings" },
                        ].map(({ href, icon: Icon, label }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setProfileOpen(false)}
                            className="flex flex-col items-center gap-1 py-3 text-slate-500 transition hover:bg-white hover:text-blue-600"
                          >
                            <Icon className="text-base" aria-hidden="true" />
                            <span className="text-[10px] font-semibold">{label}</span>
                          </Link>
                        ))}
                      </div>

                      {/* Grouped navigation */}
                      <div className="max-h-[52vh] overflow-y-auto py-1">
                        {profileGroups.map((group, gi) => (
                          <div key={group.label}>
                            {gi > 0 && <div className="my-1 border-t border-slate-100" />}
                            <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              {group.label}
                            </p>
                            {group.items.map((item) => (
                              <DropdownItem
                                key={item.href}
                                item={item}
                                pathname={pathname}
                                onClick={() => setProfileOpen(false)}
                              />
                            ))}
                          </div>
                        ))}
                      </div>

                      {/* Footer: pricing + sign out */}
                      <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <Link
                            href="/pricing"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                          >
                            <FaChevronRight className="text-[9px]" />
                            Upgrade Plan
                          </Link>
                          <button
                            type="button"
                            onClick={() => { setProfileOpen(false); signOut(); }}
                            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-700"
                          >
                            <FaSignOutAlt aria-hidden="true" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <div className="absolute left-0 right-0 top-[81px] border-b border-slate-200 bg-white/95 px-4 pb-6 pt-4 shadow-2xl backdrop-blur-xl md:hidden">
          <div className="space-y-0.5">
            {primary.map((item) => navLink(item, true))}
          </div>

          {status === "authenticated" && session && (
            <>
              <div className="my-3 border-t border-slate-100" />
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 border border-slate-100">
                <UserAvatar
                  src={session.user?.image}
                  alt={session.user?.name || "User"}
                  className="h-10 w-10 rounded-full object-cover"
                  width={80}
                  height={80}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {session.user?.name || "My Account"}
                  </p>
                  <p className="truncate text-xs text-slate-500">{session.user?.email}</p>
                </div>
              </div>

              {[
                { href: "/owner",                      label: "Owner Dashboard",      icon: FaTachometerAlt },
                { href: "/tenant",                     label: "Tenant Portal",        icon: FaKey },
                { href: "/messages",                   label: "Messages",             icon: FaEnvelope },
                { href: "/notifications",              label: "Notifications",        icon: FaBell },
                { href: "/properties/saved",           label: "Saved Properties",     icon: FaHeart },
                { href: "/bookings",                   label: "Manage Bookings",      icon: FaCalendarCheck },
                { href: "/rental-applications",        label: "Rental Applications",  icon: FaClipboardList },
                { href: "/offers",                     label: "Offers & Bids",        icon: FaHandshake },
                { href: "/viewings",                   label: "Schedule Viewings",    icon: FaCalendarCheck },
                { href: "/leases",                     label: "Lease Agreements",     icon: FaFileContract },
                { href: "/maintenance",                label: "Maintenance Hub",      icon: FaTools },
                { href: "/payments",                   label: "Payment Centre",       icon: FaCreditCard },
                { href: "/invoices",                   label: "Invoices & Receipts",  icon: FaFileInvoiceDollar },
                { href: "/organizations",              label: "Organizations",        icon: FaBuilding },
                { href: "/settings",                   label: "Settings",             icon: FaCog },
                { href: "/support",                    label: "Help & Support",       icon: FaHeadset },
                { href: "/profile",                    label: "Edit Profile",         icon: FaUser },
                ...(canAdmin ? [{ href: "/admin", label: "Admin Panel", icon: FaShieldAlt }] : []),
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      pathname === item.href
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="shrink-0 text-base" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="mt-2 border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); signOut(); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                >
                  <FaSignOutAlt aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </>
          )}

          {status === "unauthenticated" && (
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              <Link
                href="/auth/signin"
                onClick={() => setMobileOpen(false)}
                className="block w-full rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                {t("nav.signIn")}
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMobileOpen(false)}
                className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Sign up free
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

