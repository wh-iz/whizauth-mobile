import { getApiClient } from "./client";

export interface CustomerKeyData {
  appKeyId: string;
  discordUsername: string;
  expiresAt: string;
  appId: string;
  hwidResetUsed: boolean;
}

export async function loginCustomerPanel(productKey: string, discordUsername: string) {
  const client = getApiClient();
  const resp = await client.post("/api/auth/panel-login", {
    productKey,
    discordUsername,
  });
  return resp.data;
}

export async function resetCustomerHwid(productKey: string, discordUsername: string) {
  const client = getApiClient();
  const resp = await client.post("/api/auth/hwid-reset", {
    productKey,
    discordUsername,
  });
  return resp.data;
}

export async function getPublicStats() {
  const client = getApiClient();
  try {
    const [visitors, vouches] = await Promise.all([
      client.get("/api/stats/visitors").catch(() => ({ data: { count: 0 } })),
      client.get("/api/stats/vouches").catch(() => ({ data: { vouches: [] } }))
    ]);
    return {
      visitors: visitors.data?.count || 0,
      vouches: vouches.data?.vouches || []
    };
  } catch {
    return { visitors: 0, vouches: [] };
  }
}
