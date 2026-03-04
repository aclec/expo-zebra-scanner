import { EventSubscription } from "expo-modules-core";

import { BarcodeEvent } from "../ExpoZebraScannerEvent";
import ExpoZebraScannerModule from "../ExpoZebraScannerModule";
import { DEFAULT_BARCODE_ACTION } from "./constants";

declare const __DEV__: boolean;

export type ZebraCustomIntentEvent = { action?: string; categories?: string[]; data?: string; type?: string; extras?: Record<string, any> };

type BarcodeHandler = (event: BarcodeEvent) => void;
type CustomHandler<T = ZebraCustomIntentEvent> = (event: T) => void;

type BarcodeEntry = { id: number; handler: BarcodeHandler };
type CustomEntry = { id: number; handler: CustomHandler };

let nextId = 1;
// LIFO stack for the default barcode action — only the top entry receives events
const barcodeStack: BarcodeEntry[] = [];
// LIFO stacks keyed by custom action — only the top entry per action receives events
const customStacks = new Map<string, CustomEntry[]>();

let barcodeNativeSub: EventSubscription | null = null;
let customNativeSub: EventSubscription | null = null;

function normalizeAction(action?: string): string {
    return typeof action === "string" ? action.trim() : "";
}

function getEventAction(event: ZebraCustomIntentEvent): string {
    return normalizeAction(event?.action);
}

function ensureBarcodeNativeSub(): void {
    if (barcodeNativeSub) return;
    try {
        barcodeNativeSub = ExpoZebraScannerModule.addListener("onBarcodeScanned", (event: BarcodeEvent) => {
            const top = barcodeStack[barcodeStack.length - 1];
            if (!top) return;
            try {
                top.handler(event);
            } catch (error) {
                console.error("[zebra] barcode handler threw an error", error);
            }
        });
    } catch (error) {
        console.error("[zebra] failed to create barcode listener", error);
    }
}

function ensureCustomNativeSub(): void {
    if (customNativeSub) return;
    try {
        customNativeSub = ExpoZebraScannerModule.addListener("onCustomScan", (event: ZebraCustomIntentEvent) => {
            const action = getEventAction(event);
            if (!action) return;

            const stack = customStacks.get(action);
            if (!stack || stack.length === 0) return;

            const top = stack[stack.length - 1];
            try {
                top.handler(event);
            } catch (error) {
                console.error(`[zebra] custom handler threw an error for action "${action}"`, error);
            }
        });
    } catch (error) {
        console.error("[zebra] failed to create custom listener", error);
    }
}

function cleanupBarcodeNativeSubIfUnused(): void {
    if (barcodeStack.length > 0) return;
    try {
        ExpoZebraScannerModule.stopScan();
    } catch (error) {
        console.error("[zebra] failed to stop scan", error);
    }
    try {
        barcodeNativeSub?.remove();
    } catch (error) {
        console.error("[zebra] failed to remove barcode listener", error);
    }
    barcodeNativeSub = null;
}

function cleanupCustomNativeSubIfUnused(): void {
    if (customStacks.size > 0) return;
    try {
        customNativeSub?.remove();
    } catch (error) {
        console.error("[zebra] failed to remove custom listener", error);
    }
    customNativeSub = null;
}

export function resolveAction(customAction?: string): string {
    const action = normalizeAction(customAction);
    return action.length > 0 ? action : DEFAULT_BARCODE_ACTION;
}

export function subscribeBarcode(handler: BarcodeHandler): () => void {
    const id = nextId++;
    ensureBarcodeNativeSub();
    if (barcodeStack.length === 0) {
        try {
            ExpoZebraScannerModule.startScan();
        } catch (error) {
            console.error("[zebra] failed to start scan", error);
        }
    }
    if (__DEV__ && barcodeStack.length > 0) {
        console.warn(`[zebra] ${barcodeStack.length + 1} listeners are stacked for the barcode action — only the latest subscriber will receive scans. Previous subscribers resume when the top one unsubscribes.`);
    }
    barcodeStack.push({ id, handler });

    return () => {
        const index = barcodeStack.findIndex((e) => e.id === id);
        if (index === -1) return;
        barcodeStack.splice(index, 1);
        cleanupBarcodeNativeSubIfUnused();
    };
}

export function subscribeCustom<T = ZebraCustomIntentEvent>(action: string, handler: CustomHandler<T>): () => void {
    const resolvedAction = normalizeAction(action);
    if (!resolvedAction) {
        console.error("[zebra] subscribeCustom called with empty action — subscription ignored");
        return () => {};
    }
    const id = nextId++;
    ensureCustomNativeSub();

    let stack = customStacks.get(resolvedAction);
    if (!stack) {
        stack = [];
        customStacks.set(resolvedAction, stack);
    }

    if (stack.length === 0) {
        try {
            ExpoZebraScannerModule.startCustomScan(resolvedAction);
        } catch (error) {
            console.error("[zebra] failed to start custom scan for action", resolvedAction, error);
        }
    }
    if (__DEV__ && stack.length > 0) {
        console.warn(`[zebra] ${stack.length + 1} listeners are stacked for action "${resolvedAction}" — only the latest subscriber will receive scans. Previous subscribers resume when the top one unsubscribes.`);
    }
    stack.push({ id, handler: handler as CustomHandler });

    return () => {
        const currentStack = customStacks.get(resolvedAction);
        if (!currentStack) return;
        const index = currentStack.findIndex((e) => e.id === id);
        if (index === -1) return;
        currentStack.splice(index, 1);
        if (currentStack.length === 0) {
            customStacks.delete(resolvedAction);
            try {
                ExpoZebraScannerModule.stopCustomScanForAction(resolvedAction);
            } catch (error) {
                console.error("[zebra] failed to stop custom scan for action", resolvedAction, error);
            }
        }
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
