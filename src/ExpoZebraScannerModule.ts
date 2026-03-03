import { requireNativeModule } from "expo-modules-core";

import { BroadcastEvent } from "./ExpoZebraBroadcastEvent";

// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
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

export default requireNativeModule<NativeExpoZebraScannerModule>("ExpoZebraScanner");
