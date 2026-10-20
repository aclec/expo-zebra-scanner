# expo-zebra-scanner

## 58.0.0

- Update to Expo SDK 58
- Update example app to Expo SDK 58 (React Native 0.85 → 0.88)
- iOS and web log a one-time development warning that the module is Android-only; importing it on web no longer crashes
- `sendBroadcast`: arrays of numbers are now sent as `int[]` (e.g. DataWedge `NOTIFY`) instead of a string
- `useZebraCustomScanner`: array extras now arrive as JS arrays instead of unreadable strings; byte arrays such as `com.symbol.datawedge.decode_data` arrive as arrays of unsigned byte values (0–255)
- **Breaking:** `sendBroadcast` `extras` must be an object of key/value pairs; a string was silently dropped and is now rejected with an error log
- `getDataWedgeVersion()` no longer resolves to `[0, 0, 0]` when another component's DataWedge command result arrives during the lookup

## 56.0.0

- Update to Expo SDK 56
- Update example app to Expo SDK 56 (React Native 0.83 → 0.85)
- iOS minimum deployment target raised to 16.4 (Expo SDK 56 baseline)

## 55.2.0

Merged release covering previous 55.x migration work + latest stability hardening.

### BREAKING CHANGES

- Updated package versioning to match Expo SDK (`55`).
- Public API is hook-first.
- Removed legacy function-based exports from the public entrypoint:
  - `startScan`, `stopScan`
  - `addListener`, `removeListener`
  - `startCustomScan`, `stopCustomScan`, `addCustomListener`
  - `sendBroadcast`, `sendActionCommand`
  - `createIntentDatawedgeProfile`
  - `getDataWedgeVersion` (standalone export)

### Added

- `useZebraScanner(options)`
- `useZebraCustomScanner(options)` and alias `useCustomZebraScanner`
- `useZebraCreateProfile()`
- `useZebraCoreFunctions()`
- `INTENT_ACTION?: string` in `CreateProfileData` to override DataWedge intent action when needed.
- Android support for parallel custom actions and per-action cleanup via `stopCustomScanForAction(action)`.

### Changed

- `createIntentDatawedgeProfile` keeps default profile behavior and applies `INTENT_ACTION` only when explicitly provided.
- Hook internals preserve LIFO exclusive dispatch with one native listener per event type.
- Action handling is normalized (`trim`) across scanner/custom flows to avoid whitespace-based duplicates.

### Fixed

- Defensive runtime validation for JS public inputs:
  - invalid broadcast payloads are rejected safely
  - empty `extraName`, `PROFILE_NAME`, or `PACKAGE_NAME` are ignored with no crash
  - malformed hook options fail closed with no-op handlers
- Native listener lifecycle hardening in JS manager:
  - guarded listener creation/removal
  - guarded native start/stop paths to avoid corrupting subscription state on native errors
- Android Kotlin stability hardening:
  - receiver registration state is now atomic (state updated only after successful register)
  - custom receiver keys normalized before register/stop
  - `BarcodeReceiver` always emits non-null strings for `scanData` / `scanLabelType`
  - `DataWedgeVersionResolver` now guarantees single promise resolution with cleanup on timeout/error
  - module-level `sendBroadcast` avoids blank-action broadcasts and catches broadcast failures

### Docs

- README simplified to be user-focused (quick start + essential API).
- Internal agent documentation updated to reflect current runtime guarantees and native constraints.

## 6.0.0

- Add Custom Event support on Android: startCustomScan(action), stopCustomScan(), addCustomListener(listener)
- New API: getDataWedgeVersion() returning [major, minor, patch]
- Keep existing barcode receiver and default event `onBarcodeScanned` unchanged
- Update to Expo SDK 54
- Update expo-modules-core

## 5.0.0

- Update to Expo SDK 52

## 4.0.0

- Update to Expo SDK 51
