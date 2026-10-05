import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { FormButtons } from "../../components/FormButtons";
import { Page } from "../../components/Page";
import { SummaryList } from "../../components/SummaryList";
import { paths } from "./options";
import { useProvision } from "./ProvisionContext";

export function ConfirmUserPage() {
  const navigate = useNavigate();
  const { state } = useProvision();

  if (!state.user) {
    return <Navigate to={paths.userType} replace />;
  }
  const { firstName, surname } = state.user;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void navigate(paths.userDetails);
  }

  return (
    <Page title="Check this is the right user">
      <SummaryList items={[{ key: "Full name", value: `${firstName} ${surname}`.trim() }]} />
      <form noValidate onSubmit={handleSubmit}>
        <FormButtons submitLabel="Next" onCancel={() => void navigate("/")} />
      </form>
    </Page>
  );
}
