import type { DirectoryUser } from "../../services/provisioning";
import { sanitiseManagerXNumber } from "./managerXNumber";
import { sanitiseUserIdentifier } from "./validateUserIdentifier";

// The operator pastes one line, from the design: first name, last name, email address, GAKWO number,
// manager's x number (may be blank), a value that is not used, job title, location. A trailing comma
// is allowed. Values cannot contain commas: there is no quoting.
const columnCount = 8;

// A convenience check only (something@something.something); the backend decides what is valid.
const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const natureScotCsvMessages = {
  missing: "Paste in the user information",
  columns:
    "Paste in 8 values separated by commas: first name, last name, email address, GAKWO number, manager's x number, an unused value, job title and location",
  firstName: "Enter the user's first name as the 1st value",
  surname: "Enter the user's last name as the 2nd value",
  email: "Enter the user's email address as the 3rd value, in the correct format, like name@example.com",
  userIdentifier: "The 4th value must be GAKWO followed by six digits, for example GAKWO111111",
  managerXNumber: "The 5th value must be the manager's x number, for example x111111, or be left blank",
  jobTitle: "Enter the user's job title as the 7th value",
  location: "Enter the user's location as the 8th value",
};

export type ParsedNatureScotCsv =
  | { ok: true; user: DirectoryUser; managerXNumber: string; location: string }
  | { ok: false; message: string };

function cells(raw: string): string[] {
  return raw.split(",").map((cell) => cell.trim());
}

/** Eight values, or nine when the ninth is empty (a trailing comma). */
function hasRightColumns(values: string[]): boolean {
  return values.length === columnCount || (values.length === columnCount + 1 && values[columnCount] === "");
}

/**
 * The only place the pasted NatureScot user information is read and checked; use only what it
 * returns. Values are trimmed and otherwise kept as pasted. A convenience check only: the backend
 * decides whether the details are valid.
 */
export function parseNatureScotCsv(raw: string): ParsedNatureScotCsv {
  if (!raw.trim()) {
    return { ok: false, message: natureScotCsvMessages.missing };
  }
  const values = cells(raw);
  if (!hasRightColumns(values)) {
    return { ok: false, message: natureScotCsvMessages.columns };
  }
  const [firstName = "", surname = "", email = "", gakwo = "", manager = "", , jobTitle = "", location = ""] = values;
  const userIdentifier = sanitiseUserIdentifier(gakwo, "SNH");
  const managerXNumber = sanitiseManagerXNumber(manager);
  // In column order, so the first problem reported is the first one in the line.
  const checks: [boolean, string][] = [
    [Boolean(firstName), natureScotCsvMessages.firstName],
    [Boolean(surname), natureScotCsvMessages.surname],
    [emailFormat.test(email), natureScotCsvMessages.email],
    [userIdentifier.ok, natureScotCsvMessages.userIdentifier],
    [managerXNumber.ok, natureScotCsvMessages.managerXNumber],
    [Boolean(jobTitle), natureScotCsvMessages.jobTitle],
    [Boolean(location), natureScotCsvMessages.location],
  ];
  const problem = checks.find(([passed]) => !passed);
  if (problem || !userIdentifier.ok || !managerXNumber.ok) {
    return { ok: false, message: problem?.[1] ?? natureScotCsvMessages.columns };
  }
  return {
    ok: true,
    // The manager's x number from the paste is the operator's, like the one typed on the review step.
    user: { userIdentifier: userIdentifier.value, firstName, surname, email, managerXNumber: "", jobTitle },
    managerXNumber: managerXNumber.value,
    location,
  };
}

/** The error message for a value, or undefined when it is valid. */
export function validateNatureScotCsv(raw: string): string | undefined {
  const parsed = parseNatureScotCsv(raw);
  return parsed.ok ? undefined : parsed.message;
}

/**
 * True when typing more cannot fix the value (too many values), so the error can be shown while
 * the operator is still typing. Anything else waits until they leave the field or press Next.
 */
export function isFinalCsvError(raw: string): boolean {
  const values = cells(raw);
  return values.length > columnCount + 1 || (values.length === columnCount + 1 && values[columnCount] !== "");
}
