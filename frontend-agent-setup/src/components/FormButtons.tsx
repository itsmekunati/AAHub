interface FormButtonsProps {
  submitLabel: string;
  onCancel: () => void;
  busy?: boolean;
  busyLabel?: string;
}

export function FormButtons({ submitLabel, onCancel, busy = false, busyLabel }: FormButtonsProps) {
  return (
    <div className="ds_button-group">
      <button type="button" className="ds_button ds_button--cancel" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className="ds_button" disabled={busy}>
        {busy && busyLabel ? busyLabel : submitLabel}
      </button>
    </div>
  );
}
