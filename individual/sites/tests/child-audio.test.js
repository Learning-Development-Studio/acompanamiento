import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function fixture(){
 const nodes={},sounds=[],voices=[];
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.events={};this.attrs={};this.style={setProperty(){}};this.disabled=false;this.className='';this.classList={add(){},remove(){}};}
  get textContent(){return (this._text||'')+this.children.map(c=>c.textContent||'').join('');}set textContent(v){this._text=v;}
  get id(){return this._id;}set id(v){this._id=v;nodes[v]=this;}
  append(...children){this.children.push(...children);}prepend(...children){this.children.unshift(...children);}replaceChildren(...children){this._text='';this.children=children;}
  setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,fn){(this.events[k]??=[]).push(fn);}click(){if(!this.disabled)for(const fn of this.events.click||[])fn();}
  querySelectorAll(tag){return this.children.flatMap(c=>[...(c.tag===tag?[c]:[]),...c.querySelectorAll(tag)]);}remove(){}focus(){}scrollIntoView(){}
 }
 const elem=(tag,text,cls)=>{const e=new Element(tag);if(text!==undefined)e.textContent=text;e.className=cls||'';return e;};
 nodes.alumno=elem('section');const speech={cancel(){},getVoices(){return[]},speak(u){voices.push(u);}};
 const context={console,Date,JSON,Error,Array,Number,Set,Map,Math,crypto,Uint8Array,TextEncoder,Blob,cloudConnected:false,beginCloudRun(){},saveCloudRun(){},setTimeout(){return 0;},notify(){},downloadJSON(){},elem,action:(label,fn)=>{const e=elem('button',label);e.addEventListener('click',fn);return e;},$:id=>nodes[id],document:{activeElement:null,body:elem('body'),getElementById:id=>nodes[id]},window:{speechSynthesis:speech,scrollTo(){},matchMedia(){return {matches:true};}},speechSynthesis:speech,SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},Audio:class{constructor(src){this.src=src;this.currentTime=0;sounds.push(this);}play(){return Promise.resolve();}pause(){this.paused=true;}},URL:{createObjectURL(blob){context.lastBlob=blob;return 'blob:pdf';},revokeObjectURL(){}}};
 const html=readFileSync('page.html','utf8');vm.createContext(context);vm.runInContext(html.slice(html.indexOf('/* Tareas visuales:'),html.indexOf('function buildAssessment()')),context);vm.runInContext('buildStudent()',context);
 const run=code=>vm.runInContext(code,context);
 const buttons=()=>nodes['student-activity'].querySelectorAll('button');
 const click=label=>{const button=buttons().find(b=>b.attrs['aria-label']===label);assert.ok(button,'Botón disponible: '+label);button.click();return button;};
 const expect=key=>assert.ok(sounds.at(-1)?.src.endsWith('/'+key+'.mp3'),'Archivo esperado: '+key);
 return {nodes,sounds,voices,run,buttons,click,expect,open:i=>run(`openVisualTask(visualTasks[${i}])`),choose:()=>buttons().find(b=>b.attrs['aria-pressed']!==undefined).click(),context};
}

test('los botones reproducen las 22 grabaciones nuevas en sus actividades y avisos',()=>{
 const f=fixture();const names=['escucha-encuentra','palabras-amigas','fichas-palmadas','mis-tarjetas','cuento-escuchar'];
 const catalog=f.nodes['student-catalog'].querySelectorAll('button').filter(b=>b.attrs['aria-label']?.startsWith('Escuchar nombre:'));
 for(let i=0;i<5;i++){
  catalog[i].click();f.expect(names[i]+'-nombre');f.open(i);f.click('Escuchar instrucciones');f.expect(names[i]+'-instruccion');
  if(i<2){f.sounds.at(-1).onended();f.expect('confirmar-dibujo');}
 }
 f.click('Pausa');f.expect('pausa');f.click('Escuchar el cuento');f.expect('cuento-ana');
 for(let i=1;i<=5;i++){
  f.click('Escuchar pregunta');f.expect('cuento-ana-pregunta-'+String(i).padStart(2,'0'));f.choose();f.click('Entregar respuesta');
 }
 f.click('Entregar mis respuestas en PDF');f.expect('reporte-listo');assert.equal(f.context.lastBlob.type,'application/pdf');
 f.open(0);f.click('Entregar respuesta');f.expect('elige-dibujo');
 f.open(2);f.click('Ver cómo se hace');f.expect('fichas-palmadas-ejemplo');
 f.open(3);f.click('Continuar');f.expect('intento-pendiente');
 for(const word of ['sol','mesa','luna','pato','pelota','plato']){
  const listen=f.buttons().find(b=>b.attrs['aria-label']==='Escuchar');assert.equal(listen.disabled,true);
  const before=f.sounds.length;listen.click();assert.equal(f.sounds.length,before);
  f.click('Ya intenté');f.expect('mis-tarjetas-ahora-escucha');assert.equal(listen.disabled,false);listen.click();f.expect(word);f.click('Continuar');
 }
 const newlyRecorded=new Set(f.sounds.map(s=>s.src.split('/').at(-1).replace('.mp3','')).filter(k=>!['actividad-terminada','sol','mesa','luna','pato','pelota','escucha-encuentra-instruccion','palabras-amigas-instruccion'].includes(k)));
 assert.equal(newlyRecorded.size,22);assert.equal(f.voices.length,0);
});

test('una secuencia cancelada no reproduce la confirmación después de salir',()=>{
 const f=fixture();f.open(0);f.click('Escuchar instrucciones');const first=f.sounds.at(-1),ended=first.onended;
 f.click('Volver a descubrir');const count=f.sounds.length;assert.equal(first.paused,true);ended();assert.equal(f.sounds.length,count);
});

test('las actividades todavía sin grabaciones conservan su lectura acompañada',()=>{
 const f=fixture();f.open(5);f.click('Escuchar instrucciones');assert.equal(f.sounds.length,0);assert.ok(f.voices.at(-1).text);
 f.click('Ya intenté');const listen=f.buttons().find(b=>b.attrs['aria-label']==='Escuchar');assert.equal(listen.disabled,false);listen.click();assert.ok(f.voices.at(-1).text);
 f.open(6);f.click('Escuchar mi mensaje');assert.ok(f.voices.at(-1).text.includes('Cuéntale a Israel'));assert.equal(f.sounds.length,0);
});
