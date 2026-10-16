import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate, type NavigateFunction } from "react-router";
import { AppRoutes } from "../AppRoutes";
import type { OperatorRole } from "../auth/operator";
import { OperatorRoleProvider } from "../auth/OperatorRoleContext";
import { server } from "../mocks/node";
import { scenarios, type ScenarioName } from "../mocks/scenarios";

interface RenderOptions {
  scenario?: ScenarioName;
  route?: string;
  role?: OperatorRole;
}

/** Captures the router's navigate function, because the in-memory router has no browser Back button. */
function NavigateProbe({ onReady }: { onReady: (navigate: NavigateFunction) => void }) {
  onReady(useNavigate());
  return null;
}

export function renderApp(options: RenderOptions = {}) {
  const { scenario = "success", route = "/", role = "editor" } = options;
  server.use(...scenarios[scenario]);
  const user = userEvent.setup();
  let navigate: NavigateFunction | undefined;
  const result = render(
    <OperatorRoleProvider role={role}>
      <MemoryRouter initialEntries={[route]}>
        <NavigateProbe onReady={(ready) => (navigate = ready)} />
        <AppRoutes />
      </MemoryRouter>
    </OperatorRoleProvider>,
  );
  /** Presses the browser's Back button. */
  const goBack = () => act(() => void navigate?.(-1));
  return { ...result, user, goBack };
}
