export const advisorAreas=['Sonidos del habla','Letras y sonidos','Lectura de palabras','Lectura de texto','Comprensión al escuchar','Comprensión al leer','Escritura'];
export const advisorBlocks=[['Bienvenida y objetivo',3,'Anticipar el objetivo y conocer cómo llega.'],['Sonidos del habla',5,'Unir o separar sonidos, según el punto de partida.'],['Letras y sonidos',10,'Modelar, practicar juntos y repasar lo aprendido.'],['Leer y escribir palabras',10,'Aplicar los patrones enseñados; observar y corregir con apoyo.'],['Texto y comprensión',12,'Aclarar vocabulario, leer o escuchar y explicar ideas.'],['Cierre',5,'Reconocer un avance y acordar una práctica breve.']];
export function emptyAdvisor(){return {version:1,context:{interests:'',school:'',history:'',supports:'',agreements:''},checks:{interview:false,schoolwork:false,report:false,coordination:false},startDate:'',reviewDate:'',review:{achievements:'',pending:'',adjustments:'',school:'',decision:''},activePlanId:'',sessionDraft:{},goals:[],plans:[]};}
function advisorString(value,max=3000){if(typeof value!=='string'||value.length>max)throw Error('Revisa la extensión de los campos del panel.');return value;}
function advisorDate(value,datetime=false){if(value==='')return value;if(typeof value==='string'&&(datetime?/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/:/^\d{4}-\d{2}-\d{2}$/).test(value)){const date=value.slice(0,10),parsed=new Date(date+'T12:00:00Z');if(!Number.isNaN(parsed.valueOf())&&parsed.toISOString().slice(0,10)===date&&(!datetime||Number(value.slice(11,13))<24&&Number(value.slice(14,16))<60))return value;}throw Error('Fecha no válida.');}
function advisorId(value){if(typeof value!=='string'||!/^[-a-zA-Z0-9]{20,80}$/.test(value))throw Error('Registro del panel no válido.');return value;}
function advisorEnum(value,options){if(!options.includes(value))throw Error('Opción del panel no válida.');return value;}
export function cleanSessionDetail(value={}){
 const d={};for(const key of ['support','errors','achievement','home'])d[key]=advisorString(value[key]||'',1500);
 for(const [key,options] of Object.entries({confidence:['No observada','Tranquilo','Necesitó confianza','Evitó la actividad'],participation:['No observada','Participó','Con acompañamiento','Participación breve'],fatigue:['No observada','Sin señales','Pidió pausa','Se detuvo']}))d[key]=advisorEnum(value[key]||'No observada',options);
 d.planId=value.planId?advisorId(value.planId):'';return d;
}
export function checkAdvisor(value){
 if(!value||value.version!==1)throw Error('Panel del asesor no válido.');
 const clean=emptyAdvisor();for(const key of Object.keys(clean.context))clean.context[key]=advisorString(value.context?.[key]||'');
 for(const key of Object.keys(clean.checks)){if(value.checks?.[key]!==undefined&&typeof value.checks[key]!=='boolean')throw Error('Acuerdo no válido.');clean.checks[key]=value.checks?.[key]||false;}
 for(const key of ['startDate','reviewDate'])clean[key]=advisorDate(value[key]||'');
 clean.activePlanId=value.activePlanId?advisorId(value.activePlanId):'';
 for(const key of ['date','week','focus','objective','material','correct','total','oral','reading','evidence','next','confidence','participation','fatigue','support','errors','achievement','home'])if(value.sessionDraft?.[key]!==undefined)clean.sessionDraft[key]=advisorString(value.sessionDraft[key],1500);
 for(const key of Object.keys(clean.review))clean.review[key]=advisorString(value.review?.[key]||'');
 if(!Array.isArray(value.goals)||value.goals.length>12||!Array.isArray(value.plans)||value.plans.length>100)throw Error('El panel supera el número de registros admitido.');
 const ids=new Set();clean.goals=value.goals.map(g=>{
  const id=advisorId(g.id);if(ids.has(id))throw Error('Meta duplicada.');ids.add(id);
  const goal={id,area:advisorEnum(g.area,advisorAreas),status:advisorEnum(g.status,['En trabajo','Consolidada','Reformular']),reviewDate:advisorDate(g.reviewDate||''),samples:[]};
  for(const key of ['objective','baseline','criterion','support','material'])goal[key]=advisorString(g[key]||'',1000);
  if(!goal.objective.trim()||!goal.criterion.trim())throw Error('Escribe el objetivo y su criterio.');
  if(!Array.isArray(g.samples)||g.samples.length>100)throw Error('Demasiados registros para esta meta.');
  const sampleIds=new Set();goal.samples=g.samples.map(s=>{
   const id=advisorId(s.id);if(sampleIds.has(id))throw Error('Evidencia duplicada.');sampleIds.add(id);
   if(!Number.isInteger(s.correct)||!Number.isInteger(s.total)||s.total<1||s.total>1000||s.correct<0||s.correct>s.total)throw Error('Revisa los aciertos y el total.');
   const date=advisorDate(s.date);if(!date)throw Error('Fecha de evidencia pendiente.');return {id,date,correct:s.correct,total:s.total,mode:advisorEnum(s.mode,['Sin ayuda','Con apoyo','Al escuchar','Al leer']),material:advisorString(s.material||'',500),note:advisorString(s.note||'',1500)};
  });return goal;
 });
 ids.clear();clean.plans=value.plans.map(p=>{
  const id=advisorId(p.id);if(ids.has(id))throw Error('Encuentro duplicado.');ids.add(id);
  if(!Number.isInteger(p.week)||p.week<1||p.week>12)throw Error('Semana no válida.');
  const plan={id,date:advisorDate(p.date,true),week:p.week,kind:advisorEnum(p.kind,['Valoración 1','Valoración 2','Valoración 3','Intervención']),status:advisorEnum(p.status,['Programada','Realizada','Reprogramar'])};
  for(const key of ['objective','patterns','materials','home'])plan[key]=advisorString(p[key]||'',1500);
  if(!plan.objective.trim()||!plan.date)throw Error('Elige una fecha y escribe el objetivo.');
  if(!Array.isArray(p.blocks)||p.blocks.length!==6)throw Error('Estructura de encuentro no válida.');
  plan.blocks=p.blocks.map(b=>{if(!Number.isInteger(b.minutes)||b.minutes<0||b.minutes>45)throw Error('Tiempo no válido.');return {title:advisorString(b.title,150),minutes:b.minutes,description:advisorString(b.description||'',1500)};});
  if(plan.blocks.reduce((n,b)=>n+b.minutes,0)>60)throw Error('Ajusta los bloques a un máximo de 60 minutos, incluyendo las pausas que necesite.');
  return plan;
 });return clean;
}
export function advisorDateToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function advisorScore(sample){return sample?Math.round(sample.correct/sample.total*100):null;}
