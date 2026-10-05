import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { ErrorSummary, type FormError } from "../../components/ErrorSummary";
import { FormButtons } from "../../components/FormButtons";
import { Page } from "../../components/Page";
import { RadioGroup } from "../../components/RadioGroup";
import type { UserType } from "../../services/provisioning";
import { paths, userTypeOptions } from "./options";
import { useProvision } from "./ProvisionContext";

export function UserTypePage() {
  const navigate = useNavigate();
  const { state, chooseUserType } = useProvision();
  const [selected, setSelected] = useState<UserType | undefined>(state.userType);
  const [errors, setErrors] = useState<FormError[]>([]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      setErrors([{ fieldId: `user-type-${userTypeOptions[0]?.value ?? ""}`, message: "Select a user type" }]);
      return;
    }
    chooseUserType(selected);
    void navigate(paths.userIdentifier);
  }

  return (
    <Page title="Select the user type" hasErrors={errors.length > 0}>
      <ErrorSummary errors={errors} />
      <form noValidate onSubmit={handleSubmit}>
        <RadioGroup
          name="user-type"
          legend="User type"
          options={userTypeOptions}
          value={selected}
          onChange={setSelected}
          error={errors[0]?.message}
        />
        <FormButtons submitLabel="Next" onCancel={() => void navigate("/")} />
      </form>
    </Page>
  );
}
