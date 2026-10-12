import { Link } from "react-router";

export interface SummaryItem {
  key: string;
  /** An array shows one answer per line. */
  value: string | string[];
  /** Where the Change link goes. Rows without one have no action. */
  changeTo?: string;
  /** The hidden words after "Change", for a key that reads badly in lower case (e.g. one with LDAP in it). */
  changeLabel?: string;
}

interface SummaryListProps {
  items: SummaryItem[];
  label?: string;
}

function Answer({ value }: { value: string | string[] }) {
  if (typeof value === "string") {
    return <q className="ds_summary-list__answer">{value}</q>;
  }
  return (
    <ul className="ds_no-bullets">
      {value.map((line) => (
        <li key={line}>
          <q className="ds_summary-list__answer">{line}</q>
        </li>
      ))}
    </ul>
  );
}

export function SummaryList({ items, label }: SummaryListProps) {
  return (
    <ol className="ds_summary-list" aria-label={label}>
      {items.map((item) => (
        <li className="ds_summary-list__item" key={item.key}>
          <span className="ds_summary-list__key">{item.key}</span>
          <span className="ds_summary-list__value">
            <Answer value={item.value} />
          </span>
          {item.changeTo && (
            <div className="ds_summary-list__actions">
              <ul className="ds_summary-list__actions-list">
                <li className="ds_summary-list__actions-list-item">
                  <Link className="ds_link" to={item.changeTo}>
                    Change <span className="visually-hidden">{item.changeLabel ?? item.key.toLowerCase()}</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
