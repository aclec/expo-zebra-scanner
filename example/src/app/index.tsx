import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable, TextInput } from "react-native";
import { useZebraCoreFunctions, useZebraCreateProfile, useZebraCustomScanner, useZebraScanner } from "expo-zebra-scanner";
import { useIsFocused } from "@react-navigation/native";
import { SettingsContext } from "../library/context/SettingsContext";
import { CUSTOM_TESTER_PROFILE_NAME } from "../library/constants/datawedgeStructures";

const DEFAULT_ACTION = "com.symbol.datawedge.ACTION_BARCODE_SCANNED";
const DEFAULT_TEST_ACTION = "com.symbol.datawedge.TEST_CUSTOM_BARCODE";
const EXAMPLE_PACKAGE_NAME = "expo.modules.zebrascanner.example";

function CustomActionSubscription({
    action,
    enabled,
    onEvent,
}: {
    action: string;
    enabled: boolean;
    onEvent: (action: string, event: unknown) => void;
}) {
    useZebraCustomScanner({
        enabled,
        customAction: action,
        onCustomScan: (event) => {
            onEvent(action, event);
        },
    });

    return null;
}

/**
 * Example app to create a profile, configure intent and keystroke output
 * and switch between them
 */
export default function HomeScreen() {
    const [barcodes, setBarcodes] = useState<string[]>([]);
    const [inputData, setInputData] = useState<string>("");
    const [customActionInput, setCustomActionInput] = useState<string>("");
    const [customActions, setCustomActions] = useState<string[]>([DEFAULT_TEST_ACTION]);
    const ref = useRef<TextInput>(null);
    const { isIntentEnabled, isCustomEventEnabled, isCustomActionTesterEnabled } = useContext(SettingsContext);
    const previousCustomTesterEnabledRef = useRef<boolean>(isCustomActionTesterEnabled);
    const createProfile = useZebraCreateProfile();
    const { sendActionCommand } = useZebraCoreFunctions();
    const isFocused = useIsFocused();
    const scannerEnabled = isFocused && isIntentEnabled;
    const primaryCustomAction = customActions[0]?.trim() || DEFAULT_TEST_ACTION;
    const activeCustomActions = isCustomActionTesterEnabled ? customActions : [DEFAULT_ACTION];

    useZebraScanner({
        enabled: scannerEnabled && !isCustomEventEnabled,
        onBarcodeScanned: (event) => {
            const { scanData } = event;
            setBarcodes((_barcodes) => [..._barcodes, scanData]);
        },
    });

    const addCustomAction = () => {
        const action = customActionInput.trim();
        if (!action) return;
        setCustomActions((prev) => (prev.includes(action) ? prev : [...prev, action]));
        setCustomActionInput("");
    };

    useEffect(() => {
        if (isFocused) {
            ref.current?.focus();
        }
    }, [isFocused]);

    useEffect(() => {
        const wasEnabled = previousCustomTesterEnabledRef.current;
        if (!wasEnabled && isCustomActionTesterEnabled) {
            createProfile({
                PROFILE_NAME: CUSTOM_TESTER_PROFILE_NAME,
                PACKAGE_NAME: EXAMPLE_PACKAGE_NAME,
                PARAM_LIST: {
                    decoder_i2of5: "true",
                },
                INTENT_ACTION: primaryCustomAction,
            });
        } else if (wasEnabled && !isCustomActionTesterEnabled) {
            sendActionCommand("com.symbol.datawedge.api.DELETE_PROFILE", CUSTOM_TESTER_PROFILE_NAME);
        }
        previousCustomTesterEnabledRef.current = isCustomActionTesterEnabled;
    }, [createProfile, isCustomActionTesterEnabled, primaryCustomAction, sendActionCommand]);

    useEffect(() => {
        if (!isCustomActionTesterEnabled || !isIntentEnabled) return;
        createProfile({
            PROFILE_NAME: CUSTOM_TESTER_PROFILE_NAME,
            PACKAGE_NAME: EXAMPLE_PACKAGE_NAME,
            PARAM_LIST: {
                decoder_i2of5: "true",
            },
            INTENT_ACTION: primaryCustomAction,
        });
    }, [createProfile, isCustomActionTesterEnabled, isIntentEnabled, primaryCustomAction]);

    return (
        <>
            {activeCustomActions.map((action) => (
                <CustomActionSubscription
                    key={action}
                    action={action}
                    enabled={scannerEnabled && isCustomEventEnabled}
                    onEvent={(eventAction, event) => {
                        setBarcodes((_barcodes) => [..._barcodes, `[${eventAction}] ${JSON.stringify(event)}`]);
                    }}
                />
            ))}
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
                                    setBarcodes((_barcodes) => [..._barcodes, inputData]);
                                    setInputData("");
                                }}
                            />
                        )}
                        <View style={styles.flex}>
                            <Text>Barcodes ({barcodes.length})</Text>
                            {isIntentEnabled && <Text style={styles.helpLabel}>Intent enabled</Text>}
                        </View>
                        {isIntentEnabled && isCustomEventEnabled && isCustomActionTesterEnabled && (
                            <View style={styles.customActionsContainer}>
                                <Text style={styles.customActionTitle}>Custom actions (test)</Text>
                                <View style={styles.customActionRow}>
                                    <TextInput
                                        value={customActionInput}
                                        onChangeText={setCustomActionInput}
                                        style={[styles.input, styles.customActionInput]}
                                        placeholder="com.symbol.datawedge.TEST_CUSTOM_BARCODE"
                                        onSubmitEditing={addCustomAction}
                                    />
                                    <Pressable style={styles.addBtn} onPress={addCustomAction}>
                                        <Text style={styles.addBtnLabel}>Add</Text>
                                    </Pressable>
                                </View>

                                {customActions.map((action) => (
                                    <View key={action} style={styles.customActionItem}>
                                        <Text numberOfLines={2} style={styles.customActionLabel}>
                                            {action}
                                        </Text>
                                        <Pressable
                                            style={styles.deleteBtn}
                                            onPress={() => setCustomActions((prev) => prev.filter((item) => item !== action))}
                                        >
                                            <Text style={styles.deleteBtnLabel}>Delete</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text>Scanned barcodes will be shown here</Text>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <View style={styles.scannedItem}>
                        <Text numberOfLines={2} style={styles.barcode}>
                            {item}
                        </Text>
                        <Pressable
                            style={styles.deleteBtn}
                            focusable={false}
                            onPress={() => setBarcodes((_barcodes) => _barcodes.filter((_, _index) => _index !== index))}
                        >
                            <Text style={styles.deleteBtnLabel}>Delete</Text>
                        </Pressable>
                    </View>
                )}
            />
        </>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        justifyContent: "center",
        marginVertical: 15,
        marginHorizontal: 10,
    },
    headerTitle: {
        fontWeight: "bold",
        fontSize: 20,
        alignSelf: "center",
        marginBottom: 15,
    },
    input: {
        backgroundColor: "#FEFEFE",
        fontSize: 16,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderRadius: 6,
        borderColor: "#D4D4D4",
    },
    outputTypeContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderColor: "#b5b5b5",
        marginTop: 5,
        marginBottom: 15,
    },
    label: {
        color: "#454545",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FEFEFE",
        marginHorizontal: 10,
        elevation: 4,
        paddingVertical: 30,
        marginBottom: 10,
    },
    scannedItem: {
        flexDirection: "row",
        alignItems: "stretch",
        elevation: 4,
        backgroundColor: "#FEFEFE",
        marginBottom: 10,
        marginHorizontal: 10,
    },
    barcode: {
        fontSize: 16,
        flex: 1,
        flexShrink: 1,
        paddingLeft: 15,
        paddingRight: 12,
        paddingVertical: 18,
    },
    deleteBtn: {
        backgroundColor: "#E67E22",
        minWidth: 82,
        paddingHorizontal: 12,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "stretch",
    },
    deleteBtnLabel: {
        color: "#FEFEFE",
    },
    flex: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    helpLabel: {
        color: "#FF4233",
    },
    customActionsContainer: {
        marginTop: 12,
        gap: 8,
    },
    customActionTitle: {
        fontWeight: "600",
    },
    customActionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    customActionInput: {
        flex: 1,
        marginBottom: 0,
    },
    addBtn: {
        backgroundColor: "#0a7ea4",
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 6,
    },
    addBtnLabel: {
        color: "#FEFEFE",
        fontWeight: "600",
    },
    customActionItem: {
        flexDirection: "row",
        alignItems: "stretch",
        backgroundColor: "#FEFEFE",
        borderWidth: 1,
        borderColor: "#D4D4D4",
        borderRadius: 6,
        overflow: "hidden",
    },
    customActionLabel: {
        flex: 1,
        flexShrink: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
    },
});
