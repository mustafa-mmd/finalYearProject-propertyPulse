"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  FaArrowRight,
  FaCheckCircle,
  FaHome,
  FaKey,
  FaMoon,
  FaShieldAlt,
  FaMapMarkerAlt,
  FaBuilding,
  FaUsers,
  FaListAlt,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import { canAccessAdmin } from "@/config/admin";
import PropertySearchForm from "./PropertySearchForm";

const TABS = [
  {
    label: "Rent",
    purpose: "LONG_TERM_RENT",
    icon: FaKey,
    color: "from-blue-600 to-indigo-600",
    desc: "Find long-term rental homes",
  },
  {
    label: "Buy",
    purpose: "SALE",
    icon: FaHome,
    color: "from-emerald-600 to-teal-600",
    desc: "Purchase your dream property",
  },
  {
    label: "Short Stay",
    purpose: "SHORT_TERM_RENT",
    icon: FaMoon,
    color: "from-violet-600 to-purple-600",
    desc: "Nightly & weekly bookings",
  },
];

const TRUST_POINTS = [
  { icon: FaShieldAlt, label: "Verified listing signals" },
  { icon: FaMapMarkerAlt, label: "Location-aware search" },
  { icon: FaCheckCircle, label: "Direct, secure enquiries" },
];

export default function Hero({ stats = {} }) {
  const { data: session } = useSession();
  const isAdmin = session && canAccessAdmin(session.user?.permissions || []);
  const [activeTab, setActiveTab] = useState(0);

  const liveStats = [
    {
      label: "Live listings",
      value: stats.listings ?? 0,
      icon: FaListAlt,
      color: "text-blue-600",
    },
    {
      label: "Registered users",
      value: stats.users ?? 0,
      icon: FaUsers,
      color: "text-emerald-600",
    },
    {
      label: "Active agencies",
      value: stats.organizations ?? 0,
      icon: FaBuilding,
      color: "text-violet-600",
    },
  ];

  const currentTab = TABS[activeTab];

  return (
    <section className="relative isolate overflow-visible border-b border-slate-200 bg-[#f7f9fc]">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 -top-52 h-[34rem] w-[34rem] rounded-full bg-blue-200/45 blur-3xl" />
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.12),_transparent_68%)]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.03fr_0.97fr] lg:gap-16">

          {/* LEFT COLUMN */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" />
              Smarter property discovery
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-black leading-[1.03] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[4.15rem]">
              Find a place that moves your life{" "}
              <span className="relative whitespace-nowrap text-blue-600">
                forward.
                <svg viewBox="0 0 230 14" className="absolute -bottom-2 left-0 w-full text-blue-200" aria-hidden="true">
                  <path d="M3 10C62 2 159 2 227 7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="7" />
                </svg>
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              Explore live homes for rent, sale, and short stays with powerful
              filters, reliable location data, and the details you need to decide.
            </p>

            {/* I want to — tab pills */}
            <div className="mt-7 flex flex-wrap items-center gap-2.5" aria-label="Property purpose tabs">
              <span className="mr-1 text-sm font-semibold text-slate-500">I want to</span>
              {TABS.map((tab, index) => {
                const Icon = tab.icon;
                const active = activeTab === index;
                return (
                  <button
                    key={tab.purpose}
                    type="button"
                    onClick={() => setActiveTab(index)}
                    className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      active
                        ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                        : "border-slate-200 bg-white text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 hover:shadow-md"
                    }`}
                  >
                    <Icon className={`text-sm ${active ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} aria-hidden="true" />
                    {tab.label}
                    {!active && (
                      <FaArrowRight className="text-[10px] text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active tab description & Quick Action Link */}
            <div className="mt-3.5 flex flex-wrap items-center gap-3">
              <span className={`inline-block rounded-full bg-gradient-to-r ${currentTab.color} px-3 py-1 text-xs font-bold text-white shadow-sm`}>
                {currentTab.desc}
              </span>
              <Link
                href={`/properties?purpose=${currentTab.purpose}`}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700 hover:text-blue-900 hover:underline transition"
              >
                Browse all {currentTab.label.toLowerCase()} listings <FaArrowRight className="text-[10px]" />
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200 pt-6">
              {TRUST_POINTS.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Icon className="text-blue-600" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — hero image */}
          <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
            <div className="absolute -inset-4 rotate-2 rounded-[2rem] bg-blue-600/10" aria-hidden="true" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border-[6px] border-white bg-slate-200 shadow-[0_28px_70px_-24px_rgba(15,23,42,0.45)]">
              <Image
                src="/images/properties/f1.jpg"
                alt="Modern property listing"
                fill
                priority
                sizes="(max-width: 1024px) 92vw, 46vw"
                className="object-cover transition duration-700 hover:scale-[1.025]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" aria-hidden="true" />

              <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-slate-950/55 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.13em] text-white shadow-lg backdrop-blur-md sm:left-7 sm:top-7">
                <FaCheckCircle className="text-emerald-400" aria-hidden="true" />
                Discover with confidence
              </div>

              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/30 bg-white/90 p-4 shadow-xl backdrop-blur-md sm:bottom-7 sm:left-7 sm:right-auto sm:max-w-sm sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                    <FaMapMarkerAlt aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-bold text-slate-950">Search beyond the postcode</p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      Discover by city, neighbourhood, landmark, or your current location.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH FORM — pre-filled by active tab */}
        <div className="relative z-20 mt-10 rounded-[1.5rem] border border-slate-200/80 bg-white/70 p-2 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-3 lg:mt-12">
          <div className="px-2 pt-2 sm:px-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              Start your search — {currentTab.label}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {currentTab.desc}. Refine by price, space, amenities, availability, and more.
            </p>
          </div>
          <PropertySearchForm key={currentTab.purpose} tone="light" initialFilters={{ purpose: currentTab.purpose }} />
        </div>

        {/* STATS BAR — visible only to admin users */}
        {isAdmin && (
          <dl className="mx-auto mt-8 grid max-w-4xl grid-cols-1 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white/70 px-6 shadow-sm backdrop-blur sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-0">
            {liveStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center justify-center gap-1 py-5 sm:px-6">
                  <Icon className={`text-xl ${stat.color}`} aria-hidden="true" />
                  <dd className="text-2xl font-black tracking-tight text-slate-950">
                    {Number(stat.value).toLocaleString()}
                  </dd>
                  <dt className="text-sm font-semibold text-slate-500">{stat.label}</dt>
                </div>
              );
            })}
          </dl>
        )}
      </div>
    </section>
  );
}
