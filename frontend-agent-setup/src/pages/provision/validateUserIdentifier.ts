import type { UserType } from "../../services/provisioning";

// ASCII only (no `u` flag): full-width lookalike characters never match.
const userNumber = /^[uzc]\d{6}$/i;
const unfinishedUserNumber = /^[uzc]\d{0,6}$/i;
const gakwoNumber = /^gakwo\d{6}$/i;
const unfinishedGakwoNumber = /^(g|ga|gak|gakw|gakwo\d{0,6})$/i;

export const userIdentifierMessages = {
  missingNumber: "Enter the user's u, z or c number",
  missingGakwo: "Enter the user's GAKWO number",
  number: "User numbers must be u, z or c followed by six digits, for example u111111",
  gakwo: "GAKWO numbers must be GAKWO followed by six digits, for example GAKWO111111",
};

export type SanitisedUserIdentifier = { ok: true; value: string } | { ok: false; message: string };

/** NatureScot users are identified by a GAKWO number; every other user type by a u, z or c number. */
function isGakwoType(userType: UserType): boolean {
  return userType === "SNH";
}

/** The label, hint and "unavailable" explanation that match what the user type has to enter. */
export function userIdentifierCopy(userType: UserType): { label: string; hint: string; unavailable: string } {
  if (isGakwoType(userType)) {
    return {
      label: "Enter user's GAKWO number",
      hint: "Use the following format: GAKWO number, for example GAKWO111111",
      unavailable: "Enter a valid GAKWO number to continue",
    };
  }
  return {
    label: "Enter user's u/z/c number",
    hint: "Use the following format: U, Z or C number, for example u111111",
    unavailable: "Enter a valid u, z or c number to continue",
  };
}

/**
 * The only place the provisioning user identifier is cleaned and checked; submit only the `value` it
 * returns. It trims white space and otherwise rejects rather than changes. Letter case is kept.
 * A NatureScot user must give "GAKWO" and six digits; any other user type "u", "z" or "c" and six
 * digits. A convenience check only: the backend decides whether the user exists.
 */
export function sanitiseUserIdentifier(raw: string, userType: UserType): SanitisedUserIdentifier {
  const value = raw.trim();
  const gakwoType = isGakwoType(userType);
  if (!value) {
    return {
      ok: false,
      message: gakwoType ? userIdentifierMessages.missingGakwo : userIdentifierMessages.missingNumber,
    };
  }
  if (!(gakwoType ? gakwoNumber : userNumber).test(value)) {
    return { ok: false, message: gakwoType ? userIdentifierMessages.gakwo : userIdentifierMessages.number };
  }
  return { ok: true, value };
}

/** The error message for a value, or undefined when it is valid. */
export function validateUserIdentifier(raw: string, userType: UserType): string | undefined {
  const result = sanitiseUserIdentifier(raw, userType);
  return result.ok ? undefined : result.message;
}

/**
 * True when the value is wrong in a way that typing more cannot fix, so the error can be shown
 * while the operator is still typing. An unfinished number waits until they leave the field.
 */
export function isFinalError(raw: string, userType: UserType): boolean {
  const value = raw.trim();
  if (!value) {
    return false;
  }
  return !(isGakwoType(userType) ? unfinishedGakwoNumber : unfinishedUserNumber).test(value);
}
