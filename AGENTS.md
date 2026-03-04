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
-   `src/internal/zebraManager.ts`: singleton subscription manager with LIFO exclusive dispatch per action.
-   `src/useZebraScanner.ts`: barcode-focused hook.
-   `src/useZebraCustomScanner.ts`: raw custom-intent hook.
-   `src/useZebraCreateProfile.ts`: profile creation hook (`useZebraCreateProfile`).
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
    -   `enabled?: boolean`
    -   `customAction?: string`
-   `useZebraCustomScanner(options)` / alias `useCustomZebraScanner`
    -   `onCustomScan: (event: TCustomEvent) => void`
    -   `enabled?: boolean`
    -   `customAction?: string`
-   `useZebraCreateProfile()`
-   `useZebraCoreFunctions()`

### `createProfile` payload (`CreateProfileData`)

-   Required:
    -   `PROFILE_NAME: string`
    -   `PACKAGE_NAME: string`
-   Optional:
    -   `PARAM_LIST?: Record<string, string>` (merged with default BARCODE decoders)
    -   `INTENT_ACTION?: string` (overrides default `com.symbol.datawedge.ACTION_BARCODE_SCANNED`)

## Behavioral guarantees to preserve

-   One native JS listener per event type (`barcodeNativeSub`, `customNativeSub`) regardless of how many hooks are mounted.
-   For a given action, **only one handler receives each event** (LIFO exclusive dispatch — last subscriber wins).
-   When the top subscriber unsubscribes, the previous one resumes automatically.
-   Multiple distinct custom actions run in parallel and are fully isolated from each other.
-   `startScan()` / `startCustomScan(action)` called only when the stack for that action goes from 0 → 1.
-   `stopScan()` / `stopCustomScanForAction(action)` called only when the stack becomes empty.
-   Default action fallback remains `com.symbol.datawedge.ACTION_BARCODE_SCANNED`.
-   iOS keeps API shape but returns no-op / neutral values.
-   Profile creation is decoupled from scanner hooks: call `useZebraCreateProfile` explicitly before subscribing.

## Known design constraints

-   **`barcodeNativeSub` / `customNativeSub` are module-level singletons**. `customNativeSub` is a multiplexer: it dispatches to the top of the per-action stack. Multiple actions coexist via `customStacks: Map<string, CustomEntry[]>`.
-   **LIFO stack per action**: `barcodeStack: BarcodeEntry[]` and `customStacks: Map<string, CustomEntry[]>`. Only `stack[stack.length - 1]` receives the event. Unsubscribing splices the entry by ID; if removed from the middle the next-top entry resumes. `__DEV__` warning fires at subscribe-time when `stack.length > 0`.
-   **`customAction` in `useZebraScanner` uses the custom path** (`subscribeCustom` / `onCustomScan` native event), then maps `com.symbol.datawedge.data_string` and `com.symbol.datawedge.label_type` extras to `BarcodeEvent`. If the custom action sends data in a different format, `scanData` and `scanLabelType` will be empty strings — use `useZebraCustomScanner` in that case to receive the raw payload.
-   **DataWedge profile intent output has one action at a time**: a single profile cannot broadcast scanner output to two different `intent_action` values simultaneously.
-   **Profile creation is explicit**: scanner hooks do not create DataWedge profiles. Call `useZebraCreateProfile` (or `useZebraCoreFunctions().createProfile`) before using the scanner hooks if a profile needs to be configured programmatically.
-   **Native calls are guarded**: `startScan`, `stopScan`, `startCustomScan`, `stopCustomScanForAction` are wrapped in `try/catch` — a native failure is logged but does not corrupt JS subscription state.

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
