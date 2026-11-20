/**
 * ChangeLinkCard — a link change in the change inspector as source card →
 * predicate → target card, in the same top-to-bottom order as the Model
 * view's EdgeInspector (source node, edge, target node). Each card shows the
 * end's layer (colour bar), layer and type, name, description and whether
 * this changeset adds it (NEW) or it's already in the model; the predicate
 * shows what it means. The raw `source::predicate::target` id folds under
 * Identifier.
 */

import { useMemo } from 'react';
import { layerColor, layerLabel } from './domain';
import { useModel } from '../data/useModel';
import { buildModelIndex, resolveEndpoint } from '../data/modelGraph';
import { predicateDefinition } from '../data/predicateDefinitions';
import type { LinkEnd, ReviewItem, ReviewModel } from '../data/changesetReview';

function descriptionOf(end: LinkEnd, model: ReviewModel, modelDescription: (id: string) => string | undefined): string | undefined {
  if (end.isNew) {
    const add = model.items.find((i) => i.kind === 'add' && i.elementId === end.id);
    const d = add?.record.after?.description;
    return typeof d === 'string' && d ? d : undefined;
  }
  return modelDescription(end.id);
}

function EndCard({ role, end, description }: { role: 'Source' | 'Target'; end: LinkEnd; description?: string }) {
  return (
    <div className={`drv-endcard${end.isNew ? ' drv-endcard--new' : ''}`} data-testid={`link-card-${role.toLowerCase()}`}>
      <span aria-hidden="true" className="drv-endcard__bar" style={{ background: layerColor(end.layerId) }} />
      <span className="drv-endcard__body">
        <span className="drv-endcard__top">
          <span className="drv-eyebrow">
            {role} · {layerLabel(end.layerId).toLowerCase()} · {end.typeName}
          </span>
          {end.isNew ? (
            <span className="drv-new">NEW</span>
          ) : (
            <span className="drv-muted" style={{ fontSize: 10.5 }}>
              in the model
            </span>
          )}
        </span>
        <span className="drv-endcard__name">{end.name}</span>
        {description && <span className="drv-endcard__desc">{description}</span>}
      </span>
    </div>
  );
}

export function ChangeLinkCard({ item, model }: { item: ReviewItem; model: ReviewModel }) {
  const { derived } = useModel();
  const index = useMemo(() => buildModelIndex(derived), [derived]);
  if (!item.ends || !item.link) return null;
  const { source, target } = item.ends;
  const modelDescription = (id: string) => {
    const d = resolveEndpoint(index, id)?.description;
    return typeof d === 'string' && d ? d : undefined;
  };
  const definition = predicateDefinition(item.link.predicate);
  return (
    <div className="drv-linkcard" data-testid="change-link-card">
      <EndCard role="Source" end={source} description={descriptionOf(source, model, modelDescription)} />
      <div className="drv-linkcard__edge">
        <span aria-hidden="true" className="drv-linkcard__rail" />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span className="drv-chain__pred" style={{ fontSize: 13 }}>
            <span aria-hidden="true">↓</span> {item.link.predicate}
          </span>
          <span className="drv-muted" style={{ fontSize: 11.5 }}>
            {definition?.description ?? `${source.typeName} ${item.link.predicate} ${target.typeName}`}
            {definition ? ` · ${definition.category}` : ''}
          </span>
        </span>
      </div>
      <EndCard role="Target" end={target} description={descriptionOf(target, model, modelDescription)} />
      <details className="drv-ident">
        <summary className="drv-muted">Identifier</summary>
        <span className="drv-mono drv-muted" style={{ fontSize: 11, wordBreak: 'break-all' }}>
          {item.elementId}
        </span>
      </details>
    </div>
  );
}

export default ChangeLinkCard;
