repo: tinkermonkey/documentation_robotics
branch: main
path: spec/

## Last sync
date: 2026-08-13T01:11:09Z

### Updated in this project
- Added a page view (layer / node detail) alongside the graph view.
- Layer pages carry real spec metadata: `inspired_by` standard, version, URL, node-type lists from `spec/layers/*.layer.json`.
- Spec node pages carry attributes, valid outgoing/incoming relationship schemas (predicate, cardinality, strength, required) and model instances.
- Model node pages carry SpecNode identity (path, uuid, spec_node_id), source_reference provenance, repository/commit, and lifecycle metadata.

## Screen map
| Screen | Built from |
| --- | --- |
| Layer page | spec/dist/manifest.json, spec/layers/*.layer.json |
| Spec node page | spec/schemas/base/spec-node.schema.json, spec/schemas/base/spec-node-relationship.schema.json, spec/schemas/nodes/data-model/* |
| Model node page | spec/schemas/base/spec-node.schema.json, spec/schemas/base/model-node-relationship.schema.json, spec/schemas/base/source-references.schema.json |
| Graph view | spec/dist/*.json (node types + relationship schemas) |
