export type OperatorRole = "admin" | "editor";

// TEMPORARY until Okta sign-in is built (open questions #1 and #2): every operator is shown
// as an editor. This is display only and decides nothing; the backend enforces every permission.
export function currentOperatorRole(): OperatorRole {
  return "editor";
}
