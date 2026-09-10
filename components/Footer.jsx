"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaYoutube,
  FaGlobe,
  FaPhone,
  FaEnvelope,
  FaArrowRight,
} from "react-icons/fa";
import logo from "@/assets/images/logo.png";

const FOOTER_LINKS = [
  {
    heading: "Marketplace",
    links: [
      { label: "Browse Properties", href: "/properties" },
      { label: "Search & Filter", href: "/properties/search-results" },
      { label: "Compare Properties", href: "/properties/compare" },
      { label: "Saved Properties", href: "/properties/saved" },
      { label: "Saved Searches", href: "/searches" },
      { label: "Recently Viewed", href: "/properties/recently-viewed" },
    ],
  },
  {
    heading: "Landlords & Owners",
    links: [
      { label: "Owner Dashboard", href: "/owner" },
      { label: "List a Property", href: "/properties/add" },
      { label: "Manage Bookings", href: "/bookings" },
      { label: "Bulk Listing Import", href: "/owner/import" },
      { label: "Rental Applications", href: "/rental-applications" },
      { label: "Payment Center", href: "/payments" },
    ],
  },
  {
    heading: "Tenants & Buyers",
    links: [
      { label: "Tenant Portal", href: "/tenant" },
      { label: "Schedule Viewings", href: "/viewings" },
      { label: "Offers & Bids", href: "/offers" },
      { label: "Lease Agreements", href: "/leases" },
      { label: "Maintenance Hub", href: "/maintenance" },
      { label: "Invoices & Receipts", href: "/invoices" },
    ],
  },
  {
    heading: "Company & Legal",
    links: [
      { label: "About PropertyPulse", href: "/about" },
      { label: "Help & Support", href: "/support" },
      { label: "Pricing Plans", href: "/pricing" },
      { label: "Organizations", href: "/organizations" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
];

const SOCIAL = [
  { label: "Facebook", icon: FaFacebookF, href: "https://facebook.com" },
  { label: "Twitter / X", icon: FaTwitter, href: "https://twitter.com" },
  { label: "LinkedIn", icon: FaLinkedinIn, href: "https://linkedin.com" },
  { label: "Instagram", icon: FaInstagram, href: "https://instagram.com" },
  { label: "YouTube", icon: FaYoutube, href: "https://youtube.com" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300">
      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src={logo} alt="PropertyPulse" className="h-9 w-auto" />
              <span className="text-xl font-extrabold text-white">PropertyPulse</span>
            </Link>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              The premier global PropTech platform. Discover, verify, rent, buy,
              and manage residential and commercial properties worldwide with full confidence.
            </p>

            {/* Contact info */}
            <ul className="mt-6 space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <FaGlobe className="shrink-0 text-blue-500" aria-hidden="true" />
                <span className="text-slate-400">Global Hubs: San Francisco · London · Singapore · Dubai</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FaPhone className="shrink-0 text-blue-500" aria-hidden="true" />
                <a href="tel:+18005550199" className="text-slate-400 hover:text-white transition-colors">
                  +1 (800) 555-0199 (24/7 Support)
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <FaEnvelope className="shrink-0 text-blue-500" aria-hidden="true" />
                <a href="mailto:hello@propertypulse.com" className="text-slate-400 hover:text-white transition-colors">
                  hello@propertypulse.com
                </a>
              </li>
            </ul>

            {/* Social icons */}
            <div className="mt-7 flex gap-3">
              {SOCIAL.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:border-blue-500 hover:bg-blue-600 hover:text-white"
                >
                  <Icon className="text-sm" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white">{col.heading}</h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-14 rounded-2xl border border-white/10 bg-white/5 p-7 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div className="max-w-md">
            <h3 className="text-base font-bold text-white">Real Estate Insights</h3>
            <p className="mt-1 text-sm text-slate-400">
              Subscribe to get market reports, verified property alerts, and platform updates.
            </p>
          </div>
          <form onSubmit={handleNewsletter} className="mt-5 flex min-w-0 flex-1 gap-2 sm:mt-0">
            {subscribed ? (
              <p className="flex-1 rounded-xl bg-emerald-900/40 px-4 py-3 text-sm font-semibold text-emerald-400">
                ✓ Subscribed! You&apos;ll receive real estate updates.
              </p>
            ) : (
              <>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="submit"
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  Subscribe <FaArrowRight className="text-xs" aria-hidden="true" />
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} PropertyPulse. All rights reserved.
          </p>

          <div className="flex gap-6 text-xs text-slate-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
