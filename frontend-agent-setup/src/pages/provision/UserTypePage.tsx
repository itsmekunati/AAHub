import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { ErrorSummary, type FormError } from "../../components/ErrorSummary";
import { FormButtons } from "../../components/FormButtons";
import { Page } from "../../components/Page";
import { RadioGroup } from "../../components/RadioGroup";
import type { UserType } from "../../services/provisioning";
import { useCancelJourney, validationBlocked } from "./journeyAudit";
import { paths, userTypeOptions } from "./options";
import { useProvision } from "./ProvisionContext";

const unavailableHintId = "user-type-unavailable";

export function UserTypePage() {
  const navigate = useNavigate();
  const { state, chooseUserType } = useProvision();
  const [selected, setSelected] = useState<UserType | undefined>(state.userType);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const cancel = useCancelJourney("user-type");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted) {
      return;
    }
    if (!selected) {
      setErrors([{ fieldId: `user-type-${userTypeOptions[0]?.value ?? ""}`, message: "Select a user type" }]);
      validationBlocked("user-type", ["user-type"]);
      return;
    }
    setSubmitted(true);
    chooseUserType(selected);
    void navigate(paths.userIdentifier);
  }

  return (
    <Page title="Select the user type" titleSize="h2" hasErrors={errors.length > 0}>
      <ErrorSummary errors={errors} />
      <form noValidate onSubmit={handleSubmit}>
        <RadioGroup
          name="user-type"
          legend="User type"
          hideLegend
          hint="You will be able to select environment after selecting user type"
          options={userTypeOptions}
          value={selected}
          onChange={setSelected}
          error={errors[0]?.message}
        />
        <FormButtons
          submitLabel="Next"
          busy={submitted}
          unavailable={!selected}
          unavailableHintId={unavailableHintId}
          onCancel={cancel}
        />
        <p className="visually-hidden" id={unavailableHintId}>
          Select a user type to continue
        </p>
      </form>
    </Page>
  );
}
