import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as ExpoZebraScanner from 'expo-zebra-scanner';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

const PROFILE_NAME = 'DatawedgeExpoExample';

/**
 * Example app to create a profile, configure intent and keystroke output
 * and switch between them
 */
export default function App() {
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [inputData, setInputData] = useState<string>('');
  const [isIntentOutput, setIsIntentOutput] = useState(true);
  const ref = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      const listener = ExpoZebraScanner.addListener(event => {
        const { scanData } = event;
        setBarcodes(_barcodes => [..._barcodes, scanData]);
        // Do something else with barcode
      });

      ExpoZebraScanner.startScan();

      return () => {
        ExpoZebraScanner.stopScan();
        listener.remove();
      };
    }, []),
  );

  // Create the profile when app loads
  // In expo router you want to put this on your top _layout.tsx
  useEffect(() => {
    createProfile();
  }, []);

  // We create the profile with custom decoders and setup keystroke
  // for example purposes
  const createProfile = () => {
    ExpoZebraScanner.createIntentDatawedgeProfile({
      PROFILE_NAME,
      PACKAGE_NAME: 'com.anonymous.testnativeexpo',
      PARAM_LIST: {
        decoder_i2of5: 'true',
      },
    });
    ExpoZebraScanner.sendActionCommand(
      'com.symbol.datawedge.api.SET_CONFIG',
      CONFIGURE_KEYSTROKE_ENTER,
    );
  };

  // Example of how to switch between Intent and Keystroke outputs
  const onOutputTypeChange = (isIntent: boolean) => {
    setIsIntentOutput(isIntent);
    ExpoZebraScanner.sendActionCommand(
      'com.symbol.datawedge.api.SET_CONFIG',
      CONFIGURE_INTENT(isIntent),
    );
    ExpoZebraScanner.sendActionCommand(
      'com.symbol.datawedge.api.SET_CONFIG',
      CONFIGURE_KEYSTROKE(!isIntent),
    );
  };

  return (
    <FlatList
      data={barcodes}
      keyExtractor={(_, index) => index.toString()}
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Expo zebra scanner</Text>
          <TextInput
            ref={ref}
            style={styles.input}
            placeholder="Add barcode"
            focusable={true}
            autoFocus={!isIntentOutput}
            value={inputData}
            onChangeText={setInputData}
            onSubmitEditing={() => {
              setBarcodes(_barcodes => [..._barcodes, inputData]);
              setInputData('');
              ref?.current?.focus();
            }}
          />
          <View style={styles.outputTypeContainer}>
            <Text style={styles.label}>Keystroke output</Text>
            <Switch value={isIntentOutput} onValueChange={onOutputTypeChange} />
            <Text style={styles.label}>Intent output</Text>
          </View>
          <Text>Barcodes ({barcodes.length})</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text>Scanned barcodes will be shown here</Text>
        </View>
      }
      renderItem={({ item, index }) => (
        <View style={styles.scannedItem}>
          <Text style={styles.barcode}>{item}</Text>
          <Pressable
            style={styles.deleteBtn}
            focusable={false}
            onPress={() =>
              setBarcodes(_barcodes =>
                _barcodes.filter((_, _index) => _index !== index),
              )
            }>
            <Text style={styles.deleteBtnLabel}>Delete</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    justifyContent: 'center',
    marginVertical: 15,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    alignSelf: 'center',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#FEFEFE',
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: 6,
    borderColor: '#D4D4D4',
  },
  outputTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#b5b5b5',
    marginTop: 5,
    marginBottom: 15,
  },
  label: {
    color: '#454545',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEFEFE',
    marginHorizontal: 10,
    elevation: 4,
    paddingVertical: 30,
    marginBottom: 10,
  },
  scannedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 15,
    elevation: 4,
    backgroundColor: '#FEFEFE',
    marginBottom: 10,
    marginHorizontal: 10,
  },
  barcode: {
    fontSize: 16,
  },
  deleteBtn: {
    backgroundColor: '#982B1C',
    paddingVertical: 20,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnLabel: {
    color: '#FEFEFE',
  },
});

const CONFIGURE_INTENT = (enableIntent: boolean) => ({
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

const CONFIGURE_KEYSTROKE = (enableKeystroke: boolean) => ({
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

const CONFIGURE_KEYSTROKE_ENTER = {
  PROFILE_NAME,
  PROFILE_ENABLED: 'true',
  CONFIG_MODE: 'UPDATE',
  PLUGIN_CONFIG: {
    PLUGIN_NAME: 'BDF',
    OUTPUT_PLUGIN_NAME: 'KEYSTROKE',
    RESET_CONFIG: 'true',
    PARAM_LIST: {
      bdf_send_enter: 'true', // Send ENTER for keystroke output
    },
  },
};
