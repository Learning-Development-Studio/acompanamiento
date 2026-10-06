from pathlib import Path
import json,shutil
root=Path(__file__).resolve().parent.parent
api=(root/'worker/api.js').read_text().replace("import {checkAdvisor} from './advisor-model.js';",'').replace('export const taskMeta','const taskMeta').replace('export async function api','async function api')
model=(root/'worker/advisor-model.js').read_text().replace('export ','')
page=(root/'page.html').read_text()
worker='const page='+json.dumps(page,ensure_ascii=True)+';\n'+model+'\n'+api+"""
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/'))return api(request,env);
  if(!['/','/individual/','/individual','/index.html'].includes(url.pathname))return new Response('No encontrado',{status:404});
  return new Response(page,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'SAMEORIGIN'}});
 }
};
"""
(root/'worker/index.js').write_text(worker)
dist=root/'dist'
if dist.exists():shutil.rmtree(dist)
(dist/'server').mkdir(parents=True)
(dist/'.openai').mkdir()
(dist/'server/index.js').write_text(worker)
shutil.copy(root/'.openai/hosting.json',dist/'.openai/hosting.json')
shutil.copytree(root/'drizzle',dist/'drizzle')
print(json.dumps({'worker_bytes':len(worker.encode()),'project_id':json.loads((dist/'.openai/hosting.json').read_text())['project_id']}))
