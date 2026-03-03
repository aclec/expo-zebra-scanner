import { BroadcastEvent, BroadcastExtras } from "../ExpoZebraBroadcastEvent";
import ExpoZebraScannerModule from "../ExpoZebraScannerModule";
import { CreateProfileData, DEFAULT_BARCODES_CONFIG, DEFAULT_INTENT_CONFIG, DEFAULT_KEYSTROKE_CONFIG } from "../ProfileConstants";
import { DATAWEDGE_API_ACTION } from "./constants";

export function sendBroadcast(bundle: BroadcastEvent): void {
    ExpoZebraScannerModule.sendBroadcast(bundle);
}

export function sendActionCommand(extraName: string, extraData: BroadcastExtras | string): void {
    sendBroadcast({
        action: DATAWEDGE_API_ACTION,
        extras: {
            [extraName]: extraData,
        },
    });
}

export function createIntentDatawedgeProfile({ PROFILE_NAME, PACKAGE_NAME, PARAM_LIST = {}, INTENT_ACTION }: CreateProfileData): void {
    sendActionCommand("com.symbol.datawedge.api.CREATE_PROFILE", PROFILE_NAME);
    sendActionCommand("com.symbol.datawedge.api.SET_CONFIG", {
        ...DEFAULT_BARCODES_CONFIG,
        PROFILE_NAME,
        PLUGIN_CONFIG: {
            ...DEFAULT_BARCODES_CONFIG.PLUGIN_CONFIG,
            PARAM_LIST: {
                ...DEFAULT_BARCODES_CONFIG.PLUGIN_CONFIG.PARAM_LIST,
                ...PARAM_LIST,
            },
        },
        APP_LIST: [
            {
                PACKAGE_NAME,
                ACTIVITY_LIST: ["*"],
            },
        ],
    });
    sendActionCommand("com.symbol.datawedge.api.SET_CONFIG", {
        ...DEFAULT_INTENT_CONFIG,
        PROFILE_NAME,
        PLUGIN_CONFIG: {
            ...DEFAULT_INTENT_CONFIG.PLUGIN_CONFIG,
            PARAM_LIST: {
                ...DEFAULT_INTENT_CONFIG.PLUGIN_CONFIG.PARAM_LIST,
                ...(INTENT_ACTION ? { intent_action: INTENT_ACTION } : {}),
            },
        },
    });
    sendActionCommand("com.symbol.datawedge.api.SET_CONFIG", {
        ...DEFAULT_KEYSTROKE_CONFIG,
        PROFILE_NAME,
    });
}

export async function getDataWedgeVersion(): Promise<[number, number, number]> {
    try {
        const arr = await ExpoZebraScannerModule.getDataWedgeVersion();
        if (Array.isArray(arr) && arr.length >= 3) {
            return [Number(arr[0]) || 0, Number(arr[1]) || 0, Number(arr[2]) || 0];
        }
    } catch {}
    return [0, 0, 0];
}
