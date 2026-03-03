# expo-zebra-scanner

Expo module for Zebra DataWedge on Android, with hook-first APIs.

## Platform support

-   Android: fully supported.
-   iOS: API surface exists for compatibility, behavior is no-op.

## Installation

```sh
bun add expo-zebra-scanner
# or
npm install expo-zebra-scanner
# or
yarn add expo-zebra-scanner
```

## New API (hooks only)

The previous function-based API was removed from public exports. Use hooks:

-   `useZebraScanner`
-   `useZebraCustomScanner` (alias: `useCustomZebraScanner`)
-   `useZebraCreateProfile`
-   `useZebraCoreFunctions`

---

## useZebraScanner

Barcode-oriented hook.

```ts
type UseZebraScannerOptions = {
    onBarcodeScanned: (event: BarcodeEvent) => void;
    enabled?: boolean;
    customAction?: string;
};
```

Behavior:

-   If `customAction` is omitted, it listens to the default action: `com.symbol.datawedge.ACTION_BARCODE_SCANNED`.
-   If `customAction` is provided, it listens on that action and maps `com.symbol.datawedge.data_string` / `com.symbol.datawedge.label_type` extras to `BarcodeEvent`.
-   Multiple hook instances are safe: subscriptions are deduplicated and ref-counted.
-   To create a DataWedge profile, call `useZebraCreateProfile` separately before using this hook.

Example:

```tsx
import { useZebraScanner } from "expo-zebra-scanner";

useZebraScanner({
    enabled: true,
    onBarcodeScanned: (event) => {
        console.log(event.scanData, event.scanLabelType);
    },
});
```

---

## useZebraCustomScanner

Raw intent-oriented hook (full event payload).

```ts
type UseZebraCustomScannerOptions<TCustomEvent = ZebraCustomIntentEvent> = {
    onCustomScan: (event: TCustomEvent) => void;
    enabled?: boolean;
    customAction?: string;
};
```

Behavior:

-   If `customAction` is omitted, default action is: `com.symbol.datawedge.ACTION_BARCODE_SCANNED`.
-   Works with multiple parallel actions safely.
-   Hook alias also available: `useCustomZebraScanner`.

Example:

```tsx
import { useZebraCustomScanner } from "expo-zebra-scanner";

useZebraCustomScanner({
    customAction: "com.symbol.datawedge.api.RESULT_ACTION",
    onCustomScan: (event) => {
        console.log(event.action, event.extras);
    },
});
```

---

## useZebraCreateProfile

Returns a function to create/configure a default DataWedge profile. Call this before using the scanner hooks.

```ts
const createProfile = useZebraCreateProfile();
```

`useZebraCreateProfile()` takes no arguments.
Options are passed to `createProfile(...)`.

Signature:

```ts
type CreateProfileData = {
    PROFILE_NAME: string;
    PACKAGE_NAME: string;
    PARAM_LIST?: Record<string, string>;
    INTENT_ACTION?: string;
};
```

Payload options (`createProfile({...})`):

-   `PROFILE_NAME` (required): DataWedge profile name.
-   `PACKAGE_NAME` (required): Android package to bind profile to.
-   `PARAM_LIST` (optional): BARCODE plugin decoder/settings overrides.
-   `INTENT_ACTION` (optional): override DataWedge intent action.

Default usage (recommended):

```ts
const createProfile = useZebraCreateProfile();

createProfile({
    PROFILE_NAME: "ExpoDatawedgeExample",
    PACKAGE_NAME: "expo.modules.zebrascanner.example",
    PARAM_LIST: {
        decoder_qrcode: "true",
        decoder_code128: "true",
    },
});
```

Important:

-   A DataWedge profile intent output uses one `intent_action` at a time.
-   In most cases, do not set `INTENT_ACTION`. Keep the default action `com.symbol.datawedge.ACTION_BARCODE_SCANNED`.
-   Set `INTENT_ACTION` only if you intentionally listen to a custom action (for example `useZebraScanner({ customAction: "..." })`).
-   If you listen with `useZebraScanner({ customAction })`, set the same action in profile creation via `INTENT_ACTION` (or DataWedge UI / manual command).

Custom action example (optional):

```ts
createProfile({
    PROFILE_NAME: "ExpoDatawedgeExample",
    PACKAGE_NAME: "expo.modules.zebrascanner.example",
    INTENT_ACTION: "com.mycompany.MY_SCAN_ACTION",
});
```

---

## useZebraCoreFunctions

Low-level imperative API for advanced flows.

Returned functions:

-   `startScan()`
-   `stopScan()`
-   `startCustomScan(action?)`
-   `stopCustomScan(action?)`
-   `sendBroadcast(bundle)`
-   `sendActionCommand(extraName, extraData)`
-   `createProfile(profile)`
-   `getDataWedgeVersion()`

Example:

```ts
const zebra = useZebraCoreFunctions();

await zebra.getDataWedgeVersion();
zebra.startScan();
```

---

## DataWedge setup reminder

In Zebra DataWedge profile intent output:

-   Delivery: Broadcast
-   Action: `com.symbol.datawedge.ACTION_BARCODE_SCANNED`

Reference docs:

-   https://techdocs.zebra.com/datawedge/latest/guide/settings/
-   https://techdocs.zebra.com/datawedge/13-0/guide/api/setconfig/

## Development checks

```sh
npm run lint
npx tsc --noEmit -p tsconfig.json
cd example && bun run lint
cd example/android && ./gradlew :app:compileDebugKotlin
```
