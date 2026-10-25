# DeskGoblin Data Migration

Updated: 2026-10-23. Runtime baseline: `57150f4`.

## Purpose
DeskGoblin now uses a grouped skin manifest as the canonical saved format.

This migration removes the older flat manifest shape that split one layer's data across multiple top-level maps.

## Canonical Manifest Shape
Each skin manifest should now use:

- `version: 3`
- `groupOrder`
- `parts`
- `slotTweaks`
- `render`

Example:

```json
{
  "version": 3,
  "groupOrder": ["head"],
  "parts": {
    "head": {
      "slot": "head",
      "mode": "static",
      "pivot": { "x": 0.5, "y": 0.5 },
      "handAnchor": { "x": 0.5, "y": 0.95 },
      "layers": [
        {
          "id": "headFill",
          "label": "fill",
          "file": "HeadBase/HeadFill.PNG",
          "visible": true,
          "tweak": { "x": 0, "y": 0, "w": 0, "h": 0 }
        },
        {
          "id": "headLine",
          "label": "line",
          "file": "HeadBase/Head.PNG",
          "visible": true,
          "tweak": { "x": 0, "y": 0, "w": 0, "h": 0 }
        }
      ]
    }
  },
  "slotTweaks": {
    "head": { "x": 0, "y": 0, "w": 0, "h": 0 }
  },
  "render": {
    "hideDefaultArms": false,
    "nativeSize": true,
    "defaultScaleMode": "contain"
  }
}
```

## Removed Legacy Fields
These top-level fields are no longer part of the saved manifest contract:

- `visibleParts`
- `drawOrder`
- `partTweaks`
- `groupConfigs`

Those concerns now live inside the grouped `parts` tree:

- layer visibility lives on each layer
- layer order lives in the order of each `layers` array
- group order lives in `groupOrder`
- group rig config lives on each group

## Forward Migration Rules
When migrating a legacy manifest forward:

1. Convert flat file keys into grouped `parts`
2. Move per-layer visibility onto each layer's `visible`
3. Move per-layer tweak data onto each layer's `tweak`
4. Move arm/group rig settings into each group's `mode`, `pivot`, and `handAnchor`
5. Preserve top-level slot box adjustments in `slotTweaks`
6. Replace overloaded `drawOrder` with:
   - `groupOrder` for group sequencing
   - array order inside `layers` for intra-group sequencing

## Current Status
- `fox` has been migrated to the grouped v3 manifest format.
- Editor export now emits the grouped v3 manifest shape.
- Runtime normalization now treats the grouped manifest as the source of truth.

## Notes
- This migration is forward-only.
- Backward compatibility with the old flat manifest shape is intentionally being retired while the project is still in development.

## Supported input and export limits

Flat manifests are no longer supported by the current normalization path. The migration steps above are a manual conversion guide, not an automatic migration command. The runtime reads version metadata but does not strictly reject unknown versions; do not interpret that permissiveness as support.

Use [the v3 example](data/skin-manifest-v3-example.json) for new work. It is a minimal head-only fragment using Fox-relative asset paths, not a registered complete character. Layer IDs must be unique across a skin; use `headFill`/`headLine`, not repeated `fill`/`line` IDs across groups.

Known limitations to preserve or fix explicitly:

- Group/layer `offset` and `scale` now survive normalization, rendering, and serialization (DG-02 implemented). Export writes explicit zero offsets and unit scales when omitted. Other unsupported fields still require care.
- `render.nativeSize` and `render.defaultScaleMode` are preserved data but currently do not select rendering policy (DG-05).
- General part rotation is not normalized. Optional label/meta/morph/color data read by normalization is also not emitted by the current serializer.
- The [historical v2 proposal](data/skin-manifest-v2-proposal-historical.json) is retained for context only. Its defaults, repeated local layer IDs, rotation, and per-layer slot proposals do not define the current contract.

## Save, reload, and recovery

1. Back up the source manifest before editing. Editor state is in memory; browser refresh discards unexported changes.
2. Copy/download the editor manifest and inspect the JSON and known export limits above.
3. Replace `skins/<id>/manifest.json` manually. Keep image paths relative to that skin directory and preserve exact filename casing.
4. Register a new skin ID in `skins/index.json` when adding a character.
5. Serve over HTTP, reload, select the skin, and compare files, visibility, ordering, slot tweaks, arm settings, and proportions.
6. Run the structural checker and QA browser checks. Restore the backup if calibration changes unexpectedly.

There is no automatic filesystem save, manifest-import UI, legacy converter, or reverse migration. Browser stickies are separate origin-local storage; individual copy/export actions do not constitute a full-board backup/restore format.
