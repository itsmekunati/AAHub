/** Sent as the manager's x number when the operator leaves the field blank. */
export const DUMMY_MANAGER_X_NUMBER = "dummy";

export const managerXNumberMessage = "Manager's x number must be x followed by six digits, for example x111111";

// ASCII only (no `u` flag): full-width lookalike characters never match.
const xNumber = /^x\d{6}$/i;
const unfinishedXNumber = /^x\d{0,6}$/i;

export type SanitisedManagerXNumber = { ok: true; value: string } | { ok: false; message: string };

/**
 * The only place the manager's x number is cleaned and checked. The field is optional: a blank value
 * is valid and comes back as "". Otherwise it must be "x" and six digits; letter case is kept.
 * A convenience check only: the backend decides whether the manager exists.
 */
export function sanitiseManagerXNumber(raw: string): SanitisedManagerXNumber {
  const value = raw.trim();
  if (value && !xNumber.test(value)) {
    return { ok: false, message: managerXNumberMessage };
  }
  return { ok: true, value };
}

/** The error message for a value, or undefined when it is valid or blank. */
export function validateManagerXNumber(raw: string): string | undefined {
  const result = sanitiseManagerXNumber(raw);
  return result.ok ? undefined : result.message;
}

/**
 * True when the value is wrong in a way that typing more cannot fix, so the error can be shown
 * while the operator is still typing. An unfinished x number waits until they leave the field.
 */
export function isFinalManagerError(raw: string): boolean {
  const value = raw.trim();
  return value !== "" && !unfinishedXNumber.test(value);
}
