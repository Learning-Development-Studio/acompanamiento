import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
class Node{
 constructor(tag){this.tagName=tag;this.children=[];this.events={};this.attrs={};this.dataset={};this.className='';this.hidden=false;this._text='';this.style={};this.classList={add:()=>{},remove:()=>{}};}
 set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 append(...children){this.children.push(...children);}replaceChildren(...children){this._text='';this.children=[];this.append(...children);}
 get lastElementChild(){return this.children.at(-1);}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k];}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}async fire(k){for(const fn of this.events[k]||[])await fn({preventDefault(){}});}
 click(){return this.fire('click');}remove(){}
}
function fixture(){
 const ids={};const root=new Node('section');ids.reportes=root;let lastBlob;const objectUrls=new Map();
 const elem=(tag,text,cls)=>{const n=new Node(tag);Object.defineProperty(n,'id',{get(){return this._id;},set(id){this._id=id;ids[id]=this;}});if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const select=(selector)=>{const out=[];function scan(n){if(selector.startsWith('.')&&n.className.split(' ').includes(selector.slice(1))||selector==='[data-family-tab]'&&n.dataset.familyTab)out.push(n);n.children.forEach(scan);}scan(root);return out;};
 const context={console,Date,JSON,Error,Array,Number,Set,Map,Promise,Uint8Array,Blob,crypto,URL:{createObjectURL(blob){lastBlob=blob;return 'blob:report'},revokeObjectURL(){}},setTimeout:()=>0,clearTimeout(){},clearInterval(){},setInterval:()=>0,
  document:{querySelectorAll:select,body:root},navigator:{onLine:true},$:id=>ids[id],elem,action:(label,fn)=>{const n=elem('button',label);n.addEventListener('click',fn);return n;},childPDFText:value=>String(value).replaceAll('\\','\\\\').replaceAll('(','\\(').replaceAll(')','\\)'),
  childSpeak(){},familyReport:null,familySnapshot:{reports:[],discoveries:[],questions:[]},cloudConnected:true,activeRole:'padres',familyDraft:{},teacherRuns:[]};
 vm.createContext(context);vm.runInContext(readFileSync('worker/family-ui.js','utf8'),context);
 return {ctx:context,ids,root,run:code=>vm.runInContext(code,context),getBlob:()=>lastBlob};
}
test('los padres tienen seis apartados y tres tarjetas de portada sin carga manual',()=>{
 const f=fixture();f.run('buildFamily()');
 assert.equal(f.root.children[1].children.length,3);assert.equal(f.root.children[2].children.length,6);
 assert.equal(f.root.children.filter(n=>n.className==='family-pane').length,6);
 assert.ok(!f.root.textContent.includes('Cargar reporte'));assert.ok(f.ids['family-report-history'].textContent.includes('primer reporte'));
 f.run("familyTab('home')");assert.equal(f.ids['family-pane-home'].hidden,false);assert.equal(f.ids['family-pane-summary'].hidden,true);
});
test('el reporte publicado y la actividad terminada aparecen en portada sin borrar una pregunta en redacción',()=>{
 const f=fixture();f.run('buildFamily()');f.ids['family-question'].value='Texto en redacción';
 f.ctx.familyReport={summary:'Resumen revisado',recentAchievement:'Logro revisado',currentGoal:'Objetivo acordado',homeRecommendation:'Actividad de cinco minutos',moodSummary:'Participó con tranquilidad',nextPurpose:'Practicar sonidos',nextMaterials:'Una hoja',issued:'6/10/2026'};
 f.ctx.familySnapshot={reports:[f.ctx.familyReport],discoveries:[{name:'Mis tarjetas',session:2,count:6,completedAt:'2026-10-06T12:00:00Z'}],questions:[{kind:'pregunta',message:'Duda familiar',answer:'Respuesta de Israel',created_at:'2026-10-06T12:00:00Z'}]};
 f.run('renderFamilyReport()');assert.equal(f.ids['family-highlight-achievement'].textContent,'Logro revisado');assert.equal(f.ids['family-discoveries'].children.length,1);assert.ok(f.ids['family-discoveries'].textContent.includes('6 ejercicios'));assert.equal(f.ids['family-question'].value,'Texto en redacción');assert.ok(f.ids['family-report-history'].textContent.includes('Descargar PDF'));assert.ok(f.ids['family-messages'].textContent.includes('Respuesta de Israel'));
});
test('el PDF familiar es descargable y conserva acentos',async()=>{
 const f=fixture();f.ctx.sample={summary:'Se mostró tranquilo. Escuchó y participó.',strengths:'Comprensión oral.',currentGoal:'Explorar sonidos.',homeRecommendation:'Escuchar juntos cinco minutos.',issued:'6/10/2026'};
 f.run('downloadFamilyPDF(sample)');const blob=f.getBlob();assert.equal(blob.type,'application/pdf');const bytes=Buffer.from(await blob.arrayBuffer());assert.ok(bytes.toString('latin1').startsWith('%PDF-1.4'));assert.ok(bytes.toString('latin1').includes('Comprensión'));
 const {writeFileSync}=await import('node:fs');writeFileSync('/tmp/family-report-example.pdf',bytes);
});
