import { Link } from "react-router";
import { Page } from "../components/Page";
import { getConfig } from "../config";
import { paths } from "./provision/options";

const tasks = [
  {
    title: "Provision user access to RP&S",
    summary: "Provision a new user with access to RP&S",
    to: paths.userType,
  },
  {
    title: "User Role Manager",
    summary: "Manage an existing user's LDAP group membership",
    to: "/role-manager",
  },
  {
    title: "Check user's existing RP&S access",
    summary: "Check a user's existing RP&S access using u/z number or email address",
    to: "/check-access",
  },
];

export function HomePage() {
  const { environmentName, managedEnvironments, otherInstance } = getConfig();

  return (
    <Page title="What do you want to do?">
      <div className="ds_inset-text">
        <div className="ds_inset-text__text">
          <p>
            You are viewing the <strong>{environmentName}</strong> instance of Application Access Hub which allows
            you to provision and manage users in the following environments only: {managedEnvironments.join(", ")}.
          </p>
          {otherInstance && (
            <p>
              <a className="ds_link" href={otherInstance.url}>
                {otherInstance.label}
              </a>
            </p>
          )}
        </div>
      </div>
      <ul className="ds_category-list">
        {tasks.map((task) => (
          <li className="ds_category-item" key={task.to}>
            <h2 className="ds_category-item__title">
              <Link className="ds_category-item__link" to={task.to}>
                {task.title}
              </Link>
            </h2>
            <p className="ds_category-item__summary">{task.summary}</p>
          </li>
        ))}
      </ul>
    </Page>
  );
}
