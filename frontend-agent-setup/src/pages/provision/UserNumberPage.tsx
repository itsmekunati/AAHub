import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { ErrorSummary, type FormError } from "../../components/ErrorSummary";
import { FormButtons } from "../../components/FormButtons";
import { Page } from "../../components/Page";
import { SummaryList } from "../../components/SummaryList";
import { TextInput } from "../../components/TextInput";
import { problemMessage } from "../../services/problemMessage";
import { lookUpUser } from "../../services/provisioning";
import { screenError, useCancelJourney, validationBlocked } from "./journeyAudit";
import { paths, userTypeLabel } from "./options";
import { useProvision } from "./ProvisionContext";

const fieldId = "user-number";

export function UserNumberPage() {
  const navigate = useNavigate();
  const { state, userValidated } = useProvision();
  const [userIdentifier, setUserIdentifier] = useState(state.userIdentifier);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [checking, setChecking] = useState(false);
  const cancel = useCancelJourney("user-identifier");

  if (!state.userType) {
    return <Navigate to={paths.userType} replace />;
  }
  const userType = state.userType;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checking) {
      return;
    }
    const trimmed = userIdentifier.trim();
    if (!trimmed) {
      setErrors([{ fieldId, message: "Enter a user identifier" }]);
      validationBlocked("user-identifier", [fieldId], userType);
      return;
    }
    setChecking(true);
    try {
      const result = await lookUpUser(userType, trimmed);
      if (!result.found) {
        setErrors([{ fieldId, message: "User not found. Check the user identifier and user type." }]);
        return;
      }
      userValidated(trimmed, result.user);
      void navigate(paths.confirmUser);
    } catch (error) {
      setErrors([{ message: problemMessage(error) }]);
      screenError("user-identifier", error, userType);
    } finally {
      setChecking(false);
    }
  }

  const fieldError = errors.find((error) => error.fieldId === fieldId)?.message;

  return (
    <Page title="Enter the user identifier" hasErrors={errors.length > 0}>
      <ErrorSummary errors={errors} />
      <SummaryList items={[{ key: "User type", value: userTypeLabel(userType) }]} />
      <form noValidate onSubmit={(event) => void handleSubmit(event)}>
        <TextInput
          id={fieldId}
          label="User identifier"
          value={userIdentifier}
          onChange={setUserIdentifier}
          error={fieldError}
          width="fixed-20"
        />
        <FormButtons
          submitLabel="Validate"
          busy={checking}
          busyLabel="Validating"
          onCancel={cancel}
        />
        <div className="visually-hidden" role="status">
          {checking ? "Checking the user identifier" : ""}
        </div>
      </form>
    </Page>
  );
}
