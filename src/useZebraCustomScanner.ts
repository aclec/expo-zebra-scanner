import { useEffect, useMemo, useRef } from "react";

import { resolveAction, subscribeCustom, type ZebraCustomIntentEvent } from "./internal/zebraManager";

type CustomScanHandler<TCustomEvent> = (event: TCustomEvent) => void;
const NOOP_CUSTOM_HANDLER: CustomScanHandler<unknown> = () => {};

export type UseZebraCustomScannerOptions<TCustomEvent = ZebraCustomIntentEvent> = {
    onCustomScan: CustomScanHandler<TCustomEvent>;
    enabled?: boolean;
    customAction?: string;
};

export function useZebraCustomScanner<TCustomEvent = ZebraCustomIntentEvent>(options: UseZebraCustomScannerOptions<TCustomEvent>): void {
    const onCustomScan = typeof options?.onCustomScan === "function" ? options.onCustomScan : (NOOP_CUSTOM_HANDLER as CustomScanHandler<TCustomEvent>);
    const enabled = options?.enabled ?? true;
    const customAction = options?.customAction;

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
