// Idea for a PR:
// Add types to SCANNER_PARAMS according to
// https://techdocs.zebra.com/datawedge/6-3/guide/api/setconfig/#scannerinputparameters
export type ScannerParams = {
    [key: string]: string;
  };

export type CreateProfileData = {
    PROFILE_NAME: string;
    PACKAGE_NAME: string;
    PARAM_LIST?: ScannerParams;
};

export const DEFAULT_BARCODES_CONFIG = {
    PROFILE_ENABLED: 'true',
    CONFIG_MODE: 'UPDATE',
    PLUGIN_CONFIG: {
        PLUGIN_NAME: 'BARCODE',
        RESET_CONFIG: 'true',
        PARAM_LIST: {
            scanner_selection: 'auto',
            decoder_code11: 'true',
        },
    },
    APP_LIST: [
        {
            PACKAGE_NAME: '', // Your app package
            ACTIVITY_LIST: ['*'],
        },
    ],
};

export const DEFAULT_INTENT_CONFIG = {
    PROFILE_ENABLED: 'true',
    CONFIG_MODE: 'UPDATE',
    PLUGIN_CONFIG: {
        PLUGIN_NAME: 'INTENT',
        RESET_CONFIG: 'true',
        PARAM_LIST: {
            intent_output_enabled: 'true',
            intent_action: "com.symbol.datawedge.ACTION_BARCODE_SCANNED", // The action specified in ExpoZebraScannerModule.kt
            intent_delivery: '2', // Broadcast
        },
    },
};

export const DEFAULT_KEYSTROKE_CONFIG = {
    PROFILE_ENABLED: 'true',
    CONFIG_MODE: 'UPDATE',
    PLUGIN_CONFIG: {
        PLUGIN_NAME: 'KEYSTROKE',
        RESET_CONFIG: 'true',
        PARAM_LIST: {
            keystroke_output_enabled: 'false', // Disable keystroke
        },
    },
};
