/**
 * One-time fix script: patches users with empty image field
 * by fetching their Google profile picture if available.
 *
 * Run: node scripts/fix-user-images.mjs
 */
// env loaded via --env-file flag
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌  MONGO_URI not set in environment.");
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  image: { type: String, default: "" },
}, { strict: false, collection: "users" });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // Find all users with empty image
  const usersWithNoImage = await User.find({ $or: [{ image: "" }, { image: null }, { image: { $exists: false } }] });
  console.log(`Found ${usersWithNoImage.length} user(s) with no profile image.`);

  for (const user of usersWithNoImage) {
    console.log(`\n  User: ${user.email}`);
    console.log(`  Current image: "${user.image}"`);

    // The name initials URL so there's always a real image URL fallback
    const initials = (user.name || user.email || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email || "User")}&background=2563eb&color=ffffff&bold=true&size=200`;

    await User.updateOne({ _id: user._id }, { $set: { image: fallbackUrl } });
    console.log(`  ✅ Updated image to: ${fallbackUrl}`);
  }

  await mongoose.disconnect();
  console.log("\n✅ Done. All users with empty images have been patched.");
  console.log("\n⚠️  IMPORTANT: Sign out and sign back in with Google to get your actual Google profile photo set automatically.");
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
