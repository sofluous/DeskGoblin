# DeskGoblin QA

Updated: 2026-10-23. Runtime baseline: `57150f4`.

## Recorded verification

See [audit evidence](data/audit-2026-10-23.md). Structural/module checks passed; targeted probes reproduced DG-01/DG-02. No browser rendering, accessibility, clipboard, or visual acceptance is claimed. There is no application build, package manifest, configured lint command, or browser-test suite at this baseline.

## Repeatable check

From `_DeskGoblin` using Node.js (audit: v24.14.1):

```powershell
node _docs/data/check-baseline.cjs
node --test tests/stabilization.test.cjs
```

Checks syntax, local HTML dependencies, docs links/JSON, registered skin files, and existing skin normalize/export/reload fields. Exits nonzero on structural failure. Does not execute the DOM/canvas app or establish full manifest fidelity. Add focused regressions when fixing defects; do not enshrine known bugs as expected passing behavior.

## Browser smoke checklist: pending

Serve via README. Record date, browser/version, origin, viewport, theme, character, actual results, console errors, and failed requests. Start with fresh storage and repeat persistence checks after reload.

- [ ] Initial scene renders without uncaught errors or missing local resources.
- [ ] Test/Moss/Neon react to keyboard press/release and mouse movement/buttons.
- [ ] Fox loads with correct proportions, left/right semantics, arm overlays, and ears/head/body draw order.
- [ ] Fly movement/smash and idle expressions recover normally.
- [ ] Info/Timer/Chance/Editor/Debug/Settings switch; collapse/expand/side controls work.
- [ ] Editor selection/highlight, collapse/visibility, file assignment/order, isolate/rig, slot editing, and arm anchors work.
- [ ] Leaving Editor or switching characters clears rig/isolate state.
- [ ] Export, manually replace a backed-up test manifest, reload, compare settings; restore original fixture afterward.
- [ ] Timer presets/start/pause/reset/completion; compare low-FPS/background elapsed time (DG-01 implemented; browser check pending).
- [ ] Paste text/image notes, drag at multiple scales, copy/export/delete, reload to verify persistence.
- [ ] Deny clipboard and simulate storage denial/quota exhaustion; inspect feedback and scene survival (DG-04 open).
- [ ] Dice/8 Ball release outside control; rapid input respects reveal lock; RNG respects ranges.
- [ ] Narrow/mobile viewport: editor scrolls and controls remain reachable.
- [ ] Keyboard focus and icon labels; light/dark/high-style themes against workspace design guidance.
- [ ] `file://` retains procedural characters and explains custom-skin limitation.

## Risk and edge-case priorities

Boot order/loop survival; independent timer timekeeping; manifest round-trip fidelity and malformed/duplicate/missing data; arm/editor/render agreement; storage quota/denial and malformed note records; clipboard denial/unsupported APIs. Sticky drag rebuilds note DOM per movement: measure before optimizing if many/large notes cause performance trouble.

Before UI changes read workspace `../_DesignSystem/design.md` and its linked validation checklist. Keep unperformed checks unchecked.

## Stabilization follow-up results

DG-01/DG-02 implemented on 2026-10-23: all six tests in `tests/stabilization.test.cjs` passed, along with structural checks and `git diff --check`. Tests cover low FPS, suspended loops, pause/resume, reset/presets, one-shot completion/restart, calibrated transforms, live editor overrides, and repeated exports. These supersede the initial defect probes; browser checks remain pending.
