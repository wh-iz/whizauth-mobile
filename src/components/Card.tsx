import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { THEME } from "../styles/theme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "glow" | "subtle";
}

export const Card: React.FC<CardProps> = ({ children, style, variant = "default" }) => {
  return (
    <View
      style={[
        styles.card,
        variant === "glow" && styles.cardGlow,
        variant === "subtle" && styles.cardSubtle,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  cardGlow: {
    borderColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  cardSubtle: {
    backgroundColor: THEME.colors.bgCardSubtle,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
});
