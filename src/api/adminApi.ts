import { getApiClient } from "./client";

export interface KeyItemData {
  id: string;
  plain_key: string;
  app_id: string;
  hwid: string | null;
  used_by: string | null;
  revoked: boolean;
  expires_at: string;
  created_at: string;
  generated_by: string | null;
}

export interface SessionItemData {
  id: string;
  session_token: string;
  hwid: string;
  app_key_id: string;
  user?: string;
  username?: string;
  key?: string;
  license_key?: string;
  created_at: string;
  expires_at: string;
  last_seen_at: string;
  killed: boolean;
}

export async function fetchAllKeys(search?: string, appId?: string) {
  const client = getApiClient();
  const resp = await client.get("/api/admin/keys", {
    params: { search, appId, limit: 100 }
  });
  return resp.data;
}

export async function createKey(params: {
  type: "APP" | "MODEL";
  durationSeconds: number;
  appId?: string;
  pattern?: string;
  usedBy?: string;
  modelId?: string;
}) {
  const client = getApiClient();
  const resp = await client.post("/api/admin/key/create", params);
  return resp.data;
}

export async function resetKeyHwid(keyOrId: string, kind: "APP" | "MODEL" = "APP") {
  const client = getApiClient();
  const resp = await client.post("/api/admin/key/hwid-reset", { id: keyOrId, kind });
  return resp.data;
}

export async function pauseKey(keyOrId: string, kind: "APP" | "MODEL" = "APP") {
  const client = getApiClient();
  const resp = await client.post("/api/admin/key/pause", { id: keyOrId, kind });
  return resp.data;
}

export async function unpauseKey(keyOrId: string, kind: "APP" | "MODEL" = "APP") {
  const client = getApiClient();
  const resp = await client.post("/api/admin/key/unpause", { id: keyOrId, kind });
  return resp.data;
}

export async function banKey(keyOrId: string, kind: "APP" | "MODEL" = "APP") {
  const client = getApiClient();
  const resp = await client.post("/api/admin/key/ban", { id: keyOrId, kind });
  return resp.data;
}

export async function deleteKey(keyOrId: string, kind: "APP" | "MODEL" = "APP") {
  const client = getApiClient();
  const resp = await client.post("/api/admin/key/delete", { id: keyOrId, kind });
  return resp.data;
}

export async function extendKeyTime(params: {
  scope: "SINGLE" | "ALL_APP_KEYS" | "ALL_MODEL_KEYS";
  kind?: "APP" | "MODEL";
  amount: number;
  unit: "HOUR" | "DAY" | "WEEK" | "MONTH";
  target?: string;
}) {
  const client = getApiClient();
  const resp = await client.post("/api/admin/key/add-time", params);
  return resp.data;
}

export async function extendAllKeysByAppId(params: {
  appId: string;
  amount: number;
  unit: "HOUR" | "DAY" | "WEEK" | "MONTH";
}) {
  const client = getApiClient();
  const resp = await client.post("/api/admin/key/extend-all", params);
  return resp.data;
}

export async function fetchActiveSessions() {
  const client = getApiClient();
  const resp = await client.get("/api/admin/sessions");
  return resp.data;
}

export async function killSession(sessionId: string, reason: string = "Admin Terminated") {
  const client = getApiClient();
  const resp = await client.post("/api/admin/session/kill", { sessionId, reason });
  return resp.data;
}

export async function cleanupExpiredKeys() {
  const client = getApiClient();
  const resp = await client.post("/api/admin/keys/cleanup-expired", {});
  return resp.data;
}

export async function sendDiscordAnnouncement(params: {
  title: string;
  content: string;
  type?: "update" | "info" | "warning" | "important" | "downtime";
  ping?: "@everyone" | "@here" | "none";
  channelId?: string;
  botToken?: string;
  webhookUrl?: string;
  showBranding?: boolean;
}) {
  const client = getApiClient();
  const resp = await client.post("/api/admin/announcement", params);
  return resp.data;
}

export async function getAnnouncementSettings() {
  const client = getApiClient();
  const resp = await client.get("/api/admin/announcement/settings");
  return resp.data;
}
