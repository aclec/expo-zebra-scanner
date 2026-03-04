import { BroadcastEvent, BroadcastExtras } from "../ExpoZebraBroadcastEvent";
import ExpoZebraScannerModule from "../ExpoZebraScannerModule";
import { CreateProfileData, DEFAULT_BARCODES_CONFIG, DEFAULT_INTENT_CONFIG, DEFAULT_KEYSTROKE_CONFIG } from "../ProfileConstants";
import { DATAWEDGE_API_ACTION } from "./constants";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTrimmedString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeScannerParams(value: unknown): Record<string, string> {
    if (!isRecord(value)) return {};

    const normalized: Record<string, string> = {};
    for (const [key, paramValue] of Object.entries(value)) {
        if (typeof paramValue === "string") {
            normalized[key] = paramValue;
        }
    }
    return normalized;
}

export function sendBroadcast(bundle: BroadcastEvent): void {
    const action = getTrimmedString(bundle?.action);
    if (!action) {
        console.error("[zebra] sendBroadcast called with empty action");
        return;
    }

    const extras = bundle?.extras;
    if (typeof extras !== "string" && !isRecord(extras)) {
        console.error("[zebra] sendBroadcast called with invalid extras; expected string or object");
        return;
    }

    ExpoZebraScannerModule.sendBroadcast({ action, extras });
}

export function sendActionCommand(extraName: string, extraData: BroadcastExtras | string): void {
    const normalizedExtraName = getTrimmedString(extraName);
    if (!normalizedExtraName) {
        console.error("[zebra] sendActionCommand called with empty extraName");
        return;
    }

    sendBroadcast({
        action: DATAWEDGE_API_ACTION,
        extras: {
            [normalizedExtraName]: extraData,
        },
    });
}

export function createIntentDatawedgeProfile(profile: CreateProfileData): void {
    const profileName = getTrimmedString(profile?.PROFILE_NAME);
    const packageName = getTrimmedString(profile?.PACKAGE_NAME);
    const normalizedParams = normalizeScannerParams(profile?.PARAM_LIST);
    const intentAction = getTrimmedString(profile?.INTENT_ACTION);

    if (!profileName) {
        console.error("[zebra] createProfile called with empty PROFILE_NAME");
        return;
    }
    if (!packageName) {
        console.error("[zebra] createProfile called with empty PACKAGE_NAME");
        return;
    }

    sendActionCommand("com.symbol.datawedge.api.CREATE_PROFILE", profileName);
    sendActionCommand("com.symbol.datawedge.api.SET_CONFIG", {
        ...DEFAULT_BARCODES_CONFIG,
        PROFILE_NAME: profileName,
        PLUGIN_CONFIG: {
            ...DEFAULT_BARCODES_CONFIG.PLUGIN_CONFIG,
            PARAM_LIST: {
                ...DEFAULT_BARCODES_CONFIG.PLUGIN_CONFIG.PARAM_LIST,
                ...normalizedParams,
            },
        },
        APP_LIST: [
            {
                PACKAGE_NAME: packageName,
                ACTIVITY_LIST: ["*"],
            },
        ],
    });
    sendActionCommand("com.symbol.datawedge.api.SET_CONFIG", {
        ...DEFAULT_INTENT_CONFIG,
        PROFILE_NAME: profileName,
        PLUGIN_CONFIG: {
            ...DEFAULT_INTENT_CONFIG.PLUGIN_CONFIG,
            PARAM_LIST: {
                ...DEFAULT_INTENT_CONFIG.PLUGIN_CONFIG.PARAM_LIST,
                ...(intentAction ? { intent_action: intentAction } : {}),
            },
        },
    });
    sendActionCommand("com.symbol.datawedge.api.SET_CONFIG", {
        ...DEFAULT_KEYSTROKE_CONFIG,
        PROFILE_NAME: profileName,
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
