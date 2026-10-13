import { useEffect, useState } from "react";
import { getLocations, type UserType } from "../../services/provisioning";

export type LocationsState =
  | { status: "loading" }
  | { status: "loaded"; locations: string[] }
  | { status: "failed" };

type Fetched = { userType: UserType; state: LocationsState };

/** The locations for a user type. Nothing is fetched until a user type has been chosen. */
export function useLocations(userType: UserType | undefined): LocationsState {
  const [fetched, setFetched] = useState<Fetched>();

  useEffect(() => {
    if (!userType) {
      return;
    }
    let active = true;
    getLocations(userType)
      .then((locations) => {
        if (active) setFetched({ userType, state: { status: "loaded", locations } });
      })
      .catch(() => {
        if (active) setFetched({ userType, state: { status: "failed" } });
      });
    return () => {
      active = false;
    };
  }, [userType]);

  // An answer for another user type is never shown: it counts as still loading.
  return fetched && fetched.userType === userType ? fetched.state : { status: "loading" };
}
