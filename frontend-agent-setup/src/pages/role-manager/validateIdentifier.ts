import type { RoleUserType } from "../../services/roleManagement";

export const IDENTIFIER_MIN_LENGTH = 4;
export const IDENTIFIER_MAX_LENGTH = 20;
const X_NUMBER_LENGTH = 7;

// ASCII only (no `u` flag): control, invisible, accented and full-width lookalike characters never match.
const allowedCharacters = /^[A-Za-z0-9._-]+$/;
const notAllowedCharacter = /[^A-Za-z0-9._-]/;
const xNumber = /^x\d{6}$/i;

export const identifierMessages = {
  missingUsername: "Enter the username",
  missingXNumber: "Enter the x number",
  length: `Data entered must be between ${IDENTIFIER_MIN_LENGTH} and ${IDENTIFIER_MAX_LENGTH} characters`,
  xNumber: "x numbers must be in the format x111111",
  characters: "Usernames can only contain numbers, letters, full stops, underscores and hyphens",
};

export type SanitisedIdentifier = { ok: true; value: string } | { ok: false; message: string };

/** Public users are identified by a username they chose; every other user type by an x number. */
function isUsernameType(userType: RoleUserType): boolean {
  return userType === "public";
}

/** The label, hint and "unavailable" explanation that match what the user type has to enter. */
export function identifierCopy(userType: RoleUserType): { label: string; hint: string; unavailable: string } {
  if (isUsernameType(userType)) {
    return {
      label: "Enter the username",
      hint: `Use ${IDENTIFIER_MIN_LENGTH} to ${IDENTIFIER_MAX_LENGTH} letters, numbers, full stops, underscores or hyphens`,
      unavailable: "Enter a valid username to continue",
    };
  }
  return {
    label: "Enter the x number",
    hint: "Use the format x111111",
    unavailable: "Enter a valid x number to continue",
  };
}

/**
 * The only place the identifier is cleaned and checked; submit only the `value` it returns.
 * It trims white space (including non-breaking spaces) and otherwise rejects rather than changes:
 * anything outside the allowlist is reported, never stripped or normalised. Letter case is kept.
 * A public user must give a username of 4 to 20 characters; any other user type must give an x number
 * ("x" and six digits). A convenience check only: the backend decides whether the user exists.
 */
export function sanitiseIdentifier(raw: string, userType: RoleUserType): SanitisedIdentifier {
  const value = raw.trim();
  const usernameType = isUsernameType(userType);
  if (!value) {
    return { ok: false, message: usernameType ? identifierMessages.missingUsername : identifierMessages.missingXNumber };
  }
  if (usernameType && (value.length < IDENTIFIER_MIN_LENGTH || value.length > IDENTIFIER_MAX_LENGTH)) {
    return { ok: false, message: identifierMessages.length };
  }
  if (!allowedCharacters.test(value)) {
    return { ok: false, message: identifierMessages.characters };
  }
  if (!usernameType && !xNumber.test(value)) {
    return { ok: false, message: identifierMessages.xNumber };
  }
  return { ok: true, value };
}

/** The error message for a value, or undefined when it is valid. */
export function validateIdentifier(raw: string, userType: RoleUserType): string | undefined {
  const result = sanitiseIdentifier(raw, userType);
  return result.ok ? undefined : result.message;
}

/**
 * True when the value is wrong in a way that typing more cannot fix, so the error can be shown
 * while the operator is still typing. "Too short" and an unfinished x number wait until they leave the field.
 */
export function isFinalError(raw: string, userType: RoleUserType): boolean {
  const value = raw.trim();
  if (notAllowedCharacter.test(value)) {
    return true;
  }
  const longest = isUsernameType(userType) ? IDENTIFIER_MAX_LENGTH : X_NUMBER_LENGTH;
  return value.length > longest;
}
