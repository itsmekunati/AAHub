// Runtime settings. The same build runs in every environment; each environment serves its own
// config.json next to index.html (in OpenShift, from a ConfigMap). The file is public, so never
// put secrets in it.
export interface AppConfig {
  apiBaseUrl: string;
  environmentName: string;
}

let current: AppConfig | undefined;

function readSetting(value: unknown, key: keyof AppConfig): string {
  const setting = typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;
  if (typeof setting !== "string" || !setting.trim()) {
    throw new Error(`config.json is missing ${key}`);
  }
  return setting;
}

export async function loadConfig(): Promise<AppConfig> {
  const url = new URL(`${import.meta.env.BASE_URL}config.json`, window.location.origin);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`config.json could not be loaded (status ${response.status})`);
  }
  const body: unknown = await response.json();
  current = {
    apiBaseUrl: readSetting(body, "apiBaseUrl"),
    environmentName: readSetting(body, "environmentName"),
  };
  return current;
}

export function getConfig(): AppConfig {
  if (!current) {
    throw new Error("Configuration has not been loaded");
  }
  return current;
}
