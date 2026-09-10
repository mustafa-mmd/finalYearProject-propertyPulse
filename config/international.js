export const SUPPORTED_LOCALES = Object.freeze(["en", "ur", "ar", "fr", "de", "es"]);
export const RTL_LOCALES = Object.freeze(["ur", "ar"]);
export const SUPPORTED_CURRENCIES = Object.freeze([
  "ZAR",
  "PKR",
  "SAR",
  "AED",
  "USD",
  "GBP",
  "EUR",
  "INR",
  "NGN",
  "GHS",
  "KES",
  "EGP",
  "QAR",
  "CAD",
  "AUD",
  "SGD",
]);

export const CURRENCY_SYMBOLS = Object.freeze({
  ZAR: "R",
  PKR: "PKR",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED",
  SAR: "SAR",
  INR: "₹",
  CAD: "CA$",
  AUD: "A$",
  SGD: "S$",
  QAR: "QAR",
  NGN: "₦",
  EGP: "E£",
  GHS: "GH₵",
  KES: "KSh",
});

export const SUPPORTED_COUNTRIES = Object.freeze([
  { code: "ZA", name: "South Africa", currency: "ZAR", locale: "en" },
  { code: "PK", name: "Pakistan", currency: "PKR", locale: "ur" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", locale: "ar" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", locale: "ar" },
  { code: "US", name: "United States", currency: "USD", locale: "en" },
  { code: "GB", name: "United Kingdom", currency: "GBP", locale: "en" },
  { code: "EU", name: "European Union", currency: "EUR", locale: "en" },
]);

export function validCurrency(value) {
  return SUPPORTED_CURRENCIES.includes(String(value || "").toUpperCase())
    ? String(value).toUpperCase()
    : "ZAR";
}

export function validLocale(value) {
  return SUPPORTED_LOCALES.includes(value) ? value : "en";
}

export function formatPrice(amount, currencyCode = "ZAR") {
  if (amount == null) return "Custom";
  if (amount === 0) return "Free";
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  return `${symbol} ${Number(amount).toLocaleString()}`;
}
