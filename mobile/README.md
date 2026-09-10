# PropertyPulse native mobile client

This Expo/React Native client is separate from the web PWA. It browses public listings, filters locally, opens property details, and signs users in through an OAuth-style device authorization flow. Access tokens are opaque, hashed on the server, stored with Expo SecureStore, expire after 90 days, and can be revoked.

Runtime configuration uses `EXPO_PUBLIC_API_URL`. Native build/signing and store accounts are external release tasks and are intentionally listed in the final manual checklist, not embedded in source control.
