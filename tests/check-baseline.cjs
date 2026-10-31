// Structural checks only; browser acceptance and known defects are tracked in QA.md.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file).replace(/^\uFEFF/, ''));
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true })
    .flatMap((entry) => entry.isDirectory() ? walk(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);

const html = read('index.html');
let scripts = 0;
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const src = match[1].match(/src="([^"]+)"/);
    new vm.Script(src ? read(src[1]) : match[2], { filename: src ? src[1] : 'index.html:inline' });
    scripts++;
}
for (const file of walk('js').filter((file) => file.endsWith('.js'))) {
    new vm.Script(read(file), { filename: file });
}
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (!/^(https?:|data:)/.test(match[1])) {
        assert.ok(fs.existsSync(path.join(root, match[1])), `Missing HTML resource: ${match[1]}`);
    }
}

const context = { window: {}, console };
vm.createContext(context);
vm.runInContext(read('js/deskgoblin-skins.js'), context);
const manifest = context.window.DeskGoblin.createSkinManifestModule({ baseSkin: { morph: {}, colors: {} } });
const ids = json('skins/index.json').skins;
for (const id of ids) {
    const source = json(`skins/${id}/manifest.json`);
    assert.equal(source.version, 3);
    const layers = Object.values(source.parts).flatMap((group) => group.layers);
    assert.equal(new Set(layers.map((layer) => layer.id)).size, layers.length, `Duplicate IDs: ${id}`);
    for (const layer of layers) {
        assert.ok(fs.existsSync(path.join(root, 'skins', id, layer.file)), `Missing image: ${id}/${layer.file}`);
    }
    const skin = manifest.normalizeAssetSkin(id, source);
    const exported = manifest.serializeAssetManifest(skin);
    const reloaded = manifest.normalizeAssetSkin(id, exported);
    for (const key of ['partsMap', 'visibleParts', 'groupedDrawOrder', 'drawOrder', 'partTweaks', 'slotTweaks', 'groupConfigs', 'render']) {
        assert.equal(JSON.stringify(reloaded[key]), JSON.stringify(skin[key]), `${id} round-trip mismatch: ${key}`);
    }
    console.log(`PASS ${id}: ${Object.keys(source.parts).length} groups, ${layers.length} image files, current saved-field round trip`);
}
console.log(`PASS syntax (${scripts} page scripts plus all js/ files), local HTML resources and registered skin JSON`);
console.log('Browser checks remain outstanding; run node --test tests/stabilization.test.cjs for DG-01/DG-02 regressions.');
