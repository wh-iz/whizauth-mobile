import axios from "axios";

export const DEFAULT_API_URL = "https://api.whizard.dev";

export let currentApiUrl = DEFAULT_API_URL;
export let currentAdminToken = "";

export function setApiUrl(url: string) {
  currentApiUrl = url.replace(/\/+$/, "");
}

export function setAdminToken(token: string) {
  currentAdminToken = token;
}

export function getApiClient() {
  const instance = axios.create({
    baseURL: currentApiUrl,
    timeout: 12000,
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": currentAdminToken,
    },
  });
  return instance;
}
