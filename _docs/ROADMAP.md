# DeskGoblin roadmap

Updated: 2026-10-23. Items below remain open unless explicitly marked complete.

## Completed baseline

- Grouped v3 runtime/export and Fox migration.
- Utility, manifest, editor, and UI extraction; scene/render remain inline.
- Editor usability/mode cleanup, timer, stickies, fly, Chance tools, scene palettes.
- Bundled design-system integration and directory-reference fix on March 27.
- October handoff: reconciled docs, v3 example, structural check, documentation ignore-rule correction. Browser acceptance is pending.

## Next slice: stabilize existing functionality

DG-01 and DG-02 are implemented with deterministic regression coverage; browser smoke acceptance is pending. Next run the browser checklist, then proceed to DG-03/DG-04:

| ID | Work | Acceptance criteria |
| --- | --- | --- |
| DG-01 | Implemented; browser check pending: timer deadline | Accurate elapsed time at low FPS and after backgrounding; deterministic coverage of pause/resume, reset, presets, one-shot completion; document intended background/sleep behavior |
| DG-02 | Implemented; browser check pending: transform export | Non-default group/layer offset and scale survive normalize/export/reload; existing files, visibility, order, tweaks, slot tweaks, and rig settings remain stable; regression coverage for both |
| DG-03 | Consolidate feature ownership | One authoritative implementation of app state/timer/pasteboard/fly; remove or deliberately integrate duplicate files; docs/script order agree; scaled sticky drag and utility smoke checks pass |
| DG-04 | Surface storage/clipboard failures | Quota/unavailable storage and clipboard denial give actionable feedback without breaking scene; unsaved notes are distinguishable; malformed storage handled; failure paths tested |

Do not extract deeper rendering code during this slice. Apply fixes to loaded modules. Update QA and CHANGELOG with each change.

## Following slice: renderer and input contract

DG-05: decide contain-fit versus native-size semantics, then implement or remove misleading render options. Preserve Fox calibration deliberately; capture before/after procedural and Fox images. Check proportions, arm anchors, draw order, and rig editing. Update migration docs/examples if saved behavior changes.

DG-06: validate manifest inputs explicitly. Decide supported versions and reject unsupported/malformed data with visible diagnostics. Cover duplicate layer IDs, bad numbers, missing files, empty groups, and malformed JSON. Do not restore legacy compatibility implicitly.

## Later

- Extract pure layout or bootstrap helpers only after stabilization acceptance.
- Delay update/draw, arm targeting/smash, head rendering, and shared editor/render slot-math extraction.
- Prioritize new features after a fresh product decision; the audit found no unfinished feature branch that must be resumed first.
- Run a separate design-system/accessibility pass against current workspace guidance; the bundled March system predates the October workspace reference.

## Stabilization gate

Structural checks and relevant regressions pass; no new console errors. Record browser/version, date, origin, viewport, themes, characters, and smoke results. Character/editor/export, timer, stickies, and Chance checks pass. Outstanding failures remain explicit work items; syntax success alone is not full acceptance.
