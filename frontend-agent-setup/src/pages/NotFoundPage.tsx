import { Link } from "react-router";
import { Page } from "../components/Page";

export function NotFoundPage() {
  return (
    <Page title="Page not found">
      <p>If you typed the web address, check it is correct.</p>
      <p>
        <Link className="ds_link" to="/">
          Return to the start
        </Link>
      </p>
    </Page>
  );
}
