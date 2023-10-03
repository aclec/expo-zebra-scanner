# expo-zebra-scanner

- Use Hermes Engine
- Create custom expo dev build to use in development

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
        
        const listener = ExpoZebraScanner.addListener(event => {
        
            const { scanData, scanLabelType } = event;
            // ...
            
        });
        ExpoZebraScanner.startScan();


        return () => {
            ExpoZebraScanner.stopScan();
            listener.remove();
        }

    },[])

    return (
        <View>
            <Text>Zebra Barcode Scanner</Text>
        </View>
    );
}
```
