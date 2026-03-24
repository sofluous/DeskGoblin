(function () {
    const root = window.DeskGoblin = window.DeskGoblin || {};

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

        return {
            formatClock,
            syncTimerUI,
            setTimerPreset,
            resetTimer,
            updateTimer
        };
    };
})();
