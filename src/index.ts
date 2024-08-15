import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';
import ExpoZebraScannerModule from './ExpoZebraScannerModule';
import { BarcodeEvent } from './ExpoZebraScannerEvent';
import { BroadcastEvent, BroadcastExtras } from './ExpoZebraBroadcastEvent';

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

export function sendBroadcast(bundle: BroadcastEvent) {
  ExpoZebraScannerModule.sendBroadcast(bundle);
}

export function sendActionCommand(extraName: string, extraData: BroadcastExtras | string) {
  ExpoZebraScannerModule.sendBroadcast({
    action: 'com.symbol.datawedge.api.ACTION',
    extras: {
      [extraName]: extraData,
    },
  });
}

export {
  BroadcastExtras,
  BroadcastEvent,
}
