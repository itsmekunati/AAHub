import { Link, useLocation } from "react-router";

const sections = [
  { label: "User provisioning", to: "/provision/user-type", prefix: "/provision" },
  { label: "User Role Manager", to: "/role-manager", prefix: "/role-manager" },
  { label: "Check existing access to RP&S", to: "/check-access", prefix: "/check-access" },
];

export function SiteNavigation() {
  const { pathname } = useLocation();

  return (
    <div className="ds_site-header__navigation">
      <div className="ds_wrapper">
        <nav className="ds_site-navigation">
          <ul className="ds_site-navigation__list">
            {sections.map((section) => {
              const current = pathname.startsWith(section.prefix);
              return (
                <li className="ds_site-navigation__item" key={section.to}>
                  <Link
                    to={section.to}
                    className={current ? "ds_site-navigation__link ds_current" : "ds_site-navigation__link"}
                    aria-current={current ? "page" : undefined}
                  >
                    <span className="label-nav">{section.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
