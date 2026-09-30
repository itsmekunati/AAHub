import { ErrorMessage } from "./ErrorMessage";

interface SelectProps {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function Select({ id, label, value, options, placeholder, onChange, error, disabled = false }: SelectProps) {
  const errorId = `${id}-error`;

  return (
    <div className={error ? "ds_question ds_question--error" : "ds_question"}>
      <label className="ds_label" htmlFor={id}>
        {label}
      </label>
      {error && <ErrorMessage id={errorId} message={error} />}
      <div className="ds_select-wrapper">
        <select
          className={error ? "ds_select ds_select--error" : "ds_select"}
          id={id}
          name={id}
          value={value}
          disabled={disabled}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="ds_select-arrow" aria-hidden="true" />
      </div>
    </div>
  );
}
