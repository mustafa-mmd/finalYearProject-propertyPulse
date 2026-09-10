import Link from "next/link";
import Hero from "../components/Hero";
import HomeProperties from "../components/HomeProperties";
import FeaturedProperties from "@/components/FeaturedProperties";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import User from "@/models/User";
import Organization from "@/models/Organization";
import {
  FaHome,
  FaKey,
  FaMoon,
  FaBuilding,
  FaShieldAlt,
  FaUsers,
  FaCreditCard,
  FaCalendarAlt,
  FaClipboardList,
  FaChartBar,
  FaCheck,
  FaTimes,
  FaArrowRight,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
} from "react-icons/fa";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "PropertyPulse —  PropTech SaaS Platform",
  description:
    "Find verified rental and sale properties across the globe. AI-powered verification, multi-tenant workspace tools, and seamless payment processing.",
};

async function getPlatformStats() {
  try {
    await connectDB();
    const [listings, users, organizations] = await Promise.all([
      Property.countDocuments({ listingStatus: "PUBLISHED", deletedAt: { $exists: false } }),
      User.countDocuments({ accountStatus: { $ne: "DELETED" } }),
      Organization.countDocuments({ status: "ACTIVE", deletedAt: { $exists: false } }),
    ]);
    return { listings, users, organizations };
  } catch {
    return { listings: 0, users: 0, organizations: 0 };
  }
}

const FEATURES = [
  {
    icon: FaShieldAlt,
    title: "AI-Powered Verification",
    body: "Every listing passes automated AI screening before publication. Risk scores, fraud signals, and compliance checks happen instantly.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: FaBuilding,
    title: "Multi-Tenant Workspaces",
    body: "Create your agency or property management company. Invite team members, assign roles, and manage portfolios collaboratively.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: FaCreditCard,
    title: "Integrated Payments",
    body: "Secure PayFast-powered payments for bookings, deposits, and rental applications. Full transaction audit trail included.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: FaCalendarAlt,
    title: "Booking & Viewings",
    body: "Tenants can request short-term bookings or schedule in-person viewings directly from any listing. Manage all in one place.",
    color: "from-orange-500 to-amber-600",
  },
  {
    icon: FaClipboardList,
    title: "Rental Applications",
    body: "Digital rental application workflow from submission to lease drafting. Built-in approval and decline pipeline for landlords.",
    color: "from-cyan-500 to-blue-600",
  },
  {
    icon: FaChartBar,
    title: "Analytics & Reports",
    body: "Track listing performance, payment history, verification outcomes, and tenant activity from a single dashboard.",
    color: "from-rose-500 to-pink-600",
  },
];

const LISTING_TYPES = [
  {
    label: "Residential Rent",
    icon: FaKey,
    purpose: "LONG_TERM_RENT",
    desc: "Apartments, houses & townhouses",
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 hover:bg-blue-100",
    border: "border-blue-100 hover:border-blue-300",
    text: "text-blue-700",
  },
  {
    label: "Sale Properties",
    icon: FaHome,
    purpose: "SALE",
    desc: "Buy your dream home today",
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 hover:bg-emerald-100",
    border: "border-emerald-100 hover:border-emerald-300",
    text: "text-emerald-700",
  },
  {
    label: "Short-Term Stays",
    icon: FaMoon,
    purpose: "SHORT_TERM_RENT",
    desc: "Nightly & weekly rentals",
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 hover:bg-violet-100",
    border: "border-violet-100 hover:border-violet-300",
    text: "text-violet-700",
  },
  {
    label: "Commercial",
    icon: FaBuilding,
    purpose: "COMMERCIAL_LEASE",
    desc: "Offices, warehouses & retail",
    gradient: "from-orange-500 to-amber-600",
    bg: "bg-orange-50 hover:bg-orange-100",
    border: "border-orange-100 hover:border-orange-300",
    text: "text-orange-700",
  },
];

const PLANS = [
  {
    name: "Free",
    code: "FREE",
    price: "R 0",
    period: "/month",
    highlight: false,
    badge: null,
    description: "Perfect for individual landlords and renters starting out.",
    features: [
      { label: "1 active listing slot", included: true },
      { label: "Basic verification workflow", included: true },
      { label: "Messaging & saved properties", included: true },
      { label: "Team workspace", included: false },
      { label: "AI safety inspection", included: false },
      { label: "Priority support", included: false },
    ],
    cta: "Start for free",
    href: "/subscribe/checkout?plan=FREE",
  },
  {
    name: "Individual Landlord",
    code: "LANDLORD",
    price: "R 299",
    period: "/month",
    highlight: false,
    badge: null,
    description: "Professional tools for independent property owners.",
    features: [
      { label: "10 active listings slots", included: true },
      { label: "Verification workflow", included: true },
      { label: "Listing analytics & insights", included: true },
      { label: "Priority email support", included: true },
      { label: "Team workspace", included: false },
      { label: "API access", included: false },
    ],
    cta: "Start 14-day trial",
    href: "/subscribe/checkout?plan=LANDLORD",
  },
  {
    name: "Professional",
    code: "PROFESSIONAL",
    price: "R 799",
    period: "/month",
    highlight: true,
    badge: "Most popular",
    description: "For growing agencies and active property managers.",
    features: [
      { label: "50 active listing slots", included: true },
      { label: "5 team member seats", included: true },
      { label: "AI verification scan", included: true },
      { label: "Advanced lead management", included: true },
      { label: "Booking & lease workflows", included: true },
      { label: "Priority phone & email support", included: true },
    ],
    cta: "Start 14-day trial",
    href: "/subscribe/checkout?plan=PROFESSIONAL",
  },
  {
    name: "Agency",
    code: "AGENCY",
    price: "R 1,999",
    period: "/month",
    highlight: false,
    badge: null,
    description: "Multi-user operations for agencies and brokerage firms.",
    features: [
      { label: "250 active listing slots", included: true },
      { label: "25 team member seats", included: true },
      { label: "10 branch offices", included: true },
      { label: "API access & webhooks", included: true },
      { label: "Verification dashboard", included: true },
      { label: "Dedicated account manager", included: true },
    ],
    cta: "Start 14-day trial",
    href: "/subscribe/checkout?plan=AGENCY",
  },
  {
    name: "Enterprise",
    code: "ENTERPRISE",
    price: "Custom",
    period: "",
    highlight: false,
    badge: null,
    description: "Custom limits, governance, and support for large portfolios.",
    features: [
      { label: "Unlimited listing slots", included: true },
      { label: "Unlimited team seats", included: true },
      { label: "Dedicated account manager", included: true },
      { label: "Custom SLA & 99.9% uptime", included: true },
      { label: "White-label options", included: true },
      { label: "Enterprise audit reporting", included: true },
    ],
    cta: "Contact sales",
    href: "/support",
  },
];

export default async function HomePage() {
  const stats = await getPlatformStats();

  return (
    <>
      {/* Hero */}
      <Hero stats={stats} />

      {/* Browse by type — real icons, industry-level design */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <p className="pp-badge-brand inline-block">Discover</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Browse by listing type
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">
              From short-term stays to commercial investments — find exactly what you&apos;re looking for.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LISTING_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Link
                  key={type.purpose}
                  href={"/properties/search-results?purpose=" + type.purpose}
                  className={`group flex flex-col items-center rounded-2xl border-2 ${type.border} ${type.bg} p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
                >
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${type.gradient} text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                    <Icon aria-hidden="true" />
                  </span>
                  <p className={`mt-3 font-bold ${type.text}`}>{type.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{type.desc}</p>
                  <span className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${type.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Browse now <FaArrowRight className="text-[10px]" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <FeaturedProperties />

      {/* Recent Listings */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="pp-badge-brand inline-block">Just listed</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Recent properties</h2>
            </div>
            <Link href="/properties" className="btn-secondary shrink-0">
              View all listings →
            </Link>
          </div>
          <div className="mt-8">
            <HomeProperties />
          </div>
        </div>
      </section>

      {/* ═══ PRICING — moved above Platform capabilities ═══ */}
      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">Simple, transparent pricing</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Start free. Scale when you&apos;re ready.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-blue-200">
              No credit card required. Publish your first listing today and upgrade as your portfolio grows.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl p-8 transition-all duration-300 ${plan.highlight
                    ? "bg-white text-slate-900 shadow-2xl shadow-blue-950/50 ring-2 ring-blue-400 lg:scale-105"
                    : "bg-white/5 text-white backdrop-blur-sm border border-white/10 hover:bg-white/10"
                  }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-4 py-1 text-xs font-bold text-white shadow-lg">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <p className={`text-sm font-bold uppercase tracking-widest ${plan.highlight ? "text-blue-600" : "text-blue-400"}`}>
                    {plan.name}
                  </p>
                  <p className={`mt-2 text-sm ${plan.highlight ? "text-slate-500" : "text-blue-200"}`}>
                    {plan.description}
                  </p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    {plan.period && (
                      <span className={`text-sm ${plan.highlight ? "text-slate-400" : "text-blue-300"}`}>{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="mt-7 flex-1 space-y-3 border-t border-current/10 pt-6">
                  {plan.features.map((feature) => (
                    <li key={feature.label} className={`flex items-center gap-3 text-sm ${plan.highlight ? "text-slate-700" : "text-blue-100"}`}>
                      {feature.included ? (
                        <FaCheck className={`shrink-0 text-emerald-500`} aria-hidden="true" />
                      ) : (
                        <FaTimes className={`shrink-0 ${plan.highlight ? "text-slate-300" : "text-slate-600"}`} aria-hidden="true" />
                      )}
                      <span className={!feature.included ? "opacity-50" : ""}>{feature.label}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`mt-8 block rounded-xl px-5 py-3.5 text-center text-sm font-bold transition-all ${plan.highlight
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25"
                      : "border border-white/20 text-white hover:bg-white/10"
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-blue-300">
            Need a custom plan?{" "}
            <Link href="/support" className="font-semibold text-white underline underline-offset-2 hover:text-blue-200">
              Contact our sales team
            </Link>
          </p>
        </div>
      </section>

      {/* ═══ PLATFORM CAPABILITIES — moved below pricing ═══ */}
      <section className="bg-slate-950 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">Platform capabilities</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Everything you need to operate professionally
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-400">
              Built from the ground up for South African real estate compliance, trust, and scale.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <article
                  key={feat.title}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feat.color} text-xl text-white shadow-lg`}>
                    <Icon aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{feat.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{feat.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="pp-badge-brand inline-block">Get started today</p>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            Your next property is one search away
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Join thousands of landlords, agents, and tenants who trust PropertyPulse to power their real estate journey.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/properties" className="btn-primary px-8 py-3.5 text-base">
              Browse properties
            </Link>
            <Link href="/pricing" className="btn-secondary px-8 py-3.5 text-base">
              View plans
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
