import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  /** Read by screen readers; the Design System hides it visually on wider screens. */
  title: string;
  items: readonly TabItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Spreads the tabs across one line on wider screens, so they end where the panel ends. */
  fill?: boolean;
}

/**
 * Design System dynamic tabs: the documented markup and classes, with `js-initialised` for the tab
 * layout. React drives them instead of the Design System's tabs script, because pages must switch
 * tabs from code (e.g. an error summary link to a field in a hidden tab), and that script works
 * through the URL hash and its own changes to the DOM. The list and items are divs, not ul/li, so
 * they can carry the tablist/presentation roles the Design System's script would add at run time.
 */
export function Tabs({ title, items, selectedId, onSelect, fill = false }: TabsProps) {
  const focusOnSelect = useRef(false);

  useEffect(() => {
    if (focusOnSelect.current) {
      focusOnSelect.current = false;
      document.getElementById(`tab-${selectedId}`)?.focus();
    }
  }, [selectedId]);

  function handleKeyDown(event: KeyboardEvent<HTMLAnchorElement>, index: number) {
    const last = items.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const target = targets[event.key];
    const item = target === undefined ? undefined : items[target];
    if (item) {
      event.preventDefault();
      focusOnSelect.current = true;
      onSelect(item.id);
    }
  }

  return (
    <div className={fill ? "ds_tabs js-initialised app_tabs--fill" : "ds_tabs js-initialised"}>
      <h2 className="ds_tabs__title">{title}</h2>
      <div className="ds_tabs__list" role="tablist" aria-label={title}>
        {items.map((item, index) => {
          const current = item.id === selectedId;
          return (
            <div className={current ? "ds_tabs__tab ds_current" : "ds_tabs__tab"} role="presentation" key={item.id}>
              <a
                className="ds_tabs__tab-link"
                href={`#panel-${item.id}`}
                id={`tab-${item.id}`}
                role="tab"
                aria-controls={`panel-${item.id}`}
                aria-selected={current}
                tabIndex={current ? 0 : -1}
                onClick={(event) => {
                  event.preventDefault();
                  onSelect(item.id);
                }}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                {item.label}
              </a>
            </div>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          className="ds_tabs__content ds_tabs__content--bordered"
          id={`panel-${item.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${item.id}`}
          hidden={item.id !== selectedId}
          key={item.id}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
