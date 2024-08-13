# expo-zebra-scanner

- Use Hermes Engine
- Create custom expo dev build to use in development  
https://docs.expo.dev/develop/development-builds/introduction/

## Installation

```js
yarn add expo-zebra-scanner
npm install expo-zebra-scanner
```

## DataWedgeConfiguration
To configure DataWedge, you need to use the native app of zebra:  
https://techdocs.zebra.com/datawedge/latest/guide/settings/

- Disable default profile
- Create a new profile and allow your app (com.exemple.app)
- Enable Bardcode
- Enable Intent (with configuration below)

```js
Intent => Broadcast Diffusion
ACTION => com.symbol.datawedge.ACTION_BARCODE_SCANNED
=> Look at the screenshots in the DataWedge directory.
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
