# DeskGoblin documentation

Updated: 2026-10-23. Runtime baseline: `57150f4` (2026-03-27), app version `0.11`.

DeskGoblin is undergoing stabilization. Timer accuracy and transform export are fixed with deterministic coverage; browser acceptance remains pending.

## Start here

1. [PRODUCT.md](PRODUCT.md): implemented behavior, architecture, data ownership.
2. [ROADMAP.md](ROADMAP.md): ordered development tasks and acceptance criteria.
3. [QA.md](QA.md): repeatable verification and outstanding browser checks.
4. [DATA_MIGRATION.md](DATA_MIGRATION.md): current v3 format and export limits.
5. [CHANGELOG.md](CHANGELOG.md): chronological implementation history.
6. [Audit evidence](data/audit-2026-10-23.md) and [v3 example](data/skin-manifest-v3-example.json).

## Run locally

From `_DeskGoblin`:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://localhost:8000/`. Stop with Ctrl+C. There is no build or package-install step. Use localhost for clipboard APIs and grant browser permissions when prompted. Opening with `file://` disables custom skin manifests.

Run structural checks with Node.js:

```powershell
node _docs/data/check-baseline.cjs
node --test tests/stabilization.test.cjs
```

## Update rules

- Update PRODUCT when behavior, architecture, or ownership changes.
- Update ROADMAP when work is completed or priorities change; retain acceptance criteria.
- Update QA with actual results and environment. Syntax checks do not establish browser acceptance.
- Update DATA_MIGRATION and its example together when the saved contract changes.
- Append dated implementation entries to CHANGELOG; retain historical entries as history.
- Keep reusable handoff/verification artifacts in `data/`; `_scratchpad` stays local and ignored.
- Documentation is now eligible for Git tracking; include it in the next commit. This preparation pass does not create a commit.
- Before UI work, read workspace `../_DesignSystem/design.md`. The bundled `design-system/` is a runtime dependency, not the workspace policy source.
