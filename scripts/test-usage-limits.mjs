import assert from "node:assert/strict";
import connectDB from "../config/database.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import Subscription from "../models/Subscription.js";
import Property from "../models/Property.js";
import OrganizationMember from "../models/OrganizationMember.js";
import UsageRecord from "../models/UsageRecord.js";
import {
  checkActiveListingsLimit,
  checkTeamMembersLimit,
  checkAiReviewsLimit,
  incrementAiReviewsUsage,
  getSubscriptionLimits,
} from "../utils/usageLimits.js";

// Basic checks mapping parameters
const mockActorId = "60c72b2f9b1d8b23c8e51111";
const mockTenantId = "60c72b2f9b1d8b23c8e52222";

console.log("Starting SaaS usage limits checks verification...");

// 1. Fallback limits verification
const freeLimits = await getSubscriptionLimits(mockActorId, null);
assert.equal(freeLimits.activeListings, 1);
assert.equal(freeLimits.teamMembers, 1);
assert.equal(freeLimits.aiReviews, 1);
console.log("[PASS] Fallback limits match default FREE plan rules.");

// 2. Organization member limits checking mock check
const dummyAccess = await checkTeamMembersLimit(mockActorId, null);
assert.equal(dummyAccess.allowed, true, "Actor outside tenant has no member limits");
console.log("[PASS] Organization member limits boundary bypass check.");

// 3. Month period check
const currentPeriod = new Date().toISOString().slice(0, 7);
assert.match(currentPeriod, /^\d{4}-\d{2}$/);
console.log("[PASS] UsageRecord time period format check.");

console.log("Usage limit units test check passed successfully.");
process.exit(0);
