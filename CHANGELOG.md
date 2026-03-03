# expo-zebra-scanner

## 55.0.0

### BREAKING CHANGES

-   Updated package versioning to match Expo SDK (`55.0.0`).
-   Public API is now hook-first.
-   Removed legacy function-based exports from the public entrypoint:
    -   `startScan`, `stopScan`
    -   `addListener`, `removeListener`
    -   `startCustomScan`, `stopCustomScan`, `addCustomListener`
    -   `sendBroadcast`, `sendActionCommand`
    -   `createIntentDatawedgeProfile`
    -   `getDataWedgeVersion` (standalone export)

### Added

-   `useZebraScanner(options)`:
    -   `enabled?: boolean`
    -   `onBarcodeScanned?: (event: BarcodeEvent) => void`
    -   `profile?: CreateProfileData`
    -   `customAction?: string`
-   `useZebraCustomScanner(options)` (and alias `useCustomZebraScanner`):
    -   `enabled?: boolean`
    -   `onCustomScan?: (event: TCustomEvent) => void`
    -   `profile?: CreateProfileData`
    -   `customAction?: string`
-   `useCreateProfile()` for profile creation.
-   `useZebraCoreFunctions()` for imperative low-level operations.

### Android

-   Improved native receiver lifecycle safety and cleanup.
-   Added support for parallel custom actions without overriding each other.
-   Added `stopCustomScanForAction(action)` native capability.

## 6.0.0

-   Add Custom Event support on Android: startCustomScan(action), stopCustomScan(), addCustomListener(listener)
-   New API: getDataWedgeVersion() returning [major, minor, patch]
-   Keep existing barcode receiver and default event `onBarcodeScanned` unchanged
-   Update to Expo SDK 54
-   Update expo-modules-core

## 5.0.0

-   Update to Expo SDK 52

## 4.0.0

-   Update to Expo SDK 51
