import { useEffect, useMemo, useRef } from "react";

import { BarcodeEvent } from "./ExpoZebraScannerEvent";
import { resolveAction, subscribeBarcodeByAction } from "./internal/zebraManager";

type BarcodeScannedHandler = (event: BarcodeEvent) => void;
const NOOP_BARCODE_HANDLER: BarcodeScannedHandler = () => {};

export type UseZebraScannerOptions = {
    onBarcodeScanned: BarcodeScannedHandler;
    enabled?: boolean;
    customAction?: string;
};

export function useZebraScanner(options: UseZebraScannerOptions): void {
    const onBarcodeScanned = typeof options?.onBarcodeScanned === "function" ? options.onBarcodeScanned : NOOP_BARCODE_HANDLER;
    const enabled = options?.enabled ?? true;
    const customAction = options?.customAction;

    const handlerRef = useRef(onBarcodeScanned);
    handlerRef.current = onBarcodeScanned;

    const resolvedAction = useMemo(() => resolveAction(customAction), [customAction]);

    useEffect(() => {
        if (!enabled) return;
        return subscribeBarcodeByAction(resolvedAction, (event) => {
            handlerRef.current(event);
        });
    }, [enabled, resolvedAction]);
}
