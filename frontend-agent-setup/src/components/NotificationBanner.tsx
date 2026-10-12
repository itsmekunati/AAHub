import type { ReactNode } from "react";
import icons from "@scottish-government/design-system/dist/images/icons/icons.stack.svg";

interface NotificationBannerProps {
  children: ReactNode;
}

/** The Design System notification banner (success colour, information icon), shown above the page content. */
export function NotificationBanner({ children }: NotificationBannerProps) {
  return (
    <div className="ds_notification ds_notification--success">
      <div className="ds_wrapper">
        <div className="ds_notification__content">
          <span className="ds_notification__icon app_notification__icon--circle" aria-hidden="true">
            <svg className="ds_icon ds_icon--fill" aria-hidden="true" role="img" viewBox="0 0 24 24">
              <use href={`${icons}#priority_high`} />
            </svg>
          </span>
          <div className="ds_notification__text">
            <p>{children}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
