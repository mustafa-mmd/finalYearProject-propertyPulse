import connectDB from "@/config/database";
import SubscriptionPlan from "@/models/SubscriptionPlan";
import { DEFAULT_SUBSCRIPTION_PLANS } from "@/config/plans";

export async function GET() {
  await connectDB();
  const stored = await SubscriptionPlan.find({ active: true, public: true }).sort({ sortOrder: 1 }).lean();
  return Response.json(stored.length ? stored : DEFAULT_SUBSCRIPTION_PLANS, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
  });
}
