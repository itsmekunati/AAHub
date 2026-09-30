// Test helpers that walk the provisioning journey step by step, as an operator would.
import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

export const headings = {
  userType: "Select the user type",
  userNumber: "Enter the user number",
  confirmUser: "Check this is the right user",
  userDetails: "Check and complete the user details",
  ticket: "Add the JIRA ticket ID",
  success: "Access provisioning success",
  failed: "Access provisioning failed",
};

export const ticketLabel = "Enter the JIRA ticket ID associated with this request";

export function findHeading(name: string) {
  return screen.findByRole("heading", { level: 1, name });
}

export async function chooseUserType(user: UserEvent, label = "Government") {
  await user.click(screen.getByRole("radio", { name: label }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await findHeading(headings.userNumber);
}

export async function validateUserNumber(user: UserEvent, userNumber = "100001") {
  const input = screen.getByRole("textbox", { name: "User number" });
  await user.clear(input);
  await user.type(input, userNumber);
  await user.click(screen.getByRole("button", { name: "Validate" }));
  await findHeading(headings.confirmUser);
}

export async function confirmUser(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "Next" }));
  await findHeading(headings.userDetails);
}

export async function completeUserDetails(user: UserEvent, location = "Perth") {
  await screen.findByRole("option", { name: location });
  await user.selectOptions(screen.getByRole("combobox", { name: "Location" }), location);
  await user.click(screen.getByRole("button", { name: "Next" }));
  await findHeading(headings.ticket);
}

export async function walkToUserDetails(user: UserEvent, userType = "Government", userNumber = "100001") {
  await chooseUserType(user, userType);
  await validateUserNumber(user, userNumber);
  await confirmUser(user);
}

export async function walkToTicket(user: UserEvent) {
  await walkToUserDetails(user);
  await completeUserDetails(user);
}
