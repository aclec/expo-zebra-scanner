import React, { useEffect, useState } from "react";
import * as ExpoZebraScanner from "expo-zebra-scanner";
import { StyleSheet, Text, View, Pressable } from "react-native";

export default function App() {

    const [txt, setTxt] = useState("")

    useEffect(() => {
        const event = ExpoZebraScanner.addListener(e => {
            console.log(e);
            setTxt(e.scanData);
        });

        ExpoZebraScanner.startScan();

        return () => {
            ExpoZebraScanner.removeListener(event);
            ExpoZebraScanner.stopScan();
        }
    }, []);

    const createProfile = () => {
        // With an automatically generated profile we dont need to setup each Zebra device one by one
        ExpoZebraScanner.sendActionCommand('com.symbol.datawedge.api.CREATE_PROFILE', PROFILE_NAME);
        ExpoZebraScanner.sendActionCommand('com.symbol.datawedge.api.SET_CONFIG', CONFIGURE_BARCODES);
        ExpoZebraScanner.sendActionCommand('com.symbol.datawedge.api.SET_CONFIG', CONFIGURE_INTENT);
        ExpoZebraScanner.sendActionCommand('com.symbol.datawedge.api.SET_CONFIG', CONFIGURE_KEYSTROKE);
        console.log('Profile created');
    };

    return (
        <View style={styles.container}>
            <Text>Test Zebra</Text>
            <Text>{txt}</Text>
            <Pressable onPress={createProfile} style={styles.button}>
                <Text>Create custom datawedge profile</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        marginTop: 30,
        height: 80,
        backgroundColor: '#d4d4d4',
    },
});

// Custom profile configuration
const PROFILE_NAME = "ExpoDatawedgeExample";

const CONFIGURE_BARCODES = {
    PROFILE_NAME,
    PROFILE_ENABLED: 'true',
    CONFIG_MODE: 'UPDATE',
    PLUGIN_CONFIG: {
        PLUGIN_NAME: 'BARCODE',
        RESET_CONFIG: 'true',
        PARAM_LIST: {
            scanner_selection: 'auto',
            decoder_code11: 'true',
            decoder_i2of5: 'true',
        },
    },
    APP_LIST: [
        {
            PACKAGE_NAME: 'expo.modules.zebrascanner.example', // Your app package
            ACTIVITY_LIST: ['*'],
        },
    ],
};

const CONFIGURE_INTENT = {
    PROFILE_NAME,
    PROFILE_ENABLED: 'true',
    CONFIG_MODE: 'UPDATE',
    PLUGIN_CONFIG: {
        PLUGIN_NAME: 'INTENT',
        RESET_CONFIG: 'true',
        PARAM_LIST: {
            intent_output_enabled: 'true',
            intent_action: "com.symbol.datawedge.ACTION_BARCODE_SCANNED", // The action specified in ExpoZebraScannerModule.kt
            intent_delivery: '2', // Broadcast
        },
    },
};

const CONFIGURE_KEYSTROKE = {
    PROFILE_NAME,
    PROFILE_ENABLED: 'true',
    CONFIG_MODE: 'UPDATE',
    PLUGIN_CONFIG: {
        PLUGIN_NAME: 'KEYSTROKE',
        RESET_CONFIG: 'true',
        PARAM_LIST: {
            keystroke_output_enabled: 'false', // Disable keystroke
        },
    },
};
