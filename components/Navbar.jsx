"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import logo from "@/assets/images/logo-white.png";
import UnreadMessageCount from "@/components/UnreadMessageCount";
import UserAvatar from "@/components/UserAvatar";
import { useTranslation } from "@/context/I18nContext";
import { canAccessAdmin } from "@/config/admin";

export default function Navbar() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const isAuthenticated = status === "authenticated" && Boolean(session?.user?.id);
  const canAdmin = isAuthenticated && canAccessAdmin(session?.user?.permissions || []);

  const primary = [
    { href: "/", label: t("nav.home") },
    { href: "/properties", label: t("nav.properties") },
    ...(isAuthenticated ? [{ href: "/properties/add", label: t("nav.addProperty") }] : []),
    ...(canAdmin ? [{ href: "/admin", label: t("nav.admin") }] : []),
  ];

  const profileLinks = [
    { href: "/profile", label: t("nav.profile") },
    { href: "/owner/import", label: "Bulk listing import" },
    { href: "/properties/saved", label: t("nav.saved") },
    { href: "/searches", label: "Saved searches" },
    { href: "/properties/compare", label: "Compare properties" },
    { href: "/properties/recently-viewed", label: "Recently viewed" },
    { href: "/payments", label: "Payments" },
    { href: "/organizations", label: t("nav.organizations") },
    { href: "/bookings", label: t("nav.bookings") },
    { href: "/rental-applications", label: t("nav.applications") },
    { href: "/offers", label: t("nav.offers") },
    { href: "/maintenance", label: t("nav.maintenance") },
    { href: "/notifications", label: t("nav.notifications") },
    { href: "/support", label: t("nav.support") },
    { href: "/settings", label: t("nav.settings") },
  ];

  const navLink = (item, mobile = false) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setMobileOpen(false)}
      className={`${
        pathname === item.href || (item.href === "/admin" && pathname.startsWith("/admin"))
          ? "bg-slate-950"
          : ""
      } rounded-md px-3 py-2 text-white hover:bg-slate-900 ${mobile ? "block text-base font-medium" : ""}`}
    >
      {item.label}
    </Link>
  );

  return (
    <nav className="border-b border-blue-500 bg-blue-700">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-20 items-center justify-between">
          <button
            type="button"
            aria-label={t("nav.openMenu")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-md p-2 text-white hover:bg-blue-800 md:hidden"
          >
            <span aria-hidden="true" className="text-2xl">☰</span>
          </button>
          
          <div className="flex flex-1 items-center justify-center md:justify-start">
            <Link href="/" className="flex shrink-0 items-center">
              <Image className="h-10 w-auto" src={logo} alt="PropertyPulse" priority />
              <span className="ms-2 hidden text-2xl font-bold text-white md:block">PropertyPulse</span>
            </Link>
            <div className="ms-6 hidden gap-2 md:flex">
              {primary.map((item) => navLink(item))}
            </div>
          </div>

          {status === "loading" && (
            <div aria-hidden="true" className="hidden h-10 w-36 animate-pulse rounded bg-blue-600 md:block" />
          )}

          {status === "unauthenticated" && (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/auth/signin" className="rounded-md bg-slate-800 px-4 py-2 font-semibold text-white">
                {t("nav.signIn")}
              </Link>
            </div>
          )}

          {status === "authenticated" && session && (
            <div className="flex items-center">
              <Link
                href="/messages"
                aria-label={t("nav.messages")}
                className="relative me-4 rounded-full bg-slate-800 p-2 text-white"
              >
                <span aria-hidden="true">✉</span>
                <UnreadMessageCount session={session} />
              </Link>

              <div className="relative">
                <button
                  type="button"
                  aria-label={t("nav.openUserMenu")}
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex rounded-full ring-offset-blue-700 focus:ring-2 focus:ring-white focus:ring-offset-2"
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
                  <div className="absolute end-0 z-50 mt-2 max-h-[70vh] w-56 overflow-auto rounded-xl bg-white py-2 shadow-xl ring-1 ring-black/10">
                    {profileLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      >
                        {item.label}
                      </Link>
                    ))}
                    <button
                      onClick={() => signOut()}
                      className="block w-full px-4 py-2 text-start text-sm text-slate-700 hover:bg-slate-100"
                    >
                      {t("nav.signOut")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="space-y-1 px-2 pb-3 md:hidden">
          {primary.map((item) => navLink(item, true))}
          {status === "unauthenticated" && (
            <Link
              href="/auth/signin"
              onClick={() => setMobileOpen(false)}
              className="block w-full rounded-md bg-slate-800 px-3 py-2 text-start text-white"
            >
              {t("nav.signIn")}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
