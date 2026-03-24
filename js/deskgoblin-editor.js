(function attachDeskGoblinEditor(root) {
    const ns = root.DeskGoblin = root.DeskGoblin || {};

    ns.createSkinEditorModule = function createSkinEditorModule(deps) {
        const {
            skinLibraryRef,
            skinStateRef,
            getCurrentSkinDef,
            selectedPartRef,
            uiState,
            assetSkinCache,
            loadImage,
            manifest,
            dom
        } = deps;

        const {
            DEFAULT_ASSET_PARTS,
            DEFAULT_VISIBLE_PARTS,
            GROUP_SLOT_ORDER,
            extractGroupConfigs,
            clonePartTweaks,
            cloneSlotTweaks,
            cloneGroupConfigs,
            normalizePoint,
            normalizeScale2,
            normalizeLayerOrder,
            normalizeGroupedDrawOrder,
            serializeAssetManifest,
            fileNameFromPath
        } = manifest;

        const {
            partDxEl,
            partDyEl,
            partDwEl,
            partDhEl,
            partDxValEl,
            partDyValEl,
            partDwValEl,
            partDhValEl,
            partResetEl,
            partsResetAllEl,
            partCopyJsonEl,
            inspectorTabInputs,
            inspectorTabJson,
            partInspector,
            selectedPartLabelEl,
            partJsonEl,
            layerTableBody,
            armRigControlsEl,
            tModeBtn,
            soloSelectedBtn,
            armPivotXEl,
            armPivotYEl,
            armHandXEl,
            armHandYEl,
            armPivotXValEl,
            armPivotYValEl,
            armHandXValEl,
            armHandYValEl
        } = dom;

        function getSelectedPartKey() {
            return selectedPartRef.get();
        }

        function setSelectedPartKey(value) {
            selectedPartRef.set(value);
        }

        function getAssetSkinState(def) {
            if (!assetSkinCache.has(def.id)) {
                assetSkinCache.set(def.id, { requested: false, loaded: false, failed: [], images: {} });
            }
            return assetSkinCache.get(def.id);
        }

        function getInspectorState(def) {
            const st = getAssetSkinState(def);
            const runtimeAssetFiles = { ...DEFAULT_ASSET_PARTS, ...(def.partsMap || {}) };
            const layerKeys = Object.keys(runtimeAssetFiles);
            if (!st.inspectorReady) {
                // Editor/runtime state is derived from the grouped manifest so the inspector
                // can edit files, visibility, layer tweaks, and order without mutating the
                // canonical manifest object directly.
                st.partsMap = { ...runtimeAssetFiles };
                st.partTweaks = clonePartTweaks(def.partTweaks || {});
                st.slotTweaks = cloneSlotTweaks(def.slotTweaks || {});
                st.groupConfigs = cloneGroupConfigs(def.groupConfigs || extractGroupConfigs(def.groupedParts || {}));
                st.visibleSet = new Set(def.visibleParts || DEFAULT_VISIBLE_PARTS);
                st.drawOrder = normalizeLayerOrder(Object.keys(st.partsMap), def.drawOrder || layerKeys);
                st.collapsedGroups = new Set();
                st.inspectorReady = true;
            } else {
                st.partsMap = { ...runtimeAssetFiles, ...(st.partsMap || {}) };
                st.drawOrder = normalizeLayerOrder(Object.keys(st.partsMap), st.drawOrder || layerKeys);
                st.collapsedGroups = st.collapsedGroups || new Set();
                st.slotTweaks = st.slotTweaks || cloneSlotTweaks(def.slotTweaks || {});
                st.groupConfigs = st.groupConfigs || cloneGroupConfigs(def.groupConfigs || extractGroupConfigs(def.groupedParts || {}));
            }
            return st;
        }

        function groupLabelFromId(groupId) {
            return editorPartLabel(groupId);
        }

        function editorPartLabel(key) {
            const map = {
                body: "Body",
                tail: "Tail",
                head: "Head",
                mouth: "Mouth",
                charLeftEye: "Eye Left",
                charRightEye: "Eye Right",
                charLeftBrow: "Brow Left",
                charRightBrow: "Brow Right",
                charLeftEar: "Ear Left",
                charRightEar: "Ear Right",
                charLeftArmDown: "Arm Down Left",
                charLeftArmUp: "Arm Up Left",
                charRightArmDown: "Arm Down Right",
                charRightArmUp: "Arm Up Right",
                charLeftEarFill: "Ear Left",
                charLeftEarLine: "Ear Left",
                charLeftEarInner: "Ear Left",
                charRightEarFill: "Ear Right",
                charRightEarLine: "Ear Right",
                charLeftArmDownFill: "Arm Down Left",
                charLeftArmDownLine: "Arm Down Left",
                charLeftArmUpFill: "Arm Up Left",
                charLeftArmUpLine: "Arm Up Left",
                charRightArmDownFill: "Arm Down Right",
                charRightArmDownLine: "Arm Down Right",
                charRightArmUpFill: "Arm Up Right",
                charRightArmUpLine: "Arm Up Right",
                bodyFill: "Body",
                bodyLine: "Body",
                tailFill: "Tail",
                tailLine: "Tail",
                headFill: "Head",
                headLine: "Head"
            };
            return map[key] || key.replace(/^char/, "").replace(/([A-Z])/g, " $1").trim();
        }

        function editorLayerLabel(layer) {
            const id = String(layer?.id || "").toLowerCase();
            const map = {
                fill: "Fill",
                line: "Line",
                inner: "Inner",
                base: "Base"
            };
            return map[id] || (layer?.id ? String(layer.id) : "Layer");
        }

        function getAssetOptionList(partsMap) {
            return Array.from(new Set(Object.values(partsMap || {}).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        }

        function findGroupIdForLayer(groupedParts, layerKey) {
            if (!layerKey) return "";
            for (const [groupId, group] of Object.entries(groupedParts || {})) {
                if ((group.layers || []).some((layer) => layer.key === layerKey)) return groupId;
            }
            return "";
        }

        function getSelectedGroupId(groupedParts, selectionKey) {
            if (!selectionKey) return "";
            if (groupedParts && groupedParts[selectionKey]) return selectionKey;
            return findGroupIdForLayer(groupedParts, selectionKey);
        }

        function getSelectedGroup(groupedParts, selectionKey) {
            const groupId = getSelectedGroupId(groupedParts, selectionKey);
            return groupId ? groupedParts[groupId] : null;
        }

        function isGroupSelection(groupedParts, selectionKey) {
            return !!(selectionKey && groupedParts && groupedParts[selectionKey]);
        }

        function getRenderGroupedModel(skinDef, state) {
            const grouped = {
                groupedParts: skinDef.groupedParts || {},
                groupedDrawOrder: skinDef.groupedDrawOrder || skinDef.groupOrder || []
            };
            const configSource = state?.groupConfigs || skinDef.groupConfigs || {};
            const partsSource = state?.partsMap || skinDef.partsMap || {};
            const tweakSource = state?.partTweaks || skinDef.partTweaks || {};
            const visibleSet = state?.visibleSet ? new Set(Array.from(state.visibleSet)) : new Set(skinDef.visibleParts || []);
            const drawOrder = normalizeLayerOrder(Object.keys(partsSource), state?.drawOrder || skinDef.drawOrder || Object.keys(partsSource));
            const drawIndex = new Map(drawOrder.map((key, idx) => [key, idx]));
            const configuredParts = {};
            Object.entries(grouped.groupedParts || {}).forEach(([groupId, group]) => {
                const defaults = manifest.getDefaultGroupConfig(groupId);
                const config = configSource[groupId] || defaults;
                const orderedLayers = (group.layers || []).slice().sort((a, b) => {
                    const aKey = a.key || a.id;
                    const bKey = b.key || b.id;
                    return (drawIndex.get(aKey) ?? 9999) - (drawIndex.get(bKey) ?? 9999);
                }).map((layer) => {
                    const key = layer.key || layer.id;
                    return {
                        ...layer,
                        id: key,
                        key,
                        file: String(partsSource[key] || layer.file || ""),
                        visible: visibleSet.has(key),
                        tweak: {
                            x: +tweakSource?.[key]?.x || 0,
                            y: +tweakSource?.[key]?.y || 0,
                            w: +tweakSource?.[key]?.w || 0,
                            h: +tweakSource?.[key]?.h || 0
                        }
                    };
                });
                configuredParts[groupId] = {
                    ...group,
                    mode: String(config.mode || group.mode || defaults.mode),
                    pivot: normalizePoint(config.pivot || group.pivot, defaults.pivot.x, defaults.pivot.y),
                    handAnchor: normalizePoint(config.handAnchor || group.handAnchor, defaults.handAnchor.x, defaults.handAnchor.y),
                    layers: orderedLayers
                };
            });
            return {
                groupedParts: configuredParts,
                groupedDrawOrder: grouped.groupedDrawOrder || []
            };
        }

        function getEditorGroupRows(def, st) {
            const renderModel = getRenderGroupedModel(def, st);
            const groupedParts = renderModel.groupedParts || {};
            const groupedOrder = normalizeGroupedDrawOrder(Object.keys(groupedParts), renderModel.groupedDrawOrder || GROUP_SLOT_ORDER);
            return groupedOrder.map((groupId) => {
                const group = groupedParts[groupId];
                const layers = (group?.layers || []).slice().sort((a, b) => {
                    const ai = st.drawOrder.indexOf(a.key);
                    const bi = st.drawOrder.indexOf(b.key);
                    return (ai < 0 ? 9999 : ai) - (bi < 0 ? 9999 : bi);
                });
                return {
                    id: groupId,
                    group,
                    layers,
                    visibleCount: layers.filter((layer) => st.visibleSet.has(layer.key)).length,
                    totalCount: layers.length,
                    collapsed: st.collapsedGroups.has(groupId)
                };
            });
        }

        function setGroupVisibility(def, st, groupRow, visible) {
            groupRow.layers.forEach((layer) => {
                if (!layer?.key) return;
                if (visible) {
                    st.visibleSet.add(layer.key);
                    ensurePartLoaded(def, layer.key);
                } else {
                    st.visibleSet.delete(layer.key);
                }
            });
        }

        function getActiveAssetSkinDef() {
            const target = skinLibraryRef.get()[skinStateRef.get().targetId];
            if (target?.mode === "asset") return target;
            const active = getCurrentSkinDef();
            return (active.mode === "asset") ? active : null;
        }

        function ensurePartLoaded(def, key) {
            const st = getInspectorState(def);
            if (st.images[key]) return;
            const runtimeAssetFiles = st.partsMap || { ...DEFAULT_ASSET_PARTS, ...(def.partsMap || {}) };
            const rel = runtimeAssetFiles[key];
            if (!rel) return;
            const src = def.root ? `${def.root}/${rel}` : rel;
            loadImage(src).then((img) => {
                st.images[key] = img;
                st.loaded = Object.keys(st.images).length > 0;
            }).catch(() => {
                if (!st.failed.includes(src)) st.failed.push(src);
            });
        }

        function readPartBoxInputs() {
            return {
                x: +(partDxEl.value || 0),
                y: +(partDyEl.value || 0),
                w: +(partDwEl.value || 0),
                h: +(partDhEl.value || 0)
            };
        }

        function writePartBoxInputs(v) {
            const x = +(v?.x || 0);
            const y = +(v?.y || 0);
            const w = +(v?.w || 0);
            const h = +(v?.h || 0);
            partDxEl.value = String(x);
            partDyEl.value = String(y);
            partDwEl.value = String(w);
            partDhEl.value = String(h);
            partDxValEl.value = String(x);
            partDyValEl.value = String(y);
            partDwValEl.value = String(w);
            partDhValEl.value = String(h);
        }

        function getSelectedStretchArmGroup(def, st) {
            const renderModel = getRenderGroupedModel(def, st);
            const group = getSelectedGroup(renderModel.groupedParts, getSelectedPartKey());
            if (!group || group.mode !== "stretch") return null;
            return { group, renderModel };
        }

        function writeArmRigInputs(group) {
            const pivot = normalizePoint(group?.pivot, 0.5, 0.10);
            const handAnchor = normalizePoint(group?.handAnchor, 0.5, 0.96);
            armPivotXEl.value = pivot.x.toFixed(2);
            armPivotYEl.value = pivot.y.toFixed(2);
            armHandXEl.value = handAnchor.x.toFixed(2);
            armHandYEl.value = handAnchor.y.toFixed(2);
            armPivotXValEl.value = pivot.x.toFixed(2);
            armPivotYValEl.value = pivot.y.toFixed(2);
            armHandXValEl.value = handAnchor.x.toFixed(2);
            armHandYValEl.value = handAnchor.y.toFixed(2);
        }

        function getSoloRenderAlpha(groupedParts, layerKey) {
            const soloActive = uiState.isSoloSelected() && uiState.isPanelOpen() && uiState.getCurrentTab() === "editor" && !!getSelectedPartKey();
            if (!soloActive) return 1;
            const selectedPartKey = getSelectedPartKey();
            const selectedGroupId = getSelectedGroupId(groupedParts, selectedPartKey);
            if (selectedPartKey === layerKey) return 1;
            if (selectedGroupId && groupedParts?.[selectedPartKey] && findGroupIdForLayer(groupedParts, layerKey) === selectedGroupId) return 1;
            return 0;
        }

        function refreshPartsInspector() {
            const def = getActiveAssetSkinDef();
            const disabled = !def;
            [partDxEl, partDyEl, partDwEl, partDhEl, partDxValEl, partDyValEl, partDwValEl, partDhValEl, partResetEl, partsResetAllEl, partCopyJsonEl, inspectorTabInputs, inspectorTabJson]
                .forEach((el) => { el.disabled = disabled; });
            if (!def) {
                partInspector.style.opacity = "0.55";
                selectedPartLabelEl.textContent = "";
                partJsonEl.value = "Select an asset skin to inspect parts.";
                layerTableBody.innerHTML = "";
                armRigControlsEl.hidden = true;
                tModeBtn.setAttribute("aria-pressed", uiState.isTModeOn() ? "true" : "false");
                tModeBtn.classList.toggle("active", uiState.isTModeOn());
                return;
            }
            partInspector.style.opacity = "1";

            const st = getInspectorState(def);
            const runtimeAssetFiles = st.partsMap || { ...DEFAULT_ASSET_PARTS, ...(def.partsMap || {}) };
            const layerKeys = Object.keys(runtimeAssetFiles);
            const assetOptions = getAssetOptionList(runtimeAssetFiles);
            st.drawOrder = normalizeLayerOrder(layerKeys, st.drawOrder || layerKeys);
            const groupRows = getEditorGroupRows(def, st);
            const groupIds = groupRows.map((groupRow) => groupRow.id);
            if (!layerKeys.includes(getSelectedPartKey()) && !groupIds.includes(getSelectedPartKey())) {
                setSelectedPartKey(groupIds[0] || st.drawOrder[0] || "");
            }
            const selectedPartKey = getSelectedPartKey();
            const isSlotSelection = groupIds.includes(selectedPartKey);
            const stretchCtx = getSelectedStretchArmGroup(def, st);
            selectedPartLabelEl.textContent = selectedPartKey ? `${editorPartLabel(selectedPartKey)}${isSlotSelection ? " Slot" : " Layer"}` : "";
            partResetEl.title = isSlotSelection ? "Reset the selected slot box and slot transform values" : "Reset the selected layer offset and scale values";
            if (stretchCtx && isSlotSelection) {
                partResetEl.title = "Reset the selected arm slot box plus pivot and hand anchor";
            }
            partResetEl.setAttribute("aria-label", partResetEl.title);
            armRigControlsEl.hidden = !stretchCtx;
            if (stretchCtx) writeArmRigInputs(stretchCtx.group);
            tModeBtn.setAttribute("aria-pressed", uiState.isTModeOn() ? "true" : "false");
            tModeBtn.classList.toggle("active", uiState.isTModeOn());
            tModeBtn.title = uiState.isTModeOn() ? "Exit rig mode" : "Enter rig mode";
            tModeBtn.setAttribute("aria-label", tModeBtn.title);
            soloSelectedBtn.disabled = !selectedPartKey;
            soloSelectedBtn.setAttribute("aria-pressed", uiState.isSoloSelected() ? "true" : "false");
            soloSelectedBtn.classList.toggle("active", uiState.isSoloSelected());
            soloSelectedBtn.title = uiState.isSoloSelected() ? "Stop isolating the current selection" : "Isolate the current selection";
            soloSelectedBtn.setAttribute("aria-label", soloSelectedBtn.title);

            layerTableBody.innerHTML = "";
            let layerIndex = 0;
            groupRows.forEach((groupRow) => {
                const groupTr = document.createElement("tr");
                groupTr.className = "group-row";
                groupTr.dataset.group = groupRow.id;
                if (getSelectedPartKey() === groupRow.id) groupTr.classList.add("selected", "ds-table-row-selected");
                const groupVisible = groupRow.visibleCount > 0;
                const collapseIcon = groupRow.collapsed ? "iconoir-nav-arrow-right" : "iconoir-nav-arrow-down";
                const visIcon = groupVisible ? "iconoir-eye" : "iconoir-eye-closed";
                groupTr.innerHTML =
                    `<td class="col-layer ds-table-utility-cell"><button type="button" class="row-toggle-btn ds-btn ds-icon-action" aria-label="${groupRow.collapsed ? "Expand" : "Collapse"} ${groupRow.id}"><i class="${collapseIcon}"></i></button></td>` +
                    `<td><span class="part-name">${groupLabelFromId(groupRow.id)} <span class="part-count">[${groupRow.totalCount}]</span></span></td>` +
                    `<td></td>` +
                    `<td class="col-vis ds-table-utility-cell"><button type="button" class="row-visibility-btn ds-btn ds-icon-action ${groupVisible ? "" : "is-hidden"}" aria-label="${groupVisible ? "Hide" : "Show"} ${groupRow.id}" title="${groupVisible ? "Hide" : "Show"} ${groupRow.id}"><i class="${visIcon}"></i></button></td>`;

                const collapseBtn = groupTr.querySelector(".row-toggle-btn");
                const groupVisBtn = groupTr.querySelector(".row-visibility-btn");
                collapseBtn.addEventListener("click", (ev) => {
                    ev.stopPropagation();
                    if (st.collapsedGroups.has(groupRow.id)) st.collapsedGroups.delete(groupRow.id);
                    else st.collapsedGroups.add(groupRow.id);
                    refreshPartsInspector();
                });
                groupVisBtn.addEventListener("click", (ev) => {
                    ev.stopPropagation();
                    setGroupVisibility(def, st, groupRow, !groupVisible);
                    refreshPartsInspector();
                });
                groupTr.addEventListener("click", (ev) => {
                    if (ev.target && ev.target.closest && ev.target.closest("button, select, input")) return;
                    setSelectedPartKey(groupRow.id);
                    refreshPartsInspector();
                });
                layerTableBody.appendChild(groupTr);

                if (groupRow.collapsed) return;
                groupRow.layers.forEach((layer) => {
                    const k = layer.key;
                    const tr = document.createElement("tr");
                    tr.classList.add("draggable", "layer-row");
                    tr.draggable = false;
                    tr.dataset.key = k;
                    if (getSelectedPartKey() === k) tr.classList.add("selected", "ds-table-row-selected");
                    tr.addEventListener("click", (ev) => {
                        if (ev.target && ev.target.closest && ev.target.closest("input, select, button")) return;
                        setSelectedPartKey(k);
                        refreshPartsInspector();
                    });

                    const file = runtimeAssetFiles[k] || "";
                    const vis = st.visibleSet.has(k);
                    const visLayerIcon = vis ? "iconoir-eye" : "iconoir-eye-closed";
                    const assetOptionsMarkup = assetOptions.map((assetPath) =>
                        `<option value="${assetPath.replace(/"/g, "&quot;")}" ${assetPath === file ? "selected" : ""}>${fileNameFromPath(assetPath)}</option>`
                    ).join("");
                    const layerLabel = editorLayerLabel(layer);

                    tr.innerHTML =
                        `<td class="col-layer ds-table-utility-cell"><span class="child-row-indent"><span class="child-row-branch"></span><span class="layer-idx">${++layerIndex}</span><span class="layer-drag" title="Drag to reorder"><i class="iconoir-menu-scale"></i></span></span></td>` +
                        `<td><div class="layer-name">${layerLabel}</div></td>` +
                        `<td><select class="asset-select">${assetOptionsMarkup}</select></td>` +
                        `<td class="col-vis ds-table-utility-cell"><button type="button" class="row-visibility-btn ds-btn ds-icon-action ${vis ? "" : "is-hidden"}" aria-label="${vis ? "Hide" : "Show"} ${k}" title="${vis ? "Hide" : "Show"} ${k}"><i class="${visLayerIcon}"></i></button></td>`;

                    const assetEl = tr.querySelector(".asset-select");
                    const layerDragEl = tr.querySelector(".layer-drag");
                    const visBtn = tr.querySelector(".row-visibility-btn");
                    layerDragEl.draggable = true;
                    layerDragEl.addEventListener("dragstart", (ev) => {
                        tr.classList.add("dragging");
                        ev.dataTransfer.effectAllowed = "move";
                        ev.dataTransfer.setData("text/plain", k);
                    });
                    layerDragEl.addEventListener("dragend", () => {
                        tr.classList.remove("dragging");
                        Array.from(layerTableBody.querySelectorAll("tr.drop-target"))
                            .forEach((row) => row.classList.remove("drop-target"));
                    });
                    assetEl.addEventListener("click", (ev) => ev.stopPropagation());
                    assetEl.addEventListener("change", () => {
                        runtimeAssetFiles[k] = assetEl.value || file;
                        delete st.images[k];
                        if (st.visibleSet.has(k)) ensurePartLoaded(def, k);
                        refreshPartsInspector();
                    });
                    visBtn.addEventListener("click", (ev) => {
                        ev.stopPropagation();
                        if (vis) {
                            st.visibleSet.delete(k);
                        } else {
                            st.visibleSet.add(k);
                            ensurePartLoaded(def, k);
                        }
                        refreshPartsInspector();
                    });

                    tr.addEventListener("dragover", (ev) => {
                        ev.preventDefault();
                        ev.dataTransfer.dropEffect = "move";
                        if (!tr.classList.contains("dragging")) tr.classList.add("drop-target");
                    });
                    tr.addEventListener("dragleave", () => {
                        tr.classList.remove("drop-target");
                    });
                    tr.addEventListener("drop", (ev) => {
                        ev.preventDefault();
                        tr.classList.remove("drop-target");
                        const fromKey = ev.dataTransfer.getData("text/plain");
                        const toKey = k;
                        if (!fromKey || fromKey === toKey) return;
                        const fromIdx = st.drawOrder.indexOf(fromKey);
                        const toIdx = st.drawOrder.indexOf(toKey);
                        if (fromIdx < 0 || toIdx < 0) return;
                        st.drawOrder.splice(fromIdx, 1);
                        st.drawOrder.splice(toIdx, 0, fromKey);
                        refreshPartsInspector();
                    });

                    layerTableBody.appendChild(tr);
                });
            });

            if (isSlotSelection) writePartBoxInputs(st.slotTweaks[selectedPartKey] || { x: 0, y: 0, w: 0, h: 0 });
            else writePartBoxInputs(st.partTweaks[selectedPartKey] || { x: 0, y: 0, w: 0, h: 0 });
            partJsonEl.value = JSON.stringify(serializeAssetManifest(def, st), null, 2);
        }

        function loadAssetSkin(def) {
            const state = getInspectorState(def);
            if (state.requested) return;
            state.requested = true;
            const runtimeAssetFiles = state.partsMap || { ...DEFAULT_ASSET_PARTS, ...(def.partsMap || {}) };
            const root = def.root || "";
            const loadKeys = Array.from(state.visibleSet).filter((k) => !!runtimeAssetFiles[k]);

            const jobs = loadKeys.map(async (key) => {
                const rel = runtimeAssetFiles[key];
                const src = root ? `${root}/${rel}` : rel;
                const resolvedSrc = new URL(src, window.location.href).href;
                try {
                    const img = await loadImage(resolvedSrc);
                    state.images[key] = img;
                } catch (_) {
                    state.failed.push(resolvedSrc);
                }
            });

            Promise.all(jobs).then(() => {
                state.loaded = Object.keys(state.images).length > 0;
                if (!state.loaded) {
                    console.warn(`Asset skin '${def.id}' did not load any images. Check ${root}/manifest.json paths.`);
                } else if (state.failed.length) {
                    console.warn(`Some asset files failed for skin '${def.id}':`, state.failed);
                }
            });
        }

        return {
            getAssetSkinState,
            getInspectorState,
            groupLabelFromId,
            editorPartLabel,
            editorLayerLabel,
            getAssetOptionList,
            getEditorGroupRows,
            setGroupVisibility,
            getActiveAssetSkinDef,
            ensurePartLoaded,
            readPartBoxInputs,
            writePartBoxInputs,
            getSelectedGroup,
            getSelectedStretchArmGroup,
            writeArmRigInputs,
            refreshPartsInspector,
            loadAssetSkin,
            getRenderGroupedModel,
            findGroupIdForLayer,
            getSelectedGroupId,
            isGroupSelection,
            getSoloRenderAlpha
        };
    };
})(window);
