import { Link, Navigate } from "react-router";
import { Page } from "../../components/Page";
import { paths } from "./options";
import { useProvision } from "./ProvisionContext";

export function ResultPage() {
  const { state } = useProvision();
  const { outcome } = state;

  if (!outcome) {
    return <Navigate to={paths.userType} replace />;
  }

  if (outcome.succeeded) {
    return (
      <Page title="Access provisioning success" ribbon="success">
        <p>
          Your reference is <strong>{outcome.requestId}</strong>
        </p>
        <p>
          <Link className="ds_link" to="/">
            Return to the start
          </Link>
        </p>
      </Page>
    );
  }

  return (
    <Page title="Access provisioning failed" ribbon="error">
      <p>{outcome.reason}</p>
      <ul className="ds_link-list">
        <li className="ds_link-item">
          <Link className="ds_link" to={paths.ticket}>
            Try again
          </Link>
        </li>
        <li className="ds_link-item">
          <Link className="ds_link" to="/">
            Return to the start
          </Link>
        </li>
      </ul>
    </Page>
  );
}
