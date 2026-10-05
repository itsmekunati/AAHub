// Runtime settings. The same build runs in every environment; each environment serves its own
// config.json next to index.html (in OpenShift, from a ConfigMap). The file is public, so never
// put secrets in it.
export interface OtherInstanceLink {
  label: string;
  url: string;
}

export interface AppConfig {
  apiBaseUrl: string;
  /** The name of this instance, e.g. "Local development". */
  environmentName: string;
  /** The environments this instance provisions and manages users in. */
  managedEnvironments: string[];
  /** Optional link to the instance that manages the other environments. */
  otherInstance?: OtherInstanceLink;
}

let current: AppConfig | undefined;

function read(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;
}

function readString(value: unknown, key: string, name = key): string {
  const setting = read(value, key);
  if (typeof setting !== "string" || !setting.trim()) {
    throw new Error(`config.json is missing ${name}`);
  }
  return setting;
}

function readStringList(value: unknown, key: string): string[] {
  const setting = read(value, key);
  if (!Array.isArray(setting) || setting.length === 0 || !setting.every((item) => typeof item === "string" && item.trim())) {
    throw new Error(`config.json is missing ${key}`);
  }
  return setting;
}

function readOtherInstance(value: unknown): OtherInstanceLink | undefined {
  const setting = read(value, "otherInstance");
  if (setting === undefined) {
    return undefined;
  }
  const label = readString(setting, "label", "otherInstance.label");
  const url = readString(setting, "url", "otherInstance.url");
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("config.json has an otherInstance.url that is not an http(s) address");
  }
  return { label, url };
}

export async function loadConfig(): Promise<AppConfig> {
  const url = new URL(`${import.meta.env.BASE_URL}config.json`, window.location.origin);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`config.json could not be loaded (status ${response.status})`);
  }
  const body: unknown = await response.json();
  const otherInstance = readOtherInstance(body);
  current = {
    apiBaseUrl: readString(body, "apiBaseUrl"),
    environmentName: readString(body, "environmentName"),
    managedEnvironments: readStringList(body, "managedEnvironments"),
    ...(otherInstance ? { otherInstance } : {}),
  };
  return current;
}

export function getConfig(): AppConfig {
  if (!current) {
    throw new Error("Configuration has not been loaded");
  }
  return current;
}
