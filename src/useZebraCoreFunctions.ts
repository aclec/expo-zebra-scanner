import { useMemo } from "react";

import { BroadcastEvent, BroadcastExtras } from "./ExpoZebraBroadcastEvent";
import ExpoZebraScannerModule from "./ExpoZebraScannerModule";
import { CreateProfileData } from "./ProfileConstants";
import { DEFAULT_BARCODE_ACTION, DATAWEDGE_API_ACTION } from "./internal/constants";
import { createIntentDatawedgeProfile, getDataWedgeVersion, sendBroadcast } from "./internal/profile";

export function useZebraCoreFunctions() {
    return useMemo(
        () => ({
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
            sendBroadcast: (bundle: BroadcastEvent): void => {
                sendBroadcast(bundle);
            },
            sendActionCommand: (extraName: string, extraData: BroadcastExtras | string): void => {
                sendBroadcast({
                    action: DATAWEDGE_API_ACTION,
                    extras: {
                        [extraName]: extraData,
                    },
                });
            },
            createProfile: (profile: CreateProfileData): void => {
                createIntentDatawedgeProfile(profile);
            },
            getDataWedgeVersion,
        }),
        []
    );
}
