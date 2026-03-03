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
-   `useCreateProfile`
-   `useZebraCoreFunctions`

---

## useZebraScanner

Barcode-oriented hook. Listens to scan events and optionally creates a DataWedge profile automatically.

```ts
type UseZebraScannerOptions = {
    onBarcodeScanned: (event: BarcodeEvent) => void;
    profile?: CreateProfileData;
    enabled?: boolean;
    customAction?: string;
};
```

Behavior:

-   If `customAction` is omitted, it listens to the default action: `com.symbol.datawedge.ACTION_BARCODE_SCANNED`.
-   If `customAction` is provided, it listens on that action and maps payload to `BarcodeEvent`.
-   Multiple hook instances are safe: subscriptions are deduplicated and ref-counted.

```tsx
import { useState } from "react";
import { Text, View } from "react-native";
import { useZebraScanner } from "expo-zebra-scanner";

export function BarcodeScreen() {
    const [barcode, setBarcode] = useState<string | null>(null);

    useZebraScanner({
        enabled: true,
        profile: {
            PROFILE_NAME: "MyApp",
            PACKAGE_NAME: "com.mycompany.myapp",
        },
        onBarcodeScanned: (event) => {
            setBarcode(event.scanData);
        },
    });

    return (
        <View>
            <Text>Scan a barcode</Text>
            {barcode && <Text>Last scan: {barcode}</Text>}
        </View>
    );
}
```

---

## useZebraCustomScanner

Raw intent-oriented hook — gives you the full event payload, useful for listening to DataWedge API result actions.

```ts
type UseZebraCustomScannerOptions<TCustomEvent = ZebraCustomIntentEvent> = {
    onCustomScan: (event: TCustomEvent) => void;
    profile?: CreateProfileData;
    enabled?: boolean;
    customAction?: string;
};
```

Behavior:

-   If `customAction` is omitted, default action is: `com.symbol.datawedge.ACTION_BARCODE_SCANNED`.
-   Works with multiple parallel actions safely.
-   Hook alias also available: `useCustomZebraScanner`.

```tsx
import { useState } from "react";
import { Text, View } from "react-native";
import { useZebraCustomScanner } from "expo-zebra-scanner";

type ResultEvent = {
    action: string;
    extras: Record<string, unknown>;
};

export function ScanResultListener() {
    const [lastResult, setLastResult] = useState<ResultEvent | null>(null);

    useZebraCustomScanner<ResultEvent>({
        customAction: "com.symbol.datawedge.api.RESULT_ACTION",
        onCustomScan: (event) => {
            setLastResult(event);
        },
    });

    return (
        <View>
            <Text>Listening for DataWedge API results…</Text>
            {lastResult && (
                <Text>{JSON.stringify(lastResult, null, 2)}</Text>
            )}
        </View>
    );
}
```

---

## useCreateProfile

Returns a function to create/configure a DataWedge profile imperatively (e.g. on button press or on mount).

```tsx
import { useEffect } from "react";
import { useCreateProfile } from "expo-zebra-scanner";

export function ProfileSetup() {
    const createProfile = useCreateProfile();

    useEffect(() => {
        createProfile({
            PROFILE_NAME: "MyApp",
            PACKAGE_NAME: "com.mycompany.myapp",
            PARAM_LIST: {
                decoder_qrcode: "true",
                decoder_code128: "true",
            },
        });
    }, []);

    return null; // or any setup UI
}
```

---

## useZebraCoreFunctions

Low-level imperative API for advanced flows (manually trigger scans, send broadcasts, query DataWedge version…).

Returned functions:

-   `startScan()`
-   `stopScan()`
-   `startCustomScan(action?)`
-   `stopCustomScan(action?)`
-   `sendBroadcast(bundle)`
-   `sendActionCommand(extraName, extraData)`
-   `createProfile(profile)`
-   `getDataWedgeVersion()`

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
