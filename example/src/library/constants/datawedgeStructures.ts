export const PROFILE_NAME = 'ExpoZebraScannerExample';

export const CONFIGURE_INTENT = (enableIntent: boolean) => ({
  PROFILE_NAME,
  PROFILE_ENABLED: 'true',
  CONFIG_MODE: 'UPDATE',
  PLUGIN_CONFIG: {
    PLUGIN_NAME: 'INTENT',
    RESET_CONFIG: 'true',
    PARAM_LIST: {
      intent_output_enabled: enableIntent ? 'true' : 'false',
      intent_action: 'com.symbol.datawedge.ACTION_BARCODE_SCANNED',
      intent_delivery: '2',
    },
  },
});

export const CONFIGURE_INTENT_FORMATTING = (prefix: string) => ({
  PROFILE_NAME,
  PROFILE_ENABLED: 'true',
  CONFIG_MODE: 'UPDATE',
  PLUGIN_CONFIG: {
    PLUGIN_NAME: 'BDF',
    OUTPUT_PLUGIN_NAME: 'INTENT',
    RESET_CONFIG: 'true',
    PARAM_LIST: {
      bdf_prefix: prefix ? prefix : '""', // Empty strings are passed to kotlin as null so we have to sent the empty string inside a string
    },
  },
});

export const CONFIGURE_KEYSTROKE = (enableKeystroke: boolean) => ({
  PROFILE_NAME,
  PROFILE_ENABLED: 'true',
  CONFIG_MODE: 'UPDATE',
  PLUGIN_CONFIG: {
    PLUGIN_NAME: 'KEYSTROKE',
    RESET_CONFIG: 'true',
    PARAM_LIST: {
      keystroke_output_enabled: enableKeystroke ? 'true' : 'false',
    },
  },
});

export const CONFIGURE_KEYSTROKE_FORMATTING = ({
  isKeystrokeEnterEnabled,
  keystrokePrefix,
}: {
  isKeystrokeEnterEnabled: boolean;
  keystrokePrefix: string;
}) => ({
  PROFILE_NAME,
  PROFILE_ENABLED: 'true',
  CONFIG_MODE: 'UPDATE',
  PLUGIN_CONFIG: {
    PLUGIN_NAME: 'BDF',
    OUTPUT_PLUGIN_NAME: 'KEYSTROKE',
    RESET_CONFIG: 'true',
    PARAM_LIST: {
      bdf_send_enter: isKeystrokeEnterEnabled ? 'true' : 'false',
      bdf_prefix: keystrokePrefix ? keystrokePrefix : '""',
    },
  },
});
