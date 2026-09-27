"""Browser-side ES-module integration from actual dist bytes, held in memory.
Only relative import URLs, local assets and the optional existing debug guard are
adapted. This does NOT claim browser navigation to a localhost HTTP origin.
"""
from pathlib import Path
import json,re,base64,mimetypes

def module_fixture(root:Path,diagnostics=True)->str:
    dist=root/'dist'; html=(dist/'index.html').read_text()
    assets={f'assets/{p.name}':f'data:{mimetypes.guess_type(p.name)[0] or "application/octet-stream"};base64,'+base64.b64encode(p.read_bytes()).decode() for p in (dist/'assets').iterdir() if p.is_file()}
    code={p.relative_to(dist).as_posix():p.read_text() for p in (dist/'src').rglob('*.js')}
    if diagnostics:code['src/main.js']=re.sub(r"(?m)^\s*if\(!\['localhost'.*?\)return;",'  // Controlled diagnostic guard only.',code['src/main.js'])
    html=re.sub(r'<link[^>]*>','',html)
    html=re.sub(r'<script type="module"[^>]*></script>','',html)
    html=re.sub(r'src="(assets/[^" ]+)"',lambda m:'src="'+assets[m[1]]+'"',html)
    html=html.replace('</head>','<style>'+(dist/'src/styles.css').read_text()+'</style></head>')
    bootstrap='globalThis.__TM_EMBEDDED_ASSETS__='+json.dumps(assets)+';\nconst tkModules='+json.dumps(code)+';\n'+r'''
const tkModuleURLs=new Map();
function tkResolve(from,relative){const parts=from.split('/');parts.pop();for(const p of relative.split('?')[0].split('/')){if(p==='..')parts.pop();else if(p!=='.')parts.push(p);}return parts.join('/');}
function tkModuleURL(name){
 if(tkModuleURLs.has(name))return tkModuleURLs.get(name);
 if(!tkModules[name])throw new Error('Missing module '+name);
 const s=tkModules[name].replace(/(\bfrom\s*['"])(\.\.?\/[^'"]+)(['"])/g,(_,a,b,c)=>a+tkModuleURL(tkResolve(name,b))+c);
 const u=URL.createObjectURL(new Blob([s],{type:'text/javascript'}));tkModuleURLs.set(name,u);return u;
}
import(tkModuleURL('src/main.js')).catch(e=>{console.error(e);globalThis.__moduleBootError=String(e);});
'''
    return html.replace('</body>','<script>'+bootstrap.replace('</script','<\\/script')+'</script></body>')
