import { useEffect, useRef } from "react";

import { BarcodeEvent } from "./ExpoZebraScannerEvent";
import { resolveAction, subscribeBarcodeByAction } from "./internal/zebraManager";

type BarcodeScannedHandler = (event: BarcodeEvent) => void;
export type UseZebraScannerOptions = {
    onBarcodeScanned: BarcodeScannedHandler;
    enabled?: boolean;
    customAction?: string;
};

export function useZebraScanner({ onBarcodeScanned, enabled = true, customAction }: UseZebraScannerOptions): void {
    const handlerRef = useRef(onBarcodeScanned);
    handlerRef.current = onBarcodeScanned;

    const resolvedAction = resolveAction(customAction);

    useEffect(() => {
        if (!enabled) return;
        return subscribeBarcodeByAction(resolvedAction, (event) => {
            handlerRef.current(event);
        });
    }, [enabled, resolvedAction]);
}
