import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { AppRoutes } from "../AppRoutes";
import { server } from "../mocks/node";
import { scenarios, type ScenarioName } from "../mocks/scenarios";

interface RenderOptions {
  scenario?: ScenarioName;
  route?: string;
}

export function renderApp(options: RenderOptions = {}) {
  const { scenario = "success", route = "/" } = options;
  server.use(...scenarios[scenario]);
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <AppRoutes />
    </MemoryRouter>,
  );
  return { ...result, user };
}
