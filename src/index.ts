import { NativeModulesProxy, EventEmitter, Subscription } from "expo-modules-core";

// Import the native module. On web, it will be resolved to ExpoZebraScanner.web.ts
// and on native platforms to ExpoZebraScanner.ts
import ExpoZebraScannerModule from './ExpoZebraScannerModule';
import {BarcodeEvent} from "./ExpoZebraScannerEvent";
// Get the native constant value.


export function startScan() {
  return ExpoZebraScannerModule.startScan();
}

export function stopScan() {
  return ExpoZebraScannerModule.stopScan();
}


const emitter = new EventEmitter(ExpoZebraScannerModule ?? NativeModulesProxy.ExpoZebraScanner);

export function addListener(listener: (event: BarcodeEvent) => void): Subscription {
  return emitter.addListener<any>('onBarcodeScanned', listener);
}

export function removeListener(listener: any): void {
  listener.remove();
}

