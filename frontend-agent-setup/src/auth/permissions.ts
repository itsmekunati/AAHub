import type { OperatorRole } from "./operator";

// What each operator role is shown. Visibility only: the backend enforces every permission.
// An editor can use every part of the service; a viewer can use User Role Manager and
// Check existing access, but not User provisioning.
export function canProvision(role: OperatorRole): boolean {
  return role === "editor";
}
