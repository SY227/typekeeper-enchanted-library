import {productionBaselineBytes} from './production-baseline.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {HUD_LAYOUT,interfaceSizes,SPELL_CONTEXT} from '../src/ui/layout.js';
import {FIELD,POWERS,RULES} from '../src/game/rules.js';
import {PAPER_ANCHOR,BOOK_ANCHORS} from '../src/render/presentation.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const css=readFileSync(resolve(root,'src/styles.css'),'utf8');
const main=readFileSync(resolve(root,'src/main.js'),'utf8');
const pinned=JSON.parse(readFileSync(resolve(root,'tests/fixtures/v350-ui-preserved.json'),'utf8'));
// v3.6.2 adds scoped running-score storage; its old bytes remain in the pin file.
// All other pinned modules/assets remain byte-identical. New API has dedicated tests.
for(const [file,sha]of Object.entries(pinned.sha256).filter(([file])=>!['src/game/storage.js','src/render/presentation.js','src/render/renderer.js','src/render/elemental-art.js','src/audio/audio.js'].includes(file)))test(`v3.6.2 preserves v3.5.0 bytes: ${file}`,()=>assert.equal(createHash('sha256').update(productionBaselineBytes(file,readFileSync(resolve(root,file)))).digest('hex'),sha));
test('HUD geometry is immutable and simulation-independent',()=>{
 assert.ok(Object.isFrozen(HUD_LAYOUT)&&Object.isFrozen(HUD_LAYOUT.pile)&&Object.isFrozen(HUD_LAYOUT.context));
 assert.equal(FIELD.bottom,648);assert.equal(FIELD.top,172);
 assert.ok(HUD_LAYOUT.pile.x>FIELD.right);
 // Captions moved above covers as requested after 3.6.0. A low scroll's
 // lettering (not its blank frame) and the moving cover are checked in-browser.
 assert.equal(HUD_LAYOUT.statusTop,-28);
 assert.ok(HUD_LAYOUT.bookTop+HUD_LAYOUT.statusTop>=FIELD.bottom+12);
 assert.ok(HUD_LAYOUT.context.y>PAPER_ANCHOR.y+PAPER_ANCHOR.height);
 assert.ok(HUD_LAYOUT.context.x+HUD_LAYOUT.context.width<865);
 assert.ok(HUD_LAYOUT.context.y+HUD_LAYOUT.context.height<=890);
});
test('Key tabs never share the readiness row at the largest label size',()=>{
 const readinessEnd=HUD_LAYOUT.statusTop+18;
 assert.ok(readinessEnd+4<HUD_LAYOUT.keyTop);
 assert.equal(HUD_LAYOUT.bookTop,688);
 assert.deepEqual(Object.values(BOOK_ANCHORS).map(x=>x.y),[757,757,757,757]);
});
for(const scale of [.25,.4,.515555556,.648888889,.782222222,.835555556,1,1.2])test(`Readable interface sizing stays finite, capped, physically useful at scale ${scale}`,()=>{
 const sizes=interfaceSizes(scale);for(const n of Object.values(sizes))assert.ok(Number.isFinite(n)&&n>0);
 assert.ok(sizes.body>=16&&sizes.body<=21);assert.ok(sizes.utility>=42&&sizes.utility<=58);
 assert.ok(sizes.control>=44&&sizes.control<=58);
 if(scale>=.65){assert.ok(sizes.body*scale>=12.99);assert.ok(sizes.utility*scale>=35.99);}
});
for(const s of [NaN,Infinity,-1,0,undefined])test(`Invalid scale ${s} gets a safe finite fallback`,()=>assert.deepEqual(interfaceSizes(s),interfaceSizes(1)));
test('Short context descriptions state the shipping effects without inventing rewards',()=>{
 assert.deepEqual(Object.keys(SPELL_CONTEXT),POWERS);
 assert.match(SPELL_CONTEXT.fire,/No points, progress or books/);
 assert.match(SPELL_CONTEXT.ice,new RegExp(`${RULES.iceDuration} seconds`));
 assert.match(SPELL_CONTEXT.slow,new RegExp(`${RULES.slowDuration} seconds`));
 assert.match(SPELL_CONTEXT.wind,/Falling words stay/);
 for(const line of Object.values(SPELL_CONTEXT))assert.ok(line.length<=100);
});
test('One integrated rescue element and accessible meter; no old free-floating clone',()=>{
 const html=readFileSync(resolve(root,'index.html'),'utf8');
 assert.ok(!html.includes('id="rescue-hint"'));assert.equal((main.match(/id="rescue-hint"/g)||[]).length,1);
 assert.match(html,/role="meter"/);assert.match(main,/aria-valuenow/);
 assert.match(main,/model\.spellStatus\('wind'\)\.ready/);
});
test('Context help and transient messages share the defined well; keyboard precedence is explicit',()=>{
 assert.match(css,/\.has-toast \.spell-tip\{display:none!important/);
 assert.match(css,/\.spell-inventory:has\(\.spell-slot:focus-visible\)/);
 assert.match(main,/dialog-notice/);assert.match(main,/stage\.classList\.remove\('has-toast'\)/);
 assert.match(main,/a\[href\],summary/);
});
