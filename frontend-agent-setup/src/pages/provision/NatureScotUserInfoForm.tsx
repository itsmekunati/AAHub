import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { ErrorSummary, type FormError } from "../../components/ErrorSummary";
import { FormButtons } from "../../components/FormButtons";
import { Page } from "../../components/Page";
import { TextInput } from "../../components/TextInput";
import { getConfig } from "../../config";
import { problemMessage } from "../../services/problemMessage";
import { checkExistingUser } from "../../services/provisioning";
import { screenError, useCancelJourney, validationBlocked } from "./journeyAudit";
import { isFinalCsvError, parseNatureScotCsv, validateNatureScotCsv } from "./natureScotCsv";
import { paths } from "./options";
import { useProvision } from "./ProvisionContext";
import { SelectedUserType } from "./SelectedUserType";

const fieldId = "user-information";
const unavailableHintId = "user-information-unavailable";

/**
 * NatureScot's user identifier step (from the design): the operator pastes the user's details as one
 * CSV line instead of looking them up, and the backend says whether the user already exists.
 */
export function NatureScotUserInfoForm() {
  const navigate = useNavigate();
  const { state, natureScotUserEntered } = useProvision();
  const [pasted, setPasted] = useState(state.pastedUserInformation ?? "");
  // Errors that typing more cannot fix show at once; the rest wait until the field is left or submitted.
  const [touched, setTouched] = useState(false);
  // An "already exists" answer from the backend, shown until the value is changed.
  const [serverFieldError, setServerFieldError] = useState<string>();
  // The summary changes only on submit, so it never takes focus while the operator types.
  const [summary, setSummary] = useState<FormError[]>([]);
  const [checking, setChecking] = useState(false);
  const cancel = useCancelJourney("user-identifier");

  const problem = validateNatureScotCsv(pasted);
  const fieldError = serverFieldError ?? (touched || isFinalCsvError(pasted) ? problem : undefined);

  function handleChange(value: string) {
    setPasted(value);
    setServerFieldError(undefined);
    if (!validateNatureScotCsv(value)) {
      setSummary((current) => (current.length === 0 ? current : []));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checking) {
      return;
    }
    setTouched(true);
    // Only what the parser returns is ever sent or kept.
    const parsed = parseNatureScotCsv(pasted);
    if (!parsed.ok) {
      setSummary([{ fieldId, message: parsed.message }]);
      validationBlocked("user-identifier", [fieldId], "SNH");
      return;
    }
    setChecking(true);
    try {
      const existing = await checkExistingUser("SNH", parsed.user.userIdentifier, parsed.user.email);
      if (existing.exists) {
        const message = `The user already exists in ${getConfig().environmentName}, x number is ${existing.userXNumber}`;
        setServerFieldError(message);
        setSummary([{ fieldId, message }]);
        return;
      }
      natureScotUserEntered(pasted, parsed.user, parsed.managerXNumber, parsed.location);
      void navigate(paths.userDetails);
    } catch (error) {
      setSummary([{ message: problemMessage(error) }]);
      screenError("user-identifier", error, "SNH");
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      <SelectedUserType userType="SNH" />
      <Page title="Enter NatureScot user information" titleSize="h2" hasErrors={summary.length > 0}>
        <ErrorSummary errors={summary} />
        <form noValidate onSubmit={(event) => void handleSubmit(event)}>
          <TextInput
            id={fieldId}
            label="NatureScot user information"
            hideLabel
            hint="Paste in the user information in csv format"
            value={pasted}
            onChange={handleChange}
            onBlur={() => setTouched(true)}
            error={fieldError}
          />
          <FormButtons
            submitLabel="Next"
            busy={checking}
            busyLabel="Checking"
            unavailable={Boolean(problem)}
            unavailableHintId={unavailableHintId}
            onCancel={cancel}
          />
          <p className="visually-hidden" id={unavailableHintId}>
            Paste in valid NatureScot user information to continue
          </p>
          <div className="visually-hidden" role="status">
            {checking ? "Checking whether the user already exists" : ""}
          </div>
        </form>
      </Page>
    </>
  );
}
