import { Navigate, Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { NotAvailablePage } from "./pages/NotAvailablePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ConfirmUserPage } from "./pages/provision/ConfirmUserPage";
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

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="provision" element={<ProvisionLayout />}>
          <Route index element={<Navigate to="user-type" replace />} />
          <Route path="user-type" element={<UserTypePage />} />
          <Route path="user-number" element={<UserNumberPage />} />
          <Route path="confirm-user" element={<ConfirmUserPage />} />
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
