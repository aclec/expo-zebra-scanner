import ExpoZebraScannerModule from "./ExpoZebraScannerModule";
import { DEFAULT_BARCODE_ACTION } from "./internal/constants";
import { createIntentDatawedgeProfile, getDataWedgeVersion, sendBroadcast, sendActionCommand } from "./internal/profile";
import { resolveAction } from "./internal/zebraManager";

const zebraCoreFunctions = {
    startScan: (): void => {
        ExpoZebraScannerModule.startScan();
    },
    stopScan: (): void => {
        ExpoZebraScannerModule.stopScan();
    },
    startCustomScan: (action: string = DEFAULT_BARCODE_ACTION): void => {
        ExpoZebraScannerModule.startCustomScan(resolveAction(action));
    },
    stopCustomScan: (action?: string): void => {
        const normalizedAction = typeof action === "string" ? action.trim() : "";
        if (normalizedAction.length > 0) {
            ExpoZebraScannerModule.stopCustomScanForAction(normalizedAction);
            return;
        }
        ExpoZebraScannerModule.stopCustomScan();
    },
    sendBroadcast,
    sendActionCommand,
    createProfile: createIntentDatawedgeProfile,
    getDataWedgeVersion,
};

export function useZebraCoreFunctions() {
    return zebraCoreFunctions;
}
