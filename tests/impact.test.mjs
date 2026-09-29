import {retainedBaselineBytes} from './retained-baseline.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {IMPACT,MachineResponse,pileLeaf,targetTreatment,impactSource,pendingPaperPressure,impactEnvelope,impactTarget,impactFeedbackEvents} from '../src/render/impact.js';
import {GameModel} from '../src/game/model.js';
import {presentationTarget} from '../src/render/presentation.js';
import {GameRenderer} from '../src/render/renderer.js';
const event=(text,extra={})=>({changed:true,text,target:{id:8,text:'BOOK'},erased:false,...extra});
test('Impact durations are short and explicitly bounded; normal clear is 250ms',()=>{assert.equal(IMPACT.normalClear,.25);assert(IMPACT.key<=.1);assert(IMPACT.return<=.18);assert(IMPACT.landing<=.32);assert(IMPACT.points<.5);assert.equal(IMPACT.arrivals,12);});
test('Changed keys drive immediate mechanical response without needing a simulation tick',()=>{const m=new MachineResponse();m.input(event('B'));assert(m.pose().tap>.99);assert.equal(m.lastTarget,8);assert.equal(m.pose().shift,-.66);});
test('Unchanged keys do not replay a strike or alternate hands',()=>{const m=new MachineResponse();m.input(event('B'));m.step(.04);const s=JSON.stringify(m);m.input(event('B',{changed:false}));assert.equal(JSON.stringify(m),s);});
test('Hands alternate only on changed non-erasing inputs',()=>{const m=new MachineResponse();m.input(event('B'));const hand=m.hand;m.input(event('BO'));assert.notEqual(m.hand,hand);m.input(event('B',{erased:true}));assert.equal(m.hand,1-hand);assert.equal(m.key,0);assert(m.pose().erase>0);});
test('Backspace has a distinct erase response and rewinds the mechanical carriage',()=>{const m=new MachineResponse();m.input(event('BOOK'));m.input(event('BOO',{erased:true}));assert.equal(m.pose().shift,-1.98);assert.equal(m.key,0);assert(m.erase>0);});
test('Successful Enter returns from the previous carriage offset, not from a magic fixed distance',()=>{const m=new MachineResponse();m.input(event('BOOK'));const old=m.pose().shift;m.submit();assert.equal(m.pose().shift,old);m.step(.05);assert(Math.abs(m.pose().shift)<Math.abs(old));for(let i=0;i<4;i++)m.step(.05);assert.equal(m.pose().shift,0);});
test('A new letter cancels a still-running return instead of delaying input',()=>{const m=new MachineResponse();m.input(event('BOOK'));m.submit();m.input(event('F'));assert.equal(m.returning,0);assert.equal(m.pose().shift,-.66);assert(m.pose().tap>0);});
test('Key, erase and return settle exactly; zero delta preserves a paused pose',()=>{const m=new MachineResponse();m.input(event('BOOK'));m.submit();const before=JSON.stringify(m);m.step(0);assert.equal(JSON.stringify(m),before);for(let i=0;i<6;i++)m.step(.05);assert.equal(m.key+m.erase+m.returning,0);});
test('Reduced motion cancels all mechanical movement without emitting another stroke',()=>{const m=new MachineResponse();m.input(event('BOOK'));m.submit();m.step(.01,false);assert.equal(m.pose(false).tap+m.pose(false).returning+Math.abs(m.pose(false).shift),0);m.step(.01,true);assert.equal(m.pose().tap,0);});
test('Bad/long delta is bounded and cannot create an animation backlog',()=>{const m=new MachineResponse();m.input(event('A'));for(const v of [NaN,Infinity,-1]){const s=JSON.stringify(m);m.step(v);assert.equal(JSON.stringify(m),s);}m.step(999);assert.equal(m.key,IMPACT.key-.05);});
test('Twenty-four-letter buffer does not move rail outside its available paper margin',()=>{const m=new MachineResponse();m.input(event('W'.repeat(500)));assert.equal(m.pose().shift,-15.84);});
for(const danger of [0,2,12,25,49,50,74,75,89,90,95,100])test(`Physical paper geometry stays clear of input/SLOW/word lane at ${danger}%`,()=>{
 for(let i=0;i<=31;i++){const p=pileLeaf(danger,i/31);assert(p.x+p.width/2<=858);assert(p.y-15>678);if(p.y+14>742)assert(p.x-p.width/2>=795);assert(p.y+7<=818);assert(p.width>=58&&p.width<=100);}
});
test('Paper stack grows monotonically and settles into the actual destination',()=>{let last=999;for(let n=0;n<=100;n++){const p=pileLeaf(n);assert(p.y<=last);last=p.y;}const m=Object.create(GameRenderer.prototype);for(const d of [0,50,100])assert.deepEqual(m.pilePoint(d),(({x,y,width})=>({x,y,width}))(pileLeaf(d)));});
test('Nonfinite and out-of-range danger cannot poison geometry',()=>{for(const v of [NaN,Infinity,-1,9999])for(const p of Object.values(pileLeaf(v)))assert(Number.isFinite(p));});
for(const kind of ['normal','fire','ice','slow','wind','bonus'])test(`Prefix treatment retains a distinct single selected target on ${kind}`,()=>{
 const word={text:'BOOK',kind};assert.equal(targetTreatment(word,'',true).matches,false);assert.equal(targetTreatment(word,'BO',false).selected,false);assert.equal(targetTreatment(word,'BO',true).weight,2.4);assert.equal(targetTreatment(word,'BO',true).complete,false);assert.equal(targetTreatment(word,'BOOK',true).complete,true);assert.equal(targetTreatment(word,'BOOKS',true).matches,false);assert.equal(targetTreatment(word,'BO',true,true).selected,true);
});
test('Model-priority common prefix and full-word submit agree with presentation targeting',()=>{const m=new GameModel();m.start();m.words=[{id:8,text:'BOOKCASE',x:500,y:300},{id:9,text:'BOOK',x:700,y:500}];m.setBuffer('BO');const t=presentationTarget(m.words,m.buffer);assert.equal(t.id,9);assert.equal(m.drainEvents().at(-1).target.id,9);});
test('Death source uses last displayed x/y/scale/angle and never mutates word or pose',()=>{const w=Object.freeze({id:2,text:'BOOK',x:500,y:172}),p=Object.freeze({x:184,y:268,scale:.82,angle:-.13});const s=impactSource(w,p);assert.equal(s.x,184);assert.equal(s.y,268);assert.equal(s.visualScale,.82);assert.equal(s.visualAngle,-.13);assert.equal(w.x,500);assert.equal(impactSource(w).x,500);});
test('Pending-paper weights ignore malformed optional values',()=>{assert.equal(pendingPaperPressure([{pressure:12},{pressure:8},{pressure:NaN},{}]),20);});
test('Impact envelope has no negative or nonfinite visual values',()=>{for(const x of [-10,0,.01,.05,.1,999,NaN]){const t=impactEnvelope(x,.1);assert(Number.isFinite(t)&&t>=0&&t<=1);}});
test('Key/target/paper calls consume neither model random stream nor change outcomes',()=>{const a=new GameModel(),b=new GameModel();a.start({seed:31,wordSeed:81});b.start({seed:31,wordSeed:81});const q=new MachineResponse();for(let i=0;i<90;i++){q.input(event('B'));q.step(.03);pileLeaf(i);targetTreatment({text:'BOOK',kind:'normal'},'B',true);a.step();b.step();}assert.deepEqual(a.snapshot(),b.snapshot());});
test('Retained 3.5.2 baseline hashes match outside the explicitly documented caption and menu additions',()=>{
 const p=JSON.parse(fs.readFileSync(new URL('./fixtures/v352-impact-preserved.json',import.meta.url)));assert(p.sha256['src/game/model.js']);assert(p.sha256['src/game/score-chase.js']);assert(p.sha256['src/styles.css']);for(const [f,h]of Object.entries(p.sha256))assert.equal(createHash('sha256').update(retainedBaselineBytes(f,fs.readFileSync(new URL('../'+f,import.meta.url)))).digest('hex'),h,f);
});

test('Complete shorter word takes feedback priority over a lower longer prefix, exactly like Enter',()=>{
 const m=new GameModel();m.start();m.words=[{id:1,text:'BOOK',kind:'normal',x:450,y:260,width:112},{id:2,text:'BOOKCASE',kind:'normal',x:760,y:490,width:190}];
 m.setBuffer('BO');assert.equal(impactTarget(m.words,m.buffer).text,'BOOKCASE');m.drainEvents();m.setBuffer('BOOK');
 const original=m.drainEvents();assert.equal(original[0].target.text,'BOOKCASE');assert.equal(original[0].complete,false);
 const fixed=impactFeedbackEvents(original,m.words);assert.equal(fixed[0].target.text,'BOOK');assert.equal(fixed[0].complete,true);assert.equal(original[0].complete,false);
 m.submit();assert.equal(m.drainEvents().find(e=>e.type==='correct').word.text,'BOOK');assert.equal(m.score,40);assert.equal(m.words[0].text,'BOOKCASE');
});
test('Feedback target resolves batched input/correct events but does not preview a future spawn',()=>{
 const old={id:1,text:'BOOK',y:250},long={id:2,text:'BOOKCASE',y:500},future={id:3,text:'BOOK',y:600};
 const input={type:'input',text:'BOOK',changed:true,target:long,complete:false},correct={type:'correct',word:old,points:40};
 const raw=[input,correct,{type:'spawn',word:future}],fixed=impactFeedbackEvents(raw,[long,future]);
 assert.equal(fixed[0].target.id,1);assert.equal(fixed[0].complete,true);assert.equal(fixed[1],correct);assert.equal(raw[0].target.id,2);
});
test('Exact duplicates retain lowest-y/id ordering; read-only targeting never sorts the live array',()=>{
 const a=Object.freeze([{id:8,text:'BOOKCASE',y:600},{id:5,text:'BOOK',y:290},{id:2,text:'BOOK',y:290}]);
 assert.equal(impactTarget(a,'BOOK').id,2);assert.equal(impactTarget(a,'BO').id,8);assert.equal(impactTarget(a,'BOOKC').id,8);assert.equal(impactTarget(a,''),null);assert.deepEqual(a.map(w=>w.id),[8,5,2]);
});
