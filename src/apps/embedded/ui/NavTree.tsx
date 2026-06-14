/**
 * NavTree — 3-level hierarchical navigation (Section -> Layer -> Element).
 *
 * Heimdall's <Sidebar> is only 2-level, so this is built on Heimdall's <NavItem>
 * + the design's `nav-item` / `drv-nav-l2` / `drv-chev` helper classes
 * (see domain-and-nav.css). The 12 layers come from `domain.ts`; counts come
 * from the live model (`useModel`) and spec (`useSpec`); leaves are element
 * names (Model) or node-type names (Schema). Changesets lists changesets, or a
 * subtle empty hint when the model has none.
 */

import { Icon, type IconName } from '@tinkermonkey/heimdall-ui';
import { useUiStore, type ViewKind } from './uiStore';
import { LAYER_ORDER, layerLabel, type LayerSlug } from './domain';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import { useChangesets } from '../data/useChangesets';

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
      <button
        type="button"
        className={`nav-item${view === section.id ? ' nav-item--active' : ''}`}
        onClick={() => toggleSection(section.id)}
      >
        <Icon name={section.icon} size={16} className="nav-item__icon" />
        <span className="nav-item__label">{section.label}</span>
        <span className="nav-item__count">{count}</span>
      </button>
      <Chevron open={open} />
    </div>
  );
}

/** A level-1 (layer) row + its expanded element/node-type leaves. */
function LayerRow({
  sectionId,
  slug,
}: {
  sectionId: SectionId;
  slug: LayerSlug;
}) {
  const view = useUiStore((s) => s.view);
  const layerId = useUiStore((s) => s.layerId);
  const selectedId = useUiStore((s) => s.selectedId);
  const expandedLayers = useUiStore((s) => s.expandedLayers);
  const toggleLayer = useUiStore((s) => s.toggleLayer);
  const selectNode = useUiStore((s) => s.selectNode);

  const { derived: model } = useModel();
  const { derived: spec } = useSpec();

  const key = `${sectionId}:${slug}`;
  const open = expandedLayers.has(key);
  const active = view === sectionId && layerId === slug;

  // Count: spec node-types for Schema (from `nodeSchemas` keys, so data-model is
  // non-zero), model elements for Model.
  const specInfo = spec.byLayer[slug];
  const modelNodes = model.nodesByLayer[slug] ?? [];
  const count =
    sectionId === 'spec'
      ? specInfo?.typeCount ?? 0
      : modelNodes.length;

  // Leaves: element names (Model) or node-type titles (Schema). Schema leaf id
  // is the spec_node_id (`<slug>.<shortname>`) so selecting it matches the
  // graph node id the canvas / inspector operate on.
  const leaves: { id: string; label: string }[] =
    sectionId === 'spec'
      ? (specInfo?.typeIds ?? []).map((t, i) => ({
          id: `${slug}.${t}`,
          label: specInfo?.typeTitles[i] ?? t,
        }))
      : modelNodes.map((n) => ({ id: n.id, label: n.name }));

  return (
    <>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          className={`nav-item nav-item--depth-1${active ? ' nav-item--active' : ''}`}
          onClick={() => toggleLayer(sectionId, slug)}
        >
          <span className="nav-item__label">{layerLabel(slug)}</span>
          <span className="nav-item__count">{count}</span>
        </button>
        <Chevron open={open} />
      </div>
      {open &&
        leaves.map((leaf) => {
          const leafActive =
            view === sectionId && layerId === slug && selectedId === leaf.id;
          return (
            <div key={leaf.id} style={{ position: 'relative' }}>
              <button
                type="button"
                className={`nav-item nav-item--depth-1 drv-nav-l2${
                  leafActive ? ' nav-item--active' : ''
                }`}
                onClick={() => selectNode(leaf.id)}
                title={leaf.label}
              >
                <span className="nav-item__label">{leaf.label}</span>
              </button>
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
        return (
          <div key={cs.id} style={{ position: 'relative' }}>
            <button
              type="button"
              className={`nav-item nav-item--depth-1${active ? ' nav-item--active' : ''}`}
              onClick={() => selectChangeset(cs.id)}
              title={cs.name}
            >
              <span className="nav-item__label">{cs.name}</span>
              <span className="nav-item__count">{cs.changesCount}</span>
            </button>
          </div>
        );
      })}
    </>
  );
}

export function NavTree() {
  const expandedSections = useUiStore((s) => s.expandedSections);

  return (
    <div
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
                <LayerRow key={slug} sectionId={section.id} slug={slug} />
              ))}
          </div>
        );
      })}
    </div>
  );
}

export default NavTree;
