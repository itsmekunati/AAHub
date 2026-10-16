import { Navigate, Route, Routes } from "react-router";
import { useOperatorRole } from "./auth/OperatorRoleContext";
import { canProvision } from "./auth/permissions";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { NoPermissionPage } from "./pages/NoPermissionPage";
import { NotAvailablePage } from "./pages/NotAvailablePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProvisionLayout } from "./pages/provision/ProvisionLayout";
import { ResultPage } from "./pages/provision/ResultPage";
import { TicketPage } from "./pages/provision/TicketPage";
import { UserDetailsPage } from "./pages/provision/UserDetailsPage";
import { UserNumberPage } from "./pages/provision/UserNumberPage";
import { UserTypePage } from "./pages/provision/UserTypePage";
import { ChangeFailedPage } from "./pages/role-manager/ChangeFailedPage";
import { ReviewChangesPage } from "./pages/role-manager/ReviewChangesPage";
import { RoleManagerLayout } from "./pages/role-manager/RoleManagerLayout";
import { RoleUserDetailsPage } from "./pages/role-manager/RoleUserDetailsPage";
import { SelectGroupsPage } from "./pages/role-manager/SelectGroupsPage";
import { SubmittedPage } from "./pages/role-manager/SubmittedPage";

// Every provisioning address, so a viewer who opens one directly sees the permission page.
function ProvisionGuard() {
  return canProvision(useOperatorRole()) ? <ProvisionLayout /> : <NoPermissionPage />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="provision" element={<ProvisionGuard />}>
          <Route index element={<Navigate to="user-type" replace />} />
          <Route path="user-type" element={<UserTypePage />} />
          <Route path="user-number" element={<UserNumberPage />} />
          <Route path="user-details" element={<UserDetailsPage />} />
          <Route path="ticket" element={<TicketPage />} />
          <Route path="result" element={<ResultPage />} />
        </Route>
        <Route path="role-manager" element={<RoleManagerLayout />}>
          <Route index element={<Navigate to="user-details" replace />} />
          <Route path="user-details" element={<RoleUserDetailsPage />} />
          <Route path="select-groups" element={<SelectGroupsPage />} />
          <Route path="review-changes" element={<ReviewChangesPage />} />
          <Route path="submitted" element={<SubmittedPage />} />
          <Route path="change-failed" element={<ChangeFailedPage />} />
        </Route>
        <Route path="check-access" element={<NotAvailablePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
