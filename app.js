const MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DEFAULT_MATERIALS=['Quadro Negro','Máquina de Costura','Tesoura de Tecido','Tesoura de Arremate','Fita métrica','Alfinetes','Zíper','Carrinho de Zíper','Manta R1 e R2','Linhas Variadas','Aviamentos variados','Viés','Metais','Fitas variadas','Tecidos Variados','Giz de tecido','Ferro de passar'];
const TEMPLATES={
  '18-59':{workshop:'Apertados de Costura turma 18 a 59 anos',objective:'Detectar necessidades e motivações e desenvolver potencialidades e capacidades para novos objetivos de vida.'},
  '60+':{workshop:'Apertados de Costura Turma 60+',objective:'Propiciar vivências que valorizam as experiências e que estimulem e potencializem a condição de escolher e decidir, contribuindo para o desenvolvimento da autonomia e protagonismo social do usuário.'}
};
const STORE='scfv-report-v1', PINSTORE='scfv-pin-v1';
let state={project:'CONVIVENDO E APRENDENDO',workshop:TEMPLATES['18-59'].workshop,objective:TEMPLATES['18-59'].objective,responsible:'Edsel Duarte',template:'18-59',month:new Date().getMonth(),year:new Date().getFullYear(),activities:[],materials:[...DEFAULT_MATERIALS],selectedMaterials:[...DEFAULT_MATERIALS],photos:[]};
let pin=localStorage.getItem(PINSTORE)||'';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function markSaving(){const el=$('#saveState');el.textContent='Salvando…';clearTimeout(markSaving.t);markSaving.t=setTimeout(()=>{save();el.textContent='Salvo ✓'},450)}
function save(){
  collect();
  const safe={...state,photos:state.photos.slice(0,8)};
  try{localStorage.setItem(STORE,JSON.stringify(safe))}catch{toast('O aparelho ficou sem espaço para salvar fotos. O texto continua disponível.')}
}
function load(){try{const x=JSON.parse(localStorage.getItem(STORE)||'null');if(x) state={...state,...x};}catch{}}
function initMonths(){MONTHS.forEach((m,i)=>$('#month').add(new Option(m,i)))}
function fill(){
  $('#month').value=state.month;$('#year').value=state.year;$('#template').value=state.template||'custom';$('#project').value=state.project;$('#workshop').value=state.workshop;$('#objective').value=state.objective;$('#responsible').value=state.responsible;
  renderActivities();renderMaterials();renderPhotos();
}
function collect(){
  state.month=Number($('#month').value);state.year=Number($('#year').value);state.template=$('#template').value;state.project=$('#project').value.trim();state.workshop=$('#workshop').value.trim();state.objective=$('#objective').value.trim();state.responsible=$('#responsible').value.trim();
  state.activities=$$('.activity').map(el=>({date:el.querySelector('.activity-date').value,title:el.querySelector('.activity-title').value.trim(),raw:el.querySelector('.activity-raw').value.trim(),final:el.querySelector('.activity-final').value.trim(),style:el.querySelector('.activity-style').value}));
  state.selectedMaterials=$$('.material input:checked').map(i=>i.value);
}
function addActivity(data={}){
  const node=$('#activityTemplate').content.firstElementChild.cloneNode(true);const idx=$('#activities').children.length+1;node.querySelector('.activity-number').textContent=`Oficina ${idx}`;
  node.querySelector('.activity-date').value=data.date||'';node.querySelector('.activity-title').value=data.title||'';node.querySelector('.activity-raw').value=data.raw||'';node.querySelector('.activity-final').value=data.final||'';node.querySelector('.activity-style').value=data.style||'topicos';
  node.querySelector('.remove-activity').onclick=()=>{node.remove();renumber();markSaving()};
  node.querySelectorAll('input,textarea,select').forEach(e=>e.addEventListener('input',markSaving));
  node.querySelector('.ai-btn').onclick=()=>improveActivity(node);
  node.querySelector('.mic-btn').onclick=()=>startDictation(node);
  $('#activities').append(node);
}
function renderActivities(){const wrap=$('#activities');wrap.innerHTML='';(state.activities?.length?state.activities:[{}]).forEach(addActivity);renumber()}
function renumber(){$$('.activity').forEach((e,i)=>e.querySelector('.activity-number').textContent=`Oficina ${i+1}`)}
function renderMaterials(){const wrap=$('#materials');wrap.innerHTML='';state.materials.forEach(m=>{const label=document.createElement('label');label.className='material';label.innerHTML=`<input type="checkbox"><span></span>`;const input=label.querySelector('input'),span=label.querySelector('span');input.value=m;input.checked=state.selectedMaterials.includes(m);span.textContent=m;input.addEventListener('change',markSaving);wrap.append(label)})}
async function compressImage(file){return new Promise((resolve,reject)=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{let w=img.width,h=img.height,max=1280;if(w>max||h>max){const r=Math.min(max/w,max/h);w=Math.round(w*r);h=Math.round(h*r)}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);URL.revokeObjectURL(url);resolve(c.toDataURL('image/jpeg',.76))};img.onerror=reject;img.src=url})}
function renderPhotos(){const wrap=$('#photoGrid');wrap.innerHTML='';state.photos.forEach((src,i)=>{const d=document.createElement('div');d.className='photo';d.innerHTML=`<img alt="Foto ${i+1}"><button type="button">✕</button>`;d.querySelector('img').src=src;d.querySelector('button').onclick=()=>{state.photos.splice(i,1);renderPhotos();markSaving()};wrap.append(d)})}
async function checkAccess(){
  const lock=$('#lockScreen');
  try{const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});if(r.ok){lock.classList.add('hidden');if(pin)localStorage.setItem(PINSTORE,pin);return true}if(!pin)lock.classList.remove('hidden');else{localStorage.removeItem(PINSTORE);pin='';lock.classList.remove('hidden')}return false}catch{lock.classList.add('hidden');return true}
}
async function improveActivity(el){
  const raw=el.querySelector('.activity-raw').value.trim();if(!raw){toast('Primeiro escreva ou fale o que aconteceu.');return}
  const btn=el.querySelector('.ai-btn'),status=el.querySelector('.activity-status');btn.disabled=true;btn.textContent='✨ Organizando…';status.textContent='A IA está revisando sem inventar informações.';
  try{
    const r=await fetch('/api/improve',{method:'POST',headers:{'Content-Type':'application/json','x-access-pin':pin},body:JSON.stringify({text:raw,title:el.querySelector('.activity-title').value,style:el.querySelector('.activity-style').value,audience:$('#workshop').value})});
    const d=await r.json();if(!r.ok)throw new Error(d.error||'Não foi possível usar a IA.');
    if(!el.querySelector('.activity-title').value.trim())el.querySelector('.activity-title').value=d.titulo||'';el.querySelector('.activity-final').value=d.conteudo||'';status.textContent='Pronto. Você ainda pode editar o texto antes de gerar o PDF.';markSaving();
  }catch(e){status.textContent=e.message;toast(e.message)}finally{btn.disabled=false;btn.textContent='✨ Organizar com IA'}
}
function startDictation(el){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){toast('O ditado não está disponível neste navegador. Você pode usar o microfone do teclado.');return}
  const btn=el.querySelector('.mic-btn'),box=el.querySelector('.activity-raw');const rec=new SR();rec.lang='pt-BR';rec.interimResults=false;rec.continuous=false;btn.textContent='🔴 Ouvindo…';btn.disabled=true;
  rec.onresult=e=>{const txt=[...e.results].map(r=>r[0].transcript).join(' ');box.value=(box.value+' '+txt).trim();markSaving()};rec.onerror=()=>toast('Não consegui ouvir. Tente novamente.');rec.onend=()=>{btn.textContent='🎙️ Falar';btn.disabled=false};rec.start();
}
function newMonth(){
  if(!confirm('Criar um novo relatório mantendo projeto, oficina, objetivo, responsável e materiais?'))return;collect();const now=new Date();state.month=now.getMonth();state.year=now.getFullYear();state.activities=[];state.photos=[];localStorage.setItem(STORE,JSON.stringify(state));fill();toast('Novo relatório criado.')
}
function reportText(){collect();let s=`RELATÓRIO MENSAL DE ATIVIDADES\nSERVIÇO DE CONVIVÊNCIA E FORTALECIMENTO DE VÍNCULOS ${state.year}\nPROJETO: ${state.project}\nOFICINA: ${state.workshop}\nOBJETIVO: ${state.objective}\nRESPONSÁVEL: ${state.responsible}\nMÊS: ${MONTHS[state.month]}  ANO: ${state.year}\n\n`;state.activities.filter(a=>a.date||a.final||a.raw).forEach(a=>{s+=`OFICINA ${formatDate(a.date)}${a.title?': '+a.title:''}\n${a.final||a.raw}\n\n`});s+='Materiais Utilizados\n'+state.selectedMaterials.map(m=>'- '+m).join('\n');return s}
function formatDate(v){if(!v)return '';const [y,m,d]=v.split('-');return `${d}/${m}/${y}`}
function parseContent(text){const lines=String(text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);const bullets=lines.filter(l=>/^[•\-*]/.test(l));if(bullets.length>=Math.ceil(lines.length/2))return {ul:lines.map(l=>l.replace(/^[•\-*]\s*/,'')),margin:[0,2,0,8],fontSize:10.5,lineHeight:1.25};return {text:lines.join('\n'),margin:[0,2,0,8],fontSize:10.5,lineHeight:1.25,alignment:'justify'} }
async function toDataURL(url){const b=await fetch(url).then(r=>r.blob());return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b)})}
async function makePdf(){
  collect();const acts=state.activities.filter(a=>a.date||a.final||a.raw);if(!acts.length){toast('Adicione pelo menos uma oficina.');return}save();const btn=$('#pdfBtn');btn.disabled=true;btn.textContent='Montando PDF…';
  try{
    const [logo,watermark]=await Promise.all([toDataURL('/assets/apias-scfv.png'),toDataURL('/assets/instituto-sao-jeronimo.png')]);
    const content=[];
    content.push({text:'RELATÓRIO MENSAL DE ATIVIDADES',style:'reportTitle',margin:[0,0,0,6]});
    content.push({table:{widths:['*'],body:[[{text:`SERVIÇO DE CONVIVÊNCIA E FORTALECIMENTO DE VÍNCULOS ${state.year}`,bold:true,alignment:'center'}],[{text:`PROJETO: ${state.project}`,alignment:'center'}],[{text:[{text:'OFICINA: ',bold:false},state.workshop]}],[{text:[{text:'OBJETIVO: ',bold:false},state.objective]}],[{text:[{text:'RESPONSÁVEL: ',bold:false},state.responsible]}],[{text:`MÊS: ${MONTHS[state.month]}        ANO: ${state.year}`}]]},layout:{hLineWidth:()=>.7,vLineWidth:()=>.7,hLineColor:()=> '#333',vLineColor:()=> '#333',paddingLeft:()=>5,paddingRight:()=>5,paddingTop:()=>4,paddingBottom:()=>4},fontSize:10.5,margin:[0,0,0,10]});
    acts.forEach(a=>{content.push({text:`OFICINA ${formatDate(a.date)}${a.title?': '+a.title:''}`,bold:true,fontSize:10.5,margin:[0,6,0,3],unbreakable:true});content.push(parseContent(a.final||a.raw))});
    content.push({text:'Materiais Utilizados',decoration:'underline',fontSize:10.5,margin:[0,9,0,4]});content.push({ul:state.selectedMaterials,fontSize:10.5,lineHeight:1.15,margin:[0,0,0,18]});content.push({text:'Assinatura: ________________________________________________',fontSize:10.5,margin:[0,12,0,12]});content.push({text:'ANEXO: (FOTOS, REGISTROS, LISTAS DE PRESENÇA E OUTROS)',fontSize:10.5,bold:false,margin:[0,6,0,0]});
    if(state.photos.length){content.push({text:'REGISTRO FOTOGRÁFICO',bold:true,fontSize:14,alignment:'center',pageBreak:'before',margin:[0,0,0,12]});for(let i=0;i<state.photos.length;i+=2){const cols=state.photos.slice(i,i+2).map((src,j)=>({stack:[{image:src,fit:[230,260],alignment:'center'},{text:`Foto ${i+j+1}`,alignment:'center',fontSize:9,color:'#666',margin:[0,4,0,10]}],width:'*'}));if(cols.length===1)cols.push({text:'',width:'*'});content.push({columns:cols,columnGap:10})}}
    const doc={pageSize:'A4',pageMargins:[64,92,64,62],background:()=>({image:watermark,width:330,opacity:.08,absolutePosition:{x:132,y:250}}),header:()=>({margin:[50,18,50,0],columns:[{image:logo,width:62},{text:'Associação de Proteção à Infância e de Assistência Social de Santa Luzia',color:'#e9853c',fontSize:10,alignment:'center',margin:[0,21,0,0]},{text:'',width:62}]}),footer:(current,pageCount)=>({margin:[70,0,70,12],stack:[{text:'“O amor nasce com a doação.”',italics:true,alignment:'center',color:'#234e70',fontSize:8},{text:'Associação de Proteção à Infância e de Assistência Social de Santa luzia',alignment:'center',color:'#234e70',fontSize:8},{text:'R. Floriano Peixoto 409 – Centro - Santa Luzia – MG - CEP 33.010-030 –',alignment:'center',color:'#234e70',fontSize:8},{text:'Tel. /Fax 3641-1078/98993-0383',alignment:'center',color:'#234e70',fontSize:8},{text:'CNPJ 24 427 155/0001-77 - e mail: pfinanceiro914@gmail.com',alignment:'center',color:'#234e70',fontSize:8},{text:`${current}`,alignment:'right',fontSize:7,color:'#444'}]}),content,defaultStyle:{font:'Roboto',color:'#111'},styles:{reportTitle:{bold:true,fontSize:13,alignment:'center'}}};
    const name=`Relatorio_${MONTHS[state.month]}_${state.year}_SCFV.pdf`.replace(/\s+/g,'_');pdfMake.createPdf(doc).download(name);toast('PDF gerado.');
  }catch(e){console.error(e);toast('Não consegui gerar o PDF neste aparelho.')}finally{btn.disabled=false;btn.textContent='Gerar PDF'}
}

load();initMonths();fill();
$('#template').addEventListener('change',e=>{const t=TEMPLATES[e.target.value];if(t){$('#workshop').value=t.workshop;$('#objective').value=t.objective}markSaving()});
['month','year','project','workshop','objective','responsible'].forEach(id=>$('#'+id).addEventListener('input',markSaving));
$('#addActivityBtn').onclick=()=>{addActivity();renumber();markSaving();setTimeout(()=>$$('.activity').at(-1)?.scrollIntoView({behavior:'smooth',block:'center'}),60)};
$('#addMaterialBtn').onclick=()=>{const v=$('#newMaterial').value.trim();if(!v)return;if(!state.materials.includes(v))state.materials.push(v);if(!state.selectedMaterials.includes(v))state.selectedMaterials.push(v);$('#newMaterial').value='';renderMaterials();markSaving()};
$('#photoInput').addEventListener('change',async e=>{const files=[...e.target.files].slice(0,8-state.photos.length);for(const f of files){try{state.photos.push(await compressImage(f))}catch{}}renderPhotos();markSaving();e.target.value=''});
$('#previewBtn').onclick=()=>{const p=$('#preview');p.textContent=reportText();p.classList.toggle('hidden');if(!p.classList.contains('hidden'))p.scrollIntoView({behavior:'smooth'})};
$('#pdfBtn').onclick=makePdf;$('#newMonthBtn').onclick=newMonth;
$('#unlockBtn').onclick=async()=>{pin=$('#pinInput').value.trim();$('#pinError').textContent='';const ok=await checkAccess();if(!ok)$('#pinError').textContent='Código incorreto. Tente novamente.'};$('#pinInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#unlockBtn').click()});
checkAccess();
