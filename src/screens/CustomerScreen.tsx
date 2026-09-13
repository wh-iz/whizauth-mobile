import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { THEME } from "../styles/theme";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import {
  CustomerKeyData,
  loginCustomerPanel,
  resetCustomerHwid,
  getPublicStats,
} from "../api/customerApi";
import {
  Key,
  Calendar,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  Users,
  LogOut,
} from "lucide-react-native";

export const CustomerScreen: React.FC = () => {
  const [productKey, setProductKey] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [resettingHwid, setResettingHwid] = useState(false);
  const [keyData, setKeyData] = useState<CustomerKeyData | null>(null);
  const [stats, setStats] = useState<{ visitors: number; vouches: any[] }>({
    visitors: 0,
    vouches: [],
  });

  useEffect(() => {
    getPublicStats().then(setStats);
  }, []);

  const handleLogin = async () => {
    if (!productKey.trim() || !discordUsername.trim()) {
      Alert.alert("Error", "Please enter both product key and discord username");
      return;
    }

    setLoading(true);
    try {
      const resp = await loginCustomerPanel(
        productKey.trim(),
        discordUsername.trim()
      );
      if (resp.success && resp.data) {
        setKeyData(resp.data);
      } else {
        Alert.alert("Login Failed", resp.error || "Invalid key or username");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Could not connect to WhizAuth server";
      Alert.alert("Connection Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleHwidReset = async () => {
    if (!keyData) return;

    Alert.alert(
      "Confirm HWID Reset",
      "Are you sure you want to reset the bound HWID for this license key?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset HWID",
          style: "destructive",
          onPress: async () => {
            setResettingHwid(true);
            try {
              const resp = await resetCustomerHwid(
                productKey.trim(),
                discordUsername.trim()
              );
              if (resp.success) {
                Alert.alert("Success", "HWID reset successfully! You can now log in on your new PC.");
                setKeyData({ ...keyData, hwidResetUsed: true });
              } else {
                Alert.alert("Reset Failed", resp.error || "HWID reset already used or not permitted.");
              }
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.error || "Reset failed");
            } finally {
              setResettingHwid(false);
            }
          },
        },
      ]
    );
  };

  const calculateDaysLeft = (expiresAt: string) => {
    const exp = new Date(expiresAt);
    const diff = exp.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days > 3650) return "Lifetime Access";
    return days > 0 ? `${days} Days Left` : "Expired";
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!keyData ? (
        <>
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Customer Portal</Text>
            <Text style={styles.heroSubtitle}>
              Check license status, manage your HWID, and download software.
            </Text>
          </View>

          <Card variant="glow">
            <Input
              label="Product License Key"
              placeholder="e.g. WZRD-AI-XXXX-XXXX"
              value={productKey}
              onChangeText={setProductKey}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Discord Username"
              placeholder="e.g. whiz or whiz#0001"
              value={discordUsername}
              onChangeText={setDiscordUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button
              title="Access License Dashboard"
              onPress={handleLogin}
              loading={loading}
              variant="secondary"
              style={{ marginTop: 8 }}
            />
          </Card>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Users size={20} color={THEME.colors.secondary} />
              <Text style={styles.statValue}>{stats.visitors}</Text>
              <Text style={styles.statLabel}>Unique Visitors</Text>
            </Card>
            <Card style={styles.statCard}>
              <CheckCircle2 size={20} color={THEME.colors.success} />
              <Text style={styles.statValue}>{stats.vouches.length}+</Text>
              <Text style={styles.statLabel}>Verified Vouches</Text>
            </Card>
          </View>
        </>
      ) : (
        <>
          <View style={styles.portalHeader}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.usernameText}>{keyData.discordUsername}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setKeyData(null)}
              style={styles.logoutButton}
            >
              <LogOut size={16} color={THEME.colors.danger} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <Card variant="glow">
            <View style={styles.statusHeader}>
              <View style={styles.badgeSuccess}>
                <CheckCircle2 size={14} color={THEME.colors.success} />
                <Text style={styles.badgeSuccessText}>ACTIVE LICENSE</Text>
              </View>
              <Text style={styles.appIdBadge}>{keyData.appId.toUpperCase()}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Key size={18} color={THEME.colors.secondary} />
              </View>
              <View style={styles.infoDetails}>
                <Text style={styles.infoLabel}>License Key</Text>
                <Text style={styles.infoValue}>
                  {productKey.length > 8
                    ? `${productKey.slice(0, 4)}••••-••••${productKey.slice(-4)}`
                    : productKey}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={18} color={THEME.colors.primary} />
              </View>
              <View style={styles.infoDetails}>
                <Text style={styles.infoLabel}>Subscription Period</Text>
                <Text style={styles.infoValue}>
                  {calculateDaysLeft(keyData.expiresAt)}
                </Text>
                <Text style={styles.infoSubtext}>
                  Expires: {new Date(keyData.expiresAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Cpu size={18} color={THEME.colors.warning} />
              </View>
              <View style={styles.infoDetails}>
                <Text style={styles.infoLabel}>HWID Status</Text>
                <Text style={styles.infoValue}>
                  {keyData.hwidResetUsed ? "Reset Used (Locked)" : "Hardware Linked"}
                </Text>
              </View>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Self-Service Actions</Text>
            <Text style={styles.sectionDesc}>
              Changed your PC or hardware components? Reset your hardware binding below.
            </Text>

            <Button
              title="Reset Hardware (HWID)"
              onPress={handleHwidReset}
              variant="outline"
              loading={resettingHwid}
              disabled={keyData.hwidResetUsed}
              icon={<RefreshCw size={16} color={THEME.colors.primary} />}
            />
            {keyData.hwidResetUsed && (
              <Text style={styles.cooldownWarning}>
                * 1-time automated reset already used. Contact support for further resets.
              </Text>
            )}
          </Card>

          <Card variant="subtle">
            <Text style={styles.sectionTitle}>Product Downloads</Text>
            <TouchableOpacity style={styles.downloadItem}>
              <View style={styles.downloadLeft}>
                <Download size={18} color={THEME.colors.secondary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.downloadName}>whizARD AI Client</Text>
                  <Text style={styles.downloadSub}>Windows x64 (TensorRT / CUDA)</Text>
                </View>
              </View>
              <Text style={styles.downloadVersion}>v2.0</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.downloadItem}>
              <View style={styles.downloadLeft}>
                <Download size={18} color={THEME.colors.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.downloadName}>WhizAuth Universal Loader</Text>
                  <Text style={styles.downloadSub}>Auto-updating client launcher</Text>
                </View>
              </View>
              <Text style={styles.downloadVersion}>v1.0</Text>
            </TouchableOpacity>
          </Card>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  content: {
    padding: THEME.spacing.lg,
  },
  heroSection: {
    marginBottom: THEME.spacing.xl,
    marginTop: THEME.spacing.md,
  },
  heroTitle: {
    color: THEME.colors.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: THEME.spacing.lg,
  },
  statValue: {
    color: THEME.colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 8,
  },
  statLabel: {
    color: THEME.colors.textDim,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  portalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: THEME.spacing.lg,
  },
  welcomeText: {
    color: THEME.colors.textDim,
    fontSize: 13,
    fontWeight: "600",
  },
  usernameText: {
    color: THEME.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.dangerGlow,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.md,
  },
  logoutText: {
    color: THEME.colors.danger,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  badgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.successGlow,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeSuccessText: {
    color: THEME.colors.success,
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  appIdBadge: {
    color: THEME.colors.secondary,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: THEME.colors.secondaryGlow,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoDetails: {
    flex: 1,
  },
  infoLabel: {
    color: THEME.colors.textDim,
    fontSize: 12,
    fontWeight: "600",
  },
  infoValue: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  infoSubtext: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: THEME.colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionDesc: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    marginBottom: THEME.spacing.md,
    lineHeight: 18,
  },
  cooldownWarning: {
    color: THEME.colors.warning,
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  downloadItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  downloadLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  downloadName: {
    color: THEME.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  downloadSub: {
    color: THEME.colors.textDim,
    fontSize: 12,
  },
  downloadVersion: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
});
