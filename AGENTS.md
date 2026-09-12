# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Gatie

iOS impulse-spending blocker: shields shopping apps via Screen Time and unlocks only after a written reasons-for/against reflection plus a short wait. Expo SDK 57, TypeScript, React Navigation native stack. No backend; all state is on-device.

- `src/state/` — `types.ts`, pure state transforms in `actions.ts`, derived values in `selectors.ts`, AsyncStorage-backed context in `store.tsx`. Screens call `update(s => action(s, ...))`.
- `src/services/blocking.ts` — Screen Time boundary. Currently a mock; Phase 2 replaces it with `react-native-device-activity` (needs the Family Controls entitlement and a custom dev client — does not work in Expo Go).
- `src/services/purchases.ts` — RevenueCat. Mocked unless `EXPO_PUBLIC_REVENUECAT_IOS_KEY` is set. Entitlement id: `pro`.
- Free tier: 1 blocked app, fixed 4-minute wait, streak only. Pro: unlimited apps, money-saved stats/history, custom wait.

Typecheck with `npx tsc --noEmit`.
