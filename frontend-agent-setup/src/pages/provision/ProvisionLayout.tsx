import { Outlet } from "react-router";
import { ProvisionProvider } from "./ProvisionContext";

/** Leaving /provision (Cancel, or any link out) unmounts this and discards the journey's answers. */
export function ProvisionLayout() {
  return (
    <ProvisionProvider>
      <Outlet />
    </ProvisionProvider>
  );
}
