import React, {useEffect} from "react";
import * as ExpoZebraScanner from "expo-zebra-scanner";
import {StyleSheet, Text, View} from "react-native";

export default function App(){

    useEffect(() => {

        const event = ExpoZebraScanner.addListener(e => {
            console.log(e);
        });
        ExpoZebraScanner.startScan();


        return () => {
            ExpoZebraScanner.removeListener(event);
            ExpoZebraScanner.stopScan();
        }

    },[])

    return (
        <View style={styles.container}>
            <Text>Test Zebra</Text>
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
});


