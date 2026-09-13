import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { THEME } from "../styles/theme";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import {
  KeyItemData,
  SessionItemData,
  fetchAllKeys,
  createKey,
  resetKeyHwid,
  pauseKey,
  unpauseKey,
  banKey,
  deleteKey,
  fetchActiveSessions,
  killSession,
} from "../api/adminApi";
import {
  Key,
  PlusCircle,
  Copy,
  Trash2,
  Ban,
  Pause,
  Play,
  RotateCcw,
  Activity,
  Users,
  Search,
  Check,
} from "lucide-react-native";

export const AdminDashboardScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"keys" | "create" | "sessions">("keys");
  const [keys, setKeys] = useState<KeyItemData[]>([]);
  const [sessions, setSessions] = useState<SessionItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Key creation state
  const [keyType, setKeyType] = useState<"APP" | "MODEL">("APP");
  const [appId, setAppId] = useState("whizard_ai");
  const [durationDays, setDurationDays] = useState("30");
  const [keyPattern, setKeyPattern] = useState("WZRD-AI-****-****");
  const [usedByNote, setUsedByNote] = useState("");
  const [createdKeyResult, setCreatedKeyResult] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "keys") {
        const resp = await fetchAllKeys(searchQuery || undefined);
        if (resp.success && resp.data) {
          setKeys(resp.data.appKeys || []);
        }
      } else if (activeTab === "sessions") {
        const resp = await fetchActiveSessions();
        if (resp.success && resp.data) {
          setSessions(resp.data);
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    const days = parseInt(durationDays, 10);
    if (isNaN(days) || days <= 0) {
      Alert.alert("Error", "Please enter a valid duration in days");
      return;
    }

    setLoading(true);
    try {
      const resp = await createKey({
        type: keyType,
        durationSeconds: days * 86400,
        appId: appId.trim(),
        pattern: keyPattern.trim() || undefined,
        usedBy: usedByNote.trim() || undefined,
      });

      if (resp.success && resp.data) {
        setCreatedKeyResult(resp.data.plainKey);
        Alert.alert("Key Created!", `Key: ${resp.data.plainKey}`);
      } else {
        Alert.alert("Failed", resp.error || "Could not create key");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Key creation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    action: () => Promise<any>,
    confirmTitle: string,
    confirmMsg: string
  ) => {
    Alert.alert(confirmTitle, confirmMsg, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "destructive",
        onPress: async () => {
          try {
            await action();
            loadData();
          } catch (err: any) {
            Alert.alert("Action Failed", err.response?.data?.error || "Error");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab("keys")}
          style={[styles.tabButton, activeTab === "keys" && styles.tabButtonActive]}
        >
          <Key size={16} color={activeTab === "keys" ? THEME.colors.primary : THEME.colors.textDim} />
          <Text style={[styles.tabText, activeTab === "keys" && styles.tabTextActive]}>
            Keys ({keys.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("create")}
          style={[styles.tabButton, activeTab === "create" && styles.tabButtonActive]}
        >
          <PlusCircle size={16} color={activeTab === "create" ? THEME.colors.primary : THEME.colors.textDim} />
          <Text style={[styles.tabText, activeTab === "create" && styles.tabTextActive]}>
            Generate
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("sessions")}
          style={[styles.tabButton, activeTab === "sessions" && styles.tabButtonActive]}
        >
          <Activity size={16} color={activeTab === "sessions" ? THEME.colors.primary : THEME.colors.textDim} />
          <Text style={[styles.tabText, activeTab === "sessions" && styles.tabTextActive]}>
            Sessions
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === "keys" && (
          <>
            <View style={styles.searchBar}>
              <Search size={18} color={THEME.colors.textDim} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search key, user or HWID..."
                placeholderTextColor={THEME.colors.textDim}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={loadData}
              />
            </View>

            {keys.map((k) => (
              <Card key={k.id} style={styles.keyCard}>
                <View style={styles.keyCardHeader}>
                  <Text style={styles.keyText} selectable>
                    {k.plain_key || k.id}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCopiedKey(k.plain_key);
                      setTimeout(() => setCopiedKey(null), 2000);
                    }}
                    style={styles.copyBadge}
                  >
                    {copiedKey === k.plain_key ? (
                      <Check size={14} color={THEME.colors.success} />
                    ) : (
                      <Copy size={14} color={THEME.colors.textDim} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.keyMetaRow}>
                  <Text style={styles.keyAppBadge}>{k.app_id}</Text>
                  <Text style={styles.keyMetaText}>
                    Expires: {new Date(k.expires_at).toLocaleDateString()}
                  </Text>
                </View>

                {k.used_by && (
                  <Text style={styles.usedByText}>Linked: @{k.used_by}</Text>
                )}

                <Text style={styles.hwidText}>
                  HWID: {k.hwid ? `${k.hwid.slice(0, 10)}...` : "Unbound"}
                </Text>

                {/* Actions */}
                <View style={styles.keyActions}>
                  <TouchableOpacity
                    onPress={() =>
                      handleAction(
                        () => resetKeyHwid(k.id),
                        "Reset HWID",
                        `Reset HWID binding for ${k.plain_key}?`
                      )
                    }
                    style={styles.actionBtn}
                  >
                    <RotateCcw size={14} color={THEME.colors.secondary} />
                    <Text style={[styles.actionText, { color: THEME.colors.secondary }]}>
                      HWID
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      handleAction(
                        () => (k.revoked ? unpauseKey(k.id) : pauseKey(k.id)),
                        k.revoked ? "Unpause Key" : "Pause Key",
                        `Change status for ${k.plain_key}?`
                      )
                    }
                    style={styles.actionBtn}
                  >
                    {k.revoked ? (
                      <Play size={14} color={THEME.colors.success} />
                    ) : (
                      <Pause size={14} color={THEME.colors.warning} />
                    )}
                    <Text style={styles.actionText}>
                      {k.revoked ? "Unpause" : "Pause"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      handleAction(
                        () => banKey(k.id),
                        "Ban Key",
                        `Revoke & permanently ban key ${k.plain_key}?`
                      )
                    }
                    style={styles.actionBtn}
                  >
                    <Ban size={14} color={THEME.colors.danger} />
                    <Text style={[styles.actionText, { color: THEME.colors.danger }]}>
                      Ban
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </>
        )}

        {activeTab === "create" && (
          <Card variant="glow">
            <Text style={styles.sectionHeader}>Generate License Key</Text>

            <Input
              label="Product ID"
              placeholder="e.g. whizard_ai or whizard_v2"
              value={appId}
              onChangeText={setAppId}
            />

            <Input
              label="Duration (Days)"
              placeholder="30"
              keyboardType="numeric"
              value={durationDays}
              onChangeText={setDurationDays}
            />

            <Input
              label="Key Pattern"
              placeholder="WZRD-AI-****-****"
              value={keyPattern}
              onChangeText={setKeyPattern}
            />

            <Input
              label="Assigned User / Discord Tag (Optional)"
              placeholder="e.g. whiz"
              value={usedByNote}
              onChangeText={setUsedByNote}
            />

            <Button
              title="Generate Key Now"
              onPress={handleCreateKey}
              loading={loading}
              variant="primary"
              style={{ marginTop: 8 }}
            />

            {createdKeyResult && (
              <Card variant="subtle" style={{ marginTop: 16 }}>
                <Text style={styles.successKeyHeader}>Generated Key:</Text>
                <Text style={styles.successKeyValue} selectable>
                  {createdKeyResult}
                </Text>
              </Card>
            )}
          </Card>
        )}

        {activeTab === "sessions" && (
          <>
            <Text style={styles.sessionCount}>
              Active Live Sessions: {sessions.length}
            </Text>

            {sessions.map((s) => (
              <Card key={s.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.sessionToken}>
                    Session {s.id.slice(0, 8)}...
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      handleAction(
                        () => killSession(s.id),
                        "Kill Session",
                        "Force disconnect this client immediately?"
                      )
                    }
                    style={styles.killBtn}
                  >
                    <Trash2 size={14} color={THEME.colors.danger} />
                    <Text style={styles.killText}>Kill</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sessionDetail}>HWID: {s.hwid}</Text>
                <Text style={styles.sessionDetail}>
                  Expires: {new Date(s.expires_at).toLocaleTimeString()}
                </Text>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    padding: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  tabText: {
    color: THEME.colors.textDim,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },
  tabTextActive: {
    color: THEME.colors.text,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    marginBottom: THEME.spacing.md,
  },
  searchInput: {
    flex: 1,
    color: THEME.colors.text,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  keyCard: {
    marginBottom: 10,
    padding: 12,
  },
  keyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  keyText: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  copyBadge: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  keyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  keyAppBadge: {
    backgroundColor: THEME.colors.primaryGlow,
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  keyMetaText: {
    color: THEME.colors.textDim,
    fontSize: 12,
  },
  usedByText: {
    color: THEME.colors.secondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  hwidText: {
    color: THEME.colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  keyActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  actionText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },
  sectionHeader: {
    color: THEME.colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
  },
  successKeyHeader: {
    color: THEME.colors.success,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  successKeyValue: {
    color: THEME.colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  sessionCount: {
    color: THEME.colors.textDim,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  sessionCard: {
    marginBottom: 10,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.success,
    marginRight: 6,
  },
  sessionToken: {
    flex: 1,
    color: THEME.colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  killBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.dangerGlow,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  killText: {
    color: THEME.colors.danger,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },
  sessionDetail: {
    color: THEME.colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
});
