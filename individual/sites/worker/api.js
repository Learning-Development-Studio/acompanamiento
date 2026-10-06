import {checkAdvisor} from './advisor-model.js';
export const taskMeta={
 'escucha-imagen':{name:'Escucha y encuentra',session:1,count:5},
 'inicio-palabras':{name:'Palabras amigas',session:1,count:5},
 'fichas-palabra':{name:'Fichas y palmadas',session:1,count:5},
 'tarjetas-lectura':{name:'Mis tarjetas',session:2,count:6},
 'cuento-escucha':{name:'Un cuento para escuchar',session:2,count:5},
 'leo-acompanado':{name:'Leo y escucho',session:3,count:5},
 'mensaje-papel':{name:'Mi mensaje',session:3,count:5}
};
const reportFields=['summary','strengths','needs','goals','recommendations','review','recentAchievement','currentGoal','homeRecommendation','moodSummary','helpfulSupports','nextDate','nextPurpose','nextMaterials'];
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
class HTTPError extends Error{constructor(status,message){super(message);this.status=status;}}
async function digest(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');}
async function body(request){const text=await request.text();if(text.length>250000)throw new HTTPError(413,'El contenido supera el tamaño admitido.');try{return JSON.parse(text);}catch{throw new HTTPError(400,'Contenido no válido.');}}
function safeText(value,max=5000){if(typeof value!=='string'||value.length>max)throw new HTTPError(400,'Revisa el texto que intentas guardar.');return value.trim();}
function requireRole(role,allowed){if(!allowed.includes(role))throw new HTTPError(403,'Este perfil no tiene acceso a esa acción.');}
async function authorize(request,db,env){
 const roles=JSON.parse(env.LDS_ROLE_HASHES||'{}');if(!roles.alumno||!roles.padres||!roles.israel)throw new HTTPError(503,'Los accesos todavía no están configurados.');
 const role=request.headers.get('x-lds-role'),code=request.headers.get('x-lds-code')||'';
 if(!roles[role])throw new HTTPError(401,'Selecciona tu perfil e ingresa su código.');
 const actor=request.headers.get('oai-authenticated-user-id')||request.headers.get('cf-connecting-ip')||'visitante';
 const key=await digest(actor+':'+role+':'+Math.floor(Date.now()/600000));
 const attempt=await db.prepare('SELECT attempts FROM access_attempts WHERE id=?').bind(key).first();
 if((attempt?.attempts||0)>=12)throw new HTTPError(429,'Espera unos minutos antes de volver a intentar.');
 if(code.length>32||await digest(code.trim().toUpperCase())!==roles[role]){
  await db.prepare('INSERT INTO access_attempts (id,attempts,created_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=attempts+1').bind(key,new Date().toISOString()).run();
  throw new HTTPError(401,'El código no corresponde a este perfil.');
 }
 return {role,userId:request.headers.get('oai-authenticated-user-id')||'perfil:'+role};
}
async function readFamily(db){
 const reports=(await db.prepare('SELECT id,payload_json,published_at FROM family_reports ORDER BY published_at DESC LIMIT 30').all()).results||[];
 const runs=(await db.prepare('SELECT id,task_id,completed_at,trials_json FROM activity_runs WHERE completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 100').all()).results||[];
 const questions=(await db.prepare('SELECT id,kind,message,answer,created_at,answered_at FROM family_questions ORDER BY created_at DESC LIMIT 50').all()).results||[];
 return {reports:reports.map(r=>({...JSON.parse(r.payload_json),id:r.id,publishedAt:r.published_at})),discoveries:runs.map(r=>({id:r.id,task:r.task_id,name:taskMeta[r.task_id]?.name||'Actividad',session:taskMeta[r.task_id]?.session||1,count:JSON.parse(r.trials_json).length,completedAt:r.completed_at})),questions};
}
export async function api(request,env){
 try{
  if(!env.DB)throw new HTTPError(503,'El guardado compartido todavía no está disponible.');
  const url=new URL(request.url),path=url.pathname,method=request.method;
  if(path==='/api/health'&&method==='GET'){await env.DB.prepare('SELECT 1 FROM family_reports LIMIT 1').first();return json({ready:true});}
  if(!['GET','POST','PUT'].includes(method))throw new HTTPError(405,'Acción no disponible.');
  const origin=request.headers.get('origin');if(method!=='GET'&&origin&&origin!==url.origin)throw new HTTPError(403,'Origen no permitido.');
  const {role,userId}=await authorize(request,env.DB,env);
  if(path==='/api/session'&&method==='GET')return json({role,ready:true});
  if(path==='/api/family'&&method==='GET'){requireRole(role,['padres','israel']);return json(await readFamily(env.DB));}
  if(path==='/api/runs'&&method==='POST'){
   requireRole(role,['alumno','israel']);const v=await body(request),meta=taskMeta[v.task];
   if(!meta||typeof v.id!=='string'||!/^[-a-zA-Z0-9]{20,80}$/.test(v.id)||!Number.isInteger(v.revision)||v.revision<1||!Array.isArray(v.trials)||v.trials.length>meta.count||!v.trials.length)throw new HTTPError(400,'Actividad no válida.');
   const used=new Set();const trials=v.trials.map(t=>{
    if(t.task!==v.task||!Number.isInteger(t.item)||t.item<1||t.item>meta.count||used.has(t.item)||typeof t.audioHelp!=='boolean'||!Number.isFinite(Date.parse(t.at)))throw new HTTPError(400,'Respuesta no válida.');
    used.add(t.item);return {task:t.task,item:t.item,response:safeText(t.response,1500),expected:safeText(t.expected,1500),audioHelp:t.audioHelp,at:t.at};
   });
   if(v.complete&&trials.length!==meta.count)throw new HTTPError(400,'La actividad aún no está completa.');
   const now=new Date().toISOString(),completed=v.complete?now:null;
   await env.DB.prepare('INSERT INTO activity_runs (id,task_id,trials_json,revision,completed_at,updated_at,created_by) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET trials_json=excluded.trials_json,revision=excluded.revision,completed_at=excluded.completed_at,updated_at=excluded.updated_at WHERE excluded.revision>activity_runs.revision').bind(v.id,v.task,JSON.stringify(trials),v.revision,completed,now,userId).run();
   return json({saved:true,id:v.id,revision:v.revision});
  }
  if(path==='/api/teacher'&&method==='GET'){
   requireRole(role,['israel']);const docs=(await env.DB.prepare('SELECT key,value_json FROM program_documents').all()).results||[];
   const runs=(await env.DB.prepare('SELECT id,task_id,trials_json,completed_at,updated_at FROM activity_runs ORDER BY updated_at DESC LIMIT 100').all()).results||[];
   return json({documents:Object.fromEntries(docs.map(r=>[r.key,JSON.parse(r.value_json)])),runs:runs.map(r=>({...r,trials:JSON.parse(r.trials_json),trials_json:undefined})),...await readFamily(env.DB)});
  }
  if(path==='/api/teacher'&&method==='PUT'){
   requireRole(role,['israel']);const v=await body(request),now=new Date().toISOString();const statements=[];
   for(const key of ['state','assessment','familyDraft','advisor']){if(v[key]===undefined)continue;if(!v[key]||typeof v[key]!=='object'||Array.isArray(v[key]))throw new HTTPError(400,'Registro no válido.');let document=v[key];if(key==='advisor'){try{document=checkAdvisor(document);}catch(error){throw new HTTPError(400,error.message);}}statements.push(env.DB.prepare('INSERT INTO program_documents (key,value_json,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at').bind(key,JSON.stringify(document),now));}
   if(!statements.length)throw new HTTPError(400,'No hay registros para guardar.');await env.DB.batch(statements);return json({saved:true});
  }
  if(path==='/api/reports'&&method==='POST'){
   requireRole(role,['israel']);const v=await body(request),clean={};for(const key of reportFields)clean[key]=safeText(v[key]||'');
   if(!clean.summary)throw new HTTPError(400,'Escribe y revisa el resumen antes de publicarlo.');
   const now=new Date().toISOString(),id=crypto.randomUUID();clean.issued=new Date(now).toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'});clean.activities=Array.isArray(v.activities)?v.activities.slice(0,3).map(a=>({title:safeText(a.title,200),status:safeText(a.status,200)})):[];clean.type='lds-family-report';clean.version=2;
   await env.DB.prepare('INSERT INTO family_reports (id,payload_json,published_at,created_by) VALUES (?,?,?,?)').bind(id,JSON.stringify(clean),now,userId).run();return json({published:true,report:{...clean,id,publishedAt:now}});
  }
  if(path==='/api/questions'&&method==='POST'){
   requireRole(role,['padres']);const v=await body(request),message=safeText(v.message,2000);if(!message)throw new HTTPError(400,'Escribe tu mensaje antes de enviarlo.');
   const id=crypto.randomUUID();await env.DB.prepare('INSERT INTO family_questions (id,kind,message,answer,created_at,created_by) VALUES (?,?,?,NULL,?,?)').bind(id,v.kind==='observacion'?'observacion':'pregunta',message,new Date().toISOString(),userId).run();return json({saved:true,id});
  }
  const question=path.match(/^\/api\/questions\/([-a-zA-Z0-9]{20,80})$/);
  if(question&&method==='PUT'){
   requireRole(role,['israel']);const v=await body(request),answer=safeText(v.answer,5000);if(!answer)throw new HTTPError(400,'Escribe una respuesta antes de guardarla.');
   const result=await env.DB.prepare('UPDATE family_questions SET answer=?,answered_at=? WHERE id=?').bind(answer,new Date().toISOString(),question[1]).run();if(!result.meta?.changes)throw new HTTPError(404,'No se encontró el mensaje.');return json({saved:true});
  }
  throw new HTTPError(404,'No se encontró esa sección.');
 }catch(error){return json({error:error instanceof HTTPError?error.message:'No se pudo completar la acción. Vuelve a intentar.'},error instanceof HTTPError?error.status:500);}
}
