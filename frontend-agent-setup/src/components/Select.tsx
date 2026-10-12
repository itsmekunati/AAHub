import { ErrorMessage } from "./ErrorMessage";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  /** An empty first option, e.g. "Select a location". Omit when a value is always chosen. */
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export function Select({ id, label, value, options, onChange, placeholder, hint, error, disabled = false }: SelectProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : undefined, error ? errorId : undefined].filter(Boolean).join(" ");

  return (
    <div className={error ? "ds_question ds_question--error" : "ds_question"}>
      <label className="ds_label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <p className="ds_hint-text" id={hintId}>
          {hint}
        </p>
      )}
      {error && <ErrorMessage id={errorId} message={error} />}
      <div className="ds_select-wrapper">
        <select
          className={error ? "ds_select ds_select--error" : "ds_select"}
          id={id}
          name={id}
          value={value}
          disabled={disabled}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="ds_select-arrow" aria-hidden="true" />
      </div>
    </div>
  );
}
