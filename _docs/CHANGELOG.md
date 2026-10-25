# DeskGoblin Changelog

## 2026-03-22
- Added project `_docs` structure for DeskGoblin
- Documented current skin mapping issues and target grouped rig model
- Added implementation roadmap for a v2 skin manifest schema
- Added migration notes for converting flat manifests to grouped parts
- Added runtime support for grouped skin manifests in `index.html`
- Added legacy flat-manifest grouping so existing skins can render through grouped parent transforms
- Refined the editor table into compact grouped rows with collapse and visibility controls
- Added editor-only panel expansion and quieter hover-based row actions
- Added canvas selection overlay so the active editor asset is highlighted on the character
- Simplified editor naming and changed the asset column to a compact attachment selector
- Added a solo-selected editor mode to isolate the active asset on the canvas
- Added a first-pass T-mode with neutral pose rendering and slot skeleton overlays
- Added direct on-canvas editing for the selected T-mode slot box

## 2026-03-23
- Added lightweight idle face animations so the goblin occasionally smirks, squints, or perks up between interactions
- Added an ambient fly that can wander onto the scene and be squashed with a click-triggered hand smash
- Added fly state to the debug readout for easier tuning during interaction passes
- Added a brief victory face reaction after successful fly smashes
- Replaced the text-heavy timer with a dedicated visual timer tab using 5/15/30 minute presets, a circular face, and minimal start/pause/reset controls
- Added a pasteboard MVP with a stage context menu, clipboard-to-sticky capture, draggable wall notes, and copy/export/delete actions
- Refined sticky notes with drag-anywhere behavior, hover-only icon actions, safer wall placement, and an Info-tab character selector alongside clearer sidebar tab grouping
- Tightened Info panel spacing, removed the perspective note, moved Editor/Debug into the bottom rail group above Settings, and simplified sticky note headers so pasted text no longer leaks into the label
- Removed hidden browser draft overrides from skin loading so manifests are authoritative by default, and renamed the editor export controls to Copy/Download Manifest
- Fixed manifest loading so saved `groupConfigs` such as arm pivot and hand-anchor overrides are actually read back from skin manifests
- Started modularizing the app by extracting shared state creation plus timer, pasteboard, and ambient fly helpers into dedicated `js/` modules while keeping the main render loop in place
- Continued modularization by extracting skin manifest normalization and grouped-part helper logic into `js/deskgoblin-skins.js`, removing the duplicate inline manifest pipeline from `index.html`
- Continued modularization by extracting asset-skin editor and inspector helpers into `js/deskgoblin-editor.js`, including grouped selection helpers and manifest export UI logic
- Continued modularization by extracting panel/tab/theme/palette shell helpers into `js/deskgoblin-ui.js`, including character selector population and inspector tab switching
- Hardened modular boot order by switching the UI shell and skin editor integrations to boot-safe wrapper functions so early event wiring no longer hard-crashes when modules initialize out of order
- Hardened scene startup by starting the animation loop before optional manifest/editor init completes, and by catching non-critical init failures so the goblin can still render while setup issues are surfaced in debug output
- Restored missing scene pose helpers after modularization so `drawHead()` and the timer loop can run again without `getRigPoseMetrics` reference errors
- Trimmed a few unused manifest-helper imports from `index.html` and centralized init-warning reporting to reduce post-modularization noise while keeping the current boot path explicit
- Made asset image loading resolve against `window.location.href` explicitly and expanded the debug asset line with request/load state to help diagnose skin render failures
- Fixed grouped skin layer objects so they consistently expose `layer.key`, restoring drawable asset-layer matching after modularization
- Migrated skin manifests to a forward-only grouped `version: 3` schema with explicit `groupOrder`, in-layer visibility/tweak storage, and group-level rig settings kept with each part
- Switched editor manifest export to emit the grouped v3 schema instead of the older flat parallel maps, and migrated `skins/fox/manifest.json` to the new canonical format
- Updated the live grouped render model so current editor visibility, file selection, tweak, and per-layer order changes actually flow through to asset rendering instead of staying stuck on the original manifest order
- Removed the now-dead flat-manifest grouping table and flat-schema conversion helpers from `js/deskgoblin-skins.js` to keep the post-migration manifest path simpler and less misleading
- Clarified the remaining manifest/editor internals by renaming the grouped flatten helper to `deriveRuntimeLayerState` and documenting the editor's derived runtime state as distinct from the canonical saved manifest
- Tightened the final editor cleanup by renaming a few remaining local asset-state variables for clarity and started the next UI pass by bringing the timer tab onto the same inner-pane spacing rhythm as the other utility panes
- Normalized the next panel pass by turning `Debug` and `Options` into explicit section cards, capping `Part Properties` so it no longer crushes the layer list, and adding a gutter between the rail and side panel so the shell reads as a floating surface
- Rebalanced that panel pass by loosening the `Part Properties` size cap and softening the rail-to-panel gutter so the inspector stays usable and the shell spacing sits closer to the other app layouts
- Aligned the pane inset model more closely with sibling apps by removing the extra `.tab-pane.ds-panel-scroll` padding so `tab-body` owns the primary shell gutter instead of DeskGoblin double-insetting every panel
- Reworked the Goblin Editor to use stable auto-fill height tracks for `Layers` and `Part Properties`, giving both regions explicit minimum heights and internal scrolling so inspector-only controls no longer cause panel jitter or crush the layer list
- Tightened Goblin Editor inspector spacing, turned Inputs/JSON into a clearer tab row with a compact reset action, renamed the layer header from Mapping to Slot, and fixed the sticky table header so rows no longer scroll visibly beneath the top edge
- Converted Goblin Editor manifest copy/download actions and both reset actions to compact icon buttons, moved the JSON actions beneath the manifest textarea, and let the JSON pane expand to fill the available inspector space
- Removed the runtime text override that was wiping out the Part Properties reset icon button whenever a skinned character selection refreshed the inspector, so both reset controls now keep the same icon-button treatment
- Cleared editor-only transient modes like rig/isolate when leaving the Goblin Editor, and refined panel/info hierarchy by splitting the Info tab into distinct intro and character cards with stronger section headings
- Fixed the real editor-mode leak by clearing transient editor states during the normal open-panel tab-switch path as well, so leaving Goblin Editor now reliably cancels rig and isolate before other tabs or character switches render
- Made character switching cancel editor-only modes first and update visible asset skins immediately during model changes, so rig/freeze state can no longer carry across to another character
- Normalized utility-pane section rhythm by converting Timer to the shared section-card pattern and moving Info/Options runtime notes into the same in-card note treatment, so Info, Timer, Debug, and Options now read more like one cohesive panel system
- Refined Goblin Editor visual hierarchy by giving the toolbar its own stronger surface treatment, improving active mode-button contrast, elevating inspector heading weight, and increasing table scanability with clearer hover, group-row, and header treatments
- Finished the editor UI sweep by flattening slider value inputs and the nested Arm Rig section so slider controls sit on the inspector surface instead of introducing extra mini-surfaces
- Added a new Chance utility tab with a dice roller, random number generator, and magic 8 ball, all built as lightweight section-card tools that stay isolated from the core editor and skin systems
- Restyled the Chance tab for more tactility by turning dice options into die-shaped buttons, making the random number generator a large clickable result control, and reducing helper copy so the tools feel more direct and toy-like
- Reworked the Chance tools to look more like their objects: the dice tool now uses one large die that changes geometry by die type and rolls on throw, and the Magic 8 Ball now renders as a shakeable 8-ball object that reveals its answer in the center window
- Simplified the Chance object interactions by removing the extra Throw/Ask buttons for the die and 8 ball, adding hover and hold-to-shake feedback, and revealing results on release so the objects themselves are the controls
- Enhanced the Chance object animations so the die now cycles through values while held and eases into a final roll on release, and the Magic 8 Ball now stages its reveal by sliding the 8 and answer window through the ball before fading in the message
- Tuned the Magic 8 Ball hold animation so the answer triangle now slides fully out of view at the same pace as the 8, making the rolling illusion cleaner before the reveal returns
- Stabilized the die and 8-ball hold interactions by disabling click fallback on the object controls and pushed the 8-ball triangle farther out during hold so it is fully cropped while shaking
- Hardened hold-and-release object interactions by moving release handling to captured window-level pointer events and suppressing drag/click interference, so moving the mouse while holding the die or 8 ball no longer triggers stray releases
- Added a busy-state lock to the Magic 8 Ball interaction so a new hold or question cannot interrupt an in-progress reveal cycle, making the object behavior more consistent under repeated clicks
- Added three stronger graphic canvas palettes with flatter desk colors, more solid peripherals, and a subtle top-plane/front-shadow desk treatment so the scene can feel poppier without changing the current layout

## 2026-03-26 through 2026-03-27 (reconstructed from Git)
- Integrated the bundled design-system CSS and theme tooling (`3662f81`), refined that integration (`5fdb05a`), then renamed the bundle to `design-system/` and corrected page references (`57150f4`).

## 2026-10-23
- Audited runtime baseline `57150f4`; recorded findings and verification limits in `data/audit-2026-10-23.md`.
- Reconciled product/roadmap/QA docs with the current grouped v3 format, loaded module ownership, utility features, and completed design-system work.
- Added ordered DG-01 through DG-06 stabilization/renderer work with acceptance criteria; runtime defects remain open and no browser acceptance is claimed.
- Documented local serving, manual manifest save/recovery, export limitations, and browser validation steps.
- Preserved the old v2 proposal under a historical filename and added a current v3 example.
- Removed the blanket documentation ignore while retaining the local scratchpad ignore; documentation is eligible for the next Git commit.
- Added a dependency-free structural checker for script syntax, local resources, documentation links/JSON, skin assets, and current saved-field round trips. Runtime behavior is unchanged.
- Validation: `node _docs/data/check-baseline.cjs` passed, including Fox's 14 groups/24 files and existing saved-field round trip; `git diff --check` passed. Documentation is no longer ignored; `_docs/_scratchpad` remains ignored. Browser smoke checks are still pending.

### Stabilization follow-up
- DG-01: replaced render-delta countdown with an injectable wall-clock deadline; explicit toggle reconciles pause/resume and restarts completed timers. Background/sleep counts; completion feedback occurs on the next frame. Clock changes affect timing.
- DG-02: export preserves normalized group/layer offsets and scales, including explicit defaults.
- Added six Node regressions covering low FPS, suspended frames, pause/resume, resets/presets, completion/restart, transforms, live editor overrides, and repeatable export.
- All six tests, structural checks, and `git diff --check` passed. No configured lint/build step exists. Browser smoke checks remain pending; duplicate inactive modules are unchanged under DG-03.
