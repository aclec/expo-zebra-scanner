import { Platform } from "react-native";

export const COLORS = {
    background: "#F2F2F7",
    surface: "#FFFFFF",
    surfacePressed: "#E9E9EE",
    separator: "#E2E2E7",
    text: "#1C1C1E",
    textSecondary: "#6E6E73",
    tint: "#0a7ea4",
    tintPressed: "#086a8a",
    success: "#2E9E5B",
};

export const MONOSPACE = Platform.select({ ios: "Menlo", default: "monospace" });
