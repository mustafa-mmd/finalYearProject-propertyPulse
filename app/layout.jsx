import { cookies } from "next/headers";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import NotificationPermission from "@/components/NotificationPermission";
import PwaSupport from "@/components/PwaSupport";
import { I18nProvider } from "@/context/I18nContext";
import { getMessages } from "@/utils/i18n";
import { RTL_LOCALES, validLocale } from "@/config/international";
import { GlobalProvider } from "@/context/globalContext";
import { ToastContainer } from "react-toastify";
import "@/styles/global.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "photoswipe/dist/photoswipe.css";
import "react-toastify/dist/ReactToastify.css";

const configuredDomain = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";

export const metadata = {
  title: {
    default: "PropertyPulse - Global PropTech Marketplace",
    template: "%s | PropertyPulse",
  },
  description:
    "Discover, verify, rent, buy and manage residential and commercial property through a global PropTech marketplace.",
  keywords:
    "global property marketplace, PropTech SaaS, property management, real estate, buy and rent property",
  authors: [{ name: "PropertyPulse" }],
  metadataBase: new URL(configuredDomain),
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "PropertyPulse",
    title: "PropertyPulse - Global PropTech Marketplace",
    description:
      "Structured global locations, verification, transactions and multi-tenant property operations.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PropertyPulse",
    description: "A global PropTech marketplace and property operations platform.",
  },
};

export default async function RootLayout({ children }) {
  const locale = validLocale((await cookies()).get("pp_locale")?.value);

  return (
    <html lang={locale} dir={RTL_LOCALES.includes(locale) ? "rtl" : "ltr"}>
      <body className="font-sans">
        <GlobalProvider>
          <I18nProvider locale={locale} messages={getMessages(locale)} fallbackMessages={getMessages("en")}>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <ToastContainer position="bottom-right" theme="light" />
            <NotificationPermission />
            <PwaSupport />
          </AuthProvider>
          </I18nProvider>
        </GlobalProvider>
      </body>
    </html>
  );
}
