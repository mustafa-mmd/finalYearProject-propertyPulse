import assert from "node:assert/strict";
import { decryptSecret, encryptSecret, generateRecoveryCodes, generateTotpCode, generateTotpSecret, hashPassword, tokenHash, validatePassword, verifyPassword, verifyTotp } from "../utils/accountSecurity.js";

process.env.NEXTAUTH_SECRET ||= "test-secret-that-is-long-and-not-used-outside-tests";
const password = "StrongProperty42";
const encoded = hashPassword(password);
assert.equal(verifyPassword(password, encoded), true, "valid password must verify");
assert.equal(verifyPassword(`${password}!`, encoded), false, "invalid password must not verify");
assert.equal(validatePassword("short").valid, false, "weak password must fail policy");
assert.equal(validatePassword(password).valid, true, "strong password must pass policy");
const secret = generateTotpSecret(); const now = 1_800_000_000_000; const code = generateTotpCode(secret, now);
assert.equal(verifyTotp(secret, code, now), true, "current TOTP must verify");
assert.equal(verifyTotp(secret, "000000", now), code === "000000", "incorrect TOTP must fail");
assert.equal(decryptSecret(encryptSecret(secret)), secret, "encrypted MFA secret must round-trip");
assert.equal(new Set(generateRecoveryCodes()).size, 10, "recovery codes must be unique");
assert.equal(tokenHash("one"), tokenHash("one"), "token hashing must be deterministic");
assert.notEqual(tokenHash("one"), tokenHash("two"), "different tokens must hash differently");
console.log("Authentication security tests passed.");
