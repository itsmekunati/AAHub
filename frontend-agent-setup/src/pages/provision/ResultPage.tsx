import { Link, Navigate } from "react-router";
import { Page } from "../../components/Page";
import { getConfig } from "../../config";
import { paths } from "./options";
import { useProvision } from "./ProvisionContext";

function HomeLink() {
  return (
    <p>
      <Link className="ds_link" to="/">
        Go to Home Page
      </Link>
    </p>
  );
}

/** The outcome of the request: the ribbon, who it was for, and what to do next. */
export function ResultPage() {
  const { state } = useProvision();
  const { result } = state;

  if (!result) {
    return <Navigate to={paths.userType} replace />;
  }
  const { outcome, userTypeLabel, fullName } = result;
  const { environmentName } = getConfig();

  if (outcome.succeeded) {
    return (
      <Page title="Access provisioning success" ribbon="success" layout="full-width">
        <p>
          The <strong>{userTypeLabel}</strong> user <strong>{fullName}</strong> in the{" "}
          <strong>{environmentName}</strong> environment has been provisioned successfully.
        </p>
        {outcome.userXNumber && (
          <p>
            User&apos;s x number for {environmentName} environment is {outcome.userXNumber}.
          </p>
        )}
        <p>Please update any corresponding JSM tickets.</p>
        <HomeLink />
      </Page>
    );
  }

  return (
    <Page title="Access provisioning failed" ribbon="error" layout="full-width">
      <div className="app_failure-details">
        <h2>Provisioning failure details</h2>
        <p>
          The <strong>{userTypeLabel}</strong> user <strong>{fullName}</strong> in the{" "}
          <strong>{environmentName}</strong> environment has not been provisioned.
        </p>
        <p>Provisioning failure details: {outcome.reason}</p>
        <p>Please update any corresponding JSM tickets and escalate to the relevant team.</p>
      </div>
      <HomeLink />
    </Page>
  );
}
