import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { ErrorSummary, type FormError } from "../../components/ErrorSummary";
import { FormButtons } from "../../components/FormButtons";
import { Page } from "../../components/Page";
import { Select } from "../../components/Select";
import { SummaryList } from "../../components/SummaryList";
import { useCancelJourney, validationBlocked } from "./journeyAudit";
import { paths } from "./options";
import { useProvision } from "./ProvisionContext";
import { useLocations } from "./useLocations";
import { requestSummary, userDetailsSummary } from "./userSummary";
import { missingFieldNames, validateDetails } from "./validateDetails";

const locationsFailedMessage = "Sorry, the list of locations could not be loaded. Try again later.";

export function UserDetailsPage() {
  const navigate = useNavigate();
  const { state, chooseLocation } = useProvision();
  const locations = useLocations();
  const [location, setLocation] = useState(state.location ?? "");
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      return;
    }
    const found = validateDetails(user, location);
    setFormErrors(found);
    if (found.length === 0) {
      chooseLocation(location);
      void navigate(paths.ticket);
    } else {
      validationBlocked("user-details", missingFieldNames(user, location), userType);
    }
  }

  return (
    <Page title="Check and complete the user details" hasErrors={errors.length > 0}>
      <ErrorSummary errors={errors} />
      <SummaryList items={requestSummary(userType, state.userIdentifier)} />
      <div className="ds_inset-text">
        <div className="ds_inset-text__text">
          <p>The fields below are mandatory in order to create a user provisioning request.</p>
          <p>The user details have been retrieved.</p>
        </div>
      </div>
      <SummaryList label="User details" items={userDetailsSummary(user)} />
      <form noValidate onSubmit={handleSubmit}>
        <Select
          id="location"
          label="Location"
          placeholder="Select a location"
          options={locations.status === "loaded" ? locations.locations : []}
          value={location}
          onChange={setLocation}
          disabled={locations.status === "loading"}
          error={formErrors.find((error) => error.fieldId === "location")?.message}
        />
        <div className="visually-hidden" role="status">
          {locations.status === "loading" ? "Loading locations" : ""}
        </div>
        <FormButtons submitLabel="Next" onCancel={cancel} />
      </form>
    </Page>
  );
}
