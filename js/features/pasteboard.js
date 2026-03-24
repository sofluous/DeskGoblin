(function () {
    const root = window.DeskGoblin = window.DeskGoblin || {};

    root.createPasteboardModule = function createPasteboardModule({
        storageKey,
        state,
        dom,
        viewRef,
        sceneToStagePoint,
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
            } catch (_) {
                // Ignore quota and private-mode failures for this lightweight feature.
            }
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
                            } catch (_) {
                                // Clipboard permissions vary by browser.
                            }
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
                } catch (_) {
                    // Fall back to readText below.
                }
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
                dom.menuNote.textContent = "Reading clipboard…";
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
            sceneToStagePoint,
            clampStickyPosition,
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
})();
