import fs from 'node:fs/promises';import path from 'node:path';import {spawnSync} from 'node:child_process';
async function check(dir){for(const f of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())await check(p);else if(/\.(js|mjs)$/.test(p)){const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status!==0){console.error(r.stderr);process.exit(1);}}}}
await check('src');await check('scripts');console.log('All application and build modules pass JavaScript syntax checks.');
