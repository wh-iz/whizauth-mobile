import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Clipboard,
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
  extendKeyTime,
  extendAllKeysByAppId,
  fetchActiveSessions,
  killSession,
  cleanupExpiredKeys,
  sendDiscordAnnouncement,
} from "../api/adminApi";
import {
  currentApiUrl,
  setApiUrl,
  DEFAULT_API_URL,
} from "../api/client";
import {
  Key,
  PlusCircle,
  Clock,
  Activity,
  Settings as SettingsIcon,
  Copy,
  Trash2,
  Ban,
  Pause,
  Play,
  RotateCcw,
  Search,
  Check,
  RefreshCw,
  Server,
  LogOut,
  Wifi,
  Megaphone,
} from "lucide-react-native";

interface AdminDashboardScreenProps {
  onLogout?: () => void;
}

const PRODUCTS = [
  { name: "whizARD AI", id: "whizard_ai", pattern: "WZRD-AI-****-****" },
  { name: "whizARD AI+", id: "whizard_ai_plus", pattern: "WZRD-AI+-****-****" },
  { name: "whizARD V1", id: "whizard_v1", pattern: "WZRD-V1-****-****" },
  { name: "whizARD V2", id: "whizard_v2", pattern: "WZRD-V2-****-****" },
  { name: "whizARD Toolbox", id: "whizard_toolbox", pattern: "WZRD-TBX-****-****" },
  { name: "whizARD SWS", id: "whizard_sws", pattern: "WZRD-SWS-****-****" },
  { name: "whizARD SWSBOT", id: "whizard_swsbot", pattern: "WZRD-SWB-****-****" },
  { name: "Loot Goblin", id: "LG", pattern: "LG-****-****" },
  { name: "Custom", id: "custom", pattern: "WZRD-APP-****-****" },
];

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<
    "keys" | "create" | "extend" | "sessions" | "announce" | "settings"
  >("keys");

  // Keys state
  const [keys, setKeys] = useState<KeyItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAppId, setFilterAppId] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [cleaningExpired, setCleaningExpired] = useState(false);

  // Announcement state
  const [announceChannelId, setAnnounceChannelId] = useState("1490803745389285530");
  const [announceType, setAnnounceType] = useState<
    "update" | "info" | "warning" | "important" | "downtime"
  >("update");
  const [announcePing, setAnnouncePing] = useState<"@everyone" | "@here" | "none">("@everyone");
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceContent, setAnnounceContent] = useState("");
  const [announceShowBranding, setAnnounceShowBranding] = useState(true);
  const [announceSending, setAnnounceSending] = useState(false);

  // Generate Key state
  const [keyType, setKeyType] = useState<"APP" | "MODEL">("APP");
  const [appId, setAppId] = useState("whizard_ai");
  const [durationDays, setDurationDays] = useState("30");
  const [keyPattern, setKeyPattern] = useState("WZRD-AI-****-****");
  const [usedByNote, setUsedByNote] = useState("");
  const [createdKeyResult, setCreatedKeyResult] = useState<string | null>(null);

  // Add Time state
  const [extendScope, setExtendScope] = useState<"SINGLE" | "ALL_APP_KEYS">("SINGLE");
  const [extendTarget, setExtendTarget] = useState("");
  const [extendAmount, setExtendAmount] = useState("7");
  const [extendUnit, setExtendUnit] = useState<"HOUR" | "DAY" | "WEEK" | "MONTH">("DAY");

  // Sessions state
  const [sessions, setSessions] = useState<SessionItemData[]>([]);
  const [autoRefreshSessions, setAutoRefreshSessions] = useState(true);

  // Server Settings state
  const [apiUrlInput, setApiUrlInput] = useState(currentApiUrl);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [pingLoading, setPingLoading] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, filterAppId]);

  useEffect(() => {
    if (activeTab === "sessions" && autoRefreshSessions) {
      timerRef.current = setInterval(() => {
        fetchActiveSessions()
          .then((res) => {
            if (res.success && res.data) setSessions(res.data);
          })
          .catch(() => {});
      }, 10000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTab, autoRefreshSessions]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "keys") {
        const resp = await fetchAllKeys(
          searchQuery.trim() || undefined,
          filterAppId || undefined
        );
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

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleProductPreset = (prod: (typeof PRODUCTS)[0]) => {
    setAppId(prod.id === "custom" ? "" : prod.id);
    setKeyPattern(prod.pattern);
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

  const handleExtendTime = async () => {
    const amount = parseInt(extendAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (extendScope === "SINGLE" && !extendTarget.trim()) {
      Alert.alert("Error", "Please enter the target Key or ID");
      return;
    }

    setLoading(true);
    try {
      if (extendScope === "SINGLE") {
        const resp = await extendKeyTime({
          scope: "SINGLE",
          kind: "APP",
          amount,
          unit: extendUnit,
          target: extendTarget.trim(),
        });
        if (resp.success) {
          Alert.alert("Success", `Added ${amount} ${extendUnit.toLowerCase()}(s) to key.`);
        } else {
          Alert.alert("Failed", resp.error || "Could not extend time");
        }
      } else {
        const resp = await extendAllKeysByAppId({
          appId: extendTarget.trim() || "whizard_ai",
          amount,
          unit: extendUnit,
        });
        if (resp.success) {
          Alert.alert("Success", `Extended all keys for ${extendTarget || "whizard_ai"}.`);
        } else {
          Alert.alert("Failed", resp.error || "Could not extend all keys");
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Extend time failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (
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

  const handlePingServer = async () => {
    setPingLoading(true);
    setPingStatus(null);
    const start = Date.now();
    try {
      const resp = await fetchActiveSessions();
      const elapsed = Date.now() - start;
      if (resp.success) {
        setPingStatus(`Connected! Ping: ${elapsed}ms`);
      } else {
        setPingStatus("Server responded with error");
      }
    } catch (err: any) {
      setPingStatus(`Failed: ${err.message}`);
    } finally {
      setPingLoading(false);
    }
  };

  const handleSaveApiUrl = () => {
    const trimmed = apiUrlInput.trim() || DEFAULT_API_URL;
    setApiUrl(trimmed);
    setApiUrlInput(trimmed);
    Alert.alert("Saved", `Server URL set to: ${trimmed}`);
  };

  const handleSendAnnouncement = async () => {
    if (!announceTitle.trim() || !announceContent.trim()) {
      Alert.alert("Missing Information", "Please provide both a headline title and message content.");
      return;
    }

    setAnnounceSending(true);
    try {
      const resp = await sendDiscordAnnouncement({
        channelId: announceChannelId.trim(),
        title: announceTitle.trim(),
        content: announceContent.trim(),
        type: announceType,
        ping: announcePing,
        showBranding: announceShowBranding,
      });

      if (resp.success) {
        Alert.alert(
          "Sent Successfully!",
          `Announcement sent to channel #${announceChannelId} via ${resp.method || "Discord"}!`
        );
        setAnnounceTitle("");
        setAnnounceContent("");
      } else {
        Alert.alert("Failed", resp.error || "Could not send announcement");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || err.message || "Failed to send");
    } finally {
      setAnnounceSending(false);
    }
  };

  const handleCleanupExpiredKeys = () => {
    Alert.alert(
      "Purge Expired Keys",
      "Do you want to purge all expired license keys and sessions from the database?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Purge All",
          style: "destructive",
          onPress: async () => {
            setCleaningExpired(true);
            try {
              const res = await cleanupExpiredKeys();
              if (res.success) {
                const { deletedAppKeys = 0, deletedModelKeys = 0 } = res.data || {};
                Alert.alert(
                  "Cleanup Complete",
                  `Deleted ${deletedAppKeys} expired App Keys and ${deletedModelKeys} Model Keys.`
                );
                loadData();
              } else {
                Alert.alert("Failed", res.error || "Failed to clean keys");
              }
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.error || err.message);
            } finally {
              setCleaningExpired(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Sub-Navigation Tabs */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("keys")}
            style={[styles.tabButton, activeTab === "keys" && styles.tabButtonActive]}
          >
            <Key
              size={15}
              color={activeTab === "keys" ? THEME.colors.primary : THEME.colors.textDim}
            />
            <Text style={[styles.tabText, activeTab === "keys" && styles.tabTextActive]}>
              Keys ({keys.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("create")}
            style={[styles.tabButton, activeTab === "create" && styles.tabButtonActive]}
          >
            <PlusCircle
              size={15}
              color={activeTab === "create" ? THEME.colors.primary : THEME.colors.textDim}
            />
            <Text style={[styles.tabText, activeTab === "create" && styles.tabTextActive]}>
              Generate
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("extend")}
            style={[styles.tabButton, activeTab === "extend" && styles.tabButtonActive]}
          >
            <Clock
              size={15}
              color={activeTab === "extend" ? THEME.colors.primary : THEME.colors.textDim}
            />
            <Text style={[styles.tabText, activeTab === "extend" && styles.tabTextActive]}>
              Add Time
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("sessions")}
            style={[styles.tabButton, activeTab === "sessions" && styles.tabButtonActive]}
          >
            <Activity
              size={15}
              color={activeTab === "sessions" ? THEME.colors.secondary : THEME.colors.textDim}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "sessions" && styles.tabTextActiveSecondary,
              ]}
            >
              Sessions ({sessions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("announce")}
            style={[styles.tabButton, activeTab === "announce" && styles.tabButtonActive]}
          >
            <Megaphone
              size={15}
              color={activeTab === "announce" ? THEME.colors.accent : THEME.colors.textDim}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "announce" && { color: THEME.colors.accent, fontWeight: "700" },
              ]}
            >
              Announce
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("settings")}
            style={[styles.tabButton, activeTab === "settings" && styles.tabButtonActive]}
          >
            <SettingsIcon
              size={15}
              color={activeTab === "settings" ? THEME.colors.primary : THEME.colors.textDim}
            />
            <Text style={[styles.tabText, activeTab === "settings" && styles.tabTextActive]}>
              Server
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ===================== KEYS TAB ===================== */}
        {activeTab === "keys" && (
          <>
            {/* Search Input */}
            <View style={styles.searchBar}>
              <Search size={18} color={THEME.colors.textDim} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by key, discord user, or HWID..."
                placeholderTextColor={THEME.colors.textDim}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={loadData}
              />
              <TouchableOpacity onPress={loadData} style={styles.searchBtn}>
                <Text style={styles.searchBtnText}>Filter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCleanupExpiredKeys}
                style={[
                  styles.searchBtn,
                  {
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    borderColor: "rgba(239, 68, 68, 0.4)",
                    borderWidth: 1,
                  },
                ]}
                disabled={cleaningExpired}
              >
                {cleaningExpired ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Text style={[styles.searchBtnText, { color: "#EF4444" }]}>🧹 Purge</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Product Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              <TouchableOpacity
                onPress={() => setFilterAppId("")}
                style={[
                  styles.filterChip,
                  filterAppId === "" && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterAppId === "" && styles.filterChipTextActive,
                  ]}
                >
                  All Products
                </Text>
              </TouchableOpacity>
              {PRODUCTS.filter((p) => p.id !== "custom").map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setFilterAppId(p.id)}
                  style={[
                    styles.filterChip,
                    filterAppId === p.id && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filterAppId === p.id && styles.filterChipTextActive,
                    ]}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loading && keys.length === 0 ? (
              <ActivityIndicator
                size="large"
                color={THEME.colors.primary}
                style={{ marginTop: 24 }}
              />
            ) : keys.length === 0 ? (
              <Card style={{ alignItems: "center", paddingVertical: 24 }}>
                <Text style={{ color: THEME.colors.textDim }}>No license keys found.</Text>
              </Card>
            ) : (
              keys.map((k) => (
                <Card key={k.id} style={styles.keyCard}>
                  <View style={styles.keyCardHeader}>
                    <Text style={styles.keyText} selectable>
                      {k.plain_key || k.id}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(k.plain_key || k.id, k.id)}
                      style={styles.copyBadge}
                    >
                      {copiedKey === k.id ? (
                        <Check size={14} color={THEME.colors.success} />
                      ) : (
                        <Copy size={14} color={THEME.colors.textDim} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.keyMetaRow}>
                    <Text style={styles.keyAppBadge}>{k.app_id}</Text>
                    <Text
                      style={[
                        styles.statusBadge,
                        k.revoked
                          ? styles.statusBadgeRevoked
                          : styles.statusBadgeActive,
                      ]}
                    >
                      {k.revoked ? "PAUSED / BANNED" : "ACTIVE"}
                    </Text>
                    <Text style={styles.keyMetaText}>
                      Expires: {new Date(k.expires_at).toLocaleDateString()}
                    </Text>
                  </View>

                  {k.used_by && (
                    <View style={styles.discordBadge}>
                      <Text style={styles.discordBadgeText}>
                        Discord: @{k.used_by}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.hwidText} selectable>
                    HWID: {k.hwid ? k.hwid : "Unbound (Any PC)"}
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
                      <RotateCcw size={13} color={THEME.colors.secondary} />
                      <Text
                        style={[
                          styles.actionText,
                          { color: THEME.colors.secondary },
                        ]}
                      >
                        HWID
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        handleAction(
                          () => (k.revoked ? unpauseKey(k.id) : pauseKey(k.id)),
                          k.revoked ? "Unpause Key" : "Pause Key",
                          `Change state for ${k.plain_key}?`
                        )
                      }
                      style={styles.actionBtn}
                    >
                      {k.revoked ? (
                        <Play size={13} color={THEME.colors.success} />
                      ) : (
                        <Pause size={13} color={THEME.colors.warning} />
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
                          `Permanently ban and revoke ${k.plain_key}?`
                        )
                      }
                      style={styles.actionBtn}
                    >
                      <Ban size={13} color={THEME.colors.danger} />
                      <Text
                        style={[styles.actionText, { color: THEME.colors.danger }]}
                      >
                        Ban
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        handleAction(
                          () => deleteKey(k.id),
                          "Delete Key",
                          `Are you sure you want to permanently delete ${k.plain_key}?`
                        )
                      }
                      style={[styles.actionBtn, { borderColor: THEME.colors.danger }]}
                    >
                      <Trash2 size={13} color={THEME.colors.danger} />
                      <Text
                        style={[styles.actionText, { color: THEME.colors.danger }]}
                      >
                        Del
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {/* ===================== GENERATE TAB ===================== */}
        {activeTab === "create" && (
          <Card variant="glow">
            <Text style={styles.sectionHeader}>Generate License Key</Text>

            {/* Product Presets */}
            <Text style={styles.fieldLabel}>Choose Product Preset:</Text>
            <View style={styles.presetGrid}>
              {PRODUCTS.map((prod) => (
                <TouchableOpacity
                  key={prod.id}
                  onPress={() => handleProductPreset(prod)}
                  style={[
                    styles.presetBtn,
                    (appId === prod.id ||
                      (prod.id === "custom" && !appId)) &&
                      styles.presetBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetBtnText,
                      (appId === prod.id ||
                        (prod.id === "custom" && !appId)) &&
                        styles.presetBtnTextActive,
                    ]}
                  >
                    {prod.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Product ID (appId)"
              placeholder="e.g. whizard_ai"
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

            {/* Quick Duration Buttons */}
            <View style={styles.quickDurationRow}>
              {["7", "30", "90", "365", "9999"].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setDurationDays(d)}
                  style={[
                    styles.quickDurationBtn,
                    durationDays === d && styles.quickDurationBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickDurationText,
                      durationDays === d && styles.quickDurationTextActive,
                    ]}
                  >
                    {d === "9999" ? "Lifetime" : `${d}d`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Key Pattern"
              placeholder="WZRD-AI-****-****"
              value={keyPattern}
              onChangeText={setKeyPattern}
            />

            <Input
              label="Assigned User / Discord Tag (Optional)"
              placeholder="e.g. whiz or whiz#0001"
              value={usedByNote}
              onChangeText={setUsedByNote}
            />

            <Button
              title="Generate Key Now"
              onPress={handleCreateKey}
              loading={loading}
              variant="primary"
              style={{ marginTop: 12 }}
            />

            {createdKeyResult && (
              <Card variant="subtle" style={{ marginTop: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.successKeyHeader}>Generated Key:</Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(createdKeyResult, "created")}
                    style={styles.copyBadge}
                  >
                    {copiedKey === "created" ? (
                      <Check size={14} color={THEME.colors.success} />
                    ) : (
                      <Copy size={14} color={THEME.colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.successKeyValue} selectable>
                  {createdKeyResult}
                </Text>
              </Card>
            )}
          </Card>
        )}

        {/* ===================== ADD TIME TAB ===================== */}
        {activeTab === "extend" && (
          <Card variant="glow">
            <Text style={styles.sectionHeader}>Add Time to License</Text>
            <Text style={styles.sectionDesc}>
              Extend the expiration date for a single key or all keys for an entire product.
            </Text>

            {/* Scope selection */}
            <Text style={styles.fieldLabel}>Extension Scope:</Text>
            <View style={styles.scopeRow}>
              <TouchableOpacity
                onPress={() => setExtendScope("SINGLE")}
                style={[
                  styles.scopeBtn,
                  extendScope === "SINGLE" && styles.scopeBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.scopeBtnText,
                    extendScope === "SINGLE" && styles.scopeBtnTextActive,
                  ]}
                >
                  Single Key
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setExtendScope("ALL_APP_KEYS")}
                style={[
                  styles.scopeBtn,
                  extendScope === "ALL_APP_KEYS" && styles.scopeBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.scopeBtnText,
                    extendScope === "ALL_APP_KEYS" && styles.scopeBtnTextActive,
                  ]}
                >
                  All Keys (Product)
                </Text>
              </TouchableOpacity>
            </View>

            <Input
              label={
                extendScope === "SINGLE"
                  ? "Target Plain Key or Key ID"
                  : "Product ID (e.g. whizard_ai or LG)"
              }
              placeholder={
                extendScope === "SINGLE"
                  ? "e.g. WZRD-AI-XXXX-XXXX"
                  : "e.g. whizard_ai"
              }
              value={extendTarget}
              onChangeText={setExtendTarget}
            />

            <Input
              label="Amount"
              placeholder="7"
              keyboardType="numeric"
              value={extendAmount}
              onChangeText={setExtendAmount}
            />

            {/* Unit selection */}
            <Text style={styles.fieldLabel}>Time Unit:</Text>
            <View style={styles.unitRow}>
              {(["HOUR", "DAY", "WEEK", "MONTH"] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setExtendUnit(u)}
                  style={[
                    styles.unitBtn,
                    extendUnit === u && styles.unitBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitBtnText,
                      extendUnit === u && styles.unitBtnTextActive,
                    ]}
                  >
                    {u}S
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Add Time Now"
              onPress={handleExtendTime}
              loading={loading}
              variant="secondary"
              style={{ marginTop: 16 }}
            />
          </Card>
        )}

        {/* ===================== LIVE SESSIONS TAB ===================== */}
        {activeTab === "sessions" && (
          <>
            <View style={styles.sessionControlBar}>
              <View>
                <Text style={styles.sessionCountTitle}>Active Live Sessions</Text>
                <Text style={styles.sessionCountSub}>
                  {sessions.length} connection(s) currently active
                </Text>
              </View>

              <View style={styles.sessionActionsRight}>
                <TouchableOpacity
                  onPress={loadData}
                  style={styles.refreshIconBtn}
                >
                  <RefreshCw size={14} color={THEME.colors.secondary} />
                  <Text style={styles.refreshBtnText}>Refresh</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAutoRefreshSessions(!autoRefreshSessions)}
                  style={[
                    styles.autoRefreshBadge,
                    autoRefreshSessions && styles.autoRefreshBadgeActive,
                  ]}
                >
                  <Text style={styles.autoRefreshText}>
                    {autoRefreshSessions ? "Auto (10s)" : "Manual"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {sessions.length === 0 ? (
              <Card style={{ alignItems: "center", paddingVertical: 24 }}>
                <Text style={{ color: THEME.colors.textDim }}>
                  No active client sessions right now.
                </Text>
              </Card>
            ) : (
              sessions.map((s) => (
                <Card key={s.id} style={styles.sessionCard}>
                  {/* Session Header */}
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionHeaderLeft}>
                      <View style={styles.pulseDot} />
                      <Text style={styles.sessionToken}>
                        ID: {s.id.slice(0, 12)}...
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        handleAction(
                          () => killSession(s.id),
                          "Kill Session",
                          `Immediately terminate session for ${s.user || s.username || "client"}?`
                        )
                      }
                      style={styles.killBtn}
                    >
                      <Trash2 size={13} color={THEME.colors.danger} />
                      <Text style={styles.killText}>Kill</Text>
                    </TouchableOpacity>
                  </View>

                  {/* DISCORD USER / ID (Requested by user) */}
                  <View style={styles.sessionDiscordRow}>
                    <View style={styles.discordUserPill}>
                      <Text style={styles.discordUserLabel}>Discord:</Text>
                      <Text style={styles.discordUserName} selectable>
                        @{s.user || s.username || "Anonymous"}
                      </Text>
                    </View>
                  </View>

                  {/* License Key */}
                  <View style={styles.sessionDetailRow}>
                    <Text style={styles.sessionDetailLabel}>Key:</Text>
                    <Text style={styles.sessionDetailValue} selectable>
                      {s.key || s.license_key || "N/A"}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        copyToClipboard(s.key || s.license_key || "", `key-${s.id}`)
                      }
                      style={styles.miniCopyBtn}
                    >
                      <Copy size={12} color={THEME.colors.textDim} />
                    </TouchableOpacity>
                  </View>

                  {/* HWID */}
                  <View style={styles.sessionDetailRow}>
                    <Text style={styles.sessionDetailLabel}>HWID:</Text>
                    <Text style={styles.sessionDetailValue} selectable>
                      {s.hwid ? `${s.hwid.slice(0, 16)}...` : "None"}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(s.hwid, `hwid-${s.id}`)}
                      style={styles.miniCopyBtn}
                    >
                      <Copy size={12} color={THEME.colors.textDim} />
                    </TouchableOpacity>
                  </View>

                  {/* Timestamps */}
                  <View style={styles.sessionTimestamps}>
                    <Text style={styles.sessionTimeText}>
                      Created: {new Date(s.created_at).toLocaleTimeString()}
                    </Text>
                    <Text style={styles.sessionTimeText}>
                      Expires: {new Date(s.expires_at).toLocaleTimeString()}
                    </Text>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {/* ===================== ANNOUNCE TAB ===================== */}
        {activeTab === "announce" && (
          <View style={styles.announceContainer}>
            <Card style={styles.announceCard}>
              <View style={styles.announceHeader}>
                <View style={styles.announceIconWrapper}>
                  <Megaphone size={20} color={THEME.colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.announceTitle}>Discord Announcement</Text>
                  <Text style={styles.announceSubtitle}>
                    Post directly to #{announceChannelId}
                  </Text>
                </View>
              </View>

              {/* Channel ID */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.fieldLabel}>Channel ID</Text>
                <TextInput
                  style={styles.announceInput}
                  value={announceChannelId}
                  onChangeText={setAnnounceChannelId}
                  placeholder="1490803745389285530"
                  placeholderTextColor={THEME.colors.textDim}
                />
              </View>

              {/* Category selector */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.fieldLabel}>Announcement Type</Text>
                <View style={styles.announceTypeRow}>
                  {[
                    { id: "update", emoji: "🚀", label: "Update", color: "#57F287" },
                    { id: "info", emoji: "🔔", label: "Info", color: "#5865F2" },
                    { id: "warning", emoji: "⚠️", label: "Warning", color: "#FEE75C" },
                    { id: "important", emoji: "❗", label: "Important", color: "#ED4245" },
                    { id: "downtime", emoji: "🛠️", label: "Downtime", color: "#94A3B8" },
                  ].map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setAnnounceType(cat.id as any)}
                      style={[
                        styles.announceTypeChip,
                        announceType === cat.id && {
                          borderColor: cat.color,
                          backgroundColor: `${cat.color}22`,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 13 }}>{cat.emoji}</Text>
                      <Text
                        style={[
                          styles.announceTypeChipText,
                          announceType === cat.id && { color: "#FFF", fontWeight: "700" },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notification Ping */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.fieldLabel}>Mention Ping</Text>
                <View style={styles.pingRow}>
                  {(["@everyone", "@here", "none"] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setAnnouncePing(p)}
                      style={[
                        styles.pingChip,
                        announcePing === p && styles.pingChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pingChipText,
                          announcePing === p && styles.pingChipTextActive,
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Title */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.fieldLabel}>Headline Title</Text>
                <TextInput
                  style={styles.announceInput}
                  value={announceTitle}
                  onChangeText={setAnnounceTitle}
                  placeholder="e.g. System Update & Maintenance"
                  placeholderTextColor={THEME.colors.textDim}
                />
              </View>

              {/* Content */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.fieldLabel}>Message Content (Markdown)</Text>
                <TextInput
                  style={[styles.announceInput, styles.announceTextArea]}
                  value={announceContent}
                  onChangeText={setAnnounceContent}
                  placeholder="• Fixed expired keys auto-deletion&#10;• Added Discord bot management commands&#10;• Performance enhancements"
                  placeholderTextColor={THEME.colors.textDim}
                  multiline
                  numberOfLines={5}
                />
              </View>

              {/* Branding Toggle */}
              <TouchableOpacity
                onPress={() => setAnnounceShowBranding(!announceShowBranding)}
                style={styles.brandingRow}
              >
                <View style={styles.brandingCheckbox}>
                  {announceShowBranding && <Check size={14} color={THEME.colors.primary} />}
                </View>
                <Text style={styles.brandingText}>Show "whizARD" in embed footer</Text>
              </TouchableOpacity>

              {/* Send Button */}
              <Button
                title={announceSending ? "Sending to Discord..." : `Send to #${announceChannelId}`}
                onPress={handleSendAnnouncement}
                loading={announceSending}
                variant="primary"
                icon={<Megaphone size={16} color="#fff" />}
                style={{ marginTop: 18 }}
              />
            </Card>

            {/* Live Discord Embed Preview Card */}
            <View style={styles.previewCard}>
              <Text style={styles.previewHeader}>👁️ Discord Embed Preview</Text>
              <View
                style={[
                  styles.discordEmbed,
                  {
                    borderLeftColor:
                      announceType === "update"
                        ? "#57F287"
                        : announceType === "info"
                        ? "#5865F2"
                        : announceType === "warning"
                        ? "#FEE75C"
                        : announceType === "important"
                        ? "#ED4245"
                        : "#94A3B8",
                  },
                ]}
              >
                <View style={styles.discordAuthorRow}>
                  <Text
                    style={[
                      styles.discordAuthorText,
                      {
                        color:
                          announceType === "update"
                            ? "#57F287"
                            : announceType === "info"
                            ? "#5865F2"
                            : announceType === "warning"
                            ? "#FEE75C"
                            : announceType === "important"
                            ? "#ED4245"
                            : "#94A3B8",
                      },
                    ]}
                  >
                    {announceType === "update"
                      ? "🚀 UPDATE"
                      : announceType === "info"
                      ? "🔔 INFO"
                      : announceType === "warning"
                      ? "⚠️ WARNING"
                      : announceType === "important"
                      ? "❗ IMPORTANT"
                      : "🛠️ DOWNTIME"}
                  </Text>
                </View>

                {announcePing !== "none" && (
                  <Text style={styles.discordPing}>{announcePing}</Text>
                )}

                <Text style={styles.discordTitle}>
                  {announceTitle.trim() ? announceTitle : "Announcement Headline"}
                </Text>

                <Text style={styles.discordDesc}>
                  {announceContent.trim()
                    ? announceContent
                    : "Your formatted announcement content will appear here in Discord embed format."}
                </Text>

                <Text style={styles.discordFooter}>
                  {announceShowBranding ? `whizARD • ${new Date().toLocaleDateString()}` : new Date().toLocaleDateString()} • channel #{announceChannelId}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ===================== SERVER SETTINGS TAB ===================== */}
        {activeTab === "settings" && (
          <Card variant="glow">
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Server size={22} color={THEME.colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionHeader}>WhizAuth Server Settings</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Configure the WhizAuth backend API endpoint. Accessible only to authenticated admins.
            </Text>

            <Input
              label="Active API Endpoint"
              placeholder="https://api.whizard.dev"
              value={apiUrlInput}
              onChangeText={setApiUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Quick Server Switchers */}
            <Text style={styles.fieldLabel}>Quick Switch:</Text>
            <View style={styles.serverPresetsRow}>
              <TouchableOpacity
                onPress={() => {
                  setApiUrlInput("https://api.whizard.dev");
                  setApiUrl("https://api.whizard.dev");
                }}
                style={[
                  styles.serverPresetBtn,
                  apiUrlInput === "https://api.whizard.dev" &&
                    styles.serverPresetBtnActive,
                ]}
              >
                <Text style={styles.serverPresetText}>Production (api.whizard.dev)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setApiUrlInput("http://10.0.2.2:4000");
                  setApiUrl("http://10.0.2.2:4000");
                }}
                style={[
                  styles.serverPresetBtn,
                  apiUrlInput === "http://10.0.2.2:4000" &&
                    styles.serverPresetBtnActive,
                ]}
              >
                <Text style={styles.serverPresetText}>Local (10.0.2.2:4000)</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Save Server URL"
              onPress={handleSaveApiUrl}
              variant="secondary"
              icon={<Check size={16} color="#fff" />}
              style={{ marginTop: 12 }}
            />

            {/* Test Ping */}
            <Button
              title={pingLoading ? "Testing..." : "Test Connection / Ping"}
              onPress={handlePingServer}
              loading={pingLoading}
              variant="outline"
              icon={<Wifi size={16} color={THEME.colors.primary} />}
              style={{ marginTop: 10 }}
            />

            {pingStatus && (
              <View style={styles.pingResultBox}>
                <Text
                  style={[
                    styles.pingResultText,
                    pingStatus.includes("Connected")
                      ? { color: THEME.colors.success }
                      : { color: THEME.colors.danger },
                  ]}
                >
                  {pingStatus}
                </Text>
              </View>
            )}

            {/* Admin Logout */}
            <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: THEME.colors.border, paddingTop: 16 }}>
              <Button
                title="Log Out from Admin Panel"
                onPress={() => {
                  if (onLogout) onLogout();
                }}
                variant="danger"
                icon={<LogOut size={16} color="#fff" />}
              />
            </View>
          </Card>
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
    paddingBottom: 40,
  },
  tabBarWrapper: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  tabButtonActive: {
    backgroundColor: "rgba(168, 85, 247, 0.18)",
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  tabText: {
    color: THEME.colors.textDim,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  tabTextActive: {
    color: THEME.colors.text,
  },
  tabTextActiveSecondary: {
    color: THEME.colors.secondary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    marginBottom: THEME.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: THEME.colors.text,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
  },
  searchBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  searchBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 6,
    marginBottom: THEME.spacing.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  filterChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  filterChipText: {
    color: THEME.colors.textDim,
    fontSize: 11,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: "#fff",
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
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
    flex: 1,
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
    gap: 6,
    flexWrap: "wrap",
  },
  keyAppBadge: {
    backgroundColor: THEME.colors.primaryGlow,
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeActive: {
    backgroundColor: THEME.colors.successGlow,
    color: THEME.colors.success,
  },
  statusBadgeRevoked: {
    backgroundColor: THEME.colors.dangerGlow,
    color: THEME.colors.danger,
  },
  keyMetaText: {
    color: THEME.colors.textDim,
    fontSize: 11,
  },
  discordBadge: {
    backgroundColor: "rgba(88, 101, 242, 0.15)",
    borderColor: "rgba(88, 101, 242, 0.4)",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  discordBadgeText: {
    color: "#99aab5",
    fontSize: 11,
    fontWeight: "700",
  },
  hwidText: {
    color: THEME.colors.textDim,
    fontSize: 11,
    marginTop: 4,
  },
  keyActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 6,
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
    borderWidth: 1,
    borderColor: "transparent",
  },
  actionText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 3,
  },
  sectionHeader: {
    color: THEME.colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  sectionDesc: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  fieldLabel: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  presetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  presetBtnActive: {
    backgroundColor: THEME.colors.primaryGlow,
    borderColor: THEME.colors.primary,
  },
  presetBtnText: {
    color: THEME.colors.textDim,
    fontSize: 11,
    fontWeight: "700",
  },
  presetBtnTextActive: {
    color: THEME.colors.primary,
  },
  quickDurationRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: -4,
    marginBottom: 12,
  },
  quickDurationBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  quickDurationBtnActive: {
    backgroundColor: THEME.colors.secondaryGlow,
  },
  quickDurationText: {
    color: THEME.colors.textDim,
    fontSize: 11,
    fontWeight: "700",
  },
  quickDurationTextActive: {
    color: THEME.colors.secondary,
  },
  successKeyHeader: {
    color: THEME.colors.success,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  successKeyValue: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  scopeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  scopeBtnActive: {
    backgroundColor: THEME.colors.secondaryGlow,
    borderColor: THEME.colors.secondary,
  },
  scopeBtnText: {
    color: THEME.colors.textDim,
    fontSize: 12,
    fontWeight: "700",
  },
  scopeBtnTextActive: {
    color: THEME.colors.secondary,
  },
  unitRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  unitBtnActive: {
    backgroundColor: THEME.colors.primaryGlow,
    borderColor: THEME.colors.primary,
  },
  unitBtnText: {
    color: THEME.colors.textDim,
    fontSize: 11,
    fontWeight: "700",
  },
  unitBtnTextActive: {
    color: THEME.colors.primary,
  },
  sessionControlBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sessionCountTitle: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  sessionCountSub: {
    color: THEME.colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  sessionActionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  refreshIconBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(6, 182, 212, 0.1)",
    borderWidth: 1,
    borderColor: THEME.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  refreshBtnText: {
    color: THEME.colors.secondary,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },
  autoRefreshBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  autoRefreshBadgeActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  autoRefreshText: {
    color: THEME.colors.textDim,
    fontSize: 11,
    fontWeight: "600",
  },
  sessionCard: {
    marginBottom: 10,
    padding: 12,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sessionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.success,
    marginRight: 8,
  },
  sessionToken: {
    color: THEME.colors.text,
    fontWeight: "800",
    fontSize: 13,
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
    fontWeight: "800",
    marginLeft: 3,
  },
  sessionDiscordRow: {
    marginVertical: 4,
  },
  discordUserPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(88, 101, 242, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(88, 101, 242, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  discordUserLabel: {
    color: "#5865f2",
    fontWeight: "800",
    fontSize: 11,
    marginRight: 4,
  },
  discordUserName: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 12,
  },
  sessionDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  sessionDetailLabel: {
    color: THEME.colors.textDim,
    fontSize: 11,
    fontWeight: "600",
    width: 40,
  },
  sessionDetailValue: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontFamily: "monospace",
    flex: 1,
  },
  miniCopyBtn: {
    padding: 4,
  },
  sessionTimestamps: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  sessionTimeText: {
    color: THEME.colors.textDim,
    fontSize: 10,
  },
  serverPresetsRow: {
    flexDirection: "column",
    gap: 6,
    marginBottom: 12,
  },
  serverPresetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  serverPresetBtnActive: {
    backgroundColor: THEME.colors.primaryGlow,
    borderColor: THEME.colors.primary,
  },
  serverPresetText: {
    color: THEME.colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  pingResultBox: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  pingResultText: {
    fontSize: 12,
    fontWeight: "700",
  },
  announceContainer: {
    gap: 14,
  },
  announceCard: {
    padding: 16,
  },
  announceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  announceIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  announceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.text,
  },
  announceSubtitle: {
    fontSize: 12,
    color: THEME.colors.textDim,
    marginTop: 2,
  },
  announceInput: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    color: THEME.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  announceTextArea: {
    minHeight: 90,
    textAlignVertical: "top",
    fontFamily: "monospace",
    fontSize: 12,
  },
  announceTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  announceTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  announceTypeChipText: {
    fontSize: 11,
    color: THEME.colors.textDim,
    fontWeight: "600",
  },
  pingRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  pingChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  pingChipActive: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    borderColor: THEME.colors.primary,
  },
  pingChipText: {
    fontSize: 11,
    color: THEME.colors.textDim,
    fontWeight: "600",
  },
  pingChipTextActive: {
    color: THEME.colors.text,
    fontWeight: "700",
  },
  brandingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  brandingCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168, 85, 247, 0.1)",
  },
  brandingText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  previewCard: {
    marginTop: 4,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 14,
  },
  previewHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.colors.textDim,
    marginBottom: 10,
  },
  discordEmbed: {
    backgroundColor: "#2B2D31",
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 12,
    gap: 6,
  },
  discordAuthorRow: {
    marginBottom: 2,
  },
  discordAuthorText: {
    fontSize: 12,
    fontWeight: "700",
  },
  discordPing: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(88, 101, 242, 0.2)",
    color: "#c9cdfb",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discordTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  discordDesc: {
    fontSize: 12,
    color: "#dbdee1",
    lineHeight: 18,
  },
  discordFooter: {
    fontSize: 10,
    color: "#949ba4",
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    paddingTop: 6,
  },
});
