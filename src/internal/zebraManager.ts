import { EventSubscription } from "expo-modules-core";

import { BarcodeEvent } from "../ExpoZebraScannerEvent";
import ExpoZebraScannerModule from "../ExpoZebraScannerModule";
import { DEFAULT_BARCODE_ACTION } from "./constants";

export type ZebraCustomIntentEvent = { action?: string; categories?: string[]; data?: string; type?: string; extras?: Record<string, any> };

type BarcodeHandler = (event: BarcodeEvent) => void;
type CustomHandler<T = ZebraCustomIntentEvent> = (event: T) => void;

type CustomEntry = { action: string; handler: CustomHandler };

let nextId = 1;
const barcodeHandlers = new Map<number, BarcodeHandler>();
const customHandlers = new Map<number, CustomEntry>();
const customActionRefs = new Map<string, number>();

let barcodeNativeSub: EventSubscription | null = null;
let customNativeSub: EventSubscription | null = null;

function getEventAction(event: ZebraCustomIntentEvent): string {
    return typeof event?.action === "string" && event.action.length > 0 ? event.action : "";
}

function ensureBarcodeNativeSub(): void {
    if (barcodeNativeSub) return;
    barcodeNativeSub = ExpoZebraScannerModule.addListener("onBarcodeScanned", (event: BarcodeEvent) => {
        barcodeHandlers.forEach((handler) => {
            handler(event);
        });
    });
}

function ensureCustomNativeSub(): void {
    if (customNativeSub) return;
    customNativeSub = ExpoZebraScannerModule.addListener("onCustomScan", (event: ZebraCustomIntentEvent) => {
        const action = getEventAction(event);
        if (!action) return;

        customHandlers.forEach((entry) => {
            if (entry.action === action) {
                entry.handler(event);
            }
        });
    });
}

function incrementCustomActionRef(action: string): void {
    const current = customActionRefs.get(action) ?? 0;
    customActionRefs.set(action, current + 1);
    if (current === 0) {
        ExpoZebraScannerModule.startCustomScan(action);
    }
}

function decrementCustomActionRef(action: string): void {
    const current = customActionRefs.get(action) ?? 0;
    if (current <= 1) {
        customActionRefs.delete(action);
        ExpoZebraScannerModule.stopCustomScanForAction(action);
        return;
    }
    customActionRefs.set(action, current - 1);
}

function cleanupBarcodeNativeSubIfUnused(): void {
    if (barcodeHandlers.size > 0) return;
    ExpoZebraScannerModule.stopScan();
    barcodeNativeSub?.remove();
    barcodeNativeSub = null;
}

function cleanupCustomNativeSubIfUnused(): void {
    if (customHandlers.size > 0) return;
    customNativeSub?.remove();
    customNativeSub = null;
}

export function resolveAction(customAction?: string): string {
    const action = customAction?.trim();
    return action && action.length > 0 ? action : DEFAULT_BARCODE_ACTION;
}

export function subscribeBarcode(handler: BarcodeHandler): () => void {
    const id = nextId++;
    ensureBarcodeNativeSub();
    if (barcodeHandlers.size === 0) {
        ExpoZebraScannerModule.startScan();
    }
    barcodeHandlers.set(id, handler);

    return () => {
        barcodeHandlers.delete(id);
        cleanupBarcodeNativeSubIfUnused();
    };
}

export function subscribeCustom<T = ZebraCustomIntentEvent>(action: string, handler: CustomHandler<T>): () => void {
    const id = nextId++;
    ensureCustomNativeSub();
    incrementCustomActionRef(action);
    customHandlers.set(id, {
        action,
        handler: handler as CustomHandler,
    });

    return () => {
        const entry = customHandlers.get(id);
        if (!entry) return;
        customHandlers.delete(id);
        decrementCustomActionRef(entry.action);
        cleanupCustomNativeSubIfUnused();
    };
}

export function subscribeBarcodeByAction(action: string, handler: BarcodeHandler): () => void {
    if (action === DEFAULT_BARCODE_ACTION) {
        return subscribeBarcode(handler);
    }

    return subscribeCustom(action, (event: ZebraCustomIntentEvent) => {
        const extras = event?.extras ?? {};
        const scanData = typeof extras["com.symbol.datawedge.data_string"] === "string" ? extras["com.symbol.datawedge.data_string"] : "";
        const scanLabelType = typeof extras["com.symbol.datawedge.label_type"] === "string" ? extras["com.symbol.datawedge.label_type"] : "";
        handler({ scanData, scanLabelType });
    });
}
