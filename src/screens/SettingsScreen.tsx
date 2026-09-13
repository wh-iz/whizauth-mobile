import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { THEME } from "../styles/theme";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { currentApiUrl, setApiUrl, DEFAULT_API_URL } from "../api/client";
import { Server, Check } from "lucide-react-native";

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [apiUrlInput, setApiUrlInput] = useState(currentApiUrl);

  const handleSave = () => {
    if (!apiUrlInput.trim()) {
      setApiUrl(DEFAULT_API_URL);
      setApiUrlInput(DEFAULT_API_URL);
    } else {
      setApiUrl(apiUrlInput.trim());
    }
    Alert.alert("Saved", `API Endpoint set to: ${currentApiUrl}`);
    onBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network Settings</Text>
        <Text style={styles.subtitle}>
          Configure your backend API endpoint or local debug server.
        </Text>
      </View>

      <Card variant="glow">
        <Input
          label="WhizAuth Server URL"
          placeholder="https://api.whizard.dev"
          value={apiUrlInput}
          onChangeText={setApiUrlInput}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          title="Save & Return"
          onPress={handleSave}
          variant="secondary"
          icon={<Check size={18} color="#ffffff" />}
          style={{ marginTop: 8 }}
        />

        <Button
          title="Reset to Default (api.whizard.dev)"
          onPress={() => {
            setApiUrlInput(DEFAULT_API_URL);
            setApiUrl(DEFAULT_API_URL);
          }}
          variant="outline"
          style={{ marginTop: 10 }}
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
  },
  header: {
    marginBottom: THEME.spacing.xl,
    marginTop: THEME.spacing.md,
  },
  title: {
    color: THEME.colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
});
