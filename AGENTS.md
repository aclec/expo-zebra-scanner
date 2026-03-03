# AGENTS.md

## Project purpose

`expo-zebra-scanner` is an Expo module exposing hook-based APIs for Zebra DataWedge.

-   Android: full native support.
-   iOS: compatibility stubs (no-op behavior).

## Architecture

### TypeScript / JS

-   `src/index.ts`: public API exports (hooks + types only).
-   `src/internal/constants.ts`: shared string constants (`DEFAULT_BARCODE_ACTION`, `DATAWEDGE_API_ACTION`).
-   `src/internal/profile.ts`: profile creation and low-level broadcast helpers (`sendBroadcast`, `sendActionCommand`, `createIntentDatawedgeProfile`, `getDataWedgeVersion`).
-   `src/internal/zebraManager.ts`: singleton subscription manager with dedup + ref counting.
-   `src/useZebraScanner.ts`: barcode-focused hook.
-   `src/useZebraCustomScanner.ts`: raw custom-intent hook.
-   `src/useCreateProfile.ts`: profile creation hook.
-   `src/useZebraCoreFunctions.ts`: imperative core functions hook.

### Android (Kotlin)

-   `ExpoZebraScannerModule.kt`: Expo module entry point, delegates all work to `ReceiverController`.
-   `ReceiverController.kt`: lifecycle-safe register/unregister of barcode and custom receivers.
-   `BarcodeReceiver.kt` (`internal`): receives `ACTION_BARCODE_SCANNED` broadcast, emits `onBarcodeScanned`.
-   `CustomEventReceiver.kt` (`internal`): receives arbitrary custom action broadcasts, emits `onCustomScan`.
-   `BroadcastIntentBuilder.kt`: converts JS payload (`Map<String, Any?>`) to Android `Intent` with proper Bundle extras. Handles nested `Map<*, *>` (→ `Bundle`) and `List<*>` (→ `Parcelable[]`/`StringArray`).
-   `IntentUtils.kt`: `intentToBundle` (Intent → Bundle for JS emission), `parseVersion`.
-   `DataWedgeVersionResolver.kt`: one-shot async DataWedge version query with timeout and cleanup.
-   `ZebraConstants.kt`: internal Kotlin constants (`ACTION_BARCODE_SCANNED`, `DATAWEDGE_API_ACTION`, event names).

### iOS (Swift)

-   `ExpoZebraScannerModule.swift`: no-op stubs for all functions; keeps API shape for cross-platform compat.

## Public API contract (current)

-   `useZebraScanner(options)`
    -   `onBarcodeScanned: (event: BarcodeEvent) => void`
    -   `profile?: CreateProfileData`
    -   `enabled?: boolean`
    -   `customAction?: string`
-   `useZebraCustomScanner(options)` / alias `useCustomZebraScanner`
    -   `onCustomScan: (event: TCustomEvent) => void`
    -   `profile?: CreateProfileData`
    -   `enabled?: boolean`
    -   `customAction?: string`
-   `useCreateProfile()`
-   `useZebraCoreFunctions()`

## Behavioral guarantees to preserve

-   No duplicate native listeners for the same JS flow.
-   Multiple hook instances must coexist safely.
-   Multiple custom actions must run in parallel without overriding each other.
-   Default action fallback remains `com.symbol.datawedge.ACTION_BARCODE_SCANNED`.
-   iOS keeps API shape but returns no-op / neutral values.
-   Profile creation effect is keyed on profile content (`profileKey`), not reference — avoids redundant DataWedge calls on re-renders.

## Native Android rules

-   Keep receiver lifecycle safe (`register`/`unregister` symmetry).
-   Keep support for `stopCustomScanForAction(action)` for per-action cleanup.
-   Avoid crashes on rapid mount/unmount or Fast Refresh (safeUnregister catches exceptions).
-   `BroadcastIntentBuilder` must handle Expo JSI types: `Map<*, *>` → `Bundle`, `List<Map>` → `Parcelable[]`, `List<String>` → `StringArray`. Never rely on `.toString()` for serialization.
-   `DataWedgeVersionResolver`: unregister the temporary receiver only when the result is fully handled (`completed == true`).
-   `DATAWEDGE_API_ACTION` is defined in both `src/internal/constants.ts` (TS) and `ZebraConstants.kt` (Kotlin) — keep them in sync if the value ever changes.

## Lint/build checks

-   Root lint: `npm run lint`
-   TS check: `npx tsc --noEmit -p tsconfig.json`
-   Example lint: `cd example && bun run lint`
-   Android Kotlin compile smoke test: `cd example/android && ./gradlew :app:compileDebugKotlin`

## Migration policy

-   Do not re-export legacy function API from `src/index.ts`.
-   Additive hook improvements are allowed.
-   Any behavior change in event payload/action defaults requires README updates.
