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
 * Changesets groups its changesets under Open (staged, expanded by default)
 * and Closed (applied / discarded, collapsed by default), each with its count
 * (#625); an empty group is hidden, and with none at all a subtle hint shows.
 * Architecture lists the C4 diagrams: Context, Containers, then every container
 * and component that has parts, nested as the C4 model nests them
 * (`data/c4/c4Views.ts`'s `c4NavRows`); a row opens that diagram.
 *
 * First load (#636): until a read has answered, the rows it counts show no
 * count and an open section or layer says "Loading…" (`LoadStatus`) where it
 * would otherwise say it is empty; a failed first read says so instead. The
 * tree is `aria-busy` meanwhile. A refetch keeps the counts it has.
 *
 * Type groups (`data/navTreeGroups.ts`) start collapsed. Their open state is
 * local to the tree, not in `uiStore` or the URL, so opening one pushes no
 * history. The group holding the selected element opens whenever the
 * selection changes, wherever it came from (a nav click, the graph, a deep
 * link, a cross-layer navigate), so the reveal effect can scroll to its row.
 * The changeset groups work the same way, the selected changeset's group
 * opening on every selection change.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavItem, type IconName } from '@tinkermonkey/heimdall-ui';
import { useUiStore, type ViewKind } from './uiStore';
import { LAYER_ORDER, layerLabel, type LayerSlug } from './domain';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import { useChangesets } from '../data/useChangesets';
import { purposeLabel } from '../data/changesetPurpose';
import {
  changesetGroupKey,
  groupByType,
  groupChangesetsByState,
  typeGroupKey,
  type ChangesetGroupKey,
} from '../data/navTreeGroups';
import { specTypeLabel } from '../data/typeLabel';
import { useC4Model } from '../data/c4/useC4Model';
import { c4NavRows, defaultComponentScope, resolveScope } from '../data/c4/c4Views';
import { C4_SYSTEM_ID } from '../data/c4/c4Model';
import { combineLoadStates, loadStateOf, type LoadState } from '../data/loadState';
import { LoadStatus, busyProps } from './LoadStatus';

type SectionId = Extract<ViewKind, 'model' | 'spec' | 'changesets' | 'architecture'>;
/** The sections that list the spec's layers. */
type LayerSectionId = Extract<SectionId, 'model' | 'spec'>;

const SECTIONS: { id: SectionId; label: string; icon: IconName }[] = [
  { id: 'architecture', label: 'Architecture', icon: 'component' },
  { id: 'model', label: 'Model', icon: 'graph' },
  { id: 'spec', label: 'Schema', icon: 'schema' },
  { id: 'changesets', label: 'Changesets', icon: 'clock' },
];

/** The subtle line under a section or layer: an empty hint, Loading…, or a failed read. */
const hintStyle: React.CSSProperties = {
  padding: '8px 10px 8px 34px',
  fontFamily: "'JetBrains Mono',monospace",
  fontSize: 11,
  color: 'rgb(var(--shell-fg-4))',
};

/** The reads the Architecture rows are built from: the model and the spec's catalog. */
function useArchitectureLoadState(): LoadState {
  return combineLoadStates(loadStateOf(useModel()), loadStateOf(useSpec()));
}

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

  const changesetsQuery = useChangesets();
  const changesetsState = loadStateOf(changesetsQuery);
  const architectureState = useArchitectureLoadState();
  const { model: c4 } = useC4Model();
  const open = expandedSections.has(section.id);
  // Architecture counts its diagrams: Context, Containers, and one per element with parts.
  const diagrams = useMemo(() => 2 + c4NavRows(c4).length, [c4]);
  // No count until the read behind it has answered (#636).
  const count =
    section.id === 'changesets'
      ? changesetsState === 'ready'
        ? changesetsQuery.derived.list.length
        : undefined
      : section.id === 'architecture'
        ? architectureState === 'ready'
          ? diagrams
          : undefined
        : 12;

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
  sectionId: LayerSectionId;
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

  const modelQuery = useModel();
  const specQuery = useSpec();
  const model = modelQuery.derived;
  const spec = specQuery.derived;
  // Schema counts come from the spec, Model counts from the model.
  const state = loadStateOf(sectionId === 'spec' ? specQuery : modelQuery);

  const key = `${sectionId}:${slug}`;
  const open = expandedLayers.has(key);
  const active = view === sectionId && layerId === slug;

  // Count: spec node-types for Schema (from `nodeSchemas` keys, so data-model is
  // non-zero), model elements for Model.
  const specInfo = spec.byLayer[slug];
  const modelNodes = model.nodesByLayer[slug];
  const count =
    state !== 'ready'
      ? undefined
      : sectionId === 'spec'
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
      {open && (
        <LoadStatus
          state={state}
          error={sectionId === 'spec' ? 'could not load the spec' : 'could not load the model'}
          style={hintStyle}
        />
      )}
      {/* Schema leaves: node-type names (`typeLabel`'s full singular: the
          Schema view names a type in full). The leaf id is the spec_node_id
          (`<slug>.<shortname>`) so selecting it matches the graph node id the
          canvas / inspector operate on. */}
      {open &&
        sectionId === 'spec' &&
        (specInfo?.typeIds ?? []).map((t) => {
          const id = `${slug}.${t}`;
          return (
            <LeafRow
              key={id}
              label={specTypeLabel(specInfo, slug, t).singular}
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

/** The changeset rows' Open / Closed groups and how to toggle one (local tree state, #625). */
interface ChangesetGroupState {
  openGroups: ReadonlySet<ChangesetGroupKey>;
  toggleGroup: (key: ChangesetGroupKey) => void;
}

/**
 * The Changesets section's rows: Open (staged) then Closed (applied, discarded)
 * groups, each with its count, holding the changeset rows (#625). An empty
 * group is hidden; with no changesets at all, a subtle empty hint.
 */
function ChangesetRows({ groups: groupState }: { groups: ChangesetGroupState }) {
  const view = useUiStore((s) => s.view);
  const changesetId = useUiStore((s) => s.changesetId);
  const selectChangeset = useUiStore((s) => s.selectChangeset);
  const query = useChangesets();
  const { derived } = query;
  const state = loadStateOf(query);
  const groups = useMemo(() => groupChangesetsByState(derived.list), [derived.list]);

  if (state !== 'ready') {
    return (
      <LoadStatus
        state={state}
        error="could not load changesets"
        style={hintStyle}
        data-testid="nav-changesets-status"
      />
    );
  }
  if (derived.list.length === 0) {
    return <div style={hintStyle}>no changesets</div>;
  }

  return (
    <>
      {groups.map((group) => {
        const n = group.changesets.length;
        if (n === 0) return null;
        const groupOpen = groupState.openGroups.has(group.key);
        const name = `${group.label}, ${n} ${n === 1 ? 'changeset' : 'changesets'}`;
        return (
          <div key={group.key}>
            <div style={{ position: 'relative' }}>
              <NavItem
                label={group.label}
                count={n}
                depth={1}
                className="drv-nav-group"
                aria-expanded={groupOpen}
                aria-label={name}
                title={name}
                data-testid={`nav-changeset-group-${group.key}`}
                onClick={() => groupState.toggleGroup(group.key)}
              />
              <Chevron open={groupOpen} />
            </div>
            {groupOpen &&
              group.changesets.map((cs) => {
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
                      className="drv-nav-l2"
                      onClick={() => selectChangeset(cs.id)}
                      title={label}
                      aria-label={label}
                      data-purpose={cs.purpose}
                    />
                  </div>
                );
              })}
          </div>
        );
      })}
    </>
  );
}

/** The Architecture section's rows: the C4 diagrams, each opening its scope. */
function ArchitectureRows() {
  const view = useUiStore((s) => s.view);
  const c4Level = useUiStore((s) => s.c4Level);
  const c4Scope = useUiStore((s) => s.c4Scope);
  const showC4 = useUiStore((s) => s.showC4);
  const { model: c4 } = useC4Model();
  const state = useArchitectureLoadState();
  const rows = useMemo(() => c4NavRows(c4), [c4]);
  const active = view === 'architecture';
  // The scope actually drawn (a missing or unknown `?scope=` falls back to the default container).
  const drawn = active && c4Level === 'component' ? resolveScope(c4, c4Level, c4Scope) : null;

  return (
    <>
      <div style={{ position: 'relative' }}>
        <NavItem
          label="Context"
          active={active && c4Level === 'context'}
          depth={1}
          onClick={() => showC4('context')}
          data-testid="nav-c4-context"
        />
      </div>
      <div style={{ position: 'relative' }}>
        <NavItem
          label="Containers"
          count={state === 'ready' ? (c4.childrenOf.get(C4_SYSTEM_ID)?.length ?? 0) : undefined}
          active={active && c4Level === 'container'}
          depth={1}
          onClick={() => showC4('container')}
          data-testid="nav-c4-containers"
        />
      </div>
      {rows.map((row) => {
        const name = `${row.name}, ${row.childCount} ${row.childCount === 1 ? 'part' : 'parts'}`;
        return (
          <div key={row.id} style={{ position: 'relative' }}>
            <NavItem
              label={row.name}
              count={row.childCount}
              active={drawn === row.id}
              depth={1}
              className="drv-nav-l2 drv-nav-c4"
              style={{ '--c4-depth': row.depth } as React.CSSProperties}
              aria-label={name}
              title={name}
              onClick={() => showC4('component', row.id)}
              data-testid={`nav-c4-${row.id}`}
            />
          </div>
        );
      })}
      <LoadStatus state={state} error="could not load the model" style={hintStyle} />
      {state === 'ready' && rows.length === 0 && defaultComponentScope(c4) === null && (
        <div style={hintStyle}>no components</div>
      )}
    </>
  );
}

export function NavTree() {
  const expandedSections = useUiStore((s) => s.expandedSections);
  const view = useUiStore((s) => s.view);
  const layerId = useUiStore((s) => s.layerId);
  const selectedId = useUiStore((s) => s.selectedId);
  const changesetId = useUiStore((s) => s.changesetId);
  const c4Level = useUiStore((s) => s.c4Level);
  const c4Scope = useUiStore((s) => s.c4Scope);
  const treeRef = useRef<HTMLDivElement>(null);
  // The leaf rows render from these, so a cold deep link (store set before the
  // data arrives) reveals the selected leaf once they load, not just its layer.
  const modelQuery = useModel();
  const specQuery = useSpec();
  const changesetsQuery = useChangesets();
  const model = modelQuery.derived;
  const modelNodes = model.nodes.length;
  const changesetList = changesetsQuery.derived.list;
  const treeState = combineLoadStates(
    loadStateOf(modelQuery),
    loadStateOf(specQuery),
    loadStateOf(changesetsQuery),
  );
  const changesetCount = changesetList.length;

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

  // Changeset groups (#625): Open starts expanded, Closed collapsed. Local
  // state for the same reason as the type groups: a toggle pushes no history.
  const [openChangesetGroups, setOpenChangesetGroups] = useState<ReadonlySet<ChangesetGroupKey>>(
    () => new Set<ChangesetGroupKey>(['open']),
  );
  const toggleChangesetGroup = useCallback((key: ChangesetGroupKey) => {
    setOpenChangesetGroups((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);
  const changesetGroups = useMemo<ChangesetGroupState>(
    () => ({ openGroups: openChangesetGroups, toggleGroup: toggleChangesetGroup }),
    [openChangesetGroups, toggleChangesetGroup],
  );

  // The group holding the selected changeset, once the list has it: opened on
  // every selection change, so a deep link to an applied changeset shows its row.
  const selectedChangesetGroup = useMemo(() => {
    if (view !== 'changesets' || !changesetId) return null;
    const cs = changesetList.find((c) => c.id === changesetId);
    return cs ? changesetGroupKey(cs.status) : null;
  }, [view, changesetId, changesetList]);
  useEffect(() => {
    if (!selectedChangesetGroup) return;
    setOpenChangesetGroups((prev) =>
      prev.has(selectedChangesetGroup) ? prev : new Set(prev).add(selectedChangesetGroup),
    );
  }, [selectedChangesetGroup, changesetId]);
  const selectedChangesetGroupOpen =
    selectedChangesetGroup !== null && openChangesetGroups.has(selectedChangesetGroup);

  // Reveal the selection (#560): after any navigation — a nav click, a
  // cross-layer link, a deep link, back/forward — scroll the deepest active
  // row into view. `nearest` leaves it alone when it's already visible.
  useEffect(() => {
    const active = treeRef.current?.querySelectorAll<HTMLElement>('.nav-item--active');
    const deepest = active?.[active.length - 1];
    deepest?.scrollIntoView?.({ block: 'nearest' });
  }, [view, layerId, selectedId, changesetId, expandedSections, modelNodes, changesetCount, selectedGroupOpen, selectedChangesetGroupOpen, c4Level, c4Scope]);

  return (
    <div
      ref={treeRef}
      className="drv-scroll drv-noscroll"
      style={{ flex: 1, overflowY: 'auto', padding: '8px' }}
      data-testid="nav-tree"
      {...busyProps(treeState)}
    >
      {SECTIONS.map((section) => {
        const open = expandedSections.has(section.id);
        return (
          <div key={section.id}>
            <SectionRow section={section} />
            {open && section.id === 'changesets' && <ChangesetRows groups={changesetGroups} />}
            {open && section.id === 'architecture' && <ArchitectureRows />}
            {open &&
              (section.id === 'model' || section.id === 'spec') &&
              LAYER_ORDER.map((slug) => (
                <LayerRow key={slug} sectionId={section.id as LayerSectionId} slug={slug} groups={groups} />
              ))}
          </div>
        );
      })}
    </div>
  );
}

export default NavTree;
