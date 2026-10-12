import { useEffect, useRef } from "react";
import { Outlet } from "react-router";
import { roleManagerAudit } from "../provision/journeyAudit";
import { RoleManagerProvider } from "./RoleManagerContext";

/** Leaving /role-manager (Cancel, or any link out) unmounts this and discards the journey's answers. */
export function RoleManagerLayout() {
  const reported = useRef(false);

  useEffect(() => {
    // The ref keeps this to one report per journey, including under React StrictMode.
    if (!reported.current) {
      reported.current = true;
      roleManagerAudit.started();
    }
  }, []);

  return (
    <RoleManagerProvider>
      <Outlet />
    </RoleManagerProvider>
  );
}
