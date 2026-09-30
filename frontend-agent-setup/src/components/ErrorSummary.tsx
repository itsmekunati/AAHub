import { useEffect, useRef, type MouseEvent } from "react";

export interface FormError {
  /** The id of the field the error belongs to. Omit for errors that are not about one field. */
  fieldId?: string;
  message: string;
}

interface ErrorSummaryProps {
  errors: FormError[];
}

function focusField(event: MouseEvent<HTMLAnchorElement>, fieldId: string) {
  const field = document.getElementById(fieldId);
  if (field) {
    event.preventDefault();
    field.focus();
    field.scrollIntoView?.({ block: "center" });
  }
}

export function ErrorSummary({ errors }: ErrorSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    summaryRef.current?.focus();
  }, [errors]);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      className="ds_error-summary"
      id="error-summary"
      aria-labelledby="error-summary-title"
      role="alert"
      tabIndex={-1}
      ref={summaryRef}
    >
      <h2 className="ds_error-summary__title" id="error-summary-title">
        There is a problem
      </h2>
      <ul className="ds_error-summary__list">
        {errors.map(({ fieldId, message }) => (
          <li key={`${fieldId ?? "form"}-${message}`}>
            {fieldId ? (
              <a href={`#${fieldId}`} onClick={(event) => focusField(event, fieldId)}>
                {message}
              </a>
            ) : (
              message
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
