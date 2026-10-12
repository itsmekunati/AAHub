import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { BackLink } from "../../components/BackLink";
import { ErrorSummary, type FormError } from "../../components/ErrorSummary";
import { FormButtons } from "../../components/FormButtons";
import { Page } from "../../components/Page";
import { Select } from "../../components/Select";
import { SummaryList } from "../../components/SummaryList";
import { TextInput } from "../../components/TextInput";
import { getConfig } from "../../config";
import { problemMessage } from "../../services/problemMessage";
import { getLdapGroupCatalogue, getLdapGroupMemberships, type RoleUserType } from "../../services/roleManagement";
import { roleManagerAudit, roleManagerJourney, useJourneyCancel } from "../provision/journeyAudit";
import { paths, roleUserTypeOptions } from "./options";
import { useRoleManager } from "./RoleManagerContext";
import { identifierCopy, isFinalError, sanitiseIdentifier, validateIdentifier } from "./validateIdentifier";

const fieldId = "user-identifier";
const unavailableHintId = "user-identifier-unavailable";
const step = "user-details";
const notFoundMessage = "User not found. Check the x number or username and the user type.";
function isRoleUserType(value: string): value is RoleUserType {
  return roleUserTypeOptions.some((option) => option.value === value);
}

export function RoleUserDetailsPage() {
  const navigate = useNavigate();
  const { state, groupsFound } = useRoleManager();
  const [userType, setUserType] = useState<RoleUserType>(state.userType);
  const [userIdentifier, setUserIdentifier] = useState(state.userIdentifier);
  // Errors that typing more cannot fix show at once; the rest wait until the field is left or submitted.
  const [touched, setTouched] = useState(false);
  // A "not found" answer from the backend, shown until the value is changed.
  const [serverFieldError, setServerFieldError] = useState<string>();
  // The summary changes only on submit, so it never takes focus while the operator types.
  const [summary, setSummary] = useState<FormError[]>([]);
  const [checking, setChecking] = useState(false);
  const cancel = useJourneyCancel(roleManagerJourney, step);

  const copy = identifierCopy(userType);
  const problem = validateIdentifier(userIdentifier, userType);
  const fieldError = serverFieldError ?? (touched || isFinalError(userIdentifier, userType) ? problem : undefined);

  function handleIdentifierChange(value: string) {
    setUserIdentifier(value);
    setServerFieldError(undefined);
    if (!validateIdentifier(value, userType)) {
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
    const identifier = sanitiseIdentifier(userIdentifier, userType);
    if (!identifier.ok) {
      setSummary([{ fieldId, message: identifier.message }]);
      roleManagerAudit.validationBlocked(step, [fieldId], userType);
      return;
    }
    setChecking(true);
    try {
      const [result, catalogue] = await Promise.all([
        getLdapGroupMemberships(userType, identifier.value),
        getLdapGroupCatalogue(userType),
      ]);
      if (!result.found) {
        setServerFieldError(notFoundMessage);
        setSummary([{ fieldId, message: notFoundMessage }]);
        return;
      }
      groupsFound(userType, identifier.value, result.groups, catalogue);
      void navigate(paths.selectGroups);
    } catch (error) {
      setSummary([{ message: problemMessage(error) }]);
      roleManagerAudit.screenError(step, error, userType);
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      <BackLink to="/" label="Previous" />
      <Page title="Provide the user details" hasErrors={summary.length > 0}>
        <ErrorSummary errors={summary} />
        <SummaryList items={[{ key: "Selected environment", value: getConfig().environmentName }]} />
        <form noValidate onSubmit={(event) => void handleSubmit(event)}>
          <Select
            id="user-type"
            label="User type"
            hint="Select the user type from the dropdown"
            options={roleUserTypeOptions}
            value={userType}
            onChange={(value) => {
              if (isRoleUserType(value)) {
                setUserType(value);
                setServerFieldError(undefined);
                // The summary may describe the old user type's rules; the next submit rebuilds it.
                setSummary([]);
              }
            }}
          />
          <TextInput
            id={fieldId}
            label={copy.label}
            hint={copy.hint}
            value={userIdentifier}
            onChange={handleIdentifierChange}
            onBlur={() => setTouched(true)}
            error={fieldError}
            width="fluid-three-quarters"
          />
          <FormButtons
            submitLabel="Get user's existing LDAP group memberships"
            busy={checking}
            busyLabel="Getting group memberships"
            unavailable={Boolean(problem)}
            unavailableHintId={unavailableHintId}
            onCancel={cancel}
          />
          <p className="visually-hidden" id={unavailableHintId}>
            {copy.unavailable}
          </p>
          <div className="visually-hidden" role="status">
            {checking ? "Getting the user's LDAP group memberships" : ""}
          </div>
        </form>
      </Page>
    </>
  );
}
