import Ionicons from "@expo/vector-icons/Ionicons";
import { type IconProps } from "@expo/vector-icons/build/createIconSet";
import { type ComponentProps } from "react";
import { type ColorValue } from "react-native";

// expo-router types the tab bar icon color as React Native's ColorValue, which also
// admits null and number — wider than the `string | OpaqueColorValue` the icon set takes.
type TabBarIconProps = Omit<IconProps<ComponentProps<typeof Ionicons>["name"]>, "color"> & {
    color?: ColorValue;
};

export function TabBarIcon({ style, color, ...rest }: TabBarIconProps) {
    return (
        <Ionicons
            size={28}
            color={color === null || typeof color === "number" ? undefined : color}
            style={[{ marginBottom: -3 }, style]}
            {...rest}
        />
    );
}
