import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {GameModel as Reference} from './fixtures/baseline340/src/game/model.js';
import {GameModel as Current} from '../src/game/model.js';
import * as oldRules from './fixtures/baseline340/src/game/rules.js';
import * as newRules from '../src/game/rules.js';
const notices=events=>events.filter(e=>e.type!=='multiplier-up').map(e=>{const c=structuredClone(e);if(c.type==='correct')delete c.multiplier;return c;});
const same=(a,b,where)=>{assert.deepEqual(b.snapshot(),a.snapshot(),where);assert.deepEqual(b.lastClear,a.lastClear,where);assert.deepEqual(b.stageHistory,a.stageHistory,where);assert.deepEqual(notices(b.drainEvents()),notices(a.drainEvents()),where);};
test('Differential-test reference hashes match the immutable user-uploaded 3.4.0 source',()=>{
 const hashes=JSON.parse(fs.readFileSync(new URL('./fixtures/baseline340/SHA256.json',import.meta.url)));
 for(const [p,sha]of Object.entries(hashes))assert.equal(createHash('sha256').update(fs.readFileSync(new URL('./fixtures/baseline340/'+p,import.meta.url))).digest('hex'),sha,p);
});
test('All authored rules, pace curves, power metadata and 1..100 chapter configurations match 3.4',()=>{
 for(const k of ['RULES','PACE_CURVE','PACES','POWERS','POWER_META','FIELD','RULESET_VERSION'])assert.deepEqual(newRules[k],oldRules[k],k);
 for(const p of ['classic','relaxed','maniac'])for(let n=1;n<=100;n++)assert.deepEqual(newRules.levelRules(n,p),oldRules.levelRules(n,p));
 for(let n=0;n<=160;n++)for(const text of ['I','BOOK','CONSTELLATION','BIOLUMINESCENT'])for(const kind of ['normal','bonus','ice'])assert.equal(newRules.scoreForWord(text,kind,n),oldRules.scoreForWord(text,kind,n));
});
for(let level=1;level<=48;level++)test(`3.4 → 3.5 authoritative parity: chapter ${level}, all three paces, identical genuine spawns/actions`,()=>{
 for(const pace of ['relaxed','classic','maniac']){
  const a=new Reference(),b=new Current(),options={seed:4711+level*317,wordSeed:level*98171,pace,level};a.start(options);b.start(options);same(a,b,'start');
  for(let i=0;i<650&&a.phase==='playing';i++){
   if(i===22){a.pause();b.pause();a.step(.05);b.step(.05);same(a,b,'pause');a.resume();b.resume();}
   for(const m of [a,b]){
    m.step(.05);
    // Deliberate wrong entries, priority typing and only normally earned magic.
    if(i===60||i===163){m.setBuffer('ZZZNO MATCH');m.submit();}
    if(m.words.length&&i%17===0&&i>45){const w=[...m.words].sort((x,y)=>y.y-x.y||x.id-y.id)[0];m.setBuffer(w.text);m.submit();}
    if(i%41===0&&m.inventory.ice)m.cast('ice');
    if(i%79===0&&m.inventory.slow)m.cast('slow');
    if(i%103===0&&m.inventory.fire&&m.words.length)m.cast('fire');
    if(i%67===0&&m.inventory.wind&&m.danger)m.cast('wind');
   }
   same(a,b,`chapter ${level}/${pace}/step ${i}`);
  }
  assert.deepEqual(b.exportReplay(),a.exportReplay());
  if(a.phase==='level-clear'&&level<48){assert.deepEqual(b.checkpoint(),a.checkpoint());a.nextLevel();b.nextLevel();same(a,b,'next chapter');}
 }
});
test('Miss, late-submit, compound FIRE/ICE/SLOW/WIND, and restoration retain exact 3.4 authority',()=>{
 const a=new Reference(),b=new Current();for(const m of [a,b]){m.start({seed:8,wordSeed:11,level:24});m.inventory={fire:2,ice:2,slow:2,wind:2};m.spawn();m.words[0].y=647.999;m.step();m.setBuffer(m.recentResolved[0].text);m.submit();m.cast('ice');m.cast('slow');m.cast('wind');}
 same(a,b,'miss and combined spells');for(let n=0;n<900;n++){a.step();b.step();if(n%30===0)same(a,b,`expiry ${n}`);}same(a,b,'end');
});
