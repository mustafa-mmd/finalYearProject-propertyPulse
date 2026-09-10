import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { canAccessAdmin, visibleAdminItems } from "../config/admin.js";

async function collectFiles(directory, suffix) {
  const entries = await readdir(new URL("../" + directory + "/", import.meta.url), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = directory + "/" + entry.name;
    if (entry.isDirectory()) files.push(...await collectFiles(relative, suffix));
    else if (entry.name.endsWith(suffix)) files.push(relative);
  }
  return files;
}

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
const adminPages = await collectFiles("app/admin", "page.jsx");
const adminRoutes = await collectFiles("app/api/admin", "route.js");

for (const page of adminPages) {
  const source = await read(page);
  assert.equal(source.includes("requirePermission("), false, page + " must not expose API-style authorization exceptions");
  assert.ok(
    source.includes("requirePagePermission(") || source.includes("requireAdminPageAccess("),
    page + " must use the page authorization boundary",
  );
}

for (const route of adminRoutes) {
  const source = await read(route);
  assert.ok(source.includes("requirePermission("), route + " must enforce server-side permission checks");
}

const pageAuthorization = await read("utils/pageAuthorization.js");
const authOptions = await read("utils/authOptions.js");
const navbar = await read("components/Navbar.jsx");
assert.ok(pageAuthorization.includes('redirect(mfaUrl(safeCallback))'), "admin pages must redirect to MFA step-up");
assert.ok(pageAuthorization.includes("canAccessAdmin(actor.permissions)"), "normal users must be rejected before admin rendering");
assert.ok(authOptions.includes("session?.recoveryCode"), "recovery codes must support session step-up");
assert.ok(navbar.includes("canAccessAdmin"), "admin navigation must be permission-derived");
assert.equal(canAccessAdmin(["profile.read"]), false);
assert.equal(canAccessAdmin(["support.manage"]), true);
assert.deepEqual(visibleAdminItems(["support.manage"]).map((item) => item.href), ["/admin", "/admin/support"]);

console.log("Validated admin route isolation, MFA step-up, recovery, and permission-aware navigation.");
