import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { ErrorSummary, type FormError } from "../../components/ErrorSummary";
import { FormButtons } from "../../components/FormButtons";
import { Page } from "../../components/Page";
import { TextInput } from "../../components/TextInput";
import { problemMessage } from "../../services/problemMessage";
import { lookUpUser } from "../../services/provisioning";
import { screenError, useCancelJourney, validationBlocked } from "./journeyAudit";
import { NatureScotUserInfoForm } from "./NatureScotUserInfoForm";
import { paths } from "./options";
import { useProvision } from "./ProvisionContext";
import { SelectedUserType } from "./SelectedUserType";
import {
  isFinalError,
  sanitiseUserIdentifier,
  userIdentifierCopy,
  validateUserIdentifier,
} from "./validateUserIdentifier";

const fieldId = "user-number";
const unavailableHintId = "user-number-unavailable";
const notFoundMessage = "User not found. Check the user number and user type.";

export function UserNumberPage() {
  const navigate = useNavigate();
  const { state, userValidated } = useProvision();
  const [userIdentifier, setUserIdentifier] = useState(state.userIdentifier);
  // Errors that typing more cannot fix show at once; the rest wait until the field is left or submitted.
  const [touched, setTouched] = useState(false);
  // A "not found" answer from the backend, shown until the value is changed.
  const [serverFieldError, setServerFieldError] = useState<string>();
  // The summary changes only on submit, so it never takes focus while the operator types.
  const [summary, setSummary] = useState<FormError[]>([]);
  const [checking, setChecking] = useState(false);
  const cancel = useCancelJourney("user-identifier");

  if (!state.userType) {
    return <Navigate to={paths.userType} replace />;
  }
  if (state.userType === "SNH") {
    return <NatureScotUserInfoForm />;
  }
  const userType = state.userType;
  const copy = userIdentifierCopy(userType);
  const problem = validateUserIdentifier(userIdentifier, userType);
  const fieldError = serverFieldError ?? (touched || isFinalError(userIdentifier, userType) ? problem : undefined);

  function handleIdentifierChange(value: string) {
    setUserIdentifier(value);
    setServerFieldError(undefined);
    if (!validateUserIdentifier(value, userType)) {
      setSummary((current) => (current.length === 0 ? current : []));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checking) {
      return;
    }
    setTouched(true);
    // Only the sanitised value is ever sent or kept, never what was typed.
    const identifier = sanitiseUserIdentifier(userIdentifier, userType);
    if (!identifier.ok) {
      setSummary([{ fieldId, message: identifier.message }]);
      validationBlocked("user-identifier", [fieldId], userType);
      return;
    }
    setChecking(true);
    try {
      const result = await lookUpUser(userType, identifier.value);
      if (!result.found) {
        setServerFieldError(notFoundMessage);
        setSummary([{ fieldId, message: notFoundMessage }]);
        return;
      }
      userValidated(identifier.value, result.user);
      void navigate(paths.userDetails);
    } catch (error) {
      setSummary([{ message: problemMessage(error) }]);
      screenError("user-identifier", error, userType);
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      <SelectedUserType userType={userType} />
      <Page title="Provide the user details" titleSize="h2" hasErrors={summary.length > 0}>
        <ErrorSummary errors={summary} />
        <form noValidate onSubmit={(event) => void handleSubmit(event)}>
          <TextInput
            id={fieldId}
            label={copy.label}
            hint={copy.hint}
            value={userIdentifier}
            onChange={handleIdentifierChange}
            onBlur={() => setTouched(true)}
            error={fieldError}
            width="fixed-20"
          />
          <FormButtons
            submitLabel="Validate user details"
            busy={checking}
            busyLabel="Validating"
            unavailable={Boolean(problem)}
            unavailableHintId={unavailableHintId}
            onCancel={cancel}
          />
          <p className="visually-hidden" id={unavailableHintId}>
            {copy.unavailable}
          </p>
          <div className="visually-hidden" role="status">
            {checking ? "Checking the user number" : ""}
          </div>
        </form>
      </Page>
    </>
  );
}
