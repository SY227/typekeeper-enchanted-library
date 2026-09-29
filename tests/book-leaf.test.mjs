import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {FOLIO_PALETTES,folioPalette,folioMetrics} from '../src/render/book-leaf.js';
import {APP_VERSION,BUILD_TAG} from '../src/build-info.js';
import {PRESENTATION_VERSION,readableCardLayout} from '../src/render/presentation.js';
import {RULESET_VERSION} from '../src/game/rules.js';

test('3.5.1 identifies the folio/caption build while retaining 3.2.1 balance',()=>{
 assert.equal(APP_VERSION,'3.6.2');assert.equal(PRESENTATION_VERSION,APP_VERSION);
 assert.equal(BUILD_TAG,'fresh-journey-362');assert.equal(RULESET_VERSION,'typekeeper-3.2.1');
});
for(const kind of ['normal','fire','ice','slow','wind','bonus'])test(`${kind}: immutable local folio material contains complete valid color roles`,()=>{
 const p=folioPalette(kind);assert.equal(p,FOLIO_PALETTES[kind]);assert(Object.isFrozen(p));
 for(const k of ['cover','spine','gold','face','shade','edge','ink'])assert.match(p[k],/^#[0-9a-f]{6}$/i);
 assert.notEqual(p.cover,p.face);
});
test('Unknown material has a safe normal-page fallback',()=>assert.equal(folioPalette('unknown'),FOLIO_PALETTES.normal));
for(const width of [112,160,240,410,520,620,708])test(`Folio width ${width}: decoration stays outside the central ink lane`,()=>{
 const a=folioMetrics(width);assert.equal(a.width,width);assert.equal(a.height,60);assert.equal(a.leafCount,3);
 assert(a.gutter<15);assert(a.topRule<12);assert(a.bottomRule>48);assert.equal(a.pad,16);assert(Object.isFrozen(a));
});
test('Folio metrics bound malformed inputs without nonfinite texture sizes',()=>{
 for(const [w,h]of [[NaN,NaN],[Infinity,Infinity],[-2,0]]){const a=folioMetrics(w,h);assert.equal(a.width,112);assert.equal(a.height,60);}
});
test('All six book styles remain different without relying on new labels or fonts',()=>{
 assert.equal(new Set(Object.values(FOLIO_PALETTES).map(p=>p.cover)).size,6);
 assert(Object.isFrozen(FOLIO_PALETTES));
});
test('Single-baseline text block still draws only full canonical strings; crest uses shared scroll coordinates',()=>{
 const s=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8').split(' paintCard(c,w,l,')[1].split(' drawWordFloats(c)')[0];
 assert.match(s,/const text=String\(w.text\),x=l.textX,baseline=0/);
 assert.match(s,/fillText\(text,x,baseline,l.textMaxWidth\)/);
 assert.doesNotMatch(s,/for.*l\.lines/);
 assert.match(s,/scrollGeometry\(width,h\)/);
});
test('Book art does not change single-line layout width, height, or full-word content',()=>{
 const measure=(s,size)=>s.length*size*.7;
 for(const kind of Object.keys(FOLIO_PALETTES))for(const word of ['INK','CLOCKWORK','BIOLUMINESCENT','W'.repeat(24)]){
  const l=readableCardLayout(word,112,kind,.8,measure),m=folioMetrics(l.width,l.height);
  assert.equal(l.lines.length,1);assert.equal(l.lines[0].text,word);assert.equal(l.baseline,0);
  assert.equal(m.width,l.width);assert.equal(m.height,l.height);assert(l.textWidth<=l.textMaxWidth+.01);
 }
});
test('3.5: all out-of-scope 3.4 runtime sources and existing art/audio assets remain byte-identical',()=>{
 const expected=JSON.parse(fs.readFileSync(new URL('./fixtures/v340-unchanged.json',import.meta.url)));
 for(const [p,hash]of Object.entries(expected)){
  assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../'+p,import.meta.url))).digest('hex'),hash,p);
 }
});
