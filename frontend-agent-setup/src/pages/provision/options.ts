import type { RadioOption } from "../../components/RadioGroup";
import type { UserType } from "../../services/provisioning";

// User Provisioning is for internal users only. The user type is the operator's choice and does
// not decide internal or external (that applies only to User Role Management, decided by the backend).
export const userTypeOptions: readonly RadioOption<UserType>[] = [
  { value: "SG", label: "Scottish Government" },
  { value: "FGS", label: "Scottish Forestry" },
  { value: "SNH", label: "NatureScot" },
];

export function userTypeLabel(userType: UserType): string {
  return userTypeOptions.find((option) => option.value === userType)?.label ?? userType;
}

export const paths = {
  userType: "/provision/user-type",
  userIdentifier: "/provision/user-number",
  userDetails: "/provision/user-details",
  ticket: "/provision/ticket",
  result: "/provision/result",
};
