// src/auth/AuthClient.ts: the only auth API the rest of the UI may use.
export type OperatorRole = "admin" | "editor" | "viewer"; // VERIFY: the roles this project defines

export interface Operator {
  username: string;
  displayName: string;
  roles: readonly OperatorRole[];
}

export interface AuthClient {
  init(): Promise<void>;
  isAuthenticated(): boolean;
  currentOperator(): Operator | null;
  hasRole(role: OperatorRole): boolean;
  login(): Promise<void>;
  logout(): Promise<void>;
  /** Returns a valid access token, refreshing if needed. Never store or log it. */
  getToken(): Promise<string>;
  onSessionEnd(listener: () => void): () => void;
}
