import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { SettingsContext } from "../library/context/SettingsContext";
import { useSettings } from "../library/hooks/useSettings";
import { TabBarIcon } from "../components/navigation/TabBarIcon";
import { useZebraCreateProfile } from "expo-zebra-scanner";
import { DEFAULT_PROFILE_NAME } from "../library/constants/datawedgeStructures";

export default function TabLayout() {
    const settings = useSettings();
    const createProfile = useZebraCreateProfile();

    // We create the profile with custom decoders when app loads
    useEffect(() => {
        createProfile({
            PROFILE_NAME: DEFAULT_PROFILE_NAME,
            PACKAGE_NAME: "expo.modules.zebrascanner.example",
            PARAM_LIST: {
                decoder_i2of5: "true",
            },
        });
    }, [createProfile]);

    return (
        <SettingsContext.Provider value={settings}>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: "#0a7ea4",
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Scan",
                        headerTitle: "Expo zebra scanner",
                        tabBarIcon: ({ color, focused }) => (
                            <TabBarIcon
                                name={focused ? "barcode" : "barcode-outline"}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: "Settings",
                        headerTitle: "Datawedge settings",
                        tabBarIcon: ({ color, focused }) => (
                            <TabBarIcon
                                name={focused ? "settings" : "settings-outline"}
                                color={color}
                            />
                        ),
                    }}
                />
            </Tabs>
        </SettingsContext.Provider>
    );
}
