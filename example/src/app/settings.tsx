import React, { useContext, useEffect, useState, type ReactNode } from "react";
import { Text, StyleSheet, View, Switch, TextInput, ScrollView, Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { SettingsContext } from "../library/context/SettingsContext";
import { useZebraCoreFunctions } from "expo-zebra-scanner";
import { COLORS } from "../library/constants/theme";

/*
  The settings shown here are for example purposes, currently there's no way
  to get the actual configuration of a profile and this configurations arent persistent
  because when you create a profile with createIntentDatawedgeProfile() all the settings
  are reseted
*/

// PR idea 1: Modify the native code to get the profile current settings
// PR idea 2: Make this settings persistent with async storage or something if #1 can't be done
// PR idea 3: Modify createIntentDatawedgeProfile() to avoid reset settings

const OUTPUT_MODES = ["Intent", "Keystroke"] as const;
type OutputMode = (typeof OUTPUT_MODES)[number];

// Critically damped: the thumb settles without overshoot.
const THUMB_SPRING = { duration: 350, dampingRatio: 1 };
const SWITCH_COLORS = { true: COLORS.success, false: "#D1D1D6" };

function Section({ title, footer, children }: { title: string; footer?: string; children: ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.group}>{children}</View>
            {footer ? <Text style={styles.sectionFooter}>{footer}</Text> : null}
        </View>
    );
}

function Separator() {
    return <View style={styles.separator} />;
}

function SwitchRow({
    label,
    value,
    onValueChange,
    disabled = false,
}: {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <View style={[styles.row, disabled && styles.disabled]}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Switch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={SWITCH_COLORS}
                ios_backgroundColor={SWITCH_COLORS.false}
            />
        </View>
    );
}

// Commits on submit and on blur, and only when the value actually changed.
function PrefixRow({ value, onCommit, disabled = false }: { value: string; onCommit: (value: string) => void; disabled?: boolean }) {
    const [draft, setDraft] = useState(value);

    return (
        <View style={[styles.row, disabled && styles.disabled]}>
            <Text style={styles.rowLabel}>Data prefix</Text>
            <TextInput
                value={draft}
                onChangeText={setDraft}
                onEndEditing={() => {
                    if (draft !== value) onCommit(draft);
                }}
                style={styles.prefixInput}
                placeholder="None"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                editable={!disabled}
            />
        </View>
    );
}

function SegmentedControl({
    value,
    onChange,
    disabled = false,
}: {
    value: OutputMode;
    onChange: (value: OutputMode) => void;
    disabled?: boolean;
}) {
    const [segmentWidth, setSegmentWidth] = useState(0);
    const translateX = useSharedValue(0);
    const index = OUTPUT_MODES.indexOf(value);

    // The spring starts from the thumb's live position, so rapid taps redirect it smoothly.
    useEffect(() => {
        translateX.set(withSpring(index * segmentWidth, THUMB_SPRING));
    }, [index, segmentWidth, translateX]);

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.get() }],
    }));

    return (
        <View
            style={[styles.segmented, disabled && styles.disabled]}
            onLayout={(e) => {
                const width = (e.nativeEvent.layout.width - 4) / OUTPUT_MODES.length;
                translateX.set(index * width);
                setSegmentWidth(width);
            }}
        >
            {segmentWidth > 0 && <Animated.View style={[styles.segmentThumb, { width: segmentWidth }, thumbStyle]} />}
            {OUTPUT_MODES.map((mode) => {
                const selected = mode === value;
                return (
                    <Pressable
                        key={mode}
                        accessibilityRole="button"
                        accessibilityState={{ selected, disabled }}
                        disabled={disabled}
                        onPress={() => !selected && onChange(mode)}
                        style={({ pressed }) => [styles.segment, pressed && !selected && styles.segmentPressed]}
                    >
                        <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{mode}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

function formatVersion(version: number[] | null) {
    if (!version) return "Checking…";
    if (version.every((part) => part === 0)) return "Not detected";
    return version.join(".");
}

export default function SettingsScreen() {
    const { isIntentEnabled, isKeystrokeEnterEnabled, intentPrefix, keystrokePrefix, isCustomEventEnabled, isCustomActionTesterEnabled, updateSettings } =
        useContext(SettingsContext);

    const [dwVersion, setDwVersion] = useState<number[] | null>(null);
    const { getDataWedgeVersion } = useZebraCoreFunctions();
    // Custom event mode forces intent output on the DataWedge side (see useSettings).
    const outputMode: OutputMode = isIntentEnabled || isCustomEventEnabled ? "Intent" : "Keystroke";

    useEffect(() => {
        (async () => {
            const version = await getDataWedgeVersion();
            setDwVersion(version);
        })();
    }, [getDataWedgeVersion]);

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
        >
            <Section
                title="Output"
                footer={isCustomEventEnabled ? "Custom event mode forces intent output." : "How DataWedge delivers scanned data to the app."}
            >
                <View style={styles.segmentedRow}>
                    <SegmentedControl
                        value={outputMode}
                        onChange={(mode) => updateSettings("isIntentEnabled", mode === "Intent")}
                        disabled={isCustomEventEnabled}
                    />
                </View>
            </Section>

            <Section title="Intent">
                <PrefixRow value={intentPrefix} onCommit={(value) => updateSettings("intentPrefix", value)} disabled={isCustomEventEnabled} />
            </Section>

            <Section title="Keystroke">
                <SwitchRow
                    label="Send ENTER key"
                    value={isKeystrokeEnterEnabled}
                    onValueChange={(value) => updateSettings("isKeystrokeEnterEnabled", value)}
                    disabled={isCustomEventEnabled}
                />
                <Separator />
                <PrefixRow value={keystrokePrefix} onCommit={(value) => updateSettings("keystrokePrefix", value)} disabled={isCustomEventEnabled} />
            </Section>

            <Section
                title="Custom event"
                footer="The tester creates a dedicated DataWedge profile and lets you subscribe to several actions from the Scan tab."
            >
                <SwitchRow
                    label="Enable custom event"
                    value={isCustomEventEnabled}
                    onValueChange={(value) => updateSettings("isCustomEventEnabled", value)}
                />
                <Separator />
                <SwitchRow
                    label="Custom action tester"
                    value={isCustomActionTesterEnabled}
                    onValueChange={(value) => updateSettings("isCustomActionTesterEnabled", value)}
                />
            </Section>

            <Section title="DataWedge">
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>Version</Text>
                    <Text style={styles.rowValue}>{formatVersion(dwVersion)}</Text>
                </View>
            </Section>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "500",
        color: COLORS.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.3,
        marginBottom: 6,
        paddingHorizontal: 16,
    },
    sectionFooter: {
        fontSize: 13,
        lineHeight: 18,
        color: COLORS.textSecondary,
        marginTop: 6,
        paddingHorizontal: 16,
    },
    group: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        overflow: "hidden",
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: COLORS.separator,
        marginLeft: 16,
    },
    row: {
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingHorizontal: 16,
    },
    rowLabel: {
        fontSize: 16,
        color: COLORS.text,
    },
    rowValue: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontVariant: ["tabular-nums"],
    },
    prefixInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        textAlign: "right",
        paddingVertical: 12,
    },
    disabled: {
        opacity: 0.4,
    },
    segmentedRow: {
        padding: 12,
    },
    segmented: {
        flexDirection: "row",
        padding: 2,
        borderRadius: 9,
        backgroundColor: COLORS.background,
    },
    segmentThumb: {
        position: "absolute",
        top: 2,
        bottom: 2,
        left: 2,
        borderRadius: 7,
        backgroundColor: COLORS.surface,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
    },
    segment: {
        flex: 1,
        minHeight: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 7,
    },
    segmentPressed: {
        opacity: 0.5,
    },
    segmentLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textSecondary,
    },
    segmentLabelSelected: {
        color: COLORS.text,
        fontWeight: "600",
    },
});
