import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "../styles/theme";
import { Shield, User, Lock, Settings as SettingsIcon } from "lucide-react-native";

interface HeaderProps {
  currentMode: "customer" | "admin";
  onSwitchMode: (mode: "customer" | "admin") => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSwitchMode,
  onOpenSettings,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <Shield size={20} color={THEME.colors.primary} />
        </View>
        <View>
          <Text style={styles.brandTitle}>WhizAuth</Text>
          <Text style={styles.brandSubtitle}>Mobile Portal</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => onSwitchMode("customer")}
            style={[
              styles.tab,
              currentMode === "customer" && styles.tabActiveCustomer,
            ]}
          >
            <User
              size={14}
              color={
                currentMode === "customer"
                  ? THEME.colors.secondary
                  : THEME.colors.textDim
              }
            />
            <Text
              style={[
                styles.tabText,
                currentMode === "customer" && styles.tabTextActive,
              ]}
            >
              User
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onSwitchMode("admin")}
            style={[
              styles.tab,
              currentMode === "admin" && styles.tabActiveAdmin,
            ]}
          >
            <Lock
              size={14}
              color={
                currentMode === "admin"
                  ? THEME.colors.primary
                  : THEME.colors.textDim
              }
            />
            <Text
              style={[
                styles.tabText,
                currentMode === "admin" && styles.tabTextActive,
              ]}
            >
              Admin
            </Text>
          </TouchableOpacity>
        </View>

        {onOpenSettings && (
          <TouchableOpacity
            onPress={onOpenSettings}
            style={styles.settingsButton}
          >
            <SettingsIcon size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: THEME.colors.bg,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  brandTitle: {
    color: THEME.colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: THEME.colors.textDim,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    padding: 3,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginRight: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tabActiveCustomer: {
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderWidth: 1,
    borderColor: THEME.colors.secondary,
  },
  tabActiveAdmin: {
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  tabText: {
    color: THEME.colors.textDim,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 5,
  },
  tabTextActive: {
    color: THEME.colors.text,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: THEME.colors.bgCardSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
});
