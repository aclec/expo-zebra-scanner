# expo-zebra-scanner

Expo module for Zebra DataWedge with a hook-first API.

## Platform support

- Android: supported
- iOS / web: not supported. Every hook and function is a no-op (`getDataWedgeVersion()` resolves to `[0, 0, 0]`), and a one-time warning is logged in development. To silence it, pass `enabled: Platform.OS === "android"` to the scanner hooks and guard imperative calls (`createProfile`, `sendBroadcast`, …) with the same check.

## Installation

```sh
bun add expo-zebra-scanner
# or
npm install expo-zebra-scanner
# or
yarn add expo-zebra-scanner
```

## Quick start

1. Create/configure your DataWedge profile.
2. Subscribe to scans with `useZebraScanner`.

```tsx
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useZebraCreateProfile, useZebraScanner } from "expo-zebra-scanner";

export function ScanScreen() {
  const [lastScan, setLastScan] = useState("");
  const createProfile = useZebraCreateProfile();

  useEffect(() => {
    createProfile({
      PROFILE_NAME: "ExpoDatawedgeExample",
      PACKAGE_NAME: "expo.modules.zebrascanner.example",
    });
  }, [createProfile]);

  useZebraScanner({
    onBarcodeScanned: (event) => {
      setLastScan(`${event.scanLabelType}: ${event.scanData}`);
    },
  });

  return (
    <View>
      <Text>Last scan: {lastScan || "none"}</Text>
    </View>
  );
}
```

## API

### `useZebraScanner(options)`

```ts
type UseZebraScannerOptions = {
  onBarcodeScanned: (event: BarcodeEvent) => void;
  enabled?: boolean;
  customAction?: string;
};
```

Use this for standard barcode scans.

### `useZebraCustomScanner(options)`

```ts
type UseZebraCustomScannerOptions<TCustomEvent = ZebraCustomIntentEvent> = {
  onCustomScan: (event: TCustomEvent) => void;
  enabled?: boolean;
  customAction?: string;
};
```

Use this when you need the full raw broadcast payload.

### `useZebraCreateProfile()`

Returns `createProfile(profile)`.

```ts
type CreateProfileData = {
  PROFILE_NAME: string;
  PACKAGE_NAME: string;
  PARAM_LIST?: Record<string, string>;
  INTENT_ACTION?: string;
};
```

### `useZebraCoreFunctions()`

Low-level imperative API:

- `startScan()`
- `stopScan()`
- `startCustomScan(action?)`
- `stopCustomScan(action?)`
- `sendBroadcast(bundle)`
- `sendActionCommand(extraName, extraData)`
- `createProfile(profile)`
- `getDataWedgeVersion()`

## DataWedge reminder

For standard scanner output in DataWedge profile intent settings:

- Delivery: `Broadcast`
- Action: `com.symbol.datawedge.ACTION_BARCODE_SCANNED`

If you use a custom action in the hook, use the same action in DataWedge profile config.

## Notes

- Hooks are the public API.
- If multiple listeners use the same action, the latest mounted listener receives events.
- `sendBroadcast` `extras` must be an object of key/value pairs (one intent extra per key); anything else is rejected with an error log.
- In `useZebraCustomScanner` events, top-level boolean and int extras arrive as strings (DataWedge sends most values as strings); values inside nested bundles and arrays keep their type. Array extras arrive as JS arrays. Byte arrays arrive as arrays of unsigned byte values (0–255): `com.symbol.datawedge.decode_data` is an array of those, one per decoded segment.

## Reference

- https://techdocs.zebra.com/datawedge/latest/guide/settings/
- https://techdocs.zebra.com/datawedge/13-0/guide/api/setconfig/
