// Test helpers that walk the User Role Manager journey step by step, as an operator would.
import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { paths } from "./options";
import { identifierCopy } from "./validateIdentifier";

export const start = paths.userDetails;

export const headings = {
  userDetails: "Provide the user details",
  selectGroups: "Review and select LDAP groups",
  reviewChanges: "Review your selection before submitting",
};

// The default user type is Scottish Government, which is identified by an x number.
const defaultCopy = identifierCopy("SG");
const publicCopy = identifierCopy("public");

export const identifierLabel = defaultCopy.label;
export const identifierHint = defaultCopy.hint;
export const publicIdentifierLabel = publicCopy.label;
export const publicIdentifierHint = publicCopy.hint;
export const submitLabel = "Get user's existing LDAP group memberships";
export const unavailableHint = defaultCopy.unavailable;

export function findHeading(name: string) {
  return screen.findByRole("heading", { level: 1, name });
}

/** The identifier field, whichever user type is selected: its label changes with the type. */
export function identifierField() {
  return screen.getByRole("textbox", { name: new RegExp(`^(${identifierLabel}|${publicIdentifierLabel})$`) });
}

export async function submitIdentifier(user: UserEvent, identifier: string, userType?: string) {
  if (userType) {
    await user.selectOptions(screen.getByRole("combobox", { name: "User type" }), userType);
  }
  await user.clear(identifierField());
  if (identifier) {
    await user.type(identifierField(), identifier);
  }
  await user.click(screen.getByRole("button", { name: submitLabel }));
}

export const reviewLabel = "Review";
export const reviewUnavailableHint = "Change a group selection to continue";

/** Looks the user up and lands on "Review and select LDAP groups". */
export async function walkToSelectGroups(user: UserEvent, identifier = "x123456", userType?: string) {
  await findHeading(headings.userDetails);
  await submitIdentifier(user, identifier, userType);
  await findHeading(headings.selectGroups);
}
