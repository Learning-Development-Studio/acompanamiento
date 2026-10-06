import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {api} from '../worker/api.js';
import {emptyAdvisor,advisorBlocks} from '../worker/advisor-model.js';
const codes={alumno:'TEST-ALUMNO',padres:'TEST-PADRES',israel:'TEST-ASESOR'};
const hashes=Object.fromEntries(await Promise.all(Object.entries(codes).map(async([role,code])=>[role,Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code))).toString('hex')])));
function fixture(){
 const sqlite=new DatabaseSync(':memory:');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')))sqlite.exec(readFileSync('drizzle/'+file,'utf8'));
 const DB={prepare(sql){let values=[];return {bind(...v){values=v;return this;},async first(){return sqlite.prepare(sql).get(...values)||null;},async all(){return {results:sqlite.prepare(sql).all(...values)};},async run(){const result=sqlite.prepare(sql).run(...values);return {meta:{changes:result.changes}};}};},async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
 const env={DB,LDS_ROLE_HASHES:JSON.stringify(hashes)};
 async function request(role,path,method='GET',body,code=codes[role]){const r=await api(new Request('https://example.test'+path,{method,headers:{'x-lds-role':role,'x-lds-code':code,'content-type':'application/json'},body:body?JSON.stringify(body):undefined}),env);return {status:r.status,value:await r.json()};}
 return {request,env};
}
test('cada perfil tiene permisos propios y el código se verifica en el servidor',async()=>{
 const {request}=fixture();assert.equal((await request('padres','/api/session')).status,200);assert.equal((await request('padres','/api/session','GET',null,'OTRO')).status,401);
 assert.equal((await request('padres','/api/teacher')).status,403);assert.equal((await request('alumno','/api/family')).status,403);
 assert.equal((await request('padres','/api/reports','POST',{summary:'No autorizado'})).status,403);assert.equal((await request('padres','/api/runs','POST',{})).status,403);
});
test('una actividad terminada aparece en familia y una respuesta tardía no revierte el cierre',async()=>{
 const {request}=fixture();const id=crypto.randomUUID(),task='escucha-imagen';const trials=Array.from({length:5},(_,i)=>({task,item:i+1,response:'sol',expected:'sol',audioHelp:false,at:new Date().toISOString()}));
 assert.equal((await request('alumno','/api/runs','POST',{id,task,revision:1,trials:trials.slice(0,1),complete:false})).status,200);
 assert.equal((await request('padres','/api/family')).value.discoveries.length,0);
 assert.equal((await request('alumno','/api/runs','POST',{id,task,revision:2,trials,complete:true})).status,200);
 let family=(await request('padres','/api/family')).value;assert.equal(family.discoveries.length,1);assert.equal(family.discoveries[0].count,5);assert.equal(family.discoveries[0].trials,undefined);
 await request('alumno','/api/runs','POST',{id,task,revision:1,trials:trials.slice(0,1),complete:false});family=(await request('padres','/api/family')).value;assert.equal(family.discoveries.length,1);assert.equal(family.discoveries[0].count,5);
 const teacher=(await request('israel','/api/teacher')).value;assert.equal(teacher.runs[0].trials.length,5);
});
test('los borradores del asesor permanecen privados y solo un reporte publicado aparece a los papás',async()=>{
 const {request}=fixture();await request('israel','/api/teacher','PUT',{assessment:{notes:['Privado'],familySummary:'Borrador'},familyDraft:{recentAchievement:'Borrador'}});
 let family=(await request('padres','/api/family')).value;assert.equal(family.reports.length,0);assert.equal(family.documents,undefined);
 const published=await request('israel','/api/reports','POST',{summary:'Resumen revisado.',recentAchievement:'Participó en una actividad.',currentGoal:'Explorar sonidos.',homeRecommendation:'Escuchar juntos cinco minutos.',moodSummary:'Se mostró dispuesto.',activities:[],internalNotes:'No debe aparecer'});
 assert.equal(published.status,200);family=(await request('padres','/api/family')).value;assert.equal(family.reports[0].summary,'Resumen revisado.');assert.equal(family.reports[0].internalNotes,undefined);assert.equal(family.reports[0].homeRecommendation,'Escuchar juntos cinco minutos.');
});
test('las preguntas y las observaciones reciben respuestas desde el perfil de Israel',async()=>{
 const {request}=fixture();const posted=await request('padres','/api/questions','POST',{message:'¿Cómo hacemos la actividad en casa?',kind:'pregunta'});assert.equal(posted.status,200);
 assert.equal((await request('padres','/api/questions/'+posted.value.id,'PUT',{answer:'No autorizada'})).status,403);
 assert.equal((await request('israel','/api/questions/'+posted.value.id,'PUT',{answer:'Escuchen juntos y hagan una pausa si se cansa.'})).status,200);
 const family=(await request('padres','/api/family')).value;assert.equal(family.questions[0].answer,'Escuchen juntos y hagan una pausa si se cansa.');
});
test('se rechazan cierres incompletos y respuestas duplicadas',async()=>{
 const {request}=fixture();const trial={task:'escucha-imagen',item:1,response:'sol',expected:'sol',audioHelp:false,at:new Date().toISOString()},id=crypto.randomUUID();
 assert.equal((await request('alumno','/api/runs','POST',{id,task:trial.task,revision:1,trials:[trial],complete:true})).status,400);
 assert.equal((await request('alumno','/api/runs','POST',{id,task:trial.task,revision:1,trials:[trial,trial],complete:false})).status,400);
});
test('el plan, las metas y el borrador de sesión se guardan solo para Israel',async()=>{
 const {request}=fixture();const advisor=emptyAdvisor();advisor.context.interests='Interés observado durante la entrevista.';advisor.sessionDraft={evidence:'Nota interna de sesión.'};advisor.goals=[{id:crypto.randomUUID(),area:'Lectura de palabras',objective:'Leer palabras nuevas.',baseline:'4 de 10 con apoyo.',criterion:'8 de 10 sin apoyo en dos encuentros.',support:'Sin modelo de la palabra.',material:'Sílabas directas.',status:'En trabajo',reviewDate:'2026-11-03',samples:[{id:crypto.randomUUID(),date:'2026-10-06',correct:6,total:10,mode:'Sin ayuda',material:'Sílabas directas.',note:'Evidencia de prueba local.'}]}];
 advisor.plans=[{id:crypto.randomUUID(),date:'2026-10-08T16:00',week:1,kind:'Valoración 1',status:'Programada',objective:'Conocer el punto de partida.',patterns:'',materials:'',home:'',blocks:advisorBlocks.map(([title,minutes,description])=>({title,minutes,description}))}];
 assert.equal((await request('israel','/api/teacher','PUT',{advisor})).status,200);const read=(await request('israel','/api/teacher')).value.documents.advisor;assert.equal(read.goals[0].samples[0].correct,6);assert.equal(read.plans[0].date,'2026-10-08T16:00');assert.equal(read.sessionDraft.evidence,'Nota interna de sesión.');
 assert.equal((await request('padres','/api/teacher','PUT',{advisor})).status,403);assert.equal((await request('alumno','/api/teacher')).status,403);const family=(await request('padres','/api/family')).value;assert.equal(family.advisor,undefined);assert.equal(family.reports.length,0);
 const invalid=structuredClone(advisor);invalid.goals[0].samples[0].correct=11;assert.equal((await request('israel','/api/teacher','PUT',{advisor:invalid})).status,400);invalid.goals[0].samples[0].correct=6;invalid.plans[0].date='2026-02-31T25:00';assert.equal((await request('israel','/api/teacher','PUT',{advisor:invalid})).status,400);assert.equal((await request('israel','/api/teacher')).value.documents.advisor.goals[0].samples[0].correct,6);
});
