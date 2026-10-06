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
let persistent=false;""")
change("function save(){if(persistent)", "function save(){scheduleTeacherSave();if(persistent)")
change("function persistAssessment(){if(!persistent)return;", "function persistAssessment(){scheduleTeacherSave();if(!persistent)return;")
change("function storageMessage(){$('storage-message').textContent=persistent?", "function storageMessage(){if(cloudConnected){$('storage-message').textContent='Guardado compartido automático activo. Puedes descargar respaldos cuando lo necesites.';return;}$('storage-message').textContent=persistent?")
oldStart=page.index("$('access-form').addEventListener('submit'")
oldEnd=page.index('const sessionsPlan=',oldStart)
page=page[:oldStart]+"""$('access-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!selectedRole)return;const role=selectedRole,code=$('access-code').value.trim().toUpperCase(),button=e.submitter;if(button)button.disabled=true;
 try{if(role!==selectedRole)return;await connectCloudRole(role,code);activeRole=role;$('access-code').value='';
 document.querySelectorAll('[data-view]').forEach(b=>b.hidden=!allowed[role].includes(b.dataset.view));$('active-profile').textContent=profiles[role].name;$('workspace').dataset.role=role;$('workspace').hidden=false;$('welcome').hidden=true;
 initProgramRole(role);show(allowed[role][0]);storageMessage();render();window.scrollTo(0,0);await loadCloudDashboard();
 }catch(error){if(activeRole)notify(error.message);else $('access-error').textContent=error.message;}finally{if(button)button.disabled=false;}
});
"""+page[oldEnd:]
page=re.sub(r"const profiles=\{[^\n]+\};","const profiles={alumno:{name:'Alumno'},padres:{name:'Padres de Familia'},israel:{name:'Israel (asesor)'}};",page,count=1)
change("selectedRole=$('profile-select').value;$('access-label').textContent='Código de '+profiles[selectedRole].name;", "selectedRole=$('profile-select').value;$('access-label').textContent=selectedRole?'Código de '+profiles[selectedRole].name:'Código de acceso';")
change("const allowed={alumno:['alumno'],padres:['reportes','familia','programa']", "const allowed={alumno:['alumno'],padres:['reportes']")
change("Reportes familiares</button>","Seguimiento familiar</button>")
change("childCurrent=task;childIndex=0;childRunStart=childTrials.length;", "childCurrent=task;childIndex=0;childRunStart=childTrials.length;beginCloudRun();")
change("at:new Date().toISOString()});}", "at:new Date().toISOString()});saveCloudRun(false);}")
change("else{card.replaceChildren(childImage('medalla')", "else{saveCloudRun(true);card.replaceChildren(childImage('medalla')")
change("card.append(endActions);celebrateChild(card);", "const saved=elem('p',cloudConnected?'Guardando tus descubrimientos…':'Tus respuestas están listas.','completion-caption');saved.id='child-save-status';card.append(endActions,saved);celebrateChild(card);")
# Replace only family functions; preserve grade-specific observation instruments.
start=page.index('function buildFamilyEditor()')
end=page.index('function initProgramRole(',start)
page=page[:start]+(root/'worker/family-ui.js').read_text()+'\n'+page[end:]
start=page.index('function initProgramRole(')
end=page.index('// Ampliar el guardado',start)
page=page[:start]+"""function initProgramRole(role){buildStudent();if(role==='israel'){buildAssessment();attachChildImport();buildFamilyEditor();}familyReport=null;familySnapshot={reports:[],discoveries:[],questions:[]};buildFamily();}
window.addEventListener('online',flushCloudRuns);
"""+page[end:]
change("$('logout').addEventListener('click',()=>{", "$('logout').addEventListener('click',async()=>{\n try{await closeCloud();}catch(error){notify(error.message);return;}")
change("if(activeRole==='alumno'&&childTrials.some(t=>!childDeliveredTrials.has(t))", "if(!LDS_CLOUD&&activeRole==='alumno'&&childTrials.some(t=>!childDeliveredTrials.has(t))")
change("const unsaved=!persistent&&(", "const unsaved=!LDS_CLOUD&&!persistent&&(")
change("activeRole=null;selectedRole=null;persistent=false;", "activeRole=null;selectedRole=null;persistent=false;familyDraft={};familySnapshot={reports:[],discoveries:[],questions:[]};teacherRuns=[];")
before=page.index("window.addEventListener('beforeunload'")
after=page.index('\n',before)
page=page[:before]+"""window.addEventListener('beforeunload',e=>{if(cloudPendingRuns.size||teacherSaveTimer){e.preventDefault();e.returnValue='';}});
"""+page[after:]
page=page.replace('url("assets/ilustraciones-v2.png")','url("https://learning-development-studio.github.io/acompanamiento/individual/assets/ilustraciones-v2.png")')
page=page.replace("new Audio('assets/audio/'","new Audio('https://learning-development-studio.github.io/acompanamiento/individual/assets/audio/'")
page=page.replace('<script>','<script>window.LDS_SITES=true;\n',1)
css=(root/'worker/family.css').read_text()
page=page.replace('</style>',css+'\n</style>',1)
(root/'page.html').write_text(page)
(root/'page-script.js').write_text(page.split('<script>')[1].split('</script>')[0])
print(json.dumps({'page_bytes':len(page.encode()),'parent_panes':6,'manual_import_removed':'Cargar reporte de Israel' not in page}))
