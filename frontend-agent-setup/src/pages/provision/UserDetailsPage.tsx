import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { BackLink } from "../../components/BackLink";
import { ErrorSummary, type FormError } from "../../components/ErrorSummary";
import { FormButtons } from "../../components/FormButtons";
import { Page } from "../../components/Page";
import { Select } from "../../components/Select";
import { SummaryList } from "../../components/SummaryList";
import { TextInput } from "../../components/TextInput";
import { useCancelJourney, validationBlocked } from "./journeyAudit";
import { isFinalManagerError, sanitiseManagerXNumber, validateManagerXNumber } from "./managerXNumber";
import { paths } from "./options";
import { useProvision } from "./ProvisionContext";
import { useLocations } from "./useLocations";
import { requestSummary, userDetailsSummary } from "./userSummary";
import { locationFieldId, managerFieldId, missingFieldNames, validateDetails } from "./validateDetails";

const unavailableHintId = "user-details-unavailable";
const locationsFailedMessage = "Sorry, the list of locations could not be loaded. Try again later.";

export function UserDetailsPage() {
  const navigate = useNavigate();
  const { state, detailsCompleted } = useProvision();
  const locations = useLocations(state.userType);
  const [managerXNumber, setManagerXNumber] = useState(state.managerXNumber ?? "");
  const [location, setLocation] = useState(state.location ?? "");
  // Errors that typing more cannot fix show at once; the rest wait until the field is left or submitted.
  const [managerTouched, setManagerTouched] = useState(false);
  // The summary changes only on submit, so it never takes focus while the operator types.
  const [formErrors, setFormErrors] = useState<FormError[]>([]);
  const cancel = useCancelJourney("user-details");

  const errors = useMemo(
    () => (locations.status === "failed" ? [{ message: locationsFailedMessage }, ...formErrors] : formErrors),
    [locations.status, formErrors],
  );

  const { user, userType } = state;
  if (!user || !userType) {
    return <Navigate to={paths.userType} replace />;
  }

  const managerProblem = validateManagerXNumber(managerXNumber);
  const managerError = managerTouched || isFinalManagerError(managerXNumber) ? managerProblem : undefined;
  const locationError = location ? undefined : formErrors.find((error) => error.fieldId === locationFieldId)?.message;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      return;
    }
    setManagerTouched(true);
    const found = validateDetails(user, location, managerXNumber);
    setFormErrors(found);
    // Only the sanitised manager's x number is kept, never what was typed.
    const manager = sanitiseManagerXNumber(managerXNumber);
    if (found.length === 0 && manager.ok) {
      detailsCompleted(manager.value, location);
      void navigate(paths.ticket);
    } else {
      validationBlocked("user-details", missingFieldNames(user, location, managerXNumber), userType);
    }
  }

  return (
    <>
      <BackLink to={paths.userIdentifier} label="Previous" />
      <Page title="Review your selection before submitting" titleSize="h2" hasErrors={errors.length > 0}>
        <ErrorSummary errors={errors} />
        <p>Review the user data below and add additional mandatory fields before clicking Next.</p>
        <SummaryList items={requestSummary(userType, state.userIdentifier)} />
        <p>These user details have been retrieved from Okta via BI.</p>
        <SummaryList label="User details" items={userDetailsSummary(user)} />
        <h2>Enter user data required for the provisioning request</h2>
        <p>
          The fields below are mandatory in order to create a User Provisioning request. If you leave manager&apos;s x
          number blank, a dummy value will be added into RP&amp;S. You must select a location to continue.
        </p>
        <form noValidate onSubmit={handleSubmit}>
          <TextInput
            id={managerFieldId}
            label="Manager's x number"
            value={managerXNumber}
            onChange={setManagerXNumber}
            onBlur={() => setManagerTouched(true)}
            error={managerError}
            width="fixed-20"
          />
          <Select
            id={locationFieldId}
            label="Location"
            placeholder="Select location from dropdown"
            options={locations.status === "loaded" ? locations.locations.map((name) => ({ value: name, label: name })) : []}
            value={location}
            onChange={setLocation}
            disabled={locations.status === "loading"}
            error={locationError}
          />
          <div className="visually-hidden" role="status">
            {locations.status === "loading" ? "Loading locations" : ""}
          </div>
          <FormButtons
            submitLabel="Next"
            unavailable={!location || Boolean(managerProblem)}
            unavailableHintId={unavailableHintId}
            onCancel={cancel}
          />
          <p className="visually-hidden" id={unavailableHintId}>
            {managerProblem
              ? "Enter a valid manager's x number, or leave it blank, to continue"
              : "Select a location to continue"}
          </p>
        </form>
      </Page>
    </>
  );
}
