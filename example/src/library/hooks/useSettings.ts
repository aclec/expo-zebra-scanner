import { useCallback, useState } from 'react';
import { INITIAL_SETTINGS, SettingsType } from '../constants/initialSettings';
import * as ExpoZebraScanner from 'expo-zebra-scanner';
import {
  CONFIGURE_INTENT,
  CONFIGURE_INTENT_FORMATTING,
  CONFIGURE_KEYSTROKE,
  CONFIGURE_KEYSTROKE_FORMATTING,
} from '../constants/datawedgeStructures';

export const useSettings = () => {
  const [settings, setSettings] = useState<SettingsType>(INITIAL_SETTINGS);

  const updateSettings = useCallback(
    (key: string, value: string | boolean) => {
      const _settings: SettingsType = {
        ...settings,
        [key]: value,
      };
      setSettings(_settings);

      const {
        isIntentEnabled,
        isKeystrokeEnterEnabled,
        intentPrefix,
        keystrokePrefix,
      } = _settings;

      ExpoZebraScanner.sendActionCommand(
        'com.symbol.datawedge.api.SET_CONFIG',
        CONFIGURE_INTENT(isIntentEnabled),
      );
      ExpoZebraScanner.sendActionCommand(
        'com.symbol.datawedge.api.SET_CONFIG',
        CONFIGURE_INTENT_FORMATTING(intentPrefix),
      );
      ExpoZebraScanner.sendActionCommand(
        'com.symbol.datawedge.api.SET_CONFIG',
        CONFIGURE_KEYSTROKE(!isIntentEnabled),
      );
      ExpoZebraScanner.sendActionCommand(
        'com.symbol.datawedge.api.SET_CONFIG',
        CONFIGURE_KEYSTROKE_FORMATTING({
          isKeystrokeEnterEnabled,
          keystrokePrefix,
        }),
      );
    },
    [settings],
  );

  return {
    ...settings,
    updateSettings,
  };
};
