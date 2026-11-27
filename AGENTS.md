# Agent notes

This repository is a static GitHub Pages site for browsing classified public posts by @Khazix0918.

## Do not hand-edit data

- `data/catalog.json` is maintained by an automated monitor. Never rewrite item titles, summaries, ids, classifications, counts, or coverage notes.
- If you need a fixture, copy a small sample elsewhere. Do not shrink or reformat the live catalog just to make a demo.
- `taxonomy.md` explains the form × topic scheme. Keep frontend labels consistent with `data.taxonomy` in the JSON when possible (the page already reads names and definitions from the JSON).

## Catalog schema

Top-level keys: `source`, `timezone`, `checked_at`, `newest_post_id`, `oldest_post_id`, `coverage_note`, `taxonomy`, `counts`, `items`.

Each item: `id`, `created_at_shanghai`, `form`, `topic`, `topic_secondary` (string or null), `title`, `summary`, `url`, `article_url` (may be null), `likes`.

Forms: `article`, `main`, `reply`, `note`.
Topics: `model-review`, `workflow`, `industry`, `creation`, `tools`, `hiring`, `misc`.
Topic filters should match either `topic` or `topic_secondary`.

## Frontend

- Entry: `index.html`
- Styles: `css/app.css`
- Logic: `js/app.js` (loads `data/catalog.json` via `fetch`)
- No bundler and no server-side code. Keep it static so GitHub Pages keeps working.
- Local preview: from the repo root, `python3 -m http.server 4173`, then open http://127.0.0.1:4173/
- Opening `index.html` as a file will fail to load JSON; do not "fix" this by inlining the whole catalog into the HTML.

## Deploy

GitHub Pages is served from this repository. Workflow: `.github/workflows/pages.yml`. Expected URL: https://yhcheng96.github.io/khazix-catalog/
