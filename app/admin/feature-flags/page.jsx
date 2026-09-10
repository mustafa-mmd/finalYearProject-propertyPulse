import connectDB from "@/config/database";
import FeatureFlag from "@/models/FeatureFlag";
import { requirePagePermission } from "@/utils/pageAuthorization";
import FeatureFlagsClient from "./FeatureFlagsClient";
import { ROLES } from "@/config/authorization";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Feature Flags",
  description: "Configure platform toggles and rollouts.",
};

export default async function AdminFeatureFlagsPage() {
  await requirePagePermission("feature_flags.manage", "/admin/feature-flags");
  await connectDB();

  // Query all feature flags and sanitize for client
  const rawFlags = await FeatureFlag.find({}).sort({ key: 1 }).lean();
  const flags = JSON.parse(JSON.stringify(rawFlags));

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <FeatureFlagsClient initialFlags={flags} ROLES={ROLES} />
    </section>
  );
}
