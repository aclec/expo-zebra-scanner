# expo-zebra-scanner

## Installation

```js
yarn add expo-zebra-scanner
npm install expo-zebra-scanner
```

## DataWedgeConfiguration
```js
ACTION => com.symbol.datawedge.ACTION_BARCODE_SCANNED
Intent => Broadcast Diffusion
```

## Usage

```js
import React, {useEffect} from "react";
import * as ExpoZebraScanner from "expo-zebra-scanner";

export default function MyCompnent(){

    useEffect(() => {
        
        const listner = ExpoZebraScanner.addListener(event => {
        
            const { scanData, scanLabelType } = event;
            // ...
            
        });
        ExpoZebraScanner.startScan();


        return () => {
            ExpoZebraScanner.removeListener(listner);
            ExpoZebraScanner.stopScan();
        }

    },[])

    return (
        <View>
            <Text>Zebra Barcode Scanner</Text>
        </View>
    );
}
```
