# Changeset review clarity (Claude Design canvas)

Design references for the changeset review slate planned in the DR changeset
`changeset-review-clarity` (`documentation-robotics/changesets/changeset-1794952978049-6f5oaeakc/`).
They are HTML prototypes, not code to lift: the build recreates them with heimdall-ui and the
viewer's own patterns.

| Board | What it shows |
|-------|---------------|
| `Main.dc.html` | Review list: labelled columns, change chip vs decision pill, link chains, legend |
| `ElementInspector.dc.html` | Added element: layer band, +1 neighbourhood, links grouped Out of / Into |
| `LinkInspector.dc.html` | Added link: source card → predicate → target card |
| `Impact.dc.html` | Impact tab: find, filter facets, focus |

`canvas.json` holds the board layout and the canvas notes (what the feedback traced to). The
boards load `ds/heimdall/colors_and_type.css` from the Heimdall design system, which is not
copied here (see `design/_ds/`).

**Where the build departs from the boards:** the inspector neighbourhood is drawn as wrapped
layer lanes rather than a lanes graph (a GraphCanvas lane is one row per layer and unreadable at
inspector width), and Impact's find uses heimdall-ui's `FilterBar`.
