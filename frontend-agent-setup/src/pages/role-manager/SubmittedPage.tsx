import { Link, Navigate } from "react-router";
import { Page } from "../../components/Page";
import { SummaryList } from "../../components/SummaryList";
import { getConfig } from "../../config";
import { paths } from "./options";
import { useRoleManager } from "./RoleManagerContext";

/** The change has been applied: the success ribbon, what to do next, and the references. */
export function SubmittedPage() {
  const { state } = useRoleManager();
  const { submitted, userIdentifier } = state;

  if (!submitted) {
    return <Navigate to={paths.userDetails} replace />;
  }

  return (
    <Page title="Change success" ribbon="success">
      <p>
        LDAP groups for user <strong>{userIdentifier}</strong> in the <strong>{getConfig().environmentName}</strong>{" "}
        environment have been updated successfully.
      </p>
      <p>Please validate the changes with the user, then update any corresponding JSM tickets.</p>
      <SummaryList
        label="Request reference"
        items={[
          { key: "Transaction ID", value: submitted.transactionId },
          { key: "JSM ticket ID", value: submitted.ticketId },
        ]}
      />
      <p>
        <Link className="ds_link" to="/">
          Go to Home Page
        </Link>
      </p>
    </Page>
  );
}
