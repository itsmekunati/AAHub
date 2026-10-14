import { Link } from "react-router";
import { BackLink } from "../../components/BackLink";
import type { UserType } from "../../services/provisioning";
import { paths, userTypeLabel } from "./options";

/** Above the user identifier step's heading: Previous, then the chosen user type with a Change link. */
export function SelectedUserType({ userType }: { userType: UserType }) {
  return (
    <>
      <BackLink to={paths.userType} label="Previous" />
      <p>
        <strong>Selected user type:</strong>
      </p>
      <p>{userTypeLabel(userType)}</p>
      <p>
        <Link className="ds_link" to={paths.userType}>
          Change <span className="visually-hidden">user type</span>
        </Link>
      </p>
    </>
  );
}
