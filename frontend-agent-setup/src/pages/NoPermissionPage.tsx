import { Link } from "react-router";
import { Page } from "../components/Page";

export function NoPermissionPage() {
  return (
    <Page title="You do not have permission to use this part of the service">
      <p>
        <Link className="ds_link" to="/">
          Return to the start
        </Link>
      </p>
    </Page>
  );
}
