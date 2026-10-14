import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { BackLink } from "../../components/BackLink";
import { ErrorSummary, type FormError } from "../../components/ErrorSummary";
import { FormButtons } from "../../components/FormButtons";
import { Page } from "../../components/Page";
import { SummaryList } from "../../components/SummaryList";
import { TextInput } from "../../components/TextInput";
import { getConfig } from "../../config";
import { isFinalTicketError, parseTicketNumber, ticketCopy } from "../../services/jiraTicket";
import { problemMessage } from "../../services/problemMessage";
import { RoleChangeFailedError, submitRoleChangeRequest } from "../../services/roleManagement";
import { roleManagerAudit, roleManagerJourney, useJourneyCancel } from "../provision/journeyAudit";
import { paths } from "./options";
import { useRoleManager } from "./RoleManagerContext";

const step = "review-changes";
const fieldId = "jsm-ticket-id";
const unavailableHintId = "submit-unavailable";
const { heading: ticketHeading, missing: missingMessage, format: formatMessage } = ticketCopy;

function namesOrNone(names: string[]): string | string[] {
  return names.length > 0 ? names : "None";
}

export function ReviewChangesPage() {
  const navigate = useNavigate();
  const { state, changesSubmitted, changeFailed } = useRoleManager();
  const [ticket, setTicket] = useState("");
  // The "too few digits" error waits until the field is left or Submit is pressed.
  const [touched, setTouched] = useState(false);
  // The summary changes only on submit, so it never takes focus while the operator types.
  const [summary, setSummary] = useState<FormError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const cancel = useJourneyCancel(roleManagerJourney, step);

  const { catalogue, memberships, selected, userType, userIdentifier } = state;
  if (state.submitted) {
    // Already submitted: going back must not allow a second submission.
    return <Navigate to={paths.submitted} replace />;
  }
  if (!catalogue || !memberships || !selected) {
    return <Navigate to={paths.userDetails} replace />;
  }

  const groups = catalogue.flatMap((application) => application.groups);
  const toAdd = groups.filter((group) => selected.includes(group.id) && !memberships.includes(group.id));
  const toRemove = groups.filter((group) => memberships.includes(group.id) && !selected.includes(group.id));

  const parsed = parseTicketNumber(ticket);
  const problem = parsed.ok ? undefined : parsed.reason === "missing" ? missingMessage : formatMessage;
  const fieldError = touched || isFinalTicketError(ticket) ? problem : undefined;

  function handleTicketChange(value: string) {
    setTicket(value);
    if (parseTicketNumber(value).ok) {
      setSummary((current) => (current.length === 0 ? current : []));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }
    setTouched(true);
    // Only the canonical ticket ID (ITS- and six digits) is ever sent, never what was typed.
    const result = parseTicketNumber(ticket);
    if (!result.ok) {
      setSummary([{ fieldId, message: result.reason === "missing" ? missingMessage : formatMessage }]);
      roleManagerAudit.validationBlocked(step, [fieldId], userType);
      return;
    }
    setSubmitting(true);
    try {
      const created = await submitRoleChangeRequest({
        userType,
        userIdentifier,
        groupsToAdd: toAdd.map((group) => group.id),
        groupsToRemove: toRemove.map((group) => group.id),
        jiraTicketId: result.ticketId,
      });
      changesSubmitted(created.transactionId, result.ticketId);
      roleManagerAudit.succeeded(step, created.transactionId, userType);
      void navigate(paths.submitted);
    } catch (error) {
      roleManagerAudit.screenError(step, error, userType);
      if (error instanceof RoleChangeFailedError) {
        // The backend could not apply the change: show the failure page, not a form error.
        changeFailed();
        roleManagerAudit.failed(step, error, userType);
        void navigate(paths.changeFailed);
        return;
      }
      setSummary([{ message: problemMessage(error) }]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <BackLink to={paths.selectGroups} label="Previous" />
      <Page title="Review your selection before submitting" titleSize="h2" hasErrors={summary.length > 0}>
        <ErrorSummary errors={summary} />
        <p className="ds_lead">Review the group selection, before clicking Submit to make the changes.</p>
        <SummaryList
          items={[
            { key: "Environment", value: getConfig().environmentName },
            { key: "User details", value: userIdentifier, changeTo: paths.userDetails },
            {
              key: "User added to the following LDAP groups",
              value: namesOrNone(toAdd.map((group) => group.name)),
              changeTo: paths.selectGroups,
              changeLabel: "the LDAP groups the user is added to",
            },
            {
              key: "User removed from the following LDAP groups",
              value: namesOrNone(toRemove.map((group) => group.name)),
              changeTo: paths.selectGroups,
              changeLabel: "the LDAP groups the user is removed from",
            },
          ]}
        />
        <h2>{ticketHeading}</h2>
        <form noValidate onSubmit={(event) => void handleSubmit(event)}>
          <TextInput
            id={fieldId}
            label={ticketHeading}
            hint={ticketCopy.hint}
            value={ticket}
            onChange={handleTicketChange}
            onBlur={() => setTouched(true)}
            error={fieldError}
            width="fixed-10"
            inputMode="numeric"
          />
          <FormButtons
            submitLabel="Submit"
            busy={submitting}
            busyLabel="Submitting"
            unavailable={Boolean(problem)}
            unavailableHintId={unavailableHintId}
            onCancel={cancel}
          />
          <p className="visually-hidden" id={unavailableHintId}>
            {ticketCopy.unavailable}
          </p>
          <div className="visually-hidden" role="status">
            {submitting ? "Submitting the changes" : ""}
          </div>
        </form>
      </Page>
    </>
  );
}
