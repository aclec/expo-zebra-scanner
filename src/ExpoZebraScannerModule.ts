import { Platform, requireNativeModule } from "expo";

import type { BroadcastEvent } from "./ExpoZebraBroadcastEvent";
import { unsupportedPlatformModule } from "./internal/unsupportedPlatformModule";

export type NativeExpoZebraScannerModule = {
    addListener: (
        eventName: string,
        listener: (event: any) => void
    ) => {
        remove: () => void;
    };
    startScan: () => void;
    stopScan: () => void;
    startCustomScan: (action: string) => void;
    stopCustomScan: () => void;
    stopCustomScanForAction: (action: string) => void;
    sendBroadcast: (bundle: BroadcastEvent) => void;
    getDataWedgeVersion: () => Promise<number[]>;
};

// DataWedge only exists on Android. Other platforms get a JS stub that warns once (in dev)
// and no-ops, so cross-platform apps keep working. On Android a missing native module
// (e.g. Expo Go) still throws, because silently degrading there would hide a broken build.
export default Platform.OS === "android"
    ? requireNativeModule<NativeExpoZebraScannerModule>("ExpoZebraScanner")
    : unsupportedPlatformModule;
