import { getConfig } from "../config";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${getConfig().apiBaseUrl}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init.headers },
  });
}
