import Link from "next/link";
import { FaGlobe, FaShieldAlt, FaBuilding, FaUsers, FaChartLine, FaCheckCircle } from "react-icons/fa";

export const metadata = {
  title: "About Us — PropertyPulse",
  description:
    "Learn about PropertyPulse, the global PropTech marketplace transforming residential and commercial real estate transactions worldwide.",
};

const STATS = [
  { label: "Active Global Listings", value: "1M+" },
  { label: "Countries & Regions", value: "150+" },
  { label: "Annual Property Volume", value: "$10B+" },
  { label: "Verified Users & Managers", value: "500K+" },
];

const PILLARS = [
  {
    icon: FaGlobe,
    title: "Global Reach & Connectivity",
    desc: "Connect buyers, renters, landlords, and institutional investors across borders with multi-currency and multi-language support.",
  },
  {
    icon: FaShieldAlt,
    title: "AI-Powered Verification",
    desc: "Every listing and transaction is screened with automated fraud detection and verification algorithms for total peace of mind.",
  },
  {
    icon: FaBuilding,
    title: "End-to-End Management",
    desc: "From initial property discovery to lease signing, automated payments, maintenance ticketing, and analytics.",
  },
  {
    icon: FaChartLine,
    title: "Market Intelligence",
    desc: "Real-time pricing valuation, comparative analysis, and yield insights for residential and commercial real estate.",
  },
];

const LOCATIONS = [
  { city: "San Francisco", region: "Americas Headquarters", address: "500 Howard Street, Suite 400, San Francisco, CA 94105" },
  { city: "London", region: "EMEA Headquarters", address: "30 St Mary Axe, City of London, London EC3A 8EP" },
  { city: "Singapore", region: "Asia-Pacific Headquarters", address: "1 Marina Boulevard, #28-00, Singapore 018989" },
  { city: "Dubai", region: "Middle East Hub", address: "DIFC Gate Precinct Building 4, Dubai, UAE" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 py-24 text-white">
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-400 border border-blue-500/20">
            Global PropTech SaaS
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Reinventing Real Estate, <span className="text-blue-400">Globally</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-300 sm:text-xl leading-relaxed">
            PropertyPulse powers the entire lifecycle of real estate transactions worldwide — connecting buyers, renters, owners, and property managers through modern technology and verified trust.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/properties"
              className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-500 hover:shadow-blue-500/25"
            >
              Explore Global Listings
            </Link>
            <Link
              href="/properties/add"
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 hover:border-slate-600"
            >
              List Your Property
            </Link>
          </div>
        </div>
      </section>

      {/* Global Stats */}
      <section className="-mt-10 relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-6 shadow-xl sm:grid-cols-4 sm:p-8 border border-slate-100">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-extrabold text-blue-600 sm:text-4xl">{stat.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Why PropertyPulse?</h2>
            <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
              Built from the ground up to solve fragmentation, manual friction, and fraud in real estate markets around the globe.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm transition hover:shadow-md hover:-translate-y-1 duration-200"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="text-2xl" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Global Offices */}
      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Our Global Presence</h2>
            <p className="mt-3 text-slate-400 max-w-xl mx-auto">
              Operating with local teams across key real estate hubs in North America, Europe, Middle East, and Asia-Pacific.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {LOCATIONS.map((loc) => (
              <div key={loc.city} className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{loc.region}</span>
                <h3 className="mt-2 text-xl font-bold text-white">{loc.city}</h3>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">{loc.address}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
