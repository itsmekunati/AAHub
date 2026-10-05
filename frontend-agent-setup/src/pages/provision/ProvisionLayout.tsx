import { useEffect, useRef } from "react";
import { Outlet } from "react-router";
import { journeyStarted } from "./journeyAudit";
import { ProvisionProvider } from "./ProvisionContext";

/** Leaving /provision (Cancel, or any link out) unmounts this and discards the journey's answers. */
export function ProvisionLayout() {
  const reported = useRef(false);

  useEffect(() => {
    // The ref keeps this to one report per journey, including under React StrictMode.
    if (!reported.current) {
      reported.current = true;
      journeyStarted();
    }
  }, []);

  return (
    <ProvisionProvider>
      <Outlet />
    </ProvisionProvider>
  );
}
