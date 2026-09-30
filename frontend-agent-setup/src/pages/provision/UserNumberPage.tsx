import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { ErrorSummary, type FormError } from "../../components/ErrorSummary";
import { FormButtons } from "../../components/FormButtons";
import { Page } from "../../components/Page";
import { SummaryList } from "../../components/SummaryList";
import { TextInput } from "../../components/TextInput";
import { problemMessage } from "../../services/problemMessage";
import { lookUpUser } from "../../services/provisioning";
import { paths, userTypeLabel } from "./options";
import { useProvision } from "./ProvisionContext";

const fieldId = "user-number";

export function UserNumberPage() {
  const navigate = useNavigate();
  const { state, userValidated } = useProvision();
  const [userNumber, setUserNumber] = useState(state.userNumber);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [checking, setChecking] = useState(false);

  if (!state.userType) {
    return <Navigate to={paths.userType} replace />;
  }
  const userType = state.userType;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checking) {
      return;
    }
    const trimmed = userNumber.trim();
    if (!trimmed) {
      setErrors([{ fieldId, message: "Enter a user number" }]);
      return;
    }
    setChecking(true);
    try {
      const result = await lookUpUser(userType, trimmed);
      if (!result.found) {
        setErrors([{ fieldId, message: "User not found. Check the user number and user type." }]);
        return;
      }
      userValidated(trimmed, result.user);
      void navigate(paths.confirmUser);
    } catch (error) {
      setErrors([{ message: problemMessage(error) }]);
    } finally {
      setChecking(false);
    }
  }

  const fieldError = errors.find((error) => error.fieldId === fieldId)?.message;

  return (
    <Page title="Enter the user number" hasErrors={errors.length > 0}>
      <ErrorSummary errors={errors} />
      <SummaryList items={[{ key: "User type", value: userTypeLabel(userType) }]} />
      <form noValidate onSubmit={(event) => void handleSubmit(event)}>
        <TextInput
          id={fieldId}
          label="User number"
          value={userNumber}
          onChange={setUserNumber}
          error={fieldError}
          width="fixed-20"
        />
        <FormButtons
          submitLabel="Validate"
          busy={checking}
          busyLabel="Validating"
          onCancel={() => void navigate("/")}
        />
        <div className="visually-hidden" role="status">
          {checking ? "Checking the user number" : ""}
        </div>
      </form>
    </Page>
  );
}
