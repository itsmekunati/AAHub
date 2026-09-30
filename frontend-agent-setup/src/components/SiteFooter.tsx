import oglLogo from "../assets/ogl.svg";
import govScotLogo from "../assets/scottish-government--min.svg";

// Public gov.scot policy pages. A service-specific accessibility statement may be needed later.
const siteItems = [
  { label: "Privacy", href: "https://www.gov.scot/privacy/" },
  { label: "Accessibility statement", href: "https://www.gov.scot/accessibility/" },
  { label: "Cookies", href: "https://www.gov.scot/cookies/" },
];

const openGovernmentLicence = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";

export function SiteFooter() {
  return (
    <footer className="ds_site-footer">
      <div className="ds_wrapper">
        <div className="ds_site-footer__content">
          <ul className="ds_site-footer__site-items">
            {siteItems.map((item) => (
              <li className="ds_site-items__item" key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
          <div className="ds_site-footer__copyright">
            <span className="ds_site-footer__copyright-logo">
              <img src={oglLogo} alt="Open Government Licence" width="41" height="17" loading="lazy" />
            </span>
            <p>
              All content is available under the <a href={openGovernmentLicence}>Open Government Licence v3.0</a>,
              except for graphic assets and where otherwise stated
            </p>
            <p>&copy; Crown Copyright</p>
          </div>
          <div className="ds_site-footer__org">
            <a className="ds_site-footer__org-link" title="The Scottish Government" href="https://www.gov.scot/">
              <img
                loading="lazy"
                width="300"
                height="57"
                className="ds_site-footer__org-logo"
                src={govScotLogo}
                alt="gov.scot"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
