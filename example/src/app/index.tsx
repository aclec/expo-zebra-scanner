import React, { useCallback, useContext, useRef, useState } from 'react';
import * as ExpoZebraScanner from 'expo-zebra-scanner';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SettingsContext } from '../library/context/SettingsContext';

/**
 * Example app to create a profile, configure intent and keystroke output
 * and switch between them
 */
export default function HomeScreen() {
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [inputData, setInputData] = useState<string>('');
  const ref = useRef<TextInput>(null);
  const { isIntentEnabled } = useContext(SettingsContext);

  useFocusEffect(
    useCallback(() => {
      const listener = ExpoZebraScanner.addListener(event => {
        const { scanData } = event;
        setBarcodes(_barcodes => [..._barcodes, scanData]);
        // Do something else with barcode
      });

      ExpoZebraScanner.startScan();
      ref?.current?.focus();

      return () => {
        ExpoZebraScanner.stopScan();
        listener.remove();
      };
    }, []),
  );

  return (
    <FlatList
      focusable={false}
      data={barcodes}
      keyExtractor={(_, index) => index.toString()}
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          {!isIntentEnabled && (
            <TextInput
              autoFocus
              ref={ref}
              style={styles.input}
              placeholder="Add barcode"
              focusable={true}
              value={inputData}
              onChangeText={setInputData}
              onSubmitEditing={() => {
                setBarcodes(_barcodes => [..._barcodes, inputData]);
                setInputData('');
              }}
              blurOnSubmit={false}
            />
          )}
          <View style={styles.flex}>
            <Text>Barcodes ({barcodes.length})</Text>
            {isIntentEnabled && (
              <Text style={styles.helpLabel}>Intent enabled</Text>
            )}
          </View>
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
    marginBottom: 15,
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
  flex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  helpLabel: {
    color: '#FF4233',
  },
});
