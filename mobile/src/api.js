import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
const API_URL = (process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || "http://localhost:3000").replace(/\/$/, "");
const TOKEN_KEY = "property_pulse_mobile_token";
async function request(path, options = {}) { const token = await SecureStore.getItemAsync(TOKEN_KEY); const response = await fetch(`${API_URL}${path}`, { ...options, headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } }); const payload = await response.json(); if (!response.ok) { const error = new Error(payload.error?.message || "Request failed"); error.code = payload.error?.code; throw error; } return payload.data ?? payload; }
export async function properties(page = 1) { return request(`/api/prop?page=${page}&pageSize=20`); }
export async function startDeviceAuthorization() { return request("/api/mobile/device", { method: "POST", body: JSON.stringify({ deviceName: Constants.deviceName || "PropertyPulse mobile", platform: process.env.EXPO_OS || "mobile" }) }); }
export async function exchangeDeviceCode(deviceCode) { const data = await request("/api/mobile/device", { method: "POST", body: JSON.stringify({ action: "exchange", deviceCode }) }); await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK }); return data; }
export async function currentUser() { return request("/api/mobile/me"); }
export async function logout() { try { await request("/api/mobile/me", { method: "DELETE" }); } finally { await SecureStore.deleteItemAsync(TOKEN_KEY); } }
export async function hasSession() { return Boolean(await SecureStore.getItemAsync(TOKEN_KEY)); }
