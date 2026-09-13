import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  SafeAreaView,
  View,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { THEME } from "./src/styles/theme";
import { Header } from "./src/components/Header";
import { CustomerScreen } from "./src/screens/CustomerScreen";
import { AdminLoginScreen } from "./src/screens/AdminLoginScreen";
import { AdminDashboardScreen } from "./src/screens/AdminDashboardScreen";
import { currentAdminToken, setAdminToken } from "./src/api/client";

export default function App() {
  const [mode, setMode] = useState<"customer" | "admin">("customer");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    Boolean(currentAdminToken)
  );

  const handleAdminLogout = () => {
    setAdminToken("");
    setIsAdminAuthenticated(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={THEME.colors.bg} translucent={false} />

      <Header
        currentMode={mode}
        onSwitchMode={(newMode) => setMode(newMode)}
      />

      <View style={styles.content}>
        {mode === "customer" ? (
          <CustomerScreen />
        ) : !isAdminAuthenticated && !currentAdminToken ? (
          <AdminLoginScreen onSuccess={() => setIsAdminAuthenticated(true)} />
        ) : (
          <AdminDashboardScreen onLogout={handleAdminLogout} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
    paddingTop: Platform.OS === "android" ? (RNStatusBar.currentHeight || 28) + 4 : 0,
  },
  content: {
    flex: 1,
  },
});

