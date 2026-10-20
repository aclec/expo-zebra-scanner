import { Platform } from "expo";

import type { NativeExpoZebraScannerModule } from "../ExpoZebraScannerModule";

declare const __DEV__: boolean;

let warned = false;

function warnUnsupportedPlatform(): void {
    if (warned || !__DEV__) return;
    warned = true;
    console.warn(
        `[zebra] expo-zebra-scanner only supports Android (Zebra DataWedge). On ${Platform.OS}, every hook and function is a no-op and getDataWedgeVersion() resolves to [0, 0, 0]. Pass enabled: Platform.OS === "android" to the scanner hooks and guard imperative calls the same way to silence this warning.`
    );
}

// Stand-in for the native module on every platform other than Android.
export const unsupportedPlatformModule: NativeExpoZebraScannerModule = {
    addListener: () => {
        warnUnsupportedPlatform();
        return { remove: () => {} };
    },
    startScan: warnUnsupportedPlatform,
    stopScan: warnUnsupportedPlatform,
    startCustomScan: warnUnsupportedPlatform,
    stopCustomScan: warnUnsupportedPlatform,
    stopCustomScanForAction: warnUnsupportedPlatform,
    sendBroadcast: warnUnsupportedPlatform,
    getDataWedgeVersion: async () => {
        warnUnsupportedPlatform();
        return [0, 0, 0];
    },
};
