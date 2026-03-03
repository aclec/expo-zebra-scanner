import { useCallback } from "react";

import { CreateProfileData } from "./ProfileConstants";
import { createIntentDatawedgeProfile } from "./internal/profile";

export function useCreateProfile() {
    return useCallback((profile: CreateProfileData): void => {
        createIntentDatawedgeProfile(profile);
    }, []);
}
