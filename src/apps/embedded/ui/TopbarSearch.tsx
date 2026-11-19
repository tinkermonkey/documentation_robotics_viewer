/**
 * TopbarSearch — find a model element or a Schema node type by name.
 *
 * An ARIA 1.2 combobox: the input owns focus, and the active option is
 * `aria-activedescendant` in a listbox popup of results grouped by layer
 * (`data/search.ts`). ↓/↑ move through the options (opening the list), Enter
 * chooses, Escape closes the list and a second Escape clears the text. `/`
 * (when you aren't typing in a field) and ⌘K / Ctrl+K focus it from anywhere.
 *
 * Choosing an element calls `navigateToElement`, exactly as a nav-tree leaf
 * does (history push, centering); a node type calls `navigateToSpecNode`.
 *
 * Heimdall's `CommandPalette` (a modal with plain-text labels that renders
 * every match) and `Popover` (a dialog) don't fit a topbar combobox with
 * swatches and highlights, so the popup reuses CommandPalette's
 * `command-palette__*` classes for its look.
 */

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import {
  buildSearchIndex,
  DEFAULT_SEARCH_LIMIT,
  highlightPieces,
  searchIndex,
  type SearchHit,
} from '../data/search';
import { layerColor, layerLabel } from './domain';
import { useUiStore } from './uiStore';

/** True when a key press should type into whatever has focus (so `/` isn't ours). */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag !== 'INPUT') return false;
  const type = (target as HTMLInputElement).type;
  return !['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'color', 'file'].includes(type);
}

const IS_MAC =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export function TopbarSearch() {
  const navigateToElement = useUiStore((s) => s.navigateToElement);
  const navigateToSpecNode = useUiStore((s) => s.navigateToSpecNode);
  const { derived: model } = useModel();
  const { derived: spec } = useSpec();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;

  const index = useMemo(() => buildSearchIndex(model.nodes, spec.byLayer), [model.nodes, spec.byLayer]);
  // Typing stays responsive on a large model: the search can lag a keystroke behind.
  const deferredQuery = useDeferredValue(query);
  const result = useMemo(() => searchIndex(index, deferredQuery), [index, deferredQuery]);
  const options = useMemo(() => result.groups.flatMap((g) => g.hits), [result]);

  const hasQuery = query.trim().length > 0;
  const expanded = open && hasQuery;
  const activeIndex = options.length ? Math.min(active, options.length - 1) : -1;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  // A new query starts from the best match.
  useEffect(() => setActive(0), [deferredQuery]);

  // Keep the active option in view.
  useEffect(() => {
    if (!expanded || activeIndex < 0) return;
    document.getElementById(`${baseId}-opt-${activeIndex}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [expanded, activeIndex, baseId]);

  // `/` and ⌘K / Ctrl+K focus the search.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const input = inputRef.current;
      if (!input || e.defaultPrevented) return;
      const cmdK = (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k';
      const slash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target);
      if (!cmdK && !slash) return;
      e.preventDefault();
      input.focus();
      input.select();
      setOpen(true);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const choose = useCallback(
    (hit: SearchHit | undefined) => {
      if (!hit) return;
      const { entry } = hit;
      if (entry.kind === 'element') navigateToElement(entry.id, entry.layer);
      else navigateToSpecNode(entry.id, entry.layer);
      setQuery('');
      setOpen(false);
    },
    [navigateToElement, navigateToSpecNode],
  );

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!hasQuery) return;
        e.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        if (!options.length) return;
        const step = e.key === 'ArrowDown' ? 1 : -1;
        setActive((activeIndex + step + options.length) % options.length);
        return;
      }
      case 'Enter':
        if (expanded && activeIndex >= 0) {
          e.preventDefault();
          choose(options[activeIndex]);
        }
        return;
      case 'Escape':
        if (expanded) {
          e.preventDefault();
          setOpen(false);
        } else if (query) {
          e.preventDefault();
          setQuery('');
        } else {
          inputRef.current?.blur();
        }
        return;
      default:
        return;
    }
  };

  const shortcut = IS_MAC ? '⌘K' : 'Ctrl K';
  const resultCount = expanded
    ? options.length === 0
      ? 'No matches'
      : result.total > options.length
        ? `${options.length} of ${result.total} matches shown`
        : `${options.length} ${options.length === 1 ? 'match' : 'matches'}`
    : '';

  let optionIndex = -1;

  return (
    <div className="drv-search" data-testid="topbar-search">
      <svg className="drv-search__icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        className="drv-search__input"
        placeholder="Search elements and node types"
        aria-label="Search elements and node types"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-keyshortcuts="/ Control+K Meta+K"
        aria-describedby={`${baseId}-shortcut`}
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        data-testid="topbar-search-input"
      />
      {!query && (
        <kbd className="drv-search__hint" aria-hidden="true">
          /
        </kbd>
      )}

      <div
        id={listId}
        role="listbox"
        aria-label="Search results"
        className="command-palette drv-search__popup"
        hidden={!expanded}
        // Keep focus in the input while the pointer works the list.
        onMouseDown={(e) => e.preventDefault()}
      >
        {expanded && options.length === 0 && (
          <div className="command-palette__empty">No element or node type matches “{query.trim()}”</div>
        )}
        {expanded &&
          result.groups.map((group) => {
            const headerId = `${baseId}-g-${group.key}`;
            return (
              <div key={group.key} role="group" aria-labelledby={headerId} className="command-palette__group">
                <div id={headerId} className="command-palette__group-header drv-search__group-header">
                  <span className="drv-search__swatch" style={{ background: layerColor(group.layer) }} aria-hidden="true" />
                  {layerLabel(group.layer)}
                  {group.kind === 'type' ? ' · Schema' : ''}
                </div>
                {group.hits.map((hit) => {
                  optionIndex += 1;
                  const i = optionIndex;
                  const selected = i === activeIndex;
                  return (
                    <div
                      key={`${hit.entry.kind}:${hit.entry.id}`}
                      id={optionId(i)}
                      role="option"
                      aria-selected={selected}
                      // The highlight splits the name into pieces; name the option whole.
                      aria-label={`${hit.entry.name}, ${hit.entry.typeLabel}`}
                      className={`command-palette__item drv-search__item${selected ? ' command-palette__item--selected' : ''}`}
                      onClick={() => choose(hit)}
                      onMouseMove={() => {
                        if (!selected) setActive(i);
                      }}
                      data-domain={hit.entry.layer}
                      data-kind={hit.entry.kind}
                    >
                      <span
                        className="drv-search__swatch"
                        style={{ background: layerColor(hit.entry.layer) }}
                        aria-hidden="true"
                      />
                      <span className="command-palette__item-label drv-search__name">
                        {highlightPieces(hit.entry.name, hit.match.ranges).map((p, k) =>
                          p.match ? <mark key={k}>{p.text}</mark> : <span key={k}>{p.text}</span>,
                        )}
                      </span>
                      <span className="drv-search__type">{hit.entry.typeLabel}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        {expanded && result.total > DEFAULT_SEARCH_LIMIT && (
          <div className="drv-search__more" aria-hidden="true">
            Showing the best {DEFAULT_SEARCH_LIMIT} of {result.total}. Keep typing to narrow it.
          </div>
        )}
      </div>

      <div className="drv-sr-only" role="status" aria-live="polite">
        {resultCount}
      </div>
      <span className="drv-sr-only" id={`${baseId}-shortcut`}>
        Press / or {shortcut} to search
      </span>
    </div>
  );
}

export default TopbarSearch;
