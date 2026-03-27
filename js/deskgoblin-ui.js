(function attachDeskGoblinUi(root) {
    const ns = root.DeskGoblin = root.DeskGoblin || {};

    ns.createUiShellModule = function createUiShellModule(deps) {
        const {
            stageEl,
            sidePanel,
            panelHead,
            panelCollapseBtn,
            panelCollapseIcon,
            panelSideEl,
            tabButtons,
            tabPanes,
            panelTitle,
            editorExpandBtn,
            editorExpandIcon,
            themeSelect,
            canvasPaletteSelect,
            charSelectInfo,
            charSelect,
            editorSkinSelect,
            inspectorTabInputs,
            inspectorTabJson,
            inspectorPaneInputs,
            inspectorPaneJson,
            storageKeys,
            canvasPalettes,
            state,
            callbacks
        } = deps;

        function updateCollapseAffordance() {
            const collapseToward = state.getPanelSide() === "left" ? "left" : "right";
            const isCollapsed = !state.isPanelOpen();
            panelHead.classList.toggle("collapse-left", state.getPanelSide() === "right");
            panelHead.classList.toggle("collapse-right", state.getPanelSide() === "left");
            panelCollapseIcon.className = (collapseToward === "left")
                ? (isCollapsed ? "iconoir-nav-arrow-right" : "iconoir-nav-arrow-left")
                : (isCollapsed ? "iconoir-nav-arrow-left" : "iconoir-nav-arrow-right");
            panelCollapseBtn.title = isCollapsed ? "Expand panel" : `Collapse panel ${collapseToward}`;
            panelCollapseBtn.setAttribute("aria-label", panelCollapseBtn.title);
            panelCollapseBtn.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
        }

        function setPanelOpen(open) {
            sidePanel.classList.toggle("collapsed", !open);
            stageEl.classList.toggle("panel-collapsed", !open);
            stageEl.classList.toggle("panel-expanded", !!open);
            sidePanel.setAttribute("aria-hidden", open ? "false" : "true");
            updateCollapseAffordance();
            callbacks.resize();
        }

        function setPanelSide(side) {
            const s = (side === "left") ? "left" : "right";
            state.setPanelSide(s);
            stageEl.classList.toggle("side-left", s === "left");
            stageEl.classList.toggle("side-right", s === "right");
            panelSideEl.value = s;
            updateCollapseAffordance();
            callbacks.resize();
        }

        function setActiveTab(tab) {
            tabButtons.forEach((btn) => {
                const active = !!tab && btn.dataset.tab === tab;
                btn.classList.toggle("active", active);
                btn.setAttribute("aria-pressed", active ? "true" : "false");
            });
            let activePane = null;
            tabPanes.forEach((pane) => {
                const active = !!tab && pane.dataset.pane === tab;
                pane.classList.toggle("active", active);
                pane.hidden = !active;
                if (active) activePane = pane;
            });
            sidePanel.classList.toggle("surface-none", !!(activePane && activePane.dataset.surface === "none"));
            const labelMap = { info: "Info", input: "Thoughts", timer: "Timer", chance: "Chance", editor: "Goblin Editor", debug: "Debug", options: "Options" };
            panelTitle.textContent = labelMap[tab] || "Panel";
            const editorActive = tab === "editor";
            editorExpandBtn.hidden = !editorActive;
            sidePanel.classList.toggle("editor-expanded", editorActive && state.isEditorExpanded());
            editorExpandBtn.setAttribute("aria-pressed", editorActive && state.isEditorExpanded() ? "true" : "false");
            editorExpandBtn.title = editorActive && state.isEditorExpanded() ? "Restore editor width" : "Expand editor width";
            editorExpandBtn.setAttribute("aria-label", editorExpandBtn.title);
            editorExpandIcon.className = editorActive && state.isEditorExpanded() ? "iconoir-collapse" : "iconoir-expand";
        }

        function closePanelWithNoTab() {
            state.setPanelOpen(false);
            state.setCurrentTab(null);
            setPanelOpen(false);
            setActiveTab(null);
        }

        function openPanelWithTab(tab) {
            const next = tab || state.getLastTab() || "info";
            state.setCurrentTab(next);
            state.setLastTab(next);
            state.setPanelOpen(true);
            setPanelOpen(true);
            setActiveTab(next);
        }

        function updatePanelLayoutMode() {
            const vv = window.visualViewport;
            const w = vv ? vv.width : window.innerWidth;
            const h = vv ? vv.height : window.innerHeight;
            const navTop = w <= 900 && h > w;
            stageEl.classList.toggle("nav-top", navTop);
        }

        function setupThemeSelector() {
            const currentTheme = String(document.documentElement.getAttribute("data-theme") || "").trim();
            if (!themeSelect) return;
            if (root.DesignSystemThemeSelector) {
                if (currentTheme) themeSelect.value = currentTheme;
                return;
            }
            themeSelect.innerHTML = `<option value="">System</option>${currentTheme ? `<option value="${currentTheme}">${currentTheme}</option>` : ""}`;
            themeSelect.value = currentTheme;
        }

        function applyCanvasPalette(paletteId) {
            const id = String(paletteId || "");
            const validId = canvasPalettes[id] ? id : "cute";
            state.setCanvasPaletteId(validId);
            state.setCanvasPalette(canvasPalettes[validId]);
            document.documentElement.style.setProperty("--goblin-bg-top", state.getCanvasPalette().bgTop);
            document.documentElement.style.setProperty("--goblin-bg-bottom", state.getCanvasPalette().bgBottom);
            localStorage.setItem(storageKeys.canvasPalette, validId);
            if (canvasPaletteSelect.value !== validId) canvasPaletteSelect.value = validId;
        }

        function setupCanvasPaletteSelector() {
            canvasPaletteSelect.innerHTML = Object.entries(canvasPalettes)
                .map(([id, p]) => `<option value="${id}">${p.label}</option>`)
                .join("");
            const saved = localStorage.getItem(storageKeys.canvasPalette) || "cute";
            applyCanvasPalette(saved);
            canvasPaletteSelect.addEventListener("change", () => applyCanvasPalette(canvasPaletteSelect.value));
        }

        function setInspectorPane(name) {
            const next = (name === "json") ? "json" : "inputs";
            state.setInspectorPane(next);
            inspectorTabInputs.classList.toggle("active", next === "inputs");
            inspectorTabJson.classList.toggle("active", next === "json");
            inspectorTabInputs.setAttribute("aria-pressed", next === "inputs" ? "true" : "false");
            inspectorTabJson.setAttribute("aria-pressed", next === "json" ? "true" : "false");
            inspectorPaneInputs.classList.toggle("active", next === "inputs");
            inspectorPaneJson.classList.toggle("active", next === "json");
        }

        function populateCharacterSelect() {
            const fillSelect = (el) => {
                if (!el) return;
                el.innerHTML = "";
                Object.entries(callbacks.getSkinLibrary()).forEach(([id, def]) => {
                    const opt = document.createElement("option");
                    opt.value = id;
                    opt.textContent = def.label;
                    el.appendChild(opt);
                });
            };
            fillSelect(charSelectInfo);
            fillSelect(charSelect);
            fillSelect(editorSkinSelect);
        }

        function syncSkinSelects(id) {
            if (charSelectInfo && charSelectInfo.value !== id) charSelectInfo.value = id;
            if (charSelect.value !== id) charSelect.value = id;
            if (editorSkinSelect.value !== id) editorSkinSelect.value = id;
        }

        return {
            updateCollapseAffordance,
            setPanelOpen,
            setPanelSide,
            setActiveTab,
            closePanelWithNoTab,
            openPanelWithTab,
            updatePanelLayoutMode,
            setupThemeSelector,
            applyCanvasPalette,
            setupCanvasPaletteSelector,
            setInspectorPane,
            populateCharacterSelect,
            syncSkinSelects
        };
    };
})(window);
