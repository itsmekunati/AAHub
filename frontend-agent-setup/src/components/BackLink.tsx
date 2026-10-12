import { Link } from "react-router";

interface BackLinkProps {
  to: string;
  label?: string;
}

/** The Design System back link. It sits above the page layout, before the h1. */
export function BackLink({ to, label = "Back" }: BackLinkProps) {
  return (
    <Link className="ds_back-link" to={to}>
      {label}
    </Link>
  );
}
