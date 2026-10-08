// src/test/render.tsx: render helper with persona, scenario and route. VERIFY router and provider names.
import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router"; // VERIFY: the chosen router
import { AuthProvider } from "../auth/AuthProvider"; // VERIFY: the app's auth context provider
import { createMockAuth, type Persona } from "../auth/mockAuth";
import { server } from "../mocks/node";
import { scenarios, type ScenarioName } from "../mocks/scenarios";

interface RenderOptions {
  persona?: Persona;
  scenario?: ScenarioName;
  route?: string;
}

export function renderPage(ui: ReactElement, options: RenderOptions = {}) {
  const { persona = "admin", scenario = "success", route = "/" } = options;
  server.use(...scenarios[scenario]);
  const auth = createMockAuth(persona);
  const user = userEvent.setup();
  const result = render(
    <AuthProvider client={auth}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthProvider>,
  );
  return { ...result, user, auth };
}
