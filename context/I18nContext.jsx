"use client";
import { createContext, useContext, useMemo } from "react";

const I18nContext = createContext({ locale: "en", t: (key) => key });
function resolvePath(object, path) { return path.split(".").reduce((value, part) => value?.[part], object); }
function format(template, params) { return template.replace(/\{(\w+)\}/g, (_, key) => params[key] === undefined ? `{${key}}` : String(params[key])); }

export function I18nProvider({ locale, messages, fallbackMessages, children }) {
  const value = useMemo(() => ({ locale, t(key, params = {}) { const candidate = resolvePath(messages, key); const fallback = resolvePath(fallbackMessages, key); return format(typeof candidate === "string" ? candidate : typeof fallback === "string" ? fallback : key, params); } }), [fallbackMessages, locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useTranslation() { return useContext(I18nContext); }
