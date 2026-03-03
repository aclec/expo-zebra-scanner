import { CreateProfileData } from "./ProfileConstants";
import { createIntentDatawedgeProfile } from "./internal/profile";

const createProfile = (profile: CreateProfileData): void => {
    createIntentDatawedgeProfile(profile);
};

export function useCreateProfile() {
    return createProfile;
}
