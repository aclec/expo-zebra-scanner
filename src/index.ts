import { EventSubscription } from 'expo-modules-core';
import ExpoZebraScannerModule from './ExpoZebraScannerModule';
import { BarcodeEvent } from './ExpoZebraScannerEvent';
import { BroadcastEvent, BroadcastExtras } from './ExpoZebraBroadcastEvent';
import {
  CreateProfileData,
  DEFAULT_BARCODES_CONFIG,
  DEFAULT_INTENT_CONFIG,
  DEFAULT_KEYSTROKE_CONFIG,
} from './ProfileConstants';

// Idea for a PR: Add documentation comments

// --- BarcodeScanner ---
export function startScan() {
  return ExpoZebraScannerModule.startScan();
}

export function stopScan() {
  return ExpoZebraScannerModule.stopScan();
}

export function addListener(
  listener: (event: BarcodeEvent) => void,
): EventSubscription {
  return ExpoZebraScannerModule.addListener('onBarcodeScanned', listener);
}

export function removeListener(listener: any): void {
  listener?.remove();
}

// --- Custom Scan ---
export function startCustomScan(action: string) {
  return ExpoZebraScannerModule.startCustomScan(action);
}

export function stopCustomScan() {
  return ExpoZebraScannerModule.stopCustomScan();
}

export function addCustomListener<T = any>(
  listener: (event: T) => void,
): EventSubscription {
  return ExpoZebraScannerModule.addListener('onCustomScan', listener);
}

// --- Broadcast ---
export function sendBroadcast(bundle: BroadcastEvent) {
  ExpoZebraScannerModule.sendBroadcast(bundle);
}

export function sendActionCommand(
  extraName: string,
  extraData: BroadcastExtras | string,
) {
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
 * @param param.PARAM_LIST - Optional scanner params: https://techdocs.zebra.com/datawedge/6-3/guide/api/setconfig/#scannerinputparameters
 */
export function createIntentDatawedgeProfile({
  PROFILE_NAME,
  PACKAGE_NAME,
  PARAM_LIST = {},
}: CreateProfileData) {
  sendActionCommand('com.symbol.datawedge.api.CREATE_PROFILE', PROFILE_NAME);
  sendActionCommand('com.symbol.datawedge.api.SET_CONFIG', {
    ...DEFAULT_BARCODES_CONFIG,
    PROFILE_NAME,
    PLUGIN_CONFIG: {
      ...DEFAULT_BARCODES_CONFIG.PLUGIN_CONFIG,
      PARAM_LIST: {
        ...DEFAULT_BARCODES_CONFIG.PLUGIN_CONFIG.PARAM_LIST,
        ...PARAM_LIST,
      },
    },
    APP_LIST: [
      {
        PACKAGE_NAME,
        ACTIVITY_LIST: ['*'],
      },
    ],
  });
  sendActionCommand('com.symbol.datawedge.api.SET_CONFIG', {
    ...DEFAULT_INTENT_CONFIG,
    PROFILE_NAME,
  });
  sendActionCommand('com.symbol.datawedge.api.SET_CONFIG', {
    ...DEFAULT_KEYSTROKE_CONFIG,
    PROFILE_NAME,
  });
}

export { BroadcastExtras, BroadcastEvent };

export async function getDataWedgeVersion(): Promise<[number, number, number]> {
  try {
    const arr = await (ExpoZebraScannerModule as any).getDataWedgeVersion();
    if (Array.isArray(arr) && arr.length >= 3) {
      return [Number(arr[0]) || 0, Number(arr[1]) || 0, Number(arr[2]) || 0];
    }
  } catch {}
  return [0, 0, 0];
}
