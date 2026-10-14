import { useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { BackLink } from "../../components/BackLink";
import { CheckboxGroup } from "../../components/CheckboxGroup";
import { ErrorSummary, type FormError } from "../../components/ErrorSummary";
import { FormButtons } from "../../components/FormButtons";
import { NotificationBanner } from "../../components/NotificationBanner";
import { Page } from "../../components/Page";
import { Tabs } from "../../components/Tabs";
import { getConfig } from "../../config";
import type { LdapApplication } from "../../services/roleManagement";
import { roleManagerAudit, roleManagerJourney, useJourneyCancel } from "../provision/journeyAudit";
import { groupDescriptionLinks } from "./groupDescriptionLinks";
import { paths } from "./options";
import { useRoleManager } from "./RoleManagerContext";

const step = "select-groups";
const unavailableHintId = "review-unavailable";
const noChangeMessage = "Select or clear at least one group to make a change";

export const groupFieldId = (groupId: string) => `group-${groupId}`;

function sameGroups(a: ReadonlySet<string>, b: readonly string[]): boolean {
  return a.size === b.length && b.every((group) => a.has(group));
}

/** Applications whose minimum-groups rule (from the backend) the selection breaks. */
function brokenRules(catalogue: readonly LdapApplication[], selected: ReadonlySet<string>): LdapApplication[] {
  return catalogue.filter(
    (application) => application.minimumGroups && !application.groups.some((group) => selected.has(group.id)),
  );
}

export function SelectGroupsPage() {
  const navigate = useNavigate();
  const { state, groupsSelected } = useRoleManager();
  const { catalogue, memberships } = state;
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(state.selected ?? []));
  const [activeTab, setActiveTab] = useState(catalogue?.[0]?.id ?? "");
  const [summary, setSummary] = useState<FormError[]>([]);
  // Applications whose rule was broken when the operator last pressed Review.
  const [checkedRules, setCheckedRules] = useState<ReadonlySet<string>>(new Set());
  // A field to focus once its tab is showing (after an error summary link).
  const pendingFocus = useRef<string | undefined>(undefined);
  const cancel = useJourneyCancel(roleManagerJourney, step);

  useEffect(() => {
    if (pendingFocus.current) {
      document.getElementById(pendingFocus.current)?.focus();
      pendingFocus.current = undefined;
    }
  }, [activeTab]);

  if (!catalogue || !memberships) {
    return <Navigate to={paths.userDetails} replace />;
  }

  const changed = !sameGroups(selected, memberships);
  const broken = new Set(brokenRules(catalogue, selected).map((application) => application.id));

  function toggle(groupId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  /** An error summary link to a group in a hidden tab opens that tab, then focuses the checkbox. */
  function revealField(fieldId: string) {
    const application = catalogue?.find((candidate) =>
      candidate.groups.some((group) => groupFieldId(group.id) === fieldId),
    );
    if (application && application.id !== activeTab) {
      pendingFocus.current = fieldId;
      setActiveTab(application.id);
    } else {
      document.getElementById(fieldId)?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!catalogue) {
      return;
    }
    if (!changed) {
      setSummary([{ message: noChangeMessage }]);
      roleManagerAudit.validationBlocked(step, ["groups"], state.userType);
      return;
    }
    const failing = brokenRules(catalogue, selected);
    setCheckedRules(new Set(failing.map((application) => application.id)));
    if (failing.length > 0) {
      setSummary(
        failing.map((application) => ({
          fieldId: groupFieldId(application.groups[0]?.id ?? ""),
          message: application.minimumGroups?.message ?? "",
        })),
      );
      roleManagerAudit.validationBlocked(
        step,
        failing.map((application) => `${application.id}-groups`),
        state.userType,
      );
      return;
    }
    groupsSelected(
      catalogue.flatMap((application) => application.groups.map((group) => group.id)).filter((id) => selected.has(id)),
    );
    void navigate(paths.reviewChanges);
  }

  const tabs = catalogue.map((application) => {
    const link = groupDescriptionLinks[application.id];
    const showError = checkedRules.has(application.id) && broken.has(application.id);
    return {
      id: application.id,
      label: application.name,
      content: (
        <>
          {link && (
            <>
              <p>A description of the permissions associated with each group is available at the link below:</p>
              <p>
                <a className="ds_link" href={link} target="_blank" rel="noopener noreferrer">
                  {application.name} LDAP group descriptions (opens in a new tab)
                </a>
              </p>
            </>
          )}
          <CheckboxGroup
            idPrefix="group"
            name={`${application.id}-groups`}
            legend={`Below is the list of ${application.name} LDAP groups`}
            hint="Review and select the groups the user needs to be part of"
            note={application.minimumGroups?.message}
            error={showError ? application.minimumGroups?.message : undefined}
            options={application.groups.map((group) => ({ value: group.id, label: group.name }))}
            selected={selected}
            onToggle={toggle}
          />
        </>
      ),
    };
  });

  return (
    <>
      <NotificationBanner>
        For user <strong>{state.userIdentifier}</strong> in <strong>{getConfig().environmentName}</strong> environment
      </NotificationBanner>
      <BackLink to={paths.userDetails} label="Previous" />
      <Page title="Review and select LDAP groups" titleSize="h2" hasErrors={summary.length > 0} layout="full-width">
        <ErrorSummary errors={summary} onFieldLink={revealField} />
        <p className="ds_lead">Select the groups the user should be in, then select Review to check your changes.</p>
        <form noValidate onSubmit={handleSubmit}>
          <Tabs title="Applications" items={tabs} selectedId={activeTab} onSelect={setActiveTab} fill />
          <FormButtons
            submitLabel="Review"
            unavailable={!changed}
            unavailableHintId={unavailableHintId}
            onCancel={cancel}
          />
          <p className="visually-hidden" id={unavailableHintId}>
            Change a group selection to continue
          </p>
        </form>
      </Page>
    </>
  );
}
