# DeskGoblin

Static browser canvas character/editor with timer and local pasteboard features. Input reactions occur within its browser page, not system-wide.

From this repository directory, use Python 3 to serve:

```text
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://localhost:8000/`; stop with Ctrl+C. Local HTTP supports skin-manifest fetches and browser clipboard APIs, which still require browser permissions. No package installation/build is configured.

With Node (validated with 24.14.1), from this directory:

```text
node tests/check-baseline.cjs
node --test tests/stabilization.test.cjs
```

The first checks script syntax, local HTML assets, registered skin files and manifest/export round trips. The second covers timer and transform-export stabilization. Optional local docs are checked separately; neither command needs them. No separate build/lint or browser suite is configured. Rendering, editor interactions, clipboard, responsive behavior, and full export fidelity need browser review.

Keep `js/`, `skins/` manifests/images, `icons/`, and `design-system/` with `index.html`; required checks stay under `tests/`. Do not upload ignored local `_resources/` or historical material without classification. No hosting configuration is supplied; Git inclusion and deployment inclusion differ.

See [AGENTS.md](AGENTS.md). Full-workspace docs at `../_docs/README.md` are optional and may be absent in clones.
