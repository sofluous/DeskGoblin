# DeskGoblin Development

Read [README](README.md) for setup/checks and required assets.

- Preserve grouped v3 skin manifests, transforms/editor export, timer wall-clock deadlines, and local pasteboard/state contracts. Do not equate existing structural tests with full canvas/editor acceptance.
- Runtime inputs are `index.html`, `js/`, `skins/`, `icons/`, and `design-system/`. Keep registered skin manifests and image layers together; `_resources/` is unreviewed local source material, not disposable output.
- From this directory run `node tests/check-baseline.cjs` and `node --test tests/stabilization.test.cjs`. Required checks must not depend on outer docs. No package/build/lint or configured browser suite exists.
- Follow applicable parent instructions when available. Optional local context is `../_docs/README.md`; clones retain essential setup/check commands here. Preserve unrelated changes and report unverified browser/clipboard behavior.
