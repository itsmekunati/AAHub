// Test helpers that walk the provisioning journey step by step, as an operator would.
import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

export const headings = {
  userType: "Select the user type",
  userIdentifier: "Enter the user identifier",
  confirmUser: "Check this is the right user",
  userDetails: "Check and complete the user details",
  ticket: "Add the JSM/Jira ticket ID",
  success: "Access provisioning success",
  failed: "Access provisioning failed",
};

export const ticketLabel = "Enter the JSM/Jira ticket ID associated with this request";

export function findHeading(name: string) {
  return screen.findByRole("heading", { level: 1, name });
}

export async function chooseUserType(user: UserEvent, label = "Government") {
  await user.click(screen.getByRole("radio", { name: label }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await findHeading(headings.userIdentifier);
}

export async function validateUserNumber(user: UserEvent, userIdentifier = "U100001") {
  const input = screen.getByRole("textbox", { name: "User identifier" });
  await user.clear(input);
  await user.type(input, userIdentifier);
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

export async function walkToUserDetails(user: UserEvent, userType = "Government", userIdentifier = "U100001") {
  await chooseUserType(user, userType);
  await validateUserNumber(user, userIdentifier);
  await confirmUser(user);
}

export async function walkToTicket(user: UserEvent) {
  await walkToUserDetails(user);
  await completeUserDetails(user);
}
