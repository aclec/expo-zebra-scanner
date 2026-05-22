import type { CreateProfileData } from "./ProfileConstants";
import { createIntentDatawedgeProfile } from "./internal/profile";

const createProfile = (profile: CreateProfileData): void => {
    createIntentDatawedgeProfile(profile);
};

export function useZebraCreateProfile() {
    return createProfile;
}
