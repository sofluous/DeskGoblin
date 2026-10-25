const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '');
const plain = (value) => JSON.parse(JSON.stringify(value));
const context = { window: {} };
vm.createContext(context);
for (const file of ['js/deskgoblin-features.js', 'js/deskgoblin-skins.js']) {
    vm.runInContext(read(file), context, { filename: file });
}
const api = context.window.DeskGoblin;

function timerFixture() {
    let clock = 100000;
    let completions = 0;
    const state = { durationSec: 300, remaining: 300, running: false };
    const timer = api.createTimerModule({
        timerState: state, ui: {}, clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
        now: () => clock, onComplete: () => completions++
    });
    return { timer, state, advance: (ms) => { clock += ms; }, completions: () => completions };
}

test('timer follows elapsed time at low FPS and after a suspended frame loop', () => {
    const f = timerFixture();
    f.timer.toggleTimer();
    for (let i = 0; i < 600; i++) { f.advance(100); f.timer.updateTimer(); }
    assert.equal(f.state.remaining, 240);
    f.advance(250000);
    f.timer.updateTimer();
    f.timer.updateTimer();
    assert.equal(f.state.remaining, 0);
    assert.equal(f.state.running, false);
    assert.equal(f.completions(), 1);
    f.timer.toggleTimer();
    assert.equal(f.state.remaining, 300);
    assert.equal(f.state.running, true);
});

test('pause accounts for time since the last frame and excludes paused time', () => {
    const f = timerFixture();
    f.timer.toggleTimer();
    f.advance(12500);
    f.timer.toggleTimer();
    assert.equal(f.state.remaining, 287.5);
    f.advance(60000);
    f.timer.updateTimer();
    assert.equal(f.state.remaining, 287.5);
    f.timer.toggleTimer();
    f.advance(2500);
    f.timer.updateTimer();
    assert.equal(f.state.remaining, 285);
});

test('reset and preset changes cancel the old deadline without stale completion', () => {
    const f = timerFixture();
    f.timer.toggleTimer();
    f.advance(1000);
    f.timer.resetTimer();
    assert.equal(f.state.running, false);
    assert.equal(f.state.remaining, 300);
    for (const minutes of [5, 15, 30]) {
        f.timer.toggleTimer();
        f.timer.setTimerPreset(minutes);
        assert.equal(f.state.remaining, minutes * 60);
        assert.equal(f.state.running, false);
        f.advance(2000000);
        f.timer.updateTimer();
        assert.equal(f.state.remaining, minutes * 60);
    }
    f.timer.setTimerPreset(99);
    assert.equal(f.state.remaining, 300);
    assert.equal(f.completions(), 0);
});

test('pausing an expired timer completes once without restarting it', () => {
    const f = timerFixture();
    f.timer.toggleTimer();
    f.advance(400000);
    f.timer.toggleTimer();
    assert.equal(f.state.running, false);
    assert.equal(f.state.remaining, 0);
    assert.equal(f.completions(), 1);
});

test('manifest export preserves transforms alongside live editor changes', () => {
    const m = api.createSkinManifestModule({ baseSkin: { morph: {}, colors: {} } });
    const source = JSON.parse(read('skins/fox/manifest.json'));
    const head = source.parts.head;
    head.offset = { x: -12, y: 23 };
    head.scale = { x: 1.2, y: 0.8 };
    head.layers[0].offset = { x: 4, y: -5 };
    head.layers[0].scale = { x: 0.7, y: 1.3 };
    const skin = m.normalizeAssetSkin('fox', source);
    const order = Array.from(skin.drawOrder).reverse();
    const state = {
        partsMap: { ...skin.partsMap, headFill: 'replacement.PNG' },
        drawOrder: order,
        visibleSet: new Set(skin.visibleParts.filter((id) => id !== 'headFill')),
        partTweaks: { ...skin.partTweaks, headLine: { x: 3, y: 4, w: 5, h: 6 } },
        slotTweaks: { head: { x: 7, y: 8, w: 9, h: 10 } },
        groupConfigs: { ...skin.groupConfigs, head: { mode: 'static', pivot: { x: 0.2, y: 0.3 }, handAnchor: { x: 0.4, y: 0.9 } } }
    };
    const reloaded = m.normalizeAssetSkin('fox', m.serializeAssetManifest(skin, state));
    assert.deepEqual(plain(reloaded.groupedParts.head.offset), head.offset);
    assert.deepEqual(plain(reloaded.groupedParts.head.scale), head.scale);
    const fill = reloaded.groupedParts.head.layers.find((layer) => layer.id === 'headFill');
    assert.deepEqual(plain(fill.offset), head.layers[0].offset);
    assert.deepEqual(plain(fill.scale), head.layers[0].scale);
    assert.equal(fill.file, 'replacement.PNG');
    assert.equal(fill.visible, false);
    assert.deepEqual(Array.from(reloaded.groupedParts.head.layers, (layer) => layer.id), ['headLine', 'headFill']);
    for (const key of ['partTweaks', 'slotTweaks', 'groupConfigs']) {
        assert.deepEqual(plain(reloaded[key]), plain(state[key]));
    }
    assert.deepEqual(plain(reloaded.render), plain(skin.render));
});

test('unchanged Fox transforms and export are stable across repeated reloads', () => {
    const m = api.createSkinManifestModule({ baseSkin: { morph: {}, colors: {} } });
    const skin = m.normalizeAssetSkin('fox', JSON.parse(read('skins/fox/manifest.json')));
    const exported = m.serializeAssetManifest(skin);
    assert.deepEqual(plain(m.serializeAssetManifest(m.normalizeAssetSkin('fox', exported))), plain(exported));
    assert.deepEqual(plain(exported.parts.head.offset), { x: 0, y: 0 });
    assert.deepEqual(plain(exported.parts.head.scale), { x: 1, y: 1 });
});
