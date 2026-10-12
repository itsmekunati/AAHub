// Links to each application's LDAP group descriptions, keyed by application id (as the backend
// sends it). DECIDED EXCEPTION to "no hard-coded hostnames": these pages are the same in every
// environment, so they are not in config.json (see .claude/rules/runtime-config.md).
// Add each link here when it is supplied; a tab without one shows no description link.
export const groupDescriptionLinks: Readonly<Record<string, string>> = {};
