import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  amountsMatch,
  createPayfastSignature,
  getTrustedPropertyRate,
  signaturesMatch,
  validateCustomer,
} from "../utils/payfast.js";

const property = {
  rates: { nightly: 125.5, weekly: 700, monthly: 2500 },
};

assert.equal(getTrustedPropertyRate(property, "nightly"), 125.5);
assert.equal(getTrustedPropertyRate(property, "invalid"), null);
assert.equal(getTrustedPropertyRate({ rates: { nightly: -1 } }, "nightly"), null);
assert.equal(amountsMatch("125.50", 125.5), true);
assert.equal(amountsMatch("1.00", 125.5), false);

const signedPayload = {
  merchant_id: "10000100",
  merchant_key: "test-key",
  amount: "125.50",
  item_name: "Test property",
};
const signature = createPayfastSignature(signedPayload, "test passphrase");
assert.equal(signaturesMatch(signature, signature), true);
assert.equal(signaturesMatch(signature, "0".repeat(32)), false);

assert.ok(validateCustomer({ userName: "A", userEmail: "bad" }).error);
assert.deepEqual(
  validateCustomer({
    userName: "Jane Customer",
    userEmail: "JANE@EXAMPLE.COM",
    userPhone: "+27 12 345 6789",
  }).value,
  {
    userName: "Jane Customer",
    userEmail: "jane@example.com",
    userPhone: "+27 12 345 6789",
  }
);

const payRoute = await readFile(
  new URL("../app/api/payment/pay/route.js", import.meta.url),
  "utf8"
);
const notifyRoute = await readFile(
  new URL("../app/api/payment/notify/route.js", import.meta.url),
  "utf8"
);

assert.equal(payRoute.includes("body.amount"), false, "Checkout must not trust a browser amount");
assert.ok(payRoute.includes("getTrustedPropertyRate"));
assert.ok(notifyRoute.includes("amountsMatch"));
assert.ok(notifyRoute.includes("validateWithPayfast"));
assert.ok(notifyRoute.includes("WebhookEvent"));

console.log("Validated server-owned pricing, signatures, amount checks, and webhook controls.");
