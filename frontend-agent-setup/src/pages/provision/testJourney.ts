// Test helpers that walk the provisioning journey step by step, as an operator would.
import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

export const headings = {
  userType: "Select the user type",
  userIdentifier: "Provide the user details",
  // NatureScot's version of the user identifier step: the operator pastes the user's details.
  natureScotInformation: "Enter NatureScot user information",
  userDetails: "Review your selection before submitting",
  // The details step and the ticket step share one heading; tell them apart by their fields.
  ticket: "Review your selection before submitting",
  success: "Access provisioning success",
  failed: "Access provisioning failed",
};

export const ticketLabel = "Enter the JSM ticket ID associated with this request";
export const locationPlaceholder = "Select location from dropdown";

export function findHeading(name: string) {
  return screen.findByRole("heading", { level: 1, name });
}

export async function chooseUserType(user: UserEvent, label = "Scottish Government") {
  await user.click(screen.getByRole("radio", { name: label }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await findHeading(label === "NatureScot" ? headings.natureScotInformation : headings.userIdentifier);
}

/** Scottish Government and Scottish Forestry users are identified by a u, z or c number. */
export function userNumberField() {
  return screen.getByRole("textbox", { name: "Enter user's u/z/c number" });
}

export async function validateUserNumber(user: UserEvent, userIdentifier = "U100001") {
  const input = userNumberField();
  await user.clear(input);
  await user.type(input, userIdentifier);
  await user.click(screen.getByRole("button", { name: "Validate user details" }));
  await findHeading(headings.userDetails);
}

export function natureScotField() {
  return screen.getByRole("textbox", { name: "NatureScot user information" });
}

interface NatureScotRow {
  firstName: string;
  surname: string;
  email: string;
  userIdentifier: string;
  managerXNumber: string;
  jobTitle: string;
  location: string;
}

/** A pasted line in the design's format, with fake values. Only what a test cares about needs changing. */
export function natureScotCsv(changes: Partial<NatureScotRow> = {}): string {
  const row: NatureScotRow = {
    firstName: "Jo",
    surname: "Test",
    email: "jo.test@example.test",
    userIdentifier: "GAKWO300003",
    managerXNumber: "x722222",
    jobTitle: "Ecologist",
    location: "Battleby",
    ...changes,
  };
  return `${row.firstName}, ${row.surname}, ${row.email}, ${row.userIdentifier}, ${row.managerXNumber}, , ${row.jobTitle}, ${row.location},`;
}

/** Pastes the line, as an operator would, without pressing Next. */
export async function pasteInto(user: UserEvent, csv: string) {
  await user.clear(natureScotField());
  await user.click(natureScotField());
  await user.paste(csv);
}

export async function pasteNatureScotInformation(user: UserEvent, csv = natureScotCsv()) {
  await pasteInto(user, csv);
  await user.click(screen.getByRole("button", { name: "Next" }));
  await findHeading(headings.userDetails);
}

export async function completeUserDetails(user: UserEvent, location = "Perth") {
  await screen.findByRole("option", { name: location });
  await user.selectOptions(screen.getByRole("combobox", { name: "Location" }), location);
  await user.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByRole("textbox", { name: ticketLabel });
}

export async function walkToUserDetails(user: UserEvent, userType = "Scottish Government", userIdentifier = "U100001") {
  await chooseUserType(user, userType);
  if (userType === "NatureScot") {
    await pasteNatureScotInformation(user, natureScotCsv({ userIdentifier }));
  } else {
    await validateUserNumber(user, userIdentifier);
  }
}

export async function walkToTicket(user: UserEvent) {
  await walkToUserDetails(user);
  await completeUserDetails(user);
}
