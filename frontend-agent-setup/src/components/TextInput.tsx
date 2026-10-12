import { ErrorMessage } from "./ErrorMessage";

interface TextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  hint?: string;
  error?: string;
  type?: "text" | "email";
  width?: "fixed-10" | "fixed-20" | "fluid-three-quarters";
  /** Brings up the numeric keyboard on a phone, for a field that only takes digits. */
  inputMode?: "numeric";
}

export function TextInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  hint,
  error,
  type = "text",
  width,
  inputMode,
}: TextInputProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : undefined, error ? errorId : undefined].filter(Boolean).join(" ");
  const inputClasses = ["ds_input", width ? `ds_input--${width}` : undefined, error ? "ds_input--error" : undefined]
    .filter(Boolean)
    .join(" ");

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
      <input
        className={inputClasses}
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        value={value}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}
