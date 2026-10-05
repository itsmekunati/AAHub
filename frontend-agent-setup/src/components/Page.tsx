import { useEffect, useRef, type ReactNode } from "react";

export const serviceName = "Application Access Hub";

const ribbonClasses = {
  success: "ds_notification ds_notification--success",
  error: "ds_notification app_notification--error",
};

interface PageProps {
  title: string;
  hasErrors?: boolean;
  /** Keeps the h1 for screen readers and the browser title, but does not show it. */
  hideTitle?: boolean;
  /** Shows the heading inside a green (success) or red (error) notification ribbon. */
  ribbon?: keyof typeof ribbonClasses;
  children: ReactNode;
}

/** Sets the browser title, renders the page's only h1, and moves focus to it when the page opens. */
export function Page({ title, hasErrors = false, hideTitle = false, ribbon, children }: PageProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = `${hasErrors ? "Error: " : ""}${title} - ${serviceName}`;
  }, [title, hasErrors]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [title]);

  const heading = (
    <h1 className={hideTitle ? "visually-hidden" : "ds_page-header__title"} tabIndex={-1} ref={headingRef}>
      {title}
    </h1>
  );

  return (
    <div className="ds_layout ds_layout--article">
      <div className="ds_layout__header">
        {ribbon ? (
          <div className={ribbonClasses[ribbon]}>
            <div className="ds_wrapper">
              <div className="ds_notification__content">
                <div className="ds_notification__text">{heading}</div>
              </div>
            </div>
          </div>
        ) : (
          <header className="ds_page-header">{heading}</header>
        )}
      </div>
      <div className="ds_layout__content">{children}</div>
    </div>
  );
}
