import { Link, Navigate } from "react-router";
import { Page } from "../../components/Page";
import { getConfig } from "../../config";
import { paths } from "./options";
import { useRoleManager } from "./RoleManagerContext";

/** The backend could not apply the change: the failure ribbon, the details and what to do next. */
export function ChangeFailedPage() {
  const { state } = useRoleManager();
  const { failed, userIdentifier } = state;

  if (!failed) {
    return <Navigate to={paths.userDetails} replace />;
  }

  return (
    <Page title="Change failure" ribbon="error">
      <div className="app_failure-details">
        <h2>User role manager failure details</h2>
        <p>
          LDAP groups for user <strong>{userIdentifier}</strong> in the <strong>{getConfig().environmentName}</strong>{" "}
          environment have not been updated.
        </p>
        <p>Please update any corresponding JSM tickets and escalate to the relevant team.</p>
      </div>
      <p>
        <Link className="ds_link" to="/">
          Go to Home Page
        </Link>
      </p>
    </Page>
  );
}
