import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { ErrorSummary, type FormError } from "../../components/ErrorSummary";
import { FormButtons } from "../../components/FormButtons";
import { Page } from "../../components/Page";
import { SummaryList } from "../../components/SummaryList";
import { TextInput } from "../../components/TextInput";
import { parseTicketNumber } from "../../services/jiraTicket";
import { problemMessage } from "../../services/problemMessage";
import { submitProvisioningRequest } from "../../services/provisioning";
import { screenError, useCancelJourney, validationBlocked } from "./journeyAudit";
import { paths } from "./options";
import { useProvision } from "./ProvisionContext";
import { requestSummary, userDetailsSummary } from "./userSummary";

const fieldId = "jira-ticket-id";

export function TicketPage() {
  const navigate = useNavigate();
  const { state, submissionFinished } = useProvision();
  const [ticketId, setTicketId] = useState(state.ticketId);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const cancel = useCancelJourney("ticket");

  const { userType, user, location } = state;
  if (state.outcome?.succeeded) {
    // Already provisioned: going back must not allow a second submission.
    return <Navigate to={paths.result} replace />;
  }
  if (!userType || !user || !location) {
    return <Navigate to={paths.userType} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !userType || !user || !location) {
      return;
    }
    // The shared rule (ITS- and six digits); only its canonical ticket ID is ever sent.
    const ticket = parseTicketNumber(ticketId);
    if (!ticket.ok) {
      setErrors([
        {
          fieldId,
          message:
            ticket.reason === "missing"
              ? "Enter the JSM/Jira ticket ID"
              : "Enter the JSM/Jira ticket ID in the correct format: ITS- followed by six digits, like ITS-123456",
        },
      ]);
      validationBlocked("ticket", [fieldId], userType);
      return;
    }
    const jiraTicketId = ticket.ticketId;
    setSubmitting(true);
    try {
      const created = await submitProvisioningRequest({
        userType,
        userIdentifier: state.userIdentifier,
        firstName: user.firstName,
        surname: user.surname,
        email: user.email,
        managerXNumber: user.managerXNumber,
        jobTitle: user.jobTitle,
        location,
        jiraTicketId,
      });
      submissionFinished(jiraTicketId, { succeeded: true, transactionId: created.transactionId });
    } catch (error) {
      submissionFinished(jiraTicketId, { succeeded: false, reason: problemMessage(error) });
      screenError("ticket", error, userType);
    } finally {
      setSubmitting(false);
    }
    void navigate(paths.result);
  }

  return (
    <Page title="Add the JSM/Jira ticket ID" hasErrors={errors.length > 0}>
      <ErrorSummary errors={errors} />
      <SummaryList
        label="Request details"
        items={[
          ...requestSummary(userType, state.userIdentifier),
          ...userDetailsSummary(user),
          { key: "Location", value: location },
        ]}
      />
      <form noValidate onSubmit={(event) => void handleSubmit(event)}>
        <TextInput
          id={fieldId}
          label="Enter the JSM/Jira ticket ID associated with this request"
          hint="This must be ITS- followed by six digits, for example ITS-123456"
          value={ticketId}
          onChange={setTicketId}
          error={errors.find((error) => error.fieldId === fieldId)?.message}
          width="fixed-10"
        />
        <FormButtons submitLabel="Submit" busy={submitting} busyLabel="Submitting" onCancel={cancel} />
        <div className="visually-hidden" role="status">
          {submitting ? "Submitting the request" : ""}
        </div>
      </form>
    </Page>
  );
}
