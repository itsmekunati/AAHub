import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { BackLink } from "../../components/BackLink";
import { ErrorSummary, type FormError } from "../../components/ErrorSummary";
import { FormButtons } from "../../components/FormButtons";
import { Page } from "../../components/Page";
import { SummaryList } from "../../components/SummaryList";
import { TextInput } from "../../components/TextInput";
import { isFinalTicketError, parseTicketNumber, ticketCopy } from "../../services/jiraTicket";
import { problemMessage } from "../../services/problemMessage";
import { submitProvisioningRequest } from "../../services/provisioning";
import { screenError, useCancelJourney, validationBlocked } from "./journeyAudit";
import { DUMMY_MANAGER_X_NUMBER } from "./managerXNumber";
import { paths, userTypeLabel } from "./options";
import { useProvision } from "./ProvisionContext";
import { requestSummary, userDetailsSummary } from "./userSummary";

const fieldId = "jira-ticket-id";
const unavailableHintId = "submit-unavailable";

export function TicketPage() {
  const navigate = useNavigate();
  const { state, submissionFinished } = useProvision();
  const [ticketId, setTicketId] = useState("");
  // The "too few digits" error waits until the field is left or Submit is pressed.
  const [touched, setTouched] = useState(false);
  // The summary changes only on submit, so it never takes focus while the operator types.
  const [summary, setSummary] = useState<FormError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const cancel = useCancelJourney("ticket");

  const { userType, user, location } = state;
  if (submitting && state.result) {
    // The result is in and the answers are gone; show nothing while the result page opens.
    return null;
  }
  // Also true when coming back after a result, so nothing can be shown or submitted twice.
  if (!userType || !user || !location) {
    return <Navigate to={paths.userType} replace />;
  }
  // The operator may leave the manager's x number blank; the request then carries the dummy value.
  const managerXNumber = state.managerXNumber || DUMMY_MANAGER_X_NUMBER;

  const parsed = parseTicketNumber(ticketId);
  const problem = parsed.ok ? undefined : parsed.reason === "missing" ? ticketCopy.missing : ticketCopy.format;
  const fieldError = touched || isFinalTicketError(ticketId) ? problem : undefined;

  function handleTicketChange(value: string) {
    setTicketId(value);
    if (parseTicketNumber(value).ok) {
      setSummary((current) => (current.length === 0 ? current : []));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !userType || !user || !location) {
      return;
    }
    setTouched(true);
    // The shared rule (ITS- and six digits); only its canonical ticket ID is ever sent.
    const ticket = parseTicketNumber(ticketId);
    if (!ticket.ok) {
      setSummary([{ fieldId, message: ticket.reason === "missing" ? ticketCopy.missing : ticketCopy.format }]);
      validationBlocked("ticket", [fieldId], userType);
      return;
    }
    const jiraTicketId = ticket.ticketId;
    const resultFor = { userTypeLabel: userTypeLabel(userType), fullName: `${user.firstName} ${user.surname}`.trim() };
    setSubmitting(true);
    try {
      const created = await submitProvisioningRequest({
        userType,
        userIdentifier: state.userIdentifier,
        firstName: user.firstName,
        surname: user.surname,
        email: user.email,
        managerXNumber,
        jobTitle: user.jobTitle,
        location,
        jiraTicketId,
      });
      submissionFinished({ ...resultFor, outcome: { succeeded: true, userXNumber: created.userXNumber } });
    } catch (error) {
      submissionFinished({ ...resultFor, outcome: { succeeded: false, reason: problemMessage(error) } });
      screenError("ticket", error, userType);
    }
    // `submitting` stays set: this page is left for the result page either way.
    void navigate(paths.result);
  }

  return (
    <>
      <BackLink to={paths.userDetails} label="Previous" />
      <Page title="Review your selection before submitting" titleSize="h2" hasErrors={summary.length > 0}>
        <ErrorSummary errors={summary} />
        <p>You are updating the details of an existing request.</p>
        <SummaryList label="Request details" items={requestSummary(userType, state.userIdentifier)} />
        <SummaryList
          label="User details"
          items={[
            ...userDetailsSummary(user),
            { key: "Manager's x number", value: managerXNumber },
            { key: "Location", value: location },
          ]}
        />
        <h2>{ticketCopy.heading}</h2>
        <form noValidate onSubmit={(event) => void handleSubmit(event)}>
          <TextInput
            id={fieldId}
            label={ticketCopy.heading}
            hint={ticketCopy.hint}
            value={ticketId}
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
            {submitting ? "Submitting the request" : ""}
          </div>
        </form>
      </Page>
    </>
  );
}
