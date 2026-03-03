import { useEffect, useMemo, useRef } from "react";

import { CreateProfileData } from "./ProfileConstants";
import { createIntentDatawedgeProfile } from "./internal/profile";
import { resolveAction, subscribeCustom, type ZebraCustomIntentEvent } from "./internal/zebraManager";

type CustomScanHandler<TCustomEvent> = (event: TCustomEvent) => void;
export type UseZebraCustomScannerOptions<TCustomEvent = ZebraCustomIntentEvent> = {
    onCustomScan: CustomScanHandler<TCustomEvent>;
    profile?: CreateProfileData;
    enabled?: boolean;
    customAction?: string;
};

export function useZebraCustomScanner<TCustomEvent = ZebraCustomIntentEvent>({ onCustomScan, profile, enabled = true, customAction }: UseZebraCustomScannerOptions<TCustomEvent>): void {
    const handlerRef = useRef(onCustomScan);

    useEffect(() => {
        handlerRef.current = onCustomScan;
    }, [onCustomScan]);

    const resolvedAction = useMemo(() => resolveAction(customAction), [customAction]);

    const profileKey = useMemo(() => {
        if (!profile) return "";
        return `${profile.PROFILE_NAME}|${profile.PACKAGE_NAME}|${JSON.stringify(profile.PARAM_LIST ?? {})}`;
    }, [profile]);

    useEffect(() => {
        if (!enabled || !profile) return;
        createIntentDatawedgeProfile(profile);
    }, [enabled, profile, profileKey]);

    useEffect(() => {
        if (!enabled) return;

        return subscribeCustom<TCustomEvent>(resolvedAction, (event) => {
            handlerRef.current?.(event);
        });
    }, [enabled, resolvedAction]);
}

export const useCustomZebraScanner = useZebraCustomScanner;
