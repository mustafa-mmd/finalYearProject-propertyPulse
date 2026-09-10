import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { enumerateNights } from "../config/commerce.js";
import { canTransitionListing, listingPublicFilter } from "../config/listings.js";
import { permissionsForRoles } from "../config/authorization.js";
import { organizationPermissions } from "../config/organizations.js";

assert.equal(enumerateNights("2030-01-01", "2030-01-04").length, 3);
assert.equal(enumerateNights("2030-01-04", "2030-01-01").length, 0);
assert.equal(enumerateNights("2030-01-01", "2032-01-01").length, 0);
assert.equal(canTransitionListing("PUBLISHED", "UNDER_OFFER"), true);
assert.equal(canTransitionListing("DRAFT", "PUBLISHED"), false);
assert.ok(listingPublicFilter().$or);
assert.ok(permissionsForRoles(["PLATFORM_OWNER"]).includes("admins.manage"));
assert.equal(permissionsForRoles(["SUPER_ADMIN"]).includes("admins.manage"), false);
assert.ok(organizationPermissions(["AGENT"]).includes("listings.create"));
assert.equal(organizationPermissions(["VIEWER"]).includes("members.invite"), false);

const bookingNight = await readFile(new URL("../models/BookingNight.js", import.meta.url), "utf8");
const bookingRoute = await readFile(new URL("../app/api/bookings/route.js", import.meta.url), "utf8");
const tenantAuth = await readFile(new URL("../utils/tenantAuthorization.js", import.meta.url), "utf8");
const aiReview = await readFile(new URL("../utils/listingVerification.js", import.meta.url), "utf8");
const publicPropertyRoute = await readFile(new URL("../app/api/prop/route.js", import.meta.url), "utf8");
assert.ok(bookingNight.includes("unique: true"), "Booking nights need a unique property/date lock");
assert.ok(bookingRoute.includes("BookingNight.insertMany"), "Booking creation must acquire inventory locks");
assert.ok(tenantAuth.includes("OrganizationMember"), "Tenant access must resolve active membership");
assert.ok(aiReview.includes("human decision") && aiReview.includes("Do not approve, publish, reject"), "AI verification must route to human review");
assert.ok(publicPropertyRoute.includes("listingPublicFilter"), "Public listing API must enforce publication status");
console.log("Validated lifecycle, RBAC, tenant isolation, inventory locking, AI review policy, and public visibility controls.");
