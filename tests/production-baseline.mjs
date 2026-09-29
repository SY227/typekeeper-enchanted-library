/** Normalize ONLY the documented source hunks of the approved 3.6.4 revision.
 * Original preservation hashes and the original 3.4 oracle are never updated.
 * Reverse patches must match exactly once; unrelated edits still fail their pins.
 */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const patches=JSON.parse(fs.readFileSync(new URL('./fixtures/production364-deltas.json',import.meta.url)));
export function productionBaselineBytes(file,bytes){
 const patch=patches[file];if(!patch)return bytes;
 let s=bytes.toString();
 for(const {before,after} of [...patch.changes].reverse()){
  if(s.split(after).length!==2)throw new Error(`Undeclared or missing production delta: ${file}`);
  s=s.replace(after,before);
 }
 const out=Buffer.from(s);
 if(createHash('sha256').update(out).digest('hex')!==patch.beforeSHA256)throw new Error(`Unrelated source change: ${file}`);
 return out;
}
