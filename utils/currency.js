export const SUPPORTED_CURRENCIES = Object.freeze([
  { code: "PKR", symbol: "Rs", name: "Pakistani Rupee", country: "Pakistan", locale: "ur-PK" },
  { code: "USD", symbol: "$", name: "US Dollar", country: "United States", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", country: "European Union / Germany / France", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "British Pound", country: "United Kingdom", locale: "en-GB" },
  { code: "ZAR", symbol: "R", name: "South African Rand", country: "South Africa", locale: "en-ZA" },
  { code: "SAR", symbol: "SAR", name: "Saudi Riyal", country: "Saudi Arabia", locale: "ar-SA" },
  { code: "AED", symbol: "AED", name: "UAE Dirham", country: "United Arab Emirates", locale: "ar-AE" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", country: "India", locale: "en-IN" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", country: "Canada", locale: "en-CA" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", country: "Australia", locale: "en-AU" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", country: "Singapore", locale: "en-SG" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", country: "Japan", locale: "ja-JP" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", country: "Switzerland", locale: "de-CH" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", country: "China", locale: "zh-CN" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", country: "New Zealand", locale: "en-NZ" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", country: "Hong Kong", locale: "zh-HK" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", country: "Nigeria", locale: "en-NG" },
  { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi", country: "Ghana", locale: "en-GH" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", country: "Kenya", locale: "en-KE" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound", country: "Egypt", locale: "ar-EG" },
  { code: "QAR", symbol: "QAR", name: "Qatari Riyal", country: "Qatar", locale: "ar-QA" },
  { code: "KWD", symbol: "KD", name: "Kuwaiti Dinar", country: "Kuwait", locale: "ar-KW" },
  { code: "BHD", symbol: "BD", name: "Bahraini Dinar", country: "Bahrain", locale: "ar-BH" },
  { code: "OMR", symbol: "OMR", name: "Omani Rial", country: "Oman", locale: "ar-OM" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", country: "Bangladesh", locale: "bn-BD" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", country: "Malaysia", locale: "ms-MY" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", country: "Indonesia", locale: "id-ID" },
  { code: "THB", symbol: "฿", name: "Thai Baht", country: "Thailand", locale: "th-TH" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", country: "Philippines", locale: "en-PH" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", country: "Vietnam", locale: "vi-VN" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", country: "Brazil", locale: "pt-BR" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso", country: "Mexico", locale: "es-MX" },
  { code: "CLP", symbol: "CLP$", name: "Chilean Peso", country: "Chile", locale: "es-CL" },
  { code: "COP", symbol: "COL$", name: "Colombian Peso", country: "Colombia", locale: "es-CO" },
  { code: "PEN", symbol: "S/.", name: "Peruvian Sol", country: "Peru", locale: "es-PE" },
  { code: "ARS", symbol: "ARS$", name: "Argentine Peso", country: "Argentina", locale: "es-AR" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", country: "Sweden", locale: "sv-SE" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", country: "Norway", locale: "no-NO" },
  { code: "DKK", symbol: "kr.", name: "Danish Krone", country: "Denmark", locale: "da-DK" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty", country: "Poland", locale: "pl-PL" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna", country: "Czech Republic", locale: "cs-CZ" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint", country: "Hungary", locale: "hu-HU" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", country: "Turkey", locale: "tr-TR" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel", country: "Israel", locale: "he-IL" },
  { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia", country: "Ukraine", locale: "uk-UA" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble", country: "Russia", locale: "ru-RU" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", country: "South Korea", locale: "ko-KR" },
]);

export function detectUserCurrency() {
  if (typeof window === "undefined") return "PKR";

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (timezone.includes("Karachi") || timezone.includes("Pakistan") || timezone.includes("Islamabad") || timezone.includes("Lahore")) return "PKR";
    if (timezone.includes("Johannesburg")) return "ZAR";
    if (timezone.includes("London")) return "GBP";
    if (timezone.includes("Dubai")) return "AED";
    if (timezone.includes("Riyadh")) return "SAR";
    if (timezone.includes("Kolkata") || timezone.includes("Calcutta")) return "INR";
    if (timezone.includes("Toronto") || timezone.includes("Vancouver")) return "CAD";
    if (timezone.includes("Sydney") || timezone.includes("Melbourne")) return "AUD";
    if (timezone.includes("Berlin") || timezone.includes("Paris") || timezone.includes("Rome") || timezone.includes("Madrid") || timezone.includes("Amsterdam")) return "EUR";
    if (timezone.startsWith("America/")) return "USD";

    const lang = navigator.language || "";
    if (lang.includes("PK") || lang.includes("ur")) return "PKR";
    if (lang.includes("ZA")) return "ZAR";
    if (lang.includes("GB")) return "GBP";
    if (lang.includes("AE")) return "AED";
    if (lang.includes("SA")) return "SAR";
    if (lang.includes("IN")) return "INR";
  } catch (e) {
    // ignore error
  }

  return "PKR";
}

export const DEFAULT_CURRENCY = "PKR";
const CURRENCY_MAP = new Map(SUPPORTED_CURRENCIES.map((currency) => [currency.code, currency]));

export function getCurrency(code) {
  const normalized = String(code || "").toUpperCase();
  return CURRENCY_MAP.get(normalized) || CURRENCY_MAP.get(detectUserCurrency()) || CURRENCY_MAP.get(DEFAULT_CURRENCY);
}

export function formatPrice(amount, currencyCode = DEFAULT_CURRENCY, options = {}) {
  const currency = getCurrency(currencyCode);
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: options.decimals ?? (options.compact ? 0 : 2),
      minimumFractionDigits: options.decimals ?? 0,
      notation: options.compact ? "compact" : "standard",
    }).format(amount);
  } catch {
    return `${currency.symbol} ${Number(amount).toLocaleString()}`;
  }
}

export function formatPriceRange(min, max, currencyCode = DEFAULT_CURRENCY, period = "") {
  const suffix = period ? ` / ${period}` : "";
  if (!min && !max) return "—";
  if (!min || min === max) return `${formatPrice(max, currencyCode, { decimals: 0 })}${suffix}`;
  return `${formatPrice(min, currencyCode, { decimals: 0 })} – ${formatPrice(max, currencyCode, { decimals: 0 })}${suffix}`;
}

export function isSupportedCurrency(code) {
  return CURRENCY_MAP.has(String(code || "").toUpperCase());
}
