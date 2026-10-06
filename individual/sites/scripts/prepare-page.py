from pathlib import Path
import re,json
root=Path(__file__).resolve().parent.parent
page=(root/'source.html').read_text()
def change(old,new):
 global page
 if old not in page: raise RuntimeError('No se encontró: '+old[:100])
 page=page.replace(old,new,1)
change('let persistent=false;',"""const LDS_CLOUD=window.LDS_SITES===true;
let cloudConnected=false,cloudCode='',cloudRole=null,cloudPoll=null,teacherSaveTimer=null,teacherSaveChain=Promise.resolve(),cloudRetry=null,cloudFlushing=false,cloudRunId='',cloudRunRevision=0;
const cloudPendingRuns=new Map();
let familyDraft={},familySnapshot={reports:[],discoveries:[],questions:[]},teacherRuns=[];
let activeRole=null,selectedRole=null;
let persistent=false;""")
change('let activeRole=null,selectedRole=null;\n$(\'profile-select\')', "$('profile-select')")
change("function save(){if(persistent)", "function save(){scheduleTeacherSave();if(persistent)")
change('function render(){','function renderBase(){')
change('function buildAssessment(){','function buildAssessmentCore(){')
change("Object.assign(item,{week:s.week,correct:s.correct,total:s.total});", "Object.assign(item,{week:s.week,correct:s.correct,total:s.total,detail:cleanSessionDetail(s.detail||{})});")
change("state.sessions.push(s);save();render();", "s.detail=readAdvisorSessionDetail();state.sessions.push(s);afterAdvisorSession(s);save();render();")
change("function persistAssessment(){if(!persistent)return;", "function persistAssessment(){scheduleTeacherSave();if(!persistent)return;")
change("function storageMessage(){$('storage-message').textContent=persistent?", "function storageMessage(){if(cloudConnected){$('storage-message').textContent='Guardado compartido automático activo. Puedes descargar respaldos cuando lo necesites.';return;}$('storage-message').textContent=persistent?")
oldStart=page.index("$('access-form').addEventListener('submit'")
oldEnd=page.index('const sessionsPlan=',oldStart)
page=page[:oldStart]+"""$('access-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!selectedRole)return;const role=selectedRole,code=$('access-code').value.trim().toUpperCase(),button=e.submitter;if(button)button.disabled=true;
 try{if(role!==selectedRole)return;await connectCloudRole(role,code);activeRole=role;$('access-code').value='';
 document.querySelectorAll('[data-view]').forEach(b=>b.hidden=!allowed[role].includes(b.dataset.view));$('active-profile').textContent=profiles[role].name;$('workspace').dataset.role=role;
 initProgramRole(role);show(allowed[role][0]);storageMessage();render();window.scrollTo(0,0);await loadCloudDashboard();$('workspace').hidden=false;$('welcome').hidden=true;
 }catch(error){cloudConnected=false;cloudCode='';cloudRole=null;activeRole=null;$('workspace').hidden=true;$('welcome').hidden=false;$('access-error').textContent=error.message;}finally{if(button)button.disabled=false;}
});
"""+page[oldEnd:]
page=re.sub(r"const profiles=\{[^\n]+\};","const profiles={alumno:{name:'Alumno'},padres:{name:'Padres de Familia'},israel:{name:'Israel (asesor)'}};",page,count=1)
change("selectedRole=$('profile-select').value;$('access-label').textContent='Código de '+profiles[selectedRole].name;", "selectedRole=$('profile-select').value;$('access-label').textContent=selectedRole?'Código de '+profiles[selectedRole].name:'Código de acceso';")
change("const allowed={alumno:['alumno'],padres:['reportes','familia','programa']", "const allowed={alumno:['alumno'],padres:['reportes']")
change("israel:['diagnostico','alumno','sesiones','avances','publicar','reportes','programa','familia']", "israel:['asesor','perfil-asesor','diagnostico','plan-asesor','sesiones','metas-asesor','publicar','reportes','alumno','programa','familia']")
change('<nav aria-label="Secciones del acompañamiento">','<nav aria-label="Secciones del acompañamiento"><button type="button" data-view="asesor" aria-pressed="false">Inicio</button><button type="button" data-view="perfil-asesor" aria-pressed="false">Alumno y acuerdos</button><button type="button" data-view="plan-asesor" aria-pressed="false">Plan de trabajo</button><button type="button" data-view="metas-asesor" aria-pressed="false">Metas y avance</button>')
change('<section id="alumno" hidden', '<section id="asesor" hidden aria-label="Inicio del asesor"></section><section id="perfil-asesor" hidden aria-label="Perfil pedagógico y acuerdos"></section><section id="plan-asesor" hidden aria-label="Planeación individual"></section><section id="metas-asesor" hidden aria-label="Metas y avance del alumno"></section><section id="alumno" hidden')
change('<button type="button" data-view="familia" aria-pressed="false">Guía familiar</button>', '')
change('<button type="button" data-view="programa" aria-pressed="true">Programa</button>','<button type="button" data-view="programa" aria-pressed="false">Ruta del programa</button>')
change('Utiliza un código sin nombre. Evita datos de identidad, informes diagnósticos o información sensible en las notas.','Registra qué pudo hacer, qué ayuda necesitó y cuál será el siguiente paso. El borrador se guarda automáticamente mientras escribes.')
change('<h2>Sesiones registradas</h2><div id="records">','<h2>Sesiones registradas</h2><div class="advisor-actions"><button type="button" id="advisor-session-report">Preparar devolución del último encuentro</button><button type="button" id="advisor-session-pdf">Descargar seguimiento en PDF</button></div><div id="records">')
change("Reportes familiares</button>","Seguimiento familiar</button>")
change("childCurrent=task;childIndex=0;childRunStart=childTrials.length;", "childCurrent=task;childIndex=0;childRunStart=childTrials.length;beginCloudRun();")
change("const now=new Date(),stamp=new Intl.DateTimeFormat('sv-SE'", "const now=new Date(trials.at(-1).at),stamp=new Intl.DateTimeFormat('sv-SE'")
change("at:new Date().toISOString()});}", "at:new Date().toISOString()});saveCloudRun(false);}")
change("else{card.replaceChildren(childImage('medalla')", "else{saveCloudRun(true);card.replaceChildren(childImage('medalla')")
change("card.append(endActions);celebrateChild(card);", "const saved=elem('p',cloudConnected?'Guardando tus descubrimientos…':'Tus respuestas están listas.','completion-caption');saved.id='child-save-status';card.append(endActions,saved);celebrateChild(card);")
# Replace only family functions; preserve grade-specific observation instruments.
start=page.index('function buildFamilyEditor()')
end=page.index('function initProgramRole(',start)
model=(root/'worker/advisor-model.js').read_text().replace('export ','')
page=page[:start]+model+'\n'+(root/'worker/advisor-ui.js').read_text()+'\n'+(root/'worker/family-ui.js').read_text()+'\n'+page[end:]
start=page.index('function initProgramRole(')
end=page.index('// Ampliar el guardado',start)
page=page[:start]+"""function initProgramRole(role){buildStudent();familyReport=null;familySnapshot={reports:[],discoveries:[],questions:[]};if(role==='israel'){buildAssessment();attachChildImport();buildFamilyEditor();buildAdvisorWorkspace();}buildFamily();}
window.addEventListener('online',()=>{flushCloudRuns();if(activeRole==='israel'&&teacherSavedRevision<teacherSaveRevision)flushTeacherSave().catch(error=>notify(error.message));});
$('advisor-session-report').addEventListener('click',prepareAdvisorSessionReport);
$('advisor-session-pdf').addEventListener('click',downloadAdvisorSummary);
"""+page[end:]
change("$('logout').addEventListener('click',()=>{", "$('logout').addEventListener('click',async()=>{\n try{await closeCloud();}catch(error){notify(error.message);return;}")
change("if(activeRole==='alumno'&&childTrials.some(t=>!childDeliveredTrials.has(t))", "if(!LDS_CLOUD&&activeRole==='alumno'&&childTrials.some(t=>!childDeliveredTrials.has(t))")
change("const unsaved=!persistent&&(", "const unsaved=!LDS_CLOUD&&!persistent&&(")
change("activeRole=null;selectedRole=null;persistent=false;", "activeRole=null;selectedRole=null;persistent=false;familyDraft={};familySnapshot={reports:[],discoveries:[],questions:[]};teacherRuns=[];advisor=emptyAdvisor();teacherSaveRevision=teacherSavedRevision=0;clearAdvisorWorkspace();")
before=page.index("window.addEventListener('beforeunload'")
after=page.index('\n',before)
page=page[:before]+"""window.addEventListener('beforeunload',e=>{if(cloudPendingRuns.size||teacherSaveTimer||teacherSavedRevision<teacherSaveRevision){e.preventDefault();e.returnValue='';}});
"""+page[after:]
page=page.replace('url("assets/ilustraciones-v2.png")','url("https://learning-development-studio.github.io/acompanamiento/individual/assets/ilustraciones-v2.png")')
page=page.replace("new Audio('assets/audio/'","new Audio('https://learning-development-studio.github.io/acompanamiento/individual/assets/audio/'")
page=page.replace('<script>','<script>window.LDS_SITES=true;\n',1)
css=(root/'worker/family.css').read_text()+'\n'+(root/'worker/advisor.css').read_text()
page=page.replace('</style>',css+'\n</style>',1)
(root/'page.html').write_text(page)
(root/'page-script.js').write_text(page.split('<script>')[1].split('</script>')[0])
print(json.dumps({'page_bytes':len(page.encode()),'parent_panes':6,'manual_import_removed':'Cargar reporte de Israel' not in page}))
