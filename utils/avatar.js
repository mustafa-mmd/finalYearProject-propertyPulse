/**
 * Converts low-resolution OAuth avatar URLs (e.g. Google's default 96px =s96-c)
 * to crisp, high-definition (500px) profile image URLs.
 */
export function getHighResProfileImage(url) {
  if (!url || typeof url !== "string" || !url.trim()) return null;

  const trimmed = url.trim();

  // Google OAuth profile picture URLs (e.g. lh3.googleusercontent.com/a/...=s96-c)
  if (trimmed.includes("googleusercontent.com")) {
    if (/=s\d+(-c)?/.test(trimmed)) {
      return trimmed.replace(/=s\d+(-c)?/g, "=s500-c");
    }
    return trimmed;
  }

  // GitHub / Gravatar avatars with size parameters
  if (trimmed.includes("githubusercontent.com") || trimmed.includes("gravatar.com")) {
    if (/([?&]s=)\d+/.test(trimmed)) {
      return trimmed.replace(/([?&]s=)\d+/g, "$1500");
    }
    return trimmed;
  }

  return trimmed;
}
