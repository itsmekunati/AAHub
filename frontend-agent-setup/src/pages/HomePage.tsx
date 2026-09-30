import { Link } from "react-router";
import { Page } from "../components/Page";
import { paths } from "./provision/options";

const tasks = [
  {
    title: "Provision user access",
    summary: "Create a request to give a user access.",
    to: paths.userType,
  },
  {
    title: "User role manager",
    summary: "Add or remove a user's roles.",
    to: "/role-manager",
  },
  {
    title: "Check a user's existing access",
    summary: "See what access a user already has.",
    to: "/check-access",
  },
];

export function HomePage() {
  return (
    <Page title="What do you want to do?">
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
