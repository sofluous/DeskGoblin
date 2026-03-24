(function () {
    const root = window.DeskGoblin = window.DeskGoblin || {};

    root.createSkinManifestModule = function createSkinManifestModule({ baseSkin }) {
        const PART_KEY_ALIASES = {
            charLeftEarFill: ["charLeftEarFill", "leftEarFill"],
            charLeftEarLine: ["charLeftEarLine", "leftEarLine"],
            charLeftEarInner: ["charLeftEarInner", "leftEarInner"],
            charRightEarFill: ["charRightEarFill", "rightEarFill"],
            charRightEarLine: ["charRightEarLine", "rightEarLine"],
            charLeftArmDownFill: ["charLeftArmDownFill", "leftArmDownFill", "leftArmFill"],
            charLeftArmDownLine: ["charLeftArmDownLine", "leftArmDownLine", "leftArmLine", "leftArmLower"],
            charLeftArmUpFill: ["charLeftArmUpFill", "leftArmUpFill"],
            charLeftArmUpLine: ["charLeftArmUpLine", "leftArmUpLine"],
            charRightArmDownFill: ["charRightArmDownFill", "rightArmDownFill", "rightArmFill"],
            charRightArmDownLine: ["charRightArmDownLine", "rightArmDownLine", "rightArmLine"],
            charRightArmUpFill: ["charRightArmUpFill", "rightArmUpFill"],
            charRightArmUpLine: ["charRightArmUpLine", "rightArmUpLine"],
            charLeftEye: ["charLeftEye", "leftEye"],
            charRightEye: ["charRightEye", "rightEye"],
            charLeftBrow: ["charLeftBrow", "leftBrow"],
            charRightBrow: ["charRightBrow", "rightBrow"],
            headFill: ["headFill"],
            headLine: ["headLine"],
            bodyFill: ["bodyFill"],
            bodyLine: ["bodyLine"],
            tailFill: ["tailFill"],
            tailLine: ["tailLine"],
            mouth: ["mouth"]
        };

        const DEFAULT_ASSET_PARTS = {
            bodyFill: "BodyFillParts/Body fill.PNG",
            bodyLine: "BodyFillParts/Body.PNG",
            tailFill: "TailParts/TailFill.PNG",
            tailLine: "TailParts/Tail.PNG",
            headFill: "HeadBase/HeadFill.PNG",
            headLine: "HeadBase/Head.PNG",
            charLeftEarFill: "L_EarParts/L_EarFill.PNG",
            charLeftEarLine: "L_EarParts/L_Ear.PNG",
            charLeftEarInner: "L_EarParts/InnerEarLine.PNG",
            charRightEarFill: "R_EarParts/R_EarFill.PNG",
            charRightEarLine: "R_EarParts/R_Ear.PNG",
            charLeftArmDownFill: "L_ArmDownParts/L_ArmFill.PNG",
            charLeftArmDownLine: "L_ArmDownParts/L_ArmLower.PNG",
            charLeftArmUpFill: "L_ArmUpParts/L_ArmUpFill.PNG",
            charLeftArmUpLine: "L_ArmUpParts/L_ArmUp.PNG",
            charRightArmDownFill: "R_ArmDownParts/R_ArmFill.PNG",
            charRightArmDownLine: "R_ArmDownParts/R_Arm.PNG",
            charRightArmUpFill: "R_ArmDownParts/R_ArmFill.PNG",
            charRightArmUpLine: "R_ArmDownParts/R_Arm.PNG",
            charLeftEye: "Face/L_Eye.PNG",
            charRightEye: "Face/R_Eye.PNG",
            charLeftBrow: "Face/L_Eyebrow.PNG",
            charRightBrow: "Face/R_Eyebrow.PNG",
            mouth: "Face/Mouth.PNG"
        };

        const DEFAULT_VISIBLE_PARTS = [
            "headFill", "headLine",
            "charLeftEye", "charRightEye",
            "charLeftBrow", "charRightBrow",
            "mouth"
        ];

        const GROUP_SLOT_ORDER = [
            "body", "tail",
            "charRightEar", "head", "charLeftEar",
            "charLeftEye", "charRightEye", "charLeftBrow", "charRightBrow", "mouth",
            "charRightArmDown", "charRightArmUp", "charLeftArmUp", "charLeftArmDown"
        ];

        function getDefaultGroupConfig(groupId) {
            if (groupId === "charLeftArmUp" || groupId === "charRightArmUp") {
                return {
                    mode: "stretch",
                    pivot: { x: 0.5, y: 0.10 },
                    handAnchor: { x: 0.5, y: 0.96 }
                };
            }
            return {
                mode: "static",
                pivot: { x: 0.5, y: 0.5 },
                handAnchor: { x: 0.5, y: 0.95 }
            };
        }

        function normalizePoint(v, fallbackX = 0, fallbackY = 0) {
            return {
                x: Number.isFinite(+v?.x) ? +v.x : fallbackX,
                y: Number.isFinite(+v?.y) ? +v.y : fallbackY
            };
        }

        function normalizeScale2(v, fallbackX = 1, fallbackY = 1) {
            return {
                x: Number.isFinite(+v?.x) ? +v.x : fallbackX,
                y: Number.isFinite(+v?.y) ? +v.y : fallbackY
            };
        }

        function extractGroupConfigs(groupedParts) {
            const out = {};
            Object.entries(groupedParts || {}).forEach(([groupId, group]) => {
                out[groupId] = {
                    mode: String(group?.mode || getDefaultGroupConfig(groupId).mode),
                    pivot: normalizePoint(group?.pivot, getDefaultGroupConfig(groupId).pivot.x, getDefaultGroupConfig(groupId).pivot.y),
                    handAnchor: normalizePoint(group?.handAnchor, getDefaultGroupConfig(groupId).handAnchor.x, getDefaultGroupConfig(groupId).handAnchor.y)
                };
            });
            return out;
        }

        function toCanonicalPartKey(key) {
            for (const [canon, aliases] of Object.entries(PART_KEY_ALIASES)) {
                if (aliases.includes(key)) return canon;
            }
            return key;
        }

        function normalizeLayerOrder(keys, order) {
            const out = [];
            const seen = new Set();
            (order || []).map(toCanonicalPartKey).forEach((k) => {
                if (keys.includes(k) && !seen.has(k)) {
                    seen.add(k);
                    out.push(k);
                }
            });
            keys.forEach((k) => {
                if (!seen.has(k)) out.push(k);
            });
            return out;
        }

        function fileNameFromPath(p) {
            const path = String(p || "");
            const parts = path.split(/[\\/]/);
            return parts[parts.length - 1] || path;
        }

        function semanticPartLabel(key) {
            const map = {
                headFill: "Head Fill",
                headLine: "Head Line",
                bodyFill: "Body Fill",
                bodyLine: "Body Line",
                tailFill: "Tail Fill",
                tailLine: "Tail Line",
                charLeftEarFill: "Ear Left Fill",
                charLeftEarLine: "Ear Left Line",
                charLeftEarInner: "Ear Left Inner",
                charRightEarFill: "Ear Right Fill",
                charRightEarLine: "Ear Right Line",
                charLeftArmDownFill: "Arm Down Left Fill",
                charLeftArmDownLine: "Arm Down Left Line",
                charLeftArmUpFill: "Arm Up Left Fill",
                charLeftArmUpLine: "Arm Up Left Line",
                charRightArmDownFill: "Arm Down Right Fill",
                charRightArmDownLine: "Arm Down Right Line",
                charRightArmUpFill: "Arm Up Right Fill",
                charRightArmUpLine: "Arm Up Right Line",
                charLeftEye: "Eye Left",
                charRightEye: "Eye Right",
                charLeftBrow: "Brow Left",
                charRightBrow: "Brow Right",
                mouth: "Mouth"
            };
            return map[key] || key;
        }

        function clonePartTweaks(src) {
            const out = {};
            Object.entries(src || {}).forEach(([k, v]) => {
                out[toCanonicalPartKey(k)] = {
                    x: +v?.x || 0,
                    y: +v?.y || 0,
                    w: +v?.w || 0,
                    h: +v?.h || 0
                };
            });
            return out;
        }

        function cloneSlotTweaks(src) {
            const out = {};
            Object.entries(src || {}).forEach(([k, v]) => {
                out[k] = {
                    x: +v?.x || 0,
                    y: +v?.y || 0,
                    w: +v?.w || 0,
                    h: +v?.h || 0
                };
            });
            return out;
        }

        function cloneGroupConfigs(src) {
            const out = {};
            Object.entries(src || {}).forEach(([k, v]) => {
                out[k] = {
                    mode: String(v?.mode || "static"),
                    pivot: normalizePoint(v?.pivot, 0.5, 0.5),
                    handAnchor: normalizePoint(v?.handAnchor, 0.5, 0.95)
                };
            });
            return out;
        }

        function normalizeGroupedDrawOrder(keys, order) {
            const out = [];
            const seen = new Set();
            (order || []).forEach((k) => {
                if (keys.includes(k) && !seen.has(k)) {
                    seen.add(k);
                    out.push(k);
                }
            });
            keys.forEach((k) => {
                if (!seen.has(k)) out.push(k);
            });
            return out;
        }

        function buildGroupedPartsFromManifest(manifestParts) {
            const groupedParts = {};
            Object.entries(manifestParts || {}).forEach(([groupId, def]) => {
                if (!def) return;
                const defaults = getDefaultGroupConfig(groupId);
                const layers = Array.isArray(def.layers) ? def.layers : [];
                groupedParts[groupId] = {
                    id: groupId,
                    slot: def.slot || groupId,
                    mode: String(def.mode || defaults.mode),
                    offset: normalizePoint(def.offset, 0, 0),
                    scale: normalizeScale2(def.scale, 1, 1),
                    pivot: normalizePoint(def.pivot, defaults.pivot.x, defaults.pivot.y),
                    handAnchor: normalizePoint(def.handAnchor, defaults.handAnchor.x, defaults.handAnchor.y),
                    layers: layers.map((layer, idx) => {
                        const key = toCanonicalPartKey(layer.id || layer.key || `${groupId}_${idx}`);
                        return {
                            id: key,
                            key,
                            label: layer.label || layer.id || layer.key || `layer-${idx + 1}`,
                            file: String(layer.file || ""),
                            visible: layer.visible !== false,
                            offset: normalizePoint(layer?.offset, 0, 0),
                            scale: normalizeScale2(layer?.scale, 1, 1),
                            tweak: {
                                x: +layer?.tweak?.x || 0,
                                y: +layer?.tweak?.y || 0,
                                w: +layer?.tweak?.w || 0,
                                h: +layer?.tweak?.h || 0
                            }
                        };
                    })
                };
            });
            return {
                groupedParts,
                groupedDrawOrder: normalizeGroupedDrawOrder(Object.keys(groupedParts), Object.keys(groupedParts))
            };
        }

        function deriveRuntimeLayerState(groupedParts, groupedDrawOrder) {
            const partsMap = {};
            const visibleParts = [];
            const partTweaks = {};
            const layerOrder = [];
            const orderedGroups = normalizeGroupedDrawOrder(Object.keys(groupedParts || {}), groupedDrawOrder || GROUP_SLOT_ORDER);
            orderedGroups.forEach((groupId) => {
                const group = groupedParts[groupId];
                if (!group) return;
                (group.layers || []).forEach((layer) => {
                    const key = toCanonicalPartKey(layer.key || layer.id);
                    if (!layer.file) return;
                    partsMap[key] = layer.file;
                    if (layer.visible) visibleParts.push(key);
                    partTweaks[key] = {
                        x: +layer?.tweak?.x || 0,
                        y: +layer?.tweak?.y || 0,
                        w: +layer?.tweak?.w || 0,
                        h: +layer?.tweak?.h || 0
                    };
                    layerOrder.push(key);
                });
            });
            return { partsMap, visibleParts, partTweaks, layerOrder };
        }

        function sortLayersByDrawOrder(layers, drawOrder) {
            const order = normalizeLayerOrder(
                (layers || []).map((layer) => toCanonicalPartKey(layer.key || layer.id)),
                drawOrder || []
            );
            const orderIndex = new Map(order.map((key, idx) => [key, idx]));
            return (layers || []).slice().sort((a, b) => {
                const aKey = toCanonicalPartKey(a.key || a.id);
                const bKey = toCanonicalPartKey(b.key || b.id);
                return (orderIndex.get(aKey) ?? 9999) - (orderIndex.get(bKey) ?? 9999);
            });
        }

        function serializeAssetManifest(skinDef, state) {
            const runtimeAssetFiles = state?.partsMap || skinDef.partsMap || {};
            const drawOrder = normalizeLayerOrder(Object.keys(runtimeAssetFiles), state?.drawOrder || skinDef.drawOrder || Object.keys(runtimeAssetFiles));
            const visibleSet = new Set(state?.visibleSet ? Array.from(state.visibleSet) : (skinDef.visibleParts || []));
            const runtimeLayerTweaks = state?.partTweaks || skinDef.partTweaks || {};
            const runtimeSlotTweaks = cloneSlotTweaks(state?.slotTweaks || skinDef.slotTweaks || {});
            const runtimeGroupConfigs = cloneGroupConfigs(state?.groupConfigs || skinDef.groupConfigs || {});
            const groupedOrder = normalizeGroupedDrawOrder(
                Object.keys(skinDef.groupedParts || {}),
                skinDef.groupedDrawOrder || skinDef.groupOrder || GROUP_SLOT_ORDER
            );

            const parts = {};
            groupedOrder.forEach((groupId) => {
                const sourceGroup = skinDef.groupedParts?.[groupId];
                if (!sourceGroup) return;
                const defaults = getDefaultGroupConfig(groupId);
                const config = runtimeGroupConfigs[groupId] || {};
                const orderedLayers = sortLayersByDrawOrder(sourceGroup.layers || [], drawOrder);
                parts[groupId] = {
                    slot: sourceGroup.slot || groupId,
                    mode: String(config.mode || sourceGroup.mode || defaults.mode),
                    pivot: normalizePoint(config.pivot || sourceGroup.pivot, defaults.pivot.x, defaults.pivot.y),
                    handAnchor: normalizePoint(config.handAnchor || sourceGroup.handAnchor, defaults.handAnchor.x, defaults.handAnchor.y),
                    layers: orderedLayers.map((layer) => {
                        const key = toCanonicalPartKey(layer.key || layer.id);
                        return {
                            id: key,
                            label: layer.label || key,
                            file: String(runtimeAssetFiles[key] || layer.file || ""),
                            visible: visibleSet.has(key),
                            tweak: {
                                x: +runtimeLayerTweaks?.[key]?.x || 0,
                                y: +runtimeLayerTweaks?.[key]?.y || 0,
                                w: +runtimeLayerTweaks?.[key]?.w || 0,
                                h: +runtimeLayerTweaks?.[key]?.h || 0
                            }
                        };
                    })
                };
            });

            return {
                version: 3,
                groupOrder: groupedOrder,
                parts,
                slotTweaks: runtimeSlotTweaks,
                render: {
                    hideDefaultArms: !!skinDef.hideDefaultArms,
                    nativeSize: skinDef.render?.nativeSize !== false,
                    defaultScaleMode: skinDef.render?.defaultScaleMode || "contain"
                }
            };
        }

        function normalizeAssetSkin(id, manifest) {
            const m = manifest || {};
            const manifestLabel = m.meta?.label || m.label;
            const manifestVersion = +(m.meta?.version || m.version || 3);
            const groupedData = buildGroupedPartsFromManifest(m.parts || {});
            const groupedDrawOrder = normalizeGroupedDrawOrder(Object.keys(groupedData.groupedParts), m.groupOrder || groupedData.groupedDrawOrder || GROUP_SLOT_ORDER);
            const runtimeState = deriveRuntimeLayerState(groupedData.groupedParts, groupedDrawOrder);
            const keys = Object.keys({ ...DEFAULT_ASSET_PARTS, ...runtimeState.partsMap });
            return {
                id,
                label: manifestLabel || id,
                mode: "asset",
                root: `skins/${id}`,
                version: manifestVersion,
                // Runtime/editor convenience views derived from the grouped manifest.
                partsMap: runtimeState.partsMap,
                groupedParts: groupedData.groupedParts,
                groupConfigs: cloneGroupConfigs(extractGroupConfigs(groupedData.groupedParts)),
                groupOrder: groupedDrawOrder,
                groupedDrawOrder,
                visibleParts: runtimeState.visibleParts,
                drawOrder: normalizeLayerOrder(keys, runtimeState.layerOrder.length ? runtimeState.layerOrder : keys),
                partTweaks: runtimeState.partTweaks,
                slotTweaks: cloneSlotTweaks(m.slotTweaks || {}),
                hideDefaultArms: !!m.render?.hideDefaultArms,
                render: {
                    nativeSize: m.render?.nativeSize !== false,
                    defaultScaleMode: m.render?.defaultScaleMode || "contain"
                },
                morph: { ...baseSkin.morph, ...(m.morph || {}) },
                colors: { ...baseSkin.colors, ...(m.colors || {}) }
            };
        }

        return {
            PART_KEY_ALIASES,
            DEFAULT_ASSET_PARTS,
            DEFAULT_VISIBLE_PARTS,
            GROUP_SLOT_ORDER,
            getDefaultGroupConfig,
            extractGroupConfigs,
            toCanonicalPartKey,
            normalizeLayerOrder,
            fileNameFromPath,
            semanticPartLabel,
            clonePartTweaks,
            cloneSlotTweaks,
            cloneGroupConfigs,
            normalizePoint,
            normalizeScale2,
            normalizeGroupedDrawOrder,
            buildGroupedPartsFromManifest,
            deriveRuntimeLayerState,
            serializeAssetManifest,
            normalizeAssetSkin
        };
    };
})();
