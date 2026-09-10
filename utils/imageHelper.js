/**
 * Resolves property image paths to full, valid public or remote URLs.
 * Handles filenames ("a1.jpg"), relative paths ("images/properties/a1.jpg"),
 * and full external URLs ("https://res.cloudinary.com/...").
 */
export function formatPropertyImage(src) {
  if (!src || typeof src !== "string" || !src.trim()) {
    return "/images/properties/a1.jpg";
  }

  const trimmed = src.trim();

  // Full URLs or base64 data URLs
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  // Already correct relative path
  if (trimmed.startsWith("/images/properties/")) {
    return trimmed;
  }

  // Clean path prefixed with slash
  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("/properties/")) {
      return `/images${trimmed}`;
    }
    if (!trimmed.startsWith("/images/")) {
      return `/images/properties${trimmed}`;
    }
    return trimmed.replace("/images/", "/images/properties/");
  }

  // Unprefixed relative path like "a1.jpg" or "properties/a1.jpg"
  if (trimmed.startsWith("properties/")) {
    return `/images/${trimmed}`;
  }

  if (trimmed.startsWith("images/properties/")) {
    return `/${trimmed}`;
  }

  if (trimmed.startsWith("images/")) {
    return `/${trimmed.replace("images/", "images/properties/")}`;
  }

  return `/images/properties/${trimmed}`;
}
