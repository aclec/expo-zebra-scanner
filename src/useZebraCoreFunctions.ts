import ExpoZebraScannerModule from "./ExpoZebraScannerModule";
import { DEFAULT_BARCODE_ACTION } from "./internal/constants";
import { createIntentDatawedgeProfile, getDataWedgeVersion, sendBroadcast, sendActionCommand } from "./internal/profile";

const zebraCoreFunctions = {
    startScan: (): void => {
        ExpoZebraScannerModule.startScan();
    },
    stopScan: (): void => {
        ExpoZebraScannerModule.stopScan();
    },
    startCustomScan: (action: string = DEFAULT_BARCODE_ACTION): void => {
        ExpoZebraScannerModule.startCustomScan(action);
    },
    stopCustomScan: (action?: string): void => {
        if (action && action.trim().length > 0) {
            ExpoZebraScannerModule.stopCustomScanForAction(action);
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
