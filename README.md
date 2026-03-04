# expo-zebra-scanner

Expo module for Zebra DataWedge with a hook-first API.

## Platform support

- Android: supported
- iOS: API-compatible no-op

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

## Reference

- https://techdocs.zebra.com/datawedge/latest/guide/settings/
- https://techdocs.zebra.com/datawedge/13-0/guide/api/setconfig/
