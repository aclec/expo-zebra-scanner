import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';
import ExpoZebraScannerModule from './ExpoZebraScannerModule';
import { BarcodeEvent } from './ExpoZebraScannerEvent';
import { BroadcastEvent, BroadcastExtras } from './ExpoZebraBroadcastEvent';
import {
  CreateProfileData,
  DEFAULT_BARCODES_CONFIG,
  DEFAULT_INTENT_CONFIG,
  DEFAULT_KEYSTROKE_CONFIG,
} from './ProfileConstants';

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

/**
 * Creates a new Datawedge profile with intent output enabled
 * @param param.PROFILE_NAME - Name of the profile to create
 * @param param.PACKAGE_NAME - The package of your app
 */
export function createIntentDatawedgeProfile({ PROFILE_NAME, PACKAGE_NAME }: CreateProfileData) {
  sendActionCommand('com.symbol.datawedge.api.CREATE_PROFILE', PROFILE_NAME);
  sendActionCommand('com.symbol.datawedge.api.SET_CONFIG', {
    ...DEFAULT_BARCODES_CONFIG,
    PROFILE_NAME,
    APP_LIST: [
      {
        PACKAGE_NAME,
        ACTIVITY_LIST: ['*'],
      }
    ]
  });
  sendActionCommand('com.symbol.datawedge.api.SET_CONFIG', { ...DEFAULT_INTENT_CONFIG, PROFILE_NAME });
  sendActionCommand('com.symbol.datawedge.api.SET_CONFIG', { ...DEFAULT_KEYSTROKE_CONFIG, PROFILE_NAME });
}

export {
  BroadcastExtras,
  BroadcastEvent,
}
