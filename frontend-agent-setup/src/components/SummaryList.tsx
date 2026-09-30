import { Link } from "react-router";

export interface SummaryItem {
  key: string;
  value: string;
  /** Where the Change link goes. Rows without one have no action. */
  changeTo?: string;
}

interface SummaryListProps {
  items: SummaryItem[];
  label?: string;
}

export function SummaryList({ items, label }: SummaryListProps) {
  return (
    <ol className="ds_summary-list" aria-label={label}>
      {items.map((item) => (
        <li className="ds_summary-list__item" key={item.key}>
          <span className="ds_summary-list__key">{item.key}</span>
          <span className="ds_summary-list__value">
            <q className="ds_summary-list__answer">{item.value}</q>
          </span>
          {item.changeTo && (
            <div className="ds_summary-list__actions">
              <ul className="ds_summary-list__actions-list">
                <li className="ds_summary-list__actions-list-item">
                  <Link className="ds_link" to={item.changeTo}>
                    Change <span className="visually-hidden">{item.key.toLowerCase()}</span>
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
