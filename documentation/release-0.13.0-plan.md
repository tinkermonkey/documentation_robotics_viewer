# Viewer 0.13.0 release plan

Drafted 2026-11-20. Base: `origin/main` at 9ed056e, last release v0.12.0 (2026-11-19).

## Where things stand

### Unreleased on main (merged since v0.12.0)

| PR | What | Closes |
|----|------|--------|
| #598 | Light canvas and DrBot closed on a first visit | #596 |
| #599 | Node descriptions above the facts, as markdown | #593 |
| #600 | Model nav tree grouped by node type | #592 |
| #601 | Topbar type-ahead search over elements and node types | #595 |
| #602 | Model view by type: lanes or a hive | #594 |
| #603 | Floating DrBot panel with an opt-in Dock | #597 (not linked in the PR) |
| #604 | Stop tracking the active-changeset pointer | — |
| #606 | Land the first-visit defaults DR plan | — |
| #607 | E2E: schema node-type counts read from the live spec | — |

CI is green on 9ed056e (Vitest gate + E2E, CI/CD). `CHANGELOG.md` has an empty `[Unreleased]` section.

### Open tickets

- **#588 Render changeset descriptions as markdown.** Not blocked: CLI issue
  documentation_robotics#1210 (descriptions as markdown) is still open, but plain text is valid
  markdown, so the viewer can render it now. `MarkdownText` from #599 already exists for this.
  Touches `ChangesetCanvas.tsx:310`, `ChangesetInbox.tsx:107` and the inspector overview.
- **#605 One shared label for a node type.** Three forms today: nav tree raw title
  (`navTreeGroups.ts`), lanes/hive `typeBandLabel` (`typeBands.ts:55`), Impact `pluralType`
  (`changesetImpact.ts:425`). It has two open questions (below).

### In-progress and loose ends

- **No open PRs and no staged DR changesets.** All 22 changesets are committed; none active.
- **The viewer's own model is on spec 0.13.0**; the installed dr CLI is 0.6.0 (spec 0.14.0).
  `project_status` asks for `project_upgrade`.
- **Code drift since the last as-built sync** (`model-sync-2026-11-18`): 66 commits, 88 files.
  The per-feature plans landed, but no as-built extraction has reconciled them.
- **Main checkout** (`~/workspace/documentation_robotics_viewer`) is 73 commits behind
  `origin/main` and has 58 uncommitted files: the dr Claude integration refreshed by CLI 0.5.0
  (`.claude/.dr-version` 0.2.0 → 0.5.0, new `dr-plan`, `dr-analyzer`, `dr_change_planning`).
  CLI 0.6.0 is now installed, so that refresh is already stale.
- **Stale branch** `origin/auto/api-spec-sync` (2026-11-19, no PR). Today's sync run says main is in
  sync with upstream, so the branch is superseded.
- **Worktree `changeset-viewer-ux-60093d`** (session "Changeset viewer UX refinements", PR #577
  merged): on merged branch `claude/schema-test-spec-count`, with one untracked folder, a
  discarded as-built changeset (`changeset-1795027651695-xrmphv29h`). Nothing to keep.
- **Downstream:** dr CLI 0.6.0 (released 2026-11-20) bundles viewer **0.12.0**. Its
  `cli/scripts/download-viewer.sh` pins `VIEWER_VERSION`; the next CLI release picks up 0.13.0.
- **heimdall-ui 0.13.0** is on npm (pinned 0.12.0). Optional for this release.

## Plan

Each feature goes through `/dr-plan`: a staged plan changeset before the code, and an as-built
verify before the PR merges. I'll confirm each changeset's name and intent with you before
creating it.

### 1. Housekeeping (one small PR, `chore/dr-0.14`)

1. `project_upgrade` preview → show you → apply: model spec 0.13.0 → 0.14.0. If it writes an
   `upgrade-drops-0.14.0` record, review it in the viewer and discard it (it never lands).
2. Refresh the dr Claude integration with CLI 0.6.0 in this worktree (not the main checkout) and
   commit `.claude/` together with the upgrade.
3. Delete `origin/auto/api-spec-sync`.

### 2. #605 — one node-type label (PR, closes #605)

- Plan changeset `node-type-label`. New `data/typeLabel.ts` (from `typeBandLabel`): singular,
  plural, short form (layer word dropped). Use it in the nav tree groups, lanes/hive bands, Impact
  group nodes, Schema and page headers; leave type ids, `NodeTypeBadge` and spec tooltips alone.
- Unit tests over real fixture titles (multi-word, irregular plurals, title not starting with
  the layer name); update affected component and E2E tests (`openLayer` uses the group label).
- **Your answers needed.** My recommendations:
  - Drop the layer word only inside views scoped to one layer (nav tree under a layer, lanes,
    hive). Keep the full title where several layers mix: search results, Impact, Schema.
  - Count as "Components · 37" everywhere (what the lanes already do).

### 3. #588 — changeset descriptions as markdown (PR, closes #588)

- Plan changeset `changeset-description-markdown`. `MarkdownText` in the canvas header (folds
  behind "Show more" past a few lines) and the inspector overview. On the inbox card, an inline
  excerpt: first paragraph only, code spans and emphasis, no lists.
- Tests: raw HTML not rendered, `javascript:` links stripped, plain text reads as before, excerpt
  takes only the first paragraph.
- Can run in parallel with #605: they touch different files.

### 4. Reconcile the model with the code (PR)

After 2 and 3 merge: `codebase_extract` (no `since`, or since the 2026-11-18 sync commit), review the
as-built changeset in the viewer, land it as the release's model sync (as 0.12.0 did with #581).
This clears the 66-commit drift.

### 5. Release 0.13.0 (PR `release/0.13.0`)

1. `CHANGELOG.md` `[0.13.0]`: Added (search, nav by type, model view by type, floating DrBot,
   node descriptions, markdown changeset descriptions), Changed (light canvas and DrBot closed on
   a first visit, one node-type label), Fixed/Chores (active-changeset pointer untracked, E2E spec
   counts). Note that it works with CLI 0.5.0 and 0.6.0.
2. Bump `package.json` / `package-lock.json` to 0.13.0; `npm test`, `npm run test:types`,
   `npx tsc --noEmit`, `npm run build`, `npm run test:e2e` against CLI 0.6.0.
3. Live check on `dr visualize` 0.6.0 (light + dark): search, nav groups, lanes/hive, DrBot
   panel and dock, a changeset with a markdown description.
4. Merge, tag `v0.13.0`, GitHub Release with `dr-viewer-bundle-0.13.0.zip` (as 0.12.0).
5. Downstream: CLI PR bumping `VIEWER_VERSION` to 0.13.0 in documentation_robotics
   (with your OK; not released here).

### 6. Tidy up

Remove the `changeset-viewer-ux-60093d` worktree and archive its session; discard the main
checkout's stale `.claude/` changes and fast-forward it to `origin/main`. Both only with your OK.

## Out of scope

- heimdall-ui 0.13.0 bump: separate PR after release unless it fixes something listed here.
- Element descriptions as markdown everywhere (raised in documentation_robotics#1210).
- CLI release itself.
