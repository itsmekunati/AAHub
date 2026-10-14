import { ErrorMessage } from "./ErrorMessage";

export interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxGroupProps {
  /** Used for the hint and error ids. Each checkbox's id is `${idPrefix}-${value}`. */
  idPrefix: string;
  name: string;
  legend: string;
  options: readonly CheckboxOption[];
  selected: ReadonlySet<string>;
  onToggle: (value: string) => void;
  hint?: string;
  /** A rule the operator should know about, shown in bold. It is replaced by `error` when broken. */
  note?: string;
  error?: string;
}

export function CheckboxGroup({
  idPrefix,
  name,
  legend,
  options,
  selected,
  onToggle,
  hint,
  note,
  error,
}: CheckboxGroupProps) {
  const hintId = `${idPrefix}-hint`;
  const noteId = `${idPrefix}-note`;
  const errorId = `${idPrefix}-error`;
  const showNote = Boolean(note) && !error;
  const describedBy = [hint ? hintId : undefined, showNote ? noteId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={error ? "ds_question ds_question--error" : "ds_question"}>
      <fieldset aria-describedby={describedBy || undefined}>
        <legend>{legend}</legend>
        {hint && (
          <p className="ds_hint-text" id={hintId}>
            {hint}
          </p>
        )}
        {showNote && (
          <p className="ds_hint-text" id={noteId}>
            <strong>{note}</strong>
          </p>
        )}
        {error && <ErrorMessage id={errorId} message={error} />}
        <div className="ds_checkboxes ds_field-group">
          {options.map((option) => {
            const id = `${idPrefix}-${option.value}`;
            return (
              <div className="ds_checkbox" key={option.value}>
                <input
                  className="ds_checkbox__input"
                  id={id}
                  name={name}
                  type="checkbox"
                  value={option.value}
                  checked={selected.has(option.value)}
                  onChange={() => onToggle(option.value)}
                />
                <label className="ds_checkbox__label" htmlFor={id}>
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
