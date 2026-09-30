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
  error?: string;
}

/** The first option's id is `${name}-${firstValue}`, so an error summary link can focus it. */
export function RadioGroup<T extends string>({ name, legend, options, value, onChange, error }: RadioGroupProps<T>) {
  const errorId = `${name}-error`;

  return (
    <div className={error ? "ds_question ds_question--error" : "ds_question"}>
      <fieldset aria-describedby={error ? errorId : undefined}>
        <legend>{legend}</legend>
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
