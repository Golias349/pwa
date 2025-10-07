const K={TALHOES:'TALHOES',ESTOQUE:'ESTOQUE',REG:'REG'};
const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
const db={get:(k,d=[])=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};

function setTab(t){$$('.tab').forEach(x=>x.classList.remove('active'));const el=$('#tab-'+t);if(el)el.classList.add('active');$$('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));if(t==='talhoes')renderTalhoes();if(t==='registros'){preencherCombosRegistro();renderRegistros()}if(t==='estoque')renderEstoque();if(t==='resumo'){preencherFiltrosResumo();renderResumo()}}
$$('.tab-btn').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));

$('#btnMenu').onclick=()=>drawer(true);$('#btnCloseDrawer').onclick=()=>drawer(false);
function drawer(v){const d=$('#drawer');v?d.classList.add('show'):d.classList.remove('show');d.setAttribute('aria-hidden',String(!v))}
$$('.drawer-link[data-tab]').forEach(b=>b.addEventListener('click',()=>{setTab(b.dataset.tab);drawer(false)}));
$$('.drawer-link[data-action="config"]').forEach(b=>b.addEventListener('click',()=>{showModal('config',true)}));
$$('.drawer-link[data-action="sobre"]').forEach(b=>b.addEventListener('click',()=>{showModal('sobre',true)}));

function showModal(which,open){const m=which==='config'?$('#modalConfig'):$('#modalSobre');if(!m)return;if(open){m.classList.remove('hidden');m.setAttribute('aria-hidden','false')}else{m.classList.add('hidden');m.setAttribute('aria-hidden','true')}}
$$('[data-close="config"]').forEach(b=>b.addEventListener('click',()=>showModal('config',false)));
$$('[data-close="sobre"]').forEach(b=>b.addEventListener('click',()=>showModal('sobre',false)));

const modal={open({title='Confirmar',html='',confirmText='Excluir',onConfirm=()=>{}}){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;$('#modalConfirm').textContent=confirmText;$('#modal').classList.remove('hidden');$('#modal').setAttribute('aria-hidden','false');const close=()=>{$('#modal').classList.add('hidden');$('#modal').setAttribute('aria-hidden','true')};$('#modalClose').onclick=$('#modalCancel').onclick=()=>close();$('#modalConfirm').onclick=()=>{onConfirm();close()};const onKey=e=>{if(e.key==='Escape'){close();document.removeEventListener('keydown',onKey)}};document.addEventListener('keydown',onKey);$('.modal-overlay').onclick=()=>close()}};

function renderTalhoes(){const t=db.get(K.TALHOES,[]),ul=$('#listaTalhoes');ul.innerHTML='';t.forEach((n,i)=>{const li=document.createElement('li');li.innerHTML=`<span>${n}</span><span class="row"><button class="btn" data-edit="${i}">Renomear</button><button class="btn danger" data-del="${i}">Excluir</button></span>`;ul.appendChild(li)});ul.onclick=e=>{const el=e.target;if(el.dataset.del){const i=+el.dataset.del;modal.open({title:'Excluir talhão',html:`Excluir <strong>${t[i]}</strong>?`,onConfirm:()=>{t.splice(i,1);db.set(K.TALHOES,t);renderTalhoes();preencherCombosRegistro();renderResumo()}})}else if(el.dataset.edit){const i=+el.dataset.edit;const novo=prompt('Novo nome do talhão:',t[i]);if(novo){t[i]=novo;db.set(K.TALHOES,t);renderTalhoes();preencherCombosRegistro();renderResumo()}}}})
$('#btnAddTalhao').onclick=()=>{const nome=$('#nomeTalhao').value.trim();if(!nome)return;const t=db.get(K.TALHOES,[]);t.push(nome);db.set(K.TALHOES,t);$('#nomeTalhao').value='';renderTalhoes();preencherCombosRegistro()};

function renderEstoque(){const est=db.get(K.ESTOQUE,[]),tb=$('#tbodyEstoque');tb.innerHTML='';est.forEach((it,i)=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${it.nome}</td><td>${fmtKg(it.qtd)}</td><td>${fmtR$(it.precoSaco)}</td><td><button class="btn danger" data-del="${i}">Excluir</button></td>`;tb.appendChild(tr)});tb.onclick=e=>{const i=e.target?.dataset?.del;if(i!=null){modal.open({title:'Excluir item do estoque',html:`Remover <strong>${est[i].nome}</strong>?`,onConfirm:()=>{est.splice(i,1);db.set(K.ESTOQUE,est);renderEstoque();preencherCombosRegistro()}})}}}
$('#btnAddEstoque').onclick=()=>{const nome=$('#estNome').value.trim(),qtd=parseFloat($('#estQtd').value||0),preco=parseFloat($('#estPrecoSaco').value||0);if(!nome||!qtd||!preco)return;const est=db.get(K.ESTOQUE,[]);est.push({nome,qtd,precoSaco:preco});db.set(K.ESTOQUE,est);$('#estNome').value='';$('#estQtd').value='';$('#estPrecoSaco').value='';renderEstoque();preencherCombosRegistro()};

function preencherCombosRegistro(){const t=db.get(K.TALHOES,[]),est=db.get(K.ESTOQUE,[]);$('#regTalhao').innerHTML=t.map(n=>`<option value="${n}">${n}</option>`).join('');$('#listaInsumos').innerHTML=est.map(e=>`<option value="${e.nome}">`).join('')}
function renderRegistros(){const regs=db.get(K.REG,[]),ul=$('#listaRegistros');ul.innerHTML='';regs.slice().reverse().forEach((r,idxFromEnd)=>{const i=regs.length-1-idxFromEnd;const li=document.createElement('li');li.innerHTML=`<span>${fmtData(r.data)} — <span class="badge">${r.talhao}</span> — ${r.insumo} — ${fmtKg(r.qtd)} — ${fmtR$(r.custo||0)}</span><span class="row"><button class="btn danger" data-del="${i}">Excluir</button></span>`;ul.appendChild(li)});ul.onclick=e=>{const i=e.target?.dataset?.del;if(i!=null){const r=db.get(K.REG,[])[i];modal.open({title:'Excluir registro',html:`Excluir <strong>${r.insumo}</strong> em <strong>${r.talhao}</strong> de <strong>${fmtKg(r.qtd)}</strong>?`,onConfirm:()=>{const regs=db.get(K.REG,[]);regs.splice(i,1);db.set(K.REG,regs);renderRegistros();renderResumo()}})}}}
$('#btnSalvarAplicacao').onclick=()=>{const talhao=$('#regTalhao').value,insumo=$('#regInsumo').value.trim(),desc=$('#regDesc').value.trim(),qtd=parseFloat($('#regQtd').value||0);if(!talhao||!insumo||!qtd)return;const est=db.get(K.ESTOQUE,[]),item=est.find(e=>e.nome.toLowerCase()===insumo.toLowerCase()),precoSaco=item?.precoSaco||0;const custo=precoSaco*(qtd/50);const regs=db.get(K.REG,[]);regs.push({talhao,insumo,qtd,data:new Date().toISOString(),desc,custo});db.set(K.REG,regs);$('#regQtd').value='';$('#regDesc').value='';renderRegistros();renderResumo()};

function preencherFiltrosResumo(){const m=$('#mesResumo'),a=$('#anoResumo');if(!m.options.length){for(let i=1;i<=12;i++){const o=document.createElement('option');o.value=i;o.textContent=String(i).padStart(2,'0');m.appendChild(o)}const y=new Date().getFullYear();for(let i=y-3;i<=y+1;i++){const o=document.createElement('option');o.value=i;o.textContent=i;a.appendChild(o)}const d=new Date();m.value=d.getMonth()+1;a.value=d.getFullYear();m.addEventListener('change',renderResumo);a.addEventListener('change',renderResumo)}}
function renderResumo(){const m=+$('#mesResumo').value,y=+$('#anoResumo').value;const regs=db.get(K.REG,[]).filter(r=>{const d=new Date(r.data);return d.getMonth()+1===m&&d.getFullYear()===y});const map=new Map();regs.forEach((r,i)=>{const k=`${r.talhao}__${r.insumo}`;const c=map.get(k)||{talhao:r.talhao,insumo:r.insumo,kg:0,custo:0,idx:[]};c.kg+=r.qtd;c.custo+=(r.custo||0);c.idx.push(i);map.set(k,c)});const tb=$('#tabelaResumo');tb.innerHTML='';let tKg=0,tR$=0;for(const row of map.values()){tKg+=row.kg;tR$+=row.custo;const tr=document.createElement('tr');tr.innerHTML=`<td>${row.talhao}</td><td>${row.insumo}</td><td>${fmtKg(row.kg)}</td><td>${fmtR$(row.custo)}</td><td>${String(m).padStart(2,'0')}/${y}</td><td><button class="btn danger" data-key="${row.talhao}__${row.insumo}">Excluir…</button></td>`;tb.appendChild(tr)}$('#totalKg').textContent=fmtKg(tKg);$('#totalR$').textContent=fmtR$(tR$);tb.onclick=e=>{const key=e.target?.dataset?.key;if(!key)return;const [talhao,insumo]=key.split('__');const list=db.get(K.REG,[]).map((r,idx)=>({r,idx})).filter(x=>{const d=new Date(x.r.data);return x.r.talhao===talhao&&x.r.insumo===insumo&&d.getMonth()+1===m&&d.getFullYear()===y});const html=`<p>Selecione os registros para excluir de <strong>${insumo}</strong> no talhão <strong>${talhao}</strong> (${String(m).padStart(2,'0')}/${y}).</p><ul class="lista" id="delList">${list.map(x=>`<li><label><input type="checkbox" data-i="${x.idx}"> ${fmtData(x.r.data)} — ${fmtKg(x.r.qtd)} — ${fmtR$(x.r.custo||0)}</label></li>`).join('')}</ul>`;modal.open({title:'Excluir registros do resumo',html,confirmText:'Excluir selecionados',onConfirm:()=>{const sel=[...document.querySelectorAll('#delList input[type=checkbox]')].filter(c=>c.checked).map(c=>+c.dataset.i);if(!sel.length)return;const regs=db.get(K.REG,[]).filter((_,i)=>!sel.includes(i));db.set(K.REG,regs);renderResumo();renderRegistros()}})}};

$('#btnExportCSV').onclick=()=>exportar('csv');$('#btnExportPDF').onclick=()=>exportar('pdf');
function exportar(tipo){const rows=[['Talhão','Insumo','Kg aplicados','Gasto (R$)','Mês/Ano']];$$('#tabelaResumo tr').forEach(tr=>{const tds=[...tr.children];if(tds.length<5)return;rows.push(tds.slice(0,5).map(td=>td.textContent.trim()))});if(tipo==='csv'){const csv=rows.map(r=>r.map(v=>`"${v.replace(/"/g,'""')}"`).join(';')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='resumo.csv';a.click()}else{const html=`<meta charset="utf-8"><title>Resumo</title><style>body{font:14px Arial}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:6px 8px;text-align:left}</style><h3>Resumo Mensal</h3><table>${$('#tabelaResumo').parentElement.innerHTML}</table>`;const w=window.open('','_blank');w.document.write(html);w.document.close();w.print()}}

$('#btnExportarJSON')?.addEventListener('click',()=>{const data={talhoes:db.get(K.TALHOES,[]),estoque:db.get(K.ESTOQUE,[]),registros:db.get(K.REG,[])};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='grao-digital-backup.json';a.click()});
$('#inputImportJSON')?.addEventListener('change',async ev=>{const f=ev.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());db.set(K.TALHOES,data.talhoes||[]);db.set(K.ESTOQUE,data.estoque||[]);db.set(K.REG,data.registros||[]);renderTalhoes();renderEstoque();renderRegistros();renderResumo()}catch{alert('Arquivo inválido')}});

const CLIENT_ID="149167584419-39h4d0qhjfjqs09687oih6p1fkpqds0k.apps.googleusercontent.com";
$('#btnGoogleConectar')?.addEventListener('click',()=>alert('Conectar ao Google — configurar OAuth posteriormente.'));
$('#btnDriveSalvar')?.addEventListener('click',()=>alert('Salvar no Drive — configurar OAuth posteriormente.'));
$('#btnDriveCarregar')?.addEventListener('click',()=>alert('Carregar do Drive — configurar OAuth posteriormente.'));

function fmtKg(v){return (v||0).toFixed(2).replace('.',',')}
function fmtR$(v){return (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function fmtData(iso){const d=new Date(iso);return d.toLocaleDateString('pt-BR')}

if('serviceWorker'in navigator){
  navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload());
  navigator.serviceWorker.addEventListener('message',evt=>{
    if(evt.data&&evt.data.type==='UPDATED'){
      const toast=document.createElement('div');
      toast.textContent='✨ Grão Digital atualizado para a versão mais recente!';
      Object.assign(toast.style,{position:'fixed',bottom:'20px',left:'50%',transform:'translateX(-50%)',background:'#166534',color:'#fff',padding:'10px 16px',borderRadius:'10px',boxShadow:'0 2px 10px rgba(0,0,0,.25)',zIndex:'9999',transition:'opacity .5s'});
      document.body.appendChild(toast); setTimeout(()=>toast.style.opacity='0',3500); setTimeout(()=>toast.remove(),4000);
    }
  });
}

document.addEventListener('DOMContentLoaded',()=>{setTab('talhoes');renderTalhoes();renderEstoque();preencherCombosRegistro();renderRegistros();preencherFiltrosResumo();renderResumo()});