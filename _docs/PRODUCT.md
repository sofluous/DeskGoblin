# DeskGoblin product and architecture

Updated: 2026-10-23. Runtime baseline: `57150f4`, app version `0.11`.

## Goal and current functionality

DeskGoblin animates a desk character in response to typing/clicking within its browser page. It is a static browser app with no backend, desktop wrapper, or system-wide input capture.

Implemented in source; interactive browser acceptance is pending:

| Area | Behavior |
| --- | --- |
| Character | Canvas rig, keyboard/mouse reactions, idle expressions, ambient fly and smash reaction |
| Characters | Test Goblin, Moss Goblin, Neon Gremlin, manifest-loaded Fox |
| Editor | Grouped selection, collapse/visibility, asset assignment, layer order, placement tweaks, arm pivots/hand anchors, rig/isolate modes, JSON copy/download |
| Timer | 5/15/30-minute presets, start/pause/reset, completion reaction; wall-clock deadline independent of rendering |
| Pasteboard | Clipboard text/images, draggable wall notes, copy/export/delete, local-storage persistence |
| Chance | Hold/release dice and Magic 8 Ball, random number generator |
| Shell | Collapsible panel, side selection, utility/editor/debug/settings tabs, shared themes, nine scene palettes |

## Runtime ownership

Classic scripts load in order: bundled theme registry/selector, features, skins, editor, UI, then inline app. App factories attach to `window.DeskGoblin`.

| File | Owns |
| --- | --- |
| `index.html` | CSS/markup, bootstrap, layout/slots, input, update/draw, procedural/custom rendering, arms, Chance logic, integration |
| `js/deskgoblin-features.js` | Active app-state, timer, pasteboard, ambient-fly factories |
| `js/deskgoblin-skins.js` | Grouped normalization, derived layer state, v3 serialization |
| `js/deskgoblin-editor.js` | Inspector/cache, grouped rows, live render model, image loading, export integration |
| `js/deskgoblin-ui.js` | Panel/tabs, theme/palette setup, character selectors |
| `design-system/` | Bundled theme CSS/registry/selector; VERSION records a March 27 build |

`js/app-state.js` and `js/features/{timer,pasteboard,ambient}.js` are not loaded. They overlap the active feature bundle and have diverged. Do not edit them expecting live behavior; consolidate deliberately under DG-03.

## Data and persistence

- `skins/index.json` registers asset skins; currently only Fox.
- `skins/<id>/manifest.json` is authoritative on load. Fox is v3, with 14 groups and 24 layers.
- Saved data uses `version`, `groupOrder`, grouped `parts`, `slotTweaks`, and `render`. Layer IDs must be unique across a skin because lookup is keyed by layer ID.
- `partsMap`, `visibleParts`, `drawOrder`, `partTweaks`, and `groupConfigs` are derived runtime/editor views, not canonical saved fields.
- Editor changes live in memory. Copy/download a manifest and manually replace the source file to persist them. There is no automatic file write or manifest-import UI.
- Stickies use `deskgoblin.stickies`; theme/palette use `deskgoblin.theme` and `deskgoblin.canvasPalette`. Browser storage is origin-specific; use a stable URL/port.
- Clipboard support depends on browser APIs, secure context, and permissions. Iconoir CSS is external and references upstream `main`; offline icon availability is not guaranteed.

## Rendering contract and known gaps

Grouped rendering uses a contain-fit scale from slot bounds, then group/layer scale and offset. Stretch arms have separate rig math. This differs from the original native-pixel-size proposal.

- `nativeSize` and `defaultScaleMode` are parsed/exported but do not select rendering policy.
- Group/layer offset and scale are normalized, rendered, and preserved by export (DG-02 implemented).
- General part rotation is not implemented by the manifest normalizer.
- Legacy flat manifests are unsupported. Version is read, but there is no strict schema-version rejection gate.

## Stability boundaries

Keep scene/render ownership inline during stabilization. Retain wrappers/delayed assignment around optional helpers and avoid parse-time dependencies on uninitialized scene state. The loop is scheduled before manifest loading; current warning/fallback paths improve resilience without guaranteeing every setup failure is isolated.

Preserve editor/render agreement, model-space left/right, arm overlays, and cleanup of editor modes on tab/character changes. Delay update/draw, arm sequencing, head rendering, and shared slot-math extraction until browser regression checks pass. Prefer small fixes with explicit dependencies over a framework rewrite.

## Timer timekeeping

The active timer uses a `Date.now()` deadline with an injectable clock for tests. Background/system-sleep time counts; the next frame reconciles remaining time and fires completion once. Pause reconciles elapsed time before stopping; paused time is excluded. Starting after completion begins a fresh interval. Reset/preset changes cancel the deadline. Manual system-clock changes affect the countdown. There is no background notification scheduler: feedback occurs when the page next updates.
