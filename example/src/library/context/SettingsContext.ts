import React from 'react';
import { INITIAL_SETTINGS, SettingsType } from '../constants/initialSettings';

export type SettingsContextType = SettingsType & {
  updateSettings: (key: keyof SettingsType, value: string | boolean) => void;
};

export const SettingsContext = React.createContext<SettingsContextType>({
  ...INITIAL_SETTINGS,
  updateSettings: () => {},
});
