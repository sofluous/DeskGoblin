(function () {
    const root = window.DeskGoblin = window.DeskGoblin || {};

    root.createAppState = function createAppState({ baseSkin, copyNumObject, copyColorObject }) {
        return {
            headBob: { y: 0, v: 0 },
            flyState: {
                active: false,
                squashed: false,
                escape: false,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                age: 0,
                life: 0,
                turnTimer: 0,
                wingPhase: 0,
                splatTimer: 0,
                cooldown: 5 + Math.random() * 6,
                radius: 10
            },
            timerState: {
                durationSec: 5 * 60,
                remaining: 5 * 60,
                running: false
            },
            skinState: {
                activeId: "test",
                targetId: "test",
                t: 1,
                dur: 0.24,
                fromMorph: copyNumObject(baseSkin.morph),
                toMorph: copyNumObject(baseSkin.morph),
                renderedMorph: copyNumObject(baseSkin.morph),
                fromColors: copyColorObject(baseSkin.colors),
                toColors: copyColorObject(baseSkin.colors),
                renderedColors: copyColorObject(baseSkin.colors),
                motion: 0,
                blinkTimer: 0,
                blinkNext: 1.8 + Math.random() * 2.2,
                blinkDur: 0.13,
                blink: 0,
                idleFaceTimer: 0,
                idleFaceNext: 4 + Math.random() * 5,
                idleFaceDur: 0.9,
                idleFaceType: "",
                idleFaceAmount: 0
            }
        };
    };

    root.createTimerModule = function createTimerModule({ timerState, clamp, ui, onComplete }) {
        function formatClock(totalSeconds) {
            const secs = Math.max(0, Math.ceil(totalSeconds));
            const mm = Math.floor(secs / 60);
            const ss = secs % 60;
            return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
        }

        function syncTimerUI() {
            if (!ui.timeEl) return;
            const progress = clamp(timerState.remaining / Math.max(timerState.durationSec, 1), 0, 1);
            const empty = clamp(1 - progress, 0, 1);
            ui.durationEl.textContent = `${Math.round(timerState.durationSec / 60)} Minute Timer`;
            ui.timeEl.textContent = formatClock(timerState.remaining);
            ui.subEl.textContent = timerState.running
                ? "Counting down"
                : (timerState.remaining < timerState.durationSec ? "Paused" : "Ready to start");
            ui.toggleBtn.textContent = timerState.running ? "Pause" : "Start";
            ui.toggleBtn.setAttribute("aria-pressed", timerState.running ? "true" : "false");
            ui.faceEl?.style.setProperty("--timer-progress", progress.toFixed(4));
            ui.faceEl?.style.setProperty("--timer-empty", empty.toFixed(4));
            ui.presetButtons.forEach((btn) => {
                const selected = Number(btn.dataset.minutes) === Math.round(timerState.durationSec / 60);
                btn.setAttribute("aria-pressed", selected ? "true" : "false");
            });
        }

        function setTimerPreset(minutes) {
            const mins = [5, 15, 30].includes(minutes) ? minutes : 5;
            timerState.durationSec = mins * 60;
            timerState.remaining = timerState.durationSec;
            timerState.running = false;
            syncTimerUI();
        }

        function resetTimer() {
            timerState.running = false;
            timerState.remaining = timerState.durationSec;
            syncTimerUI();
        }

        function updateTimer(dt) {
            if (!timerState.running) return;
            timerState.remaining = Math.max(0, timerState.remaining - dt);
            if (timerState.remaining <= 0) {
                timerState.remaining = 0;
                timerState.running = false;
                if (onComplete) onComplete();
            }
            syncTimerUI();
        }

        return { formatClock, syncTimerUI, setTimerPreset, resetTimer, updateTimer };
    };

    root.createPasteboardModule = function createPasteboardModule({
        storageKey,
        state,
        dom,
        viewRef,
        getStickyWallBounds,
        clamp,
        triggerFaceReaction
    }) {
        function clampStickyPosition(note, x, y) {
            const bounds = getStickyWallBounds(note.w, note.h);
            return {
                x: clamp(x, bounds.left, Math.max(bounds.left, bounds.right)),
                y: clamp(y, bounds.top, Math.max(bounds.top, bounds.bottom))
            };
        }

        function persistStickyNotes() {
            try {
                localStorage.setItem(storageKey, JSON.stringify(state.notes));
            } catch (_) { }
        }

        function loadStickyNotes() {
            try {
                const raw = localStorage.getItem(storageKey);
                if (!raw) return [];
                const parsed = JSON.parse(raw);
                if (!Array.isArray(parsed)) return [];
                return parsed.map((note) => ({
                    id: String(note.id || `sticky_${Date.now()}`),
                    kind: note.kind === "image" ? "image" : "text",
                    x: +note.x || 120,
                    y: +note.y || 100,
                    w: Math.max(120, +note.w || 152),
                    h: Math.max(100, +note.h || 128),
                    text: String(note.text || ""),
                    dataUrl: typeof note.dataUrl === "string" ? note.dataUrl : "",
                    createdAt: +note.createdAt || Date.now()
                }));
            } catch (_) {
                return [];
            }
        }

        function syncPasteboardTransform() {
            if (!dom.scene) return;
            const view = viewRef();
            dom.scene.style.transform = `translate(${view.ox}px, ${view.oy}px) scale(${view.scale})`;
        }

        function hideStageMenu() {
            state.menu.open = false;
            if (dom.menu) dom.menu.hidden = true;
        }

        function showStageMenu(clientX, clientY, sceneX, sceneY) {
            state.menu.open = true;
            state.menu.sceneX = sceneX;
            state.menu.sceneY = sceneY;
            dom.menu.hidden = false;
            const menuRect = dom.menu.getBoundingClientRect();
            const menuLeft = Math.min(clientX, Math.max(8, window.innerWidth - menuRect.width - 8));
            const menuTop = Math.min(clientY, Math.max(8, window.innerHeight - menuRect.height - 8));
            dom.menu.style.left = `${menuLeft}px`;
            dom.menu.style.top = `${menuTop}px`;
            dom.pasteBtn.disabled = false;
            dom.menuNote.textContent = "Paste a clipboard image or text snippet onto the wall.";
        }

        function escapeHtml(value) {
            return String(value || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\"/g, "&quot;");
        }

        function describeSticky(note) {
            return note.kind === "image" ? "Image Clip" : "Text Note";
        }

        function renderStickyNotes() {
            if (!dom.scene) return;
            dom.scene.innerHTML = "";
            state.notes.forEach((note) => {
                const el = document.createElement("article");
                el.className = `sticky-note ${note.kind === "image" ? "is-image" : "is-text"}`;
                el.dataset.id = note.id;
                el.style.left = `${note.x}px`;
                el.style.top = `${note.y}px`;
                el.style.width = `${note.w}px`;
                el.style.height = `${note.h}px`;
                el.innerHTML =
                    `<div class="sticky-note-head">` +
                    `<div class="sticky-note-kind">${escapeHtml(describeSticky(note))}</div>` +
                    `<button type="button" class="sticky-note-delete ds-btn ds-btn-icon ds-btn-sm" data-action="delete" aria-label="Delete sticky" title="Delete sticky"><i class="iconoir-trash"></i></button>` +
                    `</div>` +
                    `<div class="sticky-note-thumb">${note.kind === "image"
                        ? `<img src="${escapeHtml(note.dataUrl)}" alt="Sticky clipboard preview" />`
                        : `<div class="sticky-note-text">${escapeHtml((note.text || "").slice(0, 240))}</div>`}</div>` +
                    `<div class="sticky-note-actions">` +
                    `<button type="button" class="ds-btn ds-btn-icon ds-btn-sm" data-action="copy" aria-label="Copy sticky" title="Copy sticky"><i class="iconoir-copy"></i></button>` +
                    `<button type="button" class="ds-btn ds-btn-icon ds-btn-sm" data-action="export" aria-label="Export sticky" title="Export sticky"><i class="iconoir-download"></i></button>` +
                    `</div>`;

                el.addEventListener("pointerdown", (ev) => {
                    if (ev.button !== 0) return;
                    if (ev.target.closest("button, a, input, textarea, select")) return;
                    ev.preventDefault();
                    ev.stopPropagation();
                    state.drag = {
                        id: note.id,
                        startX: ev.clientX,
                        startY: ev.clientY,
                        noteX: note.x,
                        noteY: note.y
                    };
                });

                el.querySelectorAll("[data-action]").forEach((btn) => {
                    btn.addEventListener("click", async (ev) => {
                        ev.stopPropagation();
                        const action = btn.dataset.action;
                        if (action === "delete") {
                            state.notes = state.notes.filter((entry) => entry.id !== note.id);
                            persistStickyNotes();
                            renderStickyNotes();
                            return;
                        }
                        if (action === "export") {
                            const filename = note.kind === "image" ? `sticky-${note.id}.png` : `sticky-${note.id}.txt`;
                            const href = note.kind === "image"
                                ? note.dataUrl
                                : URL.createObjectURL(new Blob([note.text || ""], { type: "text/plain;charset=utf-8" }));
                            const a = document.createElement("a");
                            a.href = href;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            if (note.kind !== "image") setTimeout(() => URL.revokeObjectURL(href), 500);
                            return;
                        }
                        if (action === "copy") {
                            try {
                                if (note.kind === "image" && navigator.clipboard?.write && window.ClipboardItem) {
                                    const blob = await fetch(note.dataUrl).then((res) => res.blob());
                                    await navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]);
                                } else if (navigator.clipboard?.writeText) {
                                    await navigator.clipboard.writeText(note.kind === "image" ? note.dataUrl : note.text || "");
                                }
                            } catch (_) { }
                        }
                    });
                });

                dom.scene.appendChild(el);
            });
        }

        async function readClipboardStickyData() {
            if (navigator.clipboard?.read) {
                try {
                    const items = await navigator.clipboard.read();
                    for (const item of items) {
                        const imageType = item.types.find((type) => type.startsWith("image/"));
                        if (imageType) {
                            const blob = await item.getType(imageType);
                            const dataUrl = await new Promise((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onload = () => resolve(String(reader.result || ""));
                                reader.onerror = () => reject(reader.error);
                                reader.readAsDataURL(blob);
                            });
                            return { kind: "image", dataUrl };
                        }
                        if (item.types.includes("text/plain")) {
                            const blob = await item.getType("text/plain");
                            const text = await blob.text();
                            if (text.trim()) return { kind: "text", text };
                        }
                    }
                } catch (_) { }
            }

            if (navigator.clipboard?.readText) {
                const text = await navigator.clipboard.readText();
                if (text.trim()) return { kind: "text", text };
            }

            throw new Error("Clipboard did not contain an image or text snippet.");
        }

        async function pasteStickyAt(sceneX, sceneY) {
            try {
                dom.pasteBtn.disabled = true;
                dom.menuNote.textContent = "Reading clipboard...";
                const clip = await readClipboardStickyData();
                const base = clip.kind === "image"
                    ? { w: 156, h: 146, dataUrl: clip.dataUrl, text: "" }
                    : { w: 152, h: 126, dataUrl: "", text: clip.text || "" };
                const id = `sticky_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
                const pos = clampStickyPosition(base, sceneX - base.w * 0.5, sceneY - base.h * 0.5);
                state.notes.push({
                    id,
                    kind: clip.kind,
                    x: pos.x,
                    y: pos.y,
                    w: base.w,
                    h: base.h,
                    text: base.text,
                    dataUrl: base.dataUrl,
                    createdAt: Date.now()
                });
                persistStickyNotes();
                renderStickyNotes();
                hideStageMenu();
                triggerFaceReaction("perk", 1.0);
            } catch (err) {
                dom.menuNote.textContent = err?.message || "Clipboard access was blocked.";
                dom.pasteBtn.disabled = false;
            }
        }

        function handlePointerMove(ev) {
            if (!state.drag) return;
            const note = state.notes.find((entry) => entry.id === state.drag.id);
            if (!note) return;
            const view = viewRef();
            const dx = (ev.clientX - state.drag.startX) / Math.max(view.scale, 0.0001);
            const dy = (ev.clientY - state.drag.startY) / Math.max(view.scale, 0.0001);
            const pos = clampStickyPosition(note, state.drag.noteX + dx, state.drag.noteY + dy);
            note.x = pos.x;
            note.y = pos.y;
            renderStickyNotes();
        }

        function handlePointerUp() {
            if (!state.drag) return;
            state.drag = null;
            persistStickyNotes();
        }

        return {
            state,
            persistStickyNotes,
            loadStickyNotes,
            syncPasteboardTransform,
            hideStageMenu,
            showStageMenu,
            renderStickyNotes,
            pasteStickyAt,
            handlePointerMove,
            handlePointerUp
        };
    };

    root.createAmbientModule = function createAmbientModule({
        flyState,
        getSceneViewportBounds,
        layout,
        isTModeOn,
        getArms,
        startSmash,
        triggerFaceReaction
    }) {
        function resetFlyCooldown(min = 6, max = 14) {
            flyState.cooldown = min + Math.random() * (max - min);
        }

        function spawnFly() {
            const bounds = getSceneViewportBounds();
            const sceneLayout = layout();
            const margin = 42;
            const minX = bounds.left + margin;
            const maxX = bounds.right - margin;
            const minY = bounds.top + margin;
            const maxY = Math.max(minY + 24, sceneLayout.deskTopY - 56);
            const fromLeft = Math.random() < 0.5;
            flyState.active = true;
            flyState.squashed = false;
            flyState.escape = false;
            flyState.age = 0;
            flyState.life = 6 + Math.random() * 4;
            flyState.turnTimer = 0;
            flyState.wingPhase = Math.random() * Math.PI * 2;
            flyState.splatTimer = 0;
            flyState.x = fromLeft ? minX : maxX;
            flyState.y = minY + Math.random() * Math.max(40, maxY - minY);
            flyState.vx = fromLeft ? 48 + Math.random() * 22 : -(48 + Math.random() * 22);
            flyState.vy = (Math.random() - 0.5) * 24;
        }

        function hitTestFly(x, y) {
            if (!flyState.active || flyState.squashed) return false;
            return Math.hypot(x - flyState.x, y - flyState.y) <= flyState.radius + 6;
        }

        function smashFlyAt(x, y) {
            if (!flyState.active || flyState.squashed || isTModeOn()) return false;
            const { armL, armR } = getArms();
            if (armL && armR) {
                const leftDist = Math.hypot(x - armL.shoulder.x, y - armL.shoulder.y);
                const rightDist = Math.hypot(x - armR.shoulder.x, y - armR.shoulder.y);
                const arm = leftDist <= rightDist ? armL : armR;
                arm.assignedId = "__fly__";
                startSmash(arm, { id: "__fly__", x, y, type: "ambient", held: false });
            }
            flyState.squashed = true;
            flyState.escape = false;
            flyState.splatTimer = 0.8;
            flyState.vx = 0;
            flyState.vy = 0;
            triggerFaceReaction("smirk", 1.1);
            resetFlyCooldown(9, 18);
            return true;
        }

        function updateFly(dt) {
            if (isTModeOn()) return;
            if (!flyState.active) {
                flyState.cooldown -= dt;
                if (flyState.cooldown <= 0) spawnFly();
                return;
            }

            flyState.wingPhase += dt * 24;

            if (flyState.squashed) {
                flyState.splatTimer = Math.max(0, flyState.splatTimer - dt);
                if (flyState.splatTimer <= 0) flyState.active = false;
                return;
            }

            const bounds = getSceneViewportBounds();
            const sceneLayout = layout();
            const margin = 36;
            const minX = bounds.left + margin;
            const maxX = bounds.right - margin;
            const minY = bounds.top + margin;
            const maxY = Math.max(minY + 20, sceneLayout.deskTopY - 48);

            flyState.age += dt;
            flyState.turnTimer -= dt;
            if (flyState.age >= flyState.life) flyState.escape = true;

            if (flyState.turnTimer <= 0) {
                flyState.turnTimer = 0.25 + Math.random() * 0.8;
                const jitter = flyState.escape ? 42 : 26;
                flyState.vx += (Math.random() - 0.5) * jitter;
                flyState.vy += (Math.random() - 0.5) * jitter;
            }

            const speedLimit = flyState.escape ? 130 : 82;
            const speed = Math.hypot(flyState.vx, flyState.vy) || 1;
            if (speed > speedLimit) {
                flyState.vx = (flyState.vx / speed) * speedLimit;
                flyState.vy = (flyState.vy / speed) * speedLimit;
            }

            if (flyState.escape) {
                const escapeBias = flyState.x < (minX + maxX) * 0.5 ? -1 : 1;
                flyState.vx += escapeBias * dt * 120;
                flyState.vy -= dt * 16;
            }

            flyState.x += flyState.vx * dt;
            flyState.y += flyState.vy * dt;

            if (flyState.escape) {
                if (flyState.x < minX - 40 || flyState.x > maxX + 40 || flyState.y < minY - 40) {
                    flyState.active = false;
                    resetFlyCooldown(7, 14);
                }
                return;
            }

            if (flyState.x < minX || flyState.x > maxX) {
                flyState.x = Math.max(minX, Math.min(maxX, flyState.x));
                flyState.vx *= -0.85;
            }
            if (flyState.y < minY || flyState.y > maxY) {
                flyState.y = Math.max(minY, Math.min(maxY, flyState.y));
                flyState.vy *= -0.85;
            }
        }

        return { resetFlyCooldown, spawnFly, hitTestFly, smashFlyAt, updateFly };
    };
})();
