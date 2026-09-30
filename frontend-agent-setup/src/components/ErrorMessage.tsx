interface ErrorMessageProps {
  id: string;
  message: string;
}

export function ErrorMessage({ id, message }: ErrorMessageProps) {
  return (
    <p className="ds_question__error-message" id={id}>
      <span className="visually-hidden">Error:</span> {message}
    </p>
  );
}
