import type { RoleUserType } from "../../services/roleManagement";

// The operator's choice only. Whether a user is internal or external is decided by the backend.
export const roleUserTypeOptions: readonly { value: RoleUserType; label: string }[] = [
  { value: "scottish-government", label: "Scottish Government" },
  { value: "nature-scot", label: "NatureScot" },
  { value: "scottish-forestry", label: "Scottish Forestry" },
  { value: "public", label: "Public" },
];

export const paths = {
  userDetails: "/role-manager/user-details",
  selectGroups: "/role-manager/select-groups",
  reviewChanges: "/role-manager/review-changes",
  submitted: "/role-manager/submitted",
  changeFailed: "/role-manager/change-failed",
};
