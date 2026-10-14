import { Link, useLocation } from "react-router";
import { tabSelected, type NavigationTab } from "../pages/provision/journeyAudit";

const sections: { label: string; to: string; prefix: string; tab: NavigationTab }[] = [
  { label: "User provisioning", to: "/provision/user-type", prefix: "/provision", tab: "provisioning" },
  { label: "User Role Manager", to: "/role-manager", prefix: "/role-manager", tab: "role-management" },
  { label: "Check existing access to RP&S", to: "/check-access", prefix: "/check-access", tab: "check-access" },
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
                    onClick={() => tabSelected(section.tab)}
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
