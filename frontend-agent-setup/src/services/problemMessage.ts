import { ApiError } from "./apiClient";

/** Maps any failed API call to a plain-English message. Never shows server text to the user. */
export function problemMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) {
    return "You do not have permission to do this. Contact your administrator if you think this is wrong.";
  }
  if (error instanceof ApiError && error.status === 401) {
    return "Your session has ended. Sign in again to continue.";
  }
  return "Sorry, there is a problem with the service. Try again later.";
}
