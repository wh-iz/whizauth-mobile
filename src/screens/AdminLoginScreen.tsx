import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { THEME } from "../styles/theme";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { setAdminToken } from "../api/client";
import { ShieldCheck, Lock } from "lucide-react-native";

interface AdminLoginScreenProps {
  onSuccess: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onSuccess }) => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!token.trim()) {
      Alert.alert("Error", "Please enter your WhizAuth Admin Token");
      return;
    }

    setLoading(true);
    // Set token in API client
    setAdminToken(token.trim());
    setLoading(false);
    onSuccess();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Lock size={32} color={THEME.colors.primary} />
        </View>
        <Text style={styles.title}>Admin Authorization</Text>
        <Text style={styles.subtitle}>
          Enter your Master Secret Token to access key generation & session management.
        </Text>
      </View>

      <Card variant="glow">
        <Input
          label="Admin Secret Token"
          placeholder="Whiz_Admin_Token_..."
          secureTextEntry
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          title="Authenticate & Unlock"
          onPress={handleLogin}
          loading={loading}
          variant="primary"
          style={{ marginTop: 8 }}
          icon={<ShieldCheck size={18} color="#ffffff" />}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
    padding: THEME.spacing.lg,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: THEME.spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: THEME.colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
});
