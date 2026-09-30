import { useEffect, useState } from "react";
import { getLocations } from "../../services/provisioning";

export type LocationsState =
  | { status: "loading" }
  | { status: "loaded"; locations: string[] }
  | { status: "failed" };

export function useLocations(): LocationsState {
  const [state, setState] = useState<LocationsState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    getLocations()
      .then((locations) => {
        if (active) setState({ status: "loaded", locations });
      })
      .catch(() => {
        if (active) setState({ status: "failed" });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
