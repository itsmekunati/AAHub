import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AppRoutes } from "./AppRoutes";
import { loadConfig } from "./config";
import "./styles/main.scss";

// Mock mode (npm run dev) only. import.meta.env.DEV is false in production builds,
// so the mock API is never bundled.
async function startMockApiInMockMode(): Promise<void> {
  if (import.meta.env.DEV && import.meta.env.MODE === "mock") {
    const { startMockApi } = await import("./mocks/browser");
    await startMockApi();
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Missing #root element");
}
const root = createRoot(rootElement);
document.body.classList.add("js-enabled");

startMockApiInMockMode()
  .then(loadConfig)
  .then(() => {
    root.render(
      <StrictMode>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    console.error(error);
    root.render(
      <div className="ds_wrapper">
        <h1>Sorry, there is a problem with the service</h1>
        <p>Try again later.</p>
      </div>,
    );
  });
