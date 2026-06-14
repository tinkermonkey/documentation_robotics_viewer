# Test fixtures

Real `/api/*` responses captured from a running `dr visualize` backend. These
make the data-transform unit tests deterministic (no live server needed at test
time).

| File | Source endpoint | Captured shape |
|---|---|---|
| `model.json` | `GET /api/model` | `{ nodes (285), links (445) }` |
| `spec.json` | `GET /api/spec` | `schema-collection` (16 layer schemas) |
| `changesets.json` | `GET /api/changesets` | `{ version, changesets: { [id]: … } }` (3 changesets) |
| `changeset-detail.json` | `GET /api/changesets/<first id>` | `{ id, name, stats, changes: [...] }` |

## Refreshing

Start a backend against a known `.dr` model, then re-capture:

```bash
# Terminal 1 — serve the model (do NOT use a developer's working model for
# stable counts; a dedicated fixtures .dr model is ideal).
dr visualize --no-auth --port 8080

# Terminal 2 — re-capture (pretty-printed for readable diffs)
BASE=http://localhost:8080
curl -s $BASE/api/model      | python3 -m json.tool > tests/fixtures/model.json
curl -s $BASE/api/spec       | python3 -m json.tool > tests/fixtures/spec.json
curl -s $BASE/api/changesets | python3 -m json.tool > tests/fixtures/changesets.json

FIRST=$(curl -s $BASE/api/changesets \
  | python3 -c "import sys,json; print(list(json.load(sys.stdin)['changesets'].keys())[0])")
curl -s "$BASE/api/changesets/$FIRST" | python3 -m json.tool > tests/fixtures/changeset-detail.json
```

If counts change (nodes/links/changesets), update the corresponding assertions in
`tests/unit/*.spec.ts` (they intentionally hard-assert the live numbers so a
fixture drift or a transform regression is caught loudly).
