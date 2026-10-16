export type OperatorRole = "editor" | "viewer";

// TEMPORARY until Okta sign-in is built (open question #1): every operator is shown
// as an editor. This is display only and decides nothing; the backend enforces every permission.
export function currentOperatorRole(): OperatorRole {
  return "editor";
}
