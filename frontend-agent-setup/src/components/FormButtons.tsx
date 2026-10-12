interface FormButtonsProps {
  submitLabel: string;
  onCancel: () => void;
  busy?: boolean;
  busyLabel?: string;
  /**
   * Shows the submit button as unavailable (aria-disabled) while it stays focusable and pressable,
   * so pressing it can still show the error summary. Never use the native `disabled` for this.
   */
  unavailable?: boolean;
  /** The id of the text that says why the button is unavailable. */
  unavailableHintId?: string;
}

export function FormButtons({ submitLabel, onCancel, busy = false, busyLabel, unavailable = false, unavailableHintId }: FormButtonsProps) {
  return (
    <div className="ds_button-group">
      <button type="button" className="ds_button ds_button--cancel" onClick={onCancel}>
        Cancel
      </button>
      <button
        type="submit"
        className="ds_button"
        disabled={busy}
        aria-disabled={unavailable && !busy ? true : undefined}
        aria-describedby={unavailable && !busy ? unavailableHintId : undefined}
      >
        {busy && busyLabel ? busyLabel : submitLabel}
      </button>
    </div>
  );
}
