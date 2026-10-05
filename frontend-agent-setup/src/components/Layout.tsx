import { Link, Outlet } from "react-router";
import scottishGovernmentLogo from "../assets/scottish-government.svg";
import { currentOperatorRole } from "../auth/operator";
import { serviceName } from "./Page";
import { SiteFooter } from "./SiteFooter";
import { SiteNavigation } from "./SiteNavigation";

export function Layout() {
  return (
    <div className="ds_page">
      <div className="ds_page__top">
        <div className="ds_skip-links">
          <ul className="ds_skip-links__list">
            <li className="ds_skip-links__item">
              <a className="ds_skip-links__link" href="#main-content">
                Skip to main content
              </a>
            </li>
          </ul>
        </div>
        <header className="ds_site-header">
          <div className="ds_wrapper">
            <div className="ds_site-header__content">
              <div className="ds_site-branding">
                <Link className="ds_site-branding__logo ds_site-branding__link" to="/">
                  <img
                    width="210"
                    height="40"
                    className="ds_site-branding__logo-image"
                    src={scottishGovernmentLogo}
                    alt="The Scottish Government"
                  />
                </Link>
                <div className="ds_site-branding__title">{serviceName}</div>
              </div>
              <p className="app_site-header__role">
                <span className="visually-hidden">Signed in role:</span>{" "}
                <strong className="ds_tag">{currentOperatorRole().toUpperCase()}</strong>
              </p>
            </div>
          </div>
          <SiteNavigation />
        </header>
      </div>
      <div className="ds_page__middle">
        <div className="ds_wrapper">
          <main id="main-content">
            <Outlet />
          </main>
        </div>
      </div>
      <div className="ds_page__bottom">
        <SiteFooter />
      </div>
    </div>
  );
}
