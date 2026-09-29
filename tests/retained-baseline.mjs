/** Only the explicitly allowed v3.6.2 presentation delta is normalized.
 * The original fixture hashes remain untouched. New behavior has separate tests.
 */
export function retainedBaselineBytes(file,bytes){
 let s=bytes.toString();
 if(file==='src/styles.css'){
  const marker='\n/* v3.6.2 / replay entry.';
  const at=s.indexOf(marker);if(at>=0)s=s.slice(0,at);
 }else if(file==='src/ui/layout.js'){
  s=s.replace('statusTop:-28','statusTop:-4');
 }else return bytes;
 return Buffer.from(s);
}
