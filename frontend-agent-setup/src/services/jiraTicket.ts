// The JSM/Jira ticket rule for every transaction (decided): ITS- followed by six digits. The
// operator may type just the digits; the UI always sends ITS-123456. A convenience check only:
// the backend decides whether the ticket is valid.
export const TICKET_PREFIX = "ITS-";
export const TICKET_DIGITS = 6;

/** The words every journey uses to ask for the ticket, so they never drift apart. */
export const ticketCopy = {
  heading: "Enter the JSM ticket ID associated with this request",
  hint: "Enter just the numbers from the ITS ticket. This is required for audit purposes and is a mandatory field.",
  missing: "You must enter the associated JSM ticket ID in order to submit this page.",
  format: "Enter the 6 numbers from the ITS ticket, for example 123456",
  unavailable: "Enter the 6 numbers from the ITS ticket to continue",
};

export type ParsedTicket = { ok: true; ticketId: string } | { ok: false; reason: "missing" | "format" };

// ASCII digits only (no `u` flag), with an optional ITS- prefix in any letter case.
const ticketPattern = new RegExp(`^(?:${TICKET_PREFIX})?(\\d{${TICKET_DIGITS}})$`, "i");

const unfinishedPattern = new RegExp(`^(?:I|IT|ITS|(?:${TICKET_PREFIX})?\\d{0,${TICKET_DIGITS - 1}})$`, "i");

/**
 * True when the value is wrong in a way that typing more cannot fix (a letter that is not part of
 * ITS-, or too many digits), so the error can show while the operator types. An empty, unfinished
 * or valid value is not a final error: "too few digits" waits until they leave the field.
 */
export function isFinalTicketError(raw: string): boolean {
  const value = raw.trim();
  return !ticketPattern.test(value) && !unfinishedPattern.test(value);
}

/** Trims white space and otherwise rejects rather than changes the value. */
export function parseTicketNumber(raw: string): ParsedTicket {
  const value = raw.trim();
  if (!value) {
    return { ok: false, reason: "missing" };
  }
  const digits = ticketPattern.exec(value)?.[1];
  return digits ? { ok: true, ticketId: `${TICKET_PREFIX}${digits}` } : { ok: false, reason: "format" };
}
