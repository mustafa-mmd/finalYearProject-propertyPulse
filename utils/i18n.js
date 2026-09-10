import en from "@/messages/en.json";
import ur from "@/messages/ur.json";
import ar from "@/messages/ar.json";
import fr from "@/messages/fr.json";
import de from "@/messages/de.json";
import es from "@/messages/es.json";
import { RTL_LOCALES, SUPPORTED_LOCALES } from "@/config/international";

export const DEFAULT_LOCALE = "en";
export const MESSAGES = Object.freeze({ en, ur, ar, fr, de, es });
function resolvePath(object, path) { return path.split(".").reduce((value, part) => value?.[part], object); }
function applyParams(template, params = {}) { return template.replace(/\{(\w+)\}/g, (_, key) => params[key] === undefined ? `{${key}}` : String(params[key])); }
export function getMessages(locale = DEFAULT_LOCALE) { return MESSAGES[SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE]; }
export function getTranslations(locale = DEFAULT_LOCALE) { const messages = getMessages(locale); return (key, params = {}) => { const value = resolvePath(messages, key) ?? resolvePath(en, key); return typeof value === "string" ? applyParams(value, params) : key; }; }
export function isRtl(locale) { return RTL_LOCALES.includes(locale); }
export function detectLocale(acceptLanguage) { if (!acceptLanguage) return DEFAULT_LOCALE; for (const part of acceptLanguage.split(",")) { const locale = part.trim().split(";")[0].slice(0, 2).toLowerCase(); if (SUPPORTED_LOCALES.includes(locale)) return locale; } return DEFAULT_LOCALE; }
