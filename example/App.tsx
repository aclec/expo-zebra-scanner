import React, {useEffect, useState} from "react";
import * as ExpoZebraScanner from "expo-zebra-scanner";
import {StyleSheet, Text, View} from "react-native";

export default function App(){

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

    },[])

    return (
        <View style={styles.container}>
            <Text>Test Zebra</Text>
            <Text>{txt}</Text>
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


