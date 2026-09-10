import * as NextAuthModule from "next-auth";
import { authOptions } from "@/utils/authOptions";

function resolveNextAuth(moduleValue) {
  let candidate = moduleValue;
  for (let depth = 0; depth < 4; depth += 1) {
    if (typeof candidate === "function") return candidate;
    candidate = candidate?.default ?? candidate?.["module.exports"];
  }
  throw new TypeError("NextAuth could not be resolved as a function");
}

const handler = resolveNextAuth(NextAuthModule)(authOptions);

export { handler as GET, handler as POST };
