import type { RadioOption } from "../../components/RadioGroup";
import type { UserType } from "../../services/provisioning";

// User Provisioning is for internal users only. The user type is the operator's choice and does
// not decide internal or external (that applies only to User Role Management, decided by the backend).
export const userTypeOptions: readonly RadioOption<UserType>[] = [
  { value: "government", label: "Government" },
  { value: "forestry", label: "Forestry" },
  { value: "nature", label: "Nature" },
];

export function userTypeLabel(userType: UserType): string {
  return userTypeOptions.find((option) => option.value === userType)?.label ?? userType;
}

export const paths = {
  userType: "/provision/user-type",
  userNumber: "/provision/user-number",
  confirmUser: "/provision/confirm-user",
  userDetails: "/provision/user-details",
  ticket: "/provision/ticket",
  result: "/provision/result",
};
