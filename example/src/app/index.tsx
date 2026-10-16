import React, { useContext, useEffect, useRef, useState, type ComponentProps } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, type TextInputInstance } from "react-native";
import Animated, { FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useZebraCoreFunctions, useZebraCreateProfile, useZebraCustomScanner, useZebraScanner } from "expo-zebra-scanner";
import { useIsFocused } from "expo-router/react-navigation";
import { SettingsContext } from "../library/context/SettingsContext";
import { CUSTOM_TESTER_PROFILE_NAME } from "../library/constants/datawedgeStructures";
import { COLORS, MONOSPACE } from "../library/constants/theme";

const DEFAULT_ACTION = "com.symbol.datawedge.ACTION_BARCODE_SCANNED";
const DEFAULT_TEST_ACTION = "com.symbol.datawedge.TEST_CUSTOM_BARCODE";
const EXAMPLE_PACKAGE_NAME = "expo.modules.zebrascanner.example";

// Critically damped spring for reflow, short fades for enter/exit. Reanimated follows the
// system reduce-motion setting by default.
const ITEM_ENTERING = FadeInDown.duration(220);
const ITEM_EXITING = FadeOut.duration(150);
const ITEM_LAYOUT = LinearTransition.springify(300).dampingRatio(1);

type ScanItem = {
    id: number;
    data: string;
    meta: string;
    time: string;
};

type IconName = ComponentProps<typeof Ionicons>["name"];

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

// focusable={false} keeps hardware ENTER (keystroke output) from triggering buttons.
function IconButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            focusable={false}
            hitSlop={8}
            onPress={onPress}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
        >
            <Ionicons name={icon} size={20} color={COLORS.textSecondary} />
        </Pressable>
    );
}

/**
 * Example app to create a profile, configure intent and keystroke output
 * and switch between them
 */
export default function HomeScreen() {
    const [scans, setScans] = useState<ScanItem[]>([]);
    const [inputData, setInputData] = useState<string>("");
    const [customActionInput, setCustomActionInput] = useState<string>("");
    const [customActions, setCustomActions] = useState<string[]>([DEFAULT_TEST_ACTION]);
    const nextIdRef = useRef(0);
    const ref = useRef<TextInputInstance>(null);
    const { isIntentEnabled, isCustomEventEnabled, isCustomActionTesterEnabled } = useContext(SettingsContext);
    const previousCustomTesterEnabledRef = useRef<boolean>(isCustomActionTesterEnabled);
    const createProfile = useZebraCreateProfile();
    const { sendActionCommand } = useZebraCoreFunctions();
    const isFocused = useIsFocused();
    // Custom event mode forces intent output on the DataWedge side (see useSettings).
    const isIntentOutput = isIntentEnabled || isCustomEventEnabled;
    const scannerEnabled = isFocused && isIntentOutput;
    const primaryCustomAction = customActions[0]?.trim() || DEFAULT_TEST_ACTION;
    const activeCustomActions = isCustomActionTesterEnabled ? customActions : [DEFAULT_ACTION];

    const addScan = (data: string, meta: string) => {
        const id = nextIdRef.current++;
        const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setScans((prev) => [{ id, data, meta, time }, ...prev]);
    };

    const removeScan = (id: number) => {
        setScans((prev) => prev.filter((item) => item.id !== id));
    };

    useZebraScanner({
        enabled: scannerEnabled && !isCustomEventEnabled,
        onBarcodeScanned: ({ scanData, scanLabelType }) => {
            addScan(scanData, scanLabelType.replace(/^LABEL-TYPE-/, ""));
        },
    });

    // Read the submitted text from the event: DataWedge can send ENTER before the last
    // onChangeText has re-rendered.
    const submitInput = (data: string) => {
        if (!data.trim()) return;
        addScan(data, "Keystroke");
        setInputData("");
    };

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
        if (!isCustomActionTesterEnabled || !isIntentOutput) return;
        createProfile({
            PROFILE_NAME: CUSTOM_TESTER_PROFILE_NAME,
            PACKAGE_NAME: EXAMPLE_PACKAGE_NAME,
            PARAM_LIST: {
                decoder_i2of5: "true",
            },
            INTENT_ACTION: primaryCustomAction,
        });
    }, [createProfile, isCustomActionTesterEnabled, isIntentOutput, primaryCustomAction]);

    const mode = isCustomEventEnabled
        ? {
              title: "Custom event",
              subtitle: isCustomActionTesterEnabled
                  ? `${customActions.length} test action${customActions.length === 1 ? "" : "s"}`
                  : DEFAULT_ACTION,
          }
        : isIntentOutput
          ? { title: "Intent output", subtitle: "Press the scan trigger" }
          : { title: "Keystroke output", subtitle: "Scans are typed into the field below" };

    return (
        <>
            {activeCustomActions.map((action) => (
                <CustomActionSubscription
                    key={action}
                    action={action}
                    enabled={scannerEnabled && isCustomEventEnabled}
                    onEvent={(eventAction, event) => {
                        addScan(JSON.stringify(event), eventAction);
                    }}
                />
            ))}
            <Animated.FlatList
                focusable={false}
                style={styles.screen}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                data={scans}
                keyExtractor={(item) => item.id.toString()}
                itemLayoutAnimation={ITEM_LAYOUT}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={styles.statusCard}>
                            <View style={[styles.statusDot, { backgroundColor: isIntentOutput ? COLORS.success : COLORS.tint }]} />
                            <View style={styles.statusText}>
                                <Text style={styles.statusTitle}>{mode.title}</Text>
                                <Text style={styles.statusSubtitle} numberOfLines={1}>
                                    {mode.subtitle}
                                </Text>
                            </View>
                        </View>

                        {!isIntentOutput && (
                            <TextInput
                                autoFocus
                                ref={ref}
                                style={styles.input}
                                placeholder="Scan or type a barcode"
                                placeholderTextColor={COLORS.textSecondary}
                                focusable={true}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="done"
                                // Keep focus after ENTER so consecutive keystroke scans land here.
                                submitBehavior="submit"
                                value={inputData}
                                onChangeText={setInputData}
                                onSubmitEditing={(e) => submitInput(e.nativeEvent.text)}
                            />
                        )}

                        {isCustomEventEnabled && isCustomActionTesterEnabled && (
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Test actions</Text>
                                <View style={styles.customActionRow}>
                                    <TextInput
                                        value={customActionInput}
                                        onChangeText={setCustomActionInput}
                                        style={[styles.input, styles.customActionInput]}
                                        placeholder={DEFAULT_TEST_ACTION}
                                        placeholderTextColor={COLORS.textSecondary}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        returnKeyType="done"
                                        onSubmitEditing={addCustomAction}
                                    />
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Add action"
                                        onPress={addCustomAction}
                                        style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
                                    >
                                        <Ionicons name="add" size={22} color={COLORS.surface} />
                                    </Pressable>
                                </View>

                                {customActions.map((action) => (
                                    <View key={action} style={styles.customActionItem}>
                                        <Text numberOfLines={2} style={styles.customActionLabel}>
                                            {action}
                                        </Text>
                                        <IconButton
                                            icon="close-circle-outline"
                                            label={`Remove ${action}`}
                                            onPress={() => setCustomActions((prev) => prev.filter((item) => item !== action))}
                                        />
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                History <Text style={styles.sectionCount}>{scans.length}</Text>
                            </Text>
                            {scans.length > 0 && (
                                <Pressable
                                    accessibilityRole="button"
                                    focusable={false}
                                    hitSlop={8}
                                    onPress={() => setScans([])}
                                    style={({ pressed }) => pressed && styles.textBtnPressed}
                                >
                                    <Text style={styles.textBtn}>Clear</Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="barcode-outline" size={40} color={COLORS.textSecondary} />
                        <Text style={styles.emptyTitle}>No scans yet</Text>
                        <Text style={styles.emptyText}>Scanned barcodes appear here, newest first</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <Animated.View entering={ITEM_ENTERING} exiting={ITEM_EXITING} style={styles.item}>
                        <View style={styles.itemBody}>
                            <Text selectable numberOfLines={3} style={styles.itemData}>
                                {item.data}
                            </Text>
                            <Text numberOfLines={1} style={styles.itemMeta}>
                                {item.meta ? `${item.time} · ${item.meta}` : item.time}
                            </Text>
                        </View>
                        <IconButton icon="trash-outline" label="Delete scan" onPress={() => removeScan(item.id)} />
                    </Animated.View>
                )}
            />
        </>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    header: {
        paddingTop: 16,
        gap: 12,
    },
    statusCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusText: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.text,
    },
    statusSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    input: {
        backgroundColor: COLORS.surface,
        color: COLORS.text,
        fontSize: 16,
        minHeight: 48,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: COLORS.separator,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 12,
        gap: 8,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },
    customActionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    customActionInput: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderWidth: 0,
        fontSize: 14,
    },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.tint,
    },
    addBtnPressed: {
        backgroundColor: COLORS.tintPressed,
    },
    customActionItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.background,
        borderRadius: 10,
        paddingLeft: 12,
    },
    customActionLabel: {
        flex: 1,
        fontFamily: MONOSPACE,
        fontSize: 13,
        color: COLORS.text,
        paddingVertical: 10,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginTop: 8,
        marginBottom: 4,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        letterSpacing: -0.2,
        color: COLORS.text,
    },
    sectionCount: {
        fontWeight: "400",
        color: COLORS.textSecondary,
    },
    textBtn: {
        fontSize: 15,
        fontWeight: "500",
        color: COLORS.tint,
    },
    textBtnPressed: {
        opacity: 0.5,
    },
    empty: {
        alignItems: "center",
        gap: 6,
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.text,
        marginTop: 4,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingLeft: 16,
        paddingRight: 4,
        marginBottom: 8,
    },
    itemBody: {
        flex: 1,
        paddingVertical: 12,
        gap: 4,
    },
    itemData: {
        fontFamily: MONOSPACE,
        fontSize: 15,
        color: COLORS.text,
    },
    itemMeta: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    iconBtnPressed: {
        backgroundColor: COLORS.surfacePressed,
    },
});
