import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, SafeAreaView, View } from "react-native";
import { THEME } from "./src/styles/theme";
import { Header } from "./src/components/Header";
import { CustomerScreen } from "./src/screens/CustomerScreen";
import { AdminLoginScreen } from "./src/screens/AdminLoginScreen";
import { AdminDashboardScreen } from "./src/screens/AdminDashboardScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { currentAdminToken } from "./src/api/client";

export default function App() {
  const [mode, setMode] = useState<"customer" | "admin">("customer");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={THEME.colors.bg} />
      
      <Header
        currentMode={mode}
        onSwitchMode={(newMode) => {
          setIsSettingsOpen(false);
          setMode(newMode);
        }}
        onOpenSettings={() => setIsSettingsOpen(!isSettingsOpen)}
      />

      <View style={styles.content}>
        {isSettingsOpen ? (
          <SettingsScreen onBack={() => setIsSettingsOpen(false)} />
        ) : mode === "customer" ? (
          <CustomerScreen />
        ) : !isAdminAuthenticated && !currentAdminToken ? (
          <AdminLoginScreen onSuccess={() => setIsAdminAuthenticated(true)} />
        ) : (
          <AdminDashboardScreen />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  content: {
    flex: 1,
  },
});
