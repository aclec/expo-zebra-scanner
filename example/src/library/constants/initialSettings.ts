export type SettingsType = {
  isIntentEnabled: boolean;
  intentPrefix: string;
  isKeystrokeEnterEnabled: boolean;
  keystrokePrefix: string;
};

export const INITIAL_SETTINGS: SettingsType = {
  isIntentEnabled: true,
  intentPrefix: '',
  isKeystrokeEnterEnabled: false,
  keystrokePrefix: '',
};
