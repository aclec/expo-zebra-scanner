import { useEffect, useMemo, useRef } from "react";

import { resolveAction, subscribeCustom, type ZebraCustomIntentEvent } from "./internal/zebraManager";

type CustomScanHandler<TCustomEvent> = (event: TCustomEvent) => void;
export type UseZebraCustomScannerOptions<TCustomEvent = ZebraCustomIntentEvent> = {
    onCustomScan: CustomScanHandler<TCustomEvent>;
    enabled?: boolean;
    customAction?: string;
};

export function useZebraCustomScanner<TCustomEvent = ZebraCustomIntentEvent>({ onCustomScan, enabled = true, customAction }: UseZebraCustomScannerOptions<TCustomEvent>): void {
    const handlerRef = useRef(onCustomScan);
    handlerRef.current = onCustomScan;

    const resolvedAction = useMemo(() => resolveAction(customAction), [customAction]);

    useEffect(() => {
        if (!enabled) return;
        return subscribeCustom<TCustomEvent>(resolvedAction, (event) => {
            handlerRef.current(event);
        });
    }, [enabled, resolvedAction]);
}

export const useCustomZebraScanner = useZebraCustomScanner;
