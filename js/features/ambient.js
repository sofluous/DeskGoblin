(function () {
    const root = window.DeskGoblin = window.DeskGoblin || {};

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

        return {
            resetFlyCooldown,
            spawnFly,
            hitTestFly,
            smashFlyAt,
            updateFly
        };
    };
})();
