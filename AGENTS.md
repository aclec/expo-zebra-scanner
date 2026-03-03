# AGENTS.md

## Project purpose

`expo-zebra-scanner` is an Expo module exposing hook-based APIs for Zebra DataWedge.

-   Android: full native support.
-   iOS: compatibility stubs (no-op behavior).

## Architecture

-   `src/index.ts`: public API exports (hooks + types only).
-   `src/internal/profile.ts`: profile creation and low-level broadcast helpers.
-   `src/internal/zebraManager.ts`: singleton subscription manager with dedup + ref counting.
-   `src/useZebraScanner.ts`: barcode-focused hook.
-   `src/useZebraCustomScanner.ts`: raw custom-intent hook.
-   `src/useCreateProfile.ts`: profile creation hook.
-   `src/useZebraCoreFunctions.ts`: imperative core functions hook.
-   `android/`: native Kotlin module.
-   `ios/`: native Swift stubs.

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

## Native Android rules

-   Keep receiver lifecycle safe (`register`/`unregister` symmetry).
-   Keep support for `stopCustomScanForAction(action)` for per-action cleanup.
-   Avoid crashes on rapid mount/unmount or Fast Refresh.
-   Preserve DataWedge extras compatibility.

## Lint/build checks

-   Root lint: `npm run lint`
-   TS check: `npx tsc --noEmit -p tsconfig.json`
-   Example lint: `cd example && bun run lint`
-   Android Kotlin compile smoke test: `cd example/android && ./gradlew :app:compileDebugKotlin`

## Migration policy

-   Do not re-export legacy function API from `src/index.ts`.
-   Additive hook improvements are allowed.
-   Any behavior change in event payload/action defaults requires README updates.
