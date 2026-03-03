import { useEffect, useMemo, useRef } from "react";

import { BarcodeEvent } from "./ExpoZebraScannerEvent";
import { CreateProfileData } from "./ProfileConstants";
import { createIntentDatawedgeProfile } from "./internal/profile";
import { resolveAction, subscribeBarcodeByAction } from "./internal/zebraManager";

type BarcodeScannedHandler = (event: BarcodeEvent) => void;
export type UseZebraScannerOptions = {
    onBarcodeScanned: BarcodeScannedHandler;
    profile?: CreateProfileData;
    enabled?: boolean;
    customAction?: string;
};

export function useZebraScanner({ onBarcodeScanned, profile, enabled = true, customAction }: UseZebraScannerOptions): void {
    const handlerRef = useRef(onBarcodeScanned);

    useEffect(() => {
        handlerRef.current = onBarcodeScanned;
    }, [onBarcodeScanned]);

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

        return subscribeBarcodeByAction(resolvedAction, (event) => {
            handlerRef.current?.(event);
        });
    }, [enabled, resolvedAction]);
}
