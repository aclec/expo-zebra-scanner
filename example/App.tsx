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
        ExpoZebraScanner.createIntentDatawedgeProfile({
            PROFILE_NAME: 'ExpoDatawedgeExample',
            PACKAGE_NAME: 'expo.modules.zebrascanner.example',
        });
        console.log('Profile created');
    };

    return (
        <View style={styles.container}>
            <Text>Test Zebra</Text>
            <Text>{txt}</Text>
            <Pressable onPress={createProfile} style={styles.button}>
                <Text>Create datawedge profile</Text>
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
