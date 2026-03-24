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
})();
