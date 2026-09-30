import { Link } from "react-router";
import { Page } from "../components/Page";

export function NotAvailablePage() {
  return (
    <Page title="This part of the service is not available yet">
      <p>
        <Link className="ds_link" to="/">
          Return to the start
        </Link>
      </p>
    </Page>
  );
}
