export type SettingsType = {
  isIntentEnabled: boolean;
  intentPrefix: string;
  isKeystrokeEnterEnabled: boolean;
  keystrokePrefix: string;
  // New settings for custom event mode
  isCustomEventEnabled: boolean;
  customEventAction: string;
};

export const INITIAL_SETTINGS: SettingsType = {
  isIntentEnabled: true,
  intentPrefix: '',
  isKeystrokeEnterEnabled: false,
  keystrokePrefix: '',
  isCustomEventEnabled: false,
  customEventAction: 'com.symbol.datawedge.ACTION_BARCODE_SCANNED',
};
