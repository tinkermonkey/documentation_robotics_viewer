/**
 * NavTree — hierarchical navigation: Section -> Layer -> Element, with a
 * Model layer's elements grouped under their node type (#592):
 * Layer -> Node type (count) -> Element.
 *
 * Heimdall's <Sidebar> is only 2-level, so this is built on Heimdall's real
 * <NavItem> button (icon/label/count/active/depth) + the design's
 * `drv-nav-l2` / `drv-chev` helper classes (see domain-and-nav.css) layered on
 * top for the 3rd level and the disclosure chevron. The 12 layers come from
 * `domain.ts`; counts come from the live model (`useModel`) and spec
 * (`useSpec`); leaves are element names (Model) or node-type names (Schema).
 * Changesets lists changesets, or a subtle empty hint when the model has none.
 *
 * Type groups (`data/navTreeGroups.ts`) start collapsed. Their open state is
 * local to the tree, not in `uiStore` or the URL, so opening one pushes no
 * history. The group holding the selected element opens whenever the
 * selection changes, wherever it came from (a nav click, the graph, a deep
 * link, a cross-layer navigate), so the reveal effect can scroll to its row.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavItem, type IconName } from '@tinkermonkey/heimdall-ui';
import { useUiStore, type ViewKind } from './uiStore';
import { LAYER_ORDER, layerLabel, type LayerSlug } from './domain';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import { useChangesets } from '../data/useChangesets';
import { purposeLabel } from '../data/changesetPurpose';
import { groupByType, typeGroupKey } from '../data/navTreeGroups';

type SectionId = Extract<ViewKind, 'model' | 'spec' | 'changesets'>;

const SECTIONS: { id: SectionId; label: string; icon: IconName }[] = [
  { id: 'model', label: 'Model', icon: 'graph' },
  { id: 'spec', label: 'Schema', icon: 'schema' },
  { id: 'changesets', label: 'Changesets', icon: 'clock' },
];

/** Chevron disclosure indicator (absolutely positioned at the row's right). */
function Chevron({ open }: { open: boolean }) {
  return (
    <span
      style={{
        position: 'absolute',
        right: 12,
        top: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <span className={`drv-chev${open ? ' drv-chev--open' : ''}`} />
    </span>
  );
}

/** A level-0 (section) row: NavItem with icon + count + chevron. */
function SectionRow({ section }: { section: (typeof SECTIONS)[number] }) {
  const view = useUiStore((s) => s.view);
  const expandedSections = useUiStore((s) => s.expandedSections);
  const toggleSection = useUiStore((s) => s.toggleSection);

  const { derived: changesets } = useChangesets();
  const open = expandedSections.has(section.id);
  const count = section.id === 'changesets' ? changesets.list.length : 12;

  return (
    <div style={{ position: 'relative' }}>
      <NavItem
        icon={section.icon}
        label={section.label}
        count={count}
        active={view === section.id}
        depth={0}
        aria-expanded={open}
        onClick={() => toggleSection(section.id)}
      />
      <Chevron open={open} />
    </div>
  );
}

/** Which Model type groups are open, and how to toggle one (local tree state). */
interface GroupState {
  openGroups: ReadonlySet<string>;
  toggleGroup: (key: string) => void;
}

/** A leaf row: a Model element or a Schema node type. */
function LeafRow({
  label,
  active,
  className,
  onSelect,
}: {
  label: string;
  active: boolean;
  className: string;
  onSelect: () => void;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <NavItem
        label={label}
        active={active}
        depth={1}
        className={className}
        onClick={onSelect}
        title={label}
      />
    </div>
  );
}

/** A level-1 (layer) row + its expanded type groups (Model) or node-type leaves (Schema). */
function LayerRow({
  sectionId,
  slug,
  groups: groupState,
}: {
  sectionId: SectionId;
  slug: LayerSlug;
  groups: GroupState;
}) {
  const view = useUiStore((s) => s.view);
  const layerId = useUiStore((s) => s.layerId);
  const selectedId = useUiStore((s) => s.selectedId);
  const expandedLayers = useUiStore((s) => s.expandedLayers);
  const toggleLayer = useUiStore((s) => s.toggleLayer);
  const navigateToElement = useUiStore((s) => s.navigateToElement);
  const navigateToSpecNode = useUiStore((s) => s.navigateToSpecNode);

  const { derived: model } = useModel();
  const { derived: spec } = useSpec();

  const key = `${sectionId}:${slug}`;
  const open = expandedLayers.has(key);
  const active = view === sectionId && layerId === slug;

  // Count: spec node-types for Schema (from `nodeSchemas` keys, so data-model is
  // non-zero), model elements for Model.
  const specInfo = spec.byLayer[slug];
  const modelNodes = model.nodesByLayer[slug];
  const count =
    sectionId === 'spec'
      ? specInfo?.typeCount ?? 0
      : modelNodes?.length ?? 0;

  // Model: the layer's elements under their node type, A–Z (#592).
  const typeGroups = useMemo(
    () => (sectionId === 'model' && open ? groupByType(slug, modelNodes ?? [], specInfo) : []),
    [sectionId, open, slug, modelNodes, specInfo],
  );

  const isActive = (id: string) => view === sectionId && layerId === slug && selectedId === id;

  return (
    <>
      <div style={{ position: 'relative' }}>
        <NavItem
          label={layerLabel(slug)}
          count={count}
          active={active}
          depth={1}
          aria-expanded={open}
          onClick={() => toggleLayer(sectionId, slug)}
        />
        <Chevron open={open} />
      </div>
      {/* Schema leaves: node-type titles. The leaf id is the spec_node_id
          (`<slug>.<shortname>`) so selecting it matches the graph node id the
          canvas / inspector operate on. */}
      {open &&
        sectionId === 'spec' &&
        (specInfo?.typeIds ?? []).map((t, i) => {
          const id = `${slug}.${t}`;
          return (
            <LeafRow
              key={id}
              label={specInfo?.typeTitles[i] ?? t}
              active={isActive(id)}
              className="drv-nav-l2"
              onSelect={() => navigateToSpecNode(id, slug)}
            />
          );
        })}
      {typeGroups.map((group) => {
        const groupOpen = groupState.openGroups.has(group.key);
        const n = group.nodes.length;
        const name = `${group.label}, ${n} ${n === 1 ? 'element' : 'elements'}`;
        return (
          <div key={group.key}>
            <div style={{ position: 'relative' }}>
              <NavItem
                label={group.label}
                count={n}
                depth={1}
                className="drv-nav-l2 drv-nav-group"
                aria-expanded={groupOpen}
                aria-label={name}
                title={name}
                data-testid={`nav-type-group-${group.key}`}
                onClick={() => groupState.toggleGroup(group.key)}
              />
              <Chevron open={groupOpen} />
            </div>
            {groupOpen &&
              group.nodes.map((node) => (
                <LeafRow
                  key={node.id}
                  label={node.name}
                  active={isActive(node.id)}
                  className="drv-nav-l3"
                  onSelect={() => navigateToElement(node.id, slug)}
                />
              ))}
          </div>
        );
      })}
    </>
  );
}

/** Changeset leaf rows (or a subtle empty hint when there are none). */
function ChangesetRows() {
  const view = useUiStore((s) => s.view);
  const changesetId = useUiStore((s) => s.changesetId);
  const selectChangeset = useUiStore((s) => s.selectChangeset);
  const { derived } = useChangesets();

  if (derived.list.length === 0) {
    return (
      <div
        style={{
          padding: '8px 10px 8px 34px',
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 11,
          color: 'rgb(var(--shell-fg-4))',
        }}
      >
        no changesets
      </div>
    );
  }

  return (
    <>
      {derived.list.map((cs) => {
        const active = view === 'changesets' && changesetId === cs.id;
        // The purpose (a dr CLI with purposes) rides in the row's name and tooltip: NavItem has no slot for it.
        const purpose = purposeLabel(cs.purpose);
        const label = purpose ? `${cs.name} · ${purpose}` : cs.name;
        return (
          <div key={cs.id} style={{ position: 'relative' }}>
            <NavItem
              label={cs.name}
              count={cs.changesCount}
              active={active}
              depth={1}
              onClick={() => selectChangeset(cs.id)}
              title={label}
              aria-label={label}
              data-purpose={cs.purpose}
            />
          </div>
        );
      })}
    </>
  );
}

export function NavTree() {
  const expandedSections = useUiStore((s) => s.expandedSections);
  const view = useUiStore((s) => s.view);
  const layerId = useUiStore((s) => s.layerId);
  const selectedId = useUiStore((s) => s.selectedId);
  const changesetId = useUiStore((s) => s.changesetId);
  const treeRef = useRef<HTMLDivElement>(null);
  // The leaf rows render from these, so a cold deep link (store set before the
  // data arrives) reveals the selected leaf once they load, not just its layer.
  const { derived: model } = useModel();
  const modelNodes = model.nodes.length;
  const changesetCount = useChangesets().derived.list.length;

  // Model type groups (#592): collapsed until opened. Local state on purpose —
  // not in uiStore or the URL — so opening a group pushes no history.
  const [openGroups, setOpenGroups] = useState<ReadonlySet<string>>(() => new Set());
  const toggleGroup = useCallback((key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);
  const groups = useMemo<GroupState>(() => ({ openGroups, toggleGroup }), [openGroups, toggleGroup]);

  // The type group holding the selected Model element, once the model has it.
  const selectedGroup = useMemo(() => {
    if (view !== 'model' || !layerId || !selectedId) return null;
    const node = model.nodesByLayer[layerId]?.find((n) => n.id === selectedId);
    return node ? typeGroupKey(layerId, node.type) : null;
  }, [view, layerId, selectedId, model.nodesByLayer]);

  // Open the selection's group whenever the selection changes (or the model it
  // needs arrives), wherever it was made. Closing it afterwards sticks until
  // the next selection.
  useEffect(() => {
    if (!selectedGroup) return;
    setOpenGroups((prev) => (prev.has(selectedGroup) ? prev : new Set(prev).add(selectedGroup)));
  }, [selectedGroup, selectedId]);
  const selectedGroupOpen = selectedGroup !== null && openGroups.has(selectedGroup);

  // Reveal the selection (#560): after any navigation — a nav click, a
  // cross-layer link, a deep link, back/forward — scroll the deepest active
  // row into view. `nearest` leaves it alone when it's already visible.
  useEffect(() => {
    const active = treeRef.current?.querySelectorAll<HTMLElement>('.nav-item--active');
    const deepest = active?.[active.length - 1];
    deepest?.scrollIntoView?.({ block: 'nearest' });
  }, [view, layerId, selectedId, changesetId, expandedSections, modelNodes, changesetCount, selectedGroupOpen]);

  return (
    <div
      ref={treeRef}
      className="drv-scroll drv-noscroll"
      style={{ flex: 1, overflowY: 'auto', padding: '8px' }}
      data-testid="nav-tree"
    >
      {SECTIONS.map((section) => {
        const open = expandedSections.has(section.id);
        return (
          <div key={section.id}>
            <SectionRow section={section} />
            {open && section.id === 'changesets' && <ChangesetRows />}
            {open &&
              section.id !== 'changesets' &&
              LAYER_ORDER.map((slug) => (
                <LayerRow key={slug} sectionId={section.id} slug={slug} groups={groups} />
              ))}
          </div>
        );
      })}
    </div>
  );
}

export default NavTree;
