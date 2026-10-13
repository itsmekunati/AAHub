import { ErrorMessage } from "./ErrorMessage";

export interface RadioOption<T extends string> {
  value: T;
  label: string;
}

interface RadioGroupProps<T extends string> {
  name: string;
  legend: string;
  options: readonly RadioOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  hint?: string;
  /** Keeps the legend for screen readers, but does not show it (e.g. when the page heading already asks the question). */
  hideLegend?: boolean;
  error?: string;
}

/** The first option's id is `${name}-${firstValue}`, so an error summary link can focus it. */
export function RadioGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  hint,
  hideLegend = false,
  error,
}: RadioGroupProps<T>) {
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const describedBy = [hint ? hintId : undefined, error ? errorId : undefined].filter(Boolean).join(" ");

  return (
    <div className={error ? "ds_question ds_question--error" : "ds_question"}>
      <fieldset aria-describedby={describedBy || undefined}>
        <legend className={hideLegend ? "visually-hidden" : undefined}>{legend}</legend>
        {hint && (
          <p className="ds_hint-text" id={hintId}>
            {hint}
          </p>
        )}
        {error && <ErrorMessage id={errorId} message={error} />}
        <div className="ds_field-group">
          {options.map((option) => {
            const id = `${name}-${option.value}`;
            return (
              <div className="ds_radio" key={option.value}>
                <input
                  className="ds_radio__input"
                  id={id}
                  name={name}
                  type="radio"
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                />
                <label className="ds_radio__label" htmlFor={id}>
                  {option.label}
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
