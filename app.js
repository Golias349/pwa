// ===== Config =====
const BASE_PATH = (typeof BASE_PATH !== 'undefined') ? BASE_PATH : "./";
const APP_VERSION = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : "v6.3";
const GOOGLE_CLIENT_ID = (typeof GOOGLE_CLIENT_ID !== 'undefined') ? GOOGLE_CLIENT_ID : "";
const GOOGLE_SCOPES = "https://www.googleapis.com/auth/drive.file";

// ===== Helpers =====
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmtBRL = v => (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const hojeISO = () => new Date().toISOString().slice(0,10);

const K = { TALHOES:'gd_talhoes_v63', ESTOQUE:'gd_estoque_v63', REG:'gd_registros_v63' };
const db = {
  get:(k,def=[])=>JSON.parse(localStorage.getItem(k)||JSON.stringify(def)),
  set:(k,v)=>localStorage.setItem(k,JSON.stringify(v)),
  del:(k)=>localStorage.removeItem(k)
};

// ===== Drawer
const drawer = $('#drawer'), backdrop = $('#backdrop');
$('#btnMenu').onclick = ()=>{ drawer.classList.add('show'); backdrop.classList.add('show'); drawer.setAttribute('aria-hidden','false'); };
$('#btnDrawerClose').onclick = ()=>{ drawer.classList.remove('show'); backdrop.classList.remove('show'); drawer.setAttribute('aria-hidden','true'); };
backdrop.onclick = $('#btnDrawerClose').onclick;
$$('.drawer__link[data-open="config"]').forEach(a=>a.onclick=(e)=>{ e.preventDefault(); goto('view-config'); drawer.classList.remove('show'); backdrop.classList.remove('show'); });

// ===== Tabs
$$('.tab').forEach(t=>t.addEventListener('click',()=>{
  $$('.tab').forEach(b=>b.classList.remove('active'));
  t.classList.add('active');
  goto(t.dataset.view);
}));
function goto(id){ $$('main > section').forEach(s=>s.classList.add('hidden')); $('#'+id).classList.remove('hidden'); window.scrollTo({top:0,behavior:'smooth'}); }

// ===== Estado
let talhoes = db.get(K.TALHOES);
let estoque = db.get(K.ESTOQUE);
let registros = db.get(K.REG);

// ===== Talhoes
function fillSelTalhao(){ $('#selTalhao').innerHTML = `<option value="">Talhão…</option>` + talhoes.map(t=>`<option>${t}</option>`).join(''); }
function renderTalhoes(){
  const ul = $('#listaTalhoes');
  ul.innerHTML = talhoes.map((t,i)=>`
    <li>
      <div><strong>${t}</strong></div>
      <div class="row gap">
        <button class="btn" data-rename="${i}">Renomear</button>
        <button class="btn btn-danger" data-del="${i}">Excluir</button>
      </div>
    </li>
  `).join('') || `<li class="muted">Nenhum talhão cadastrado</li>`;

  ul.querySelectorAll('[data-rename]').forEach(b=>b.onclick=()=>{
    const i = +b.dataset.rename;
    const novo = prompt('Novo nome:', talhoes[i]);
    if(!novo) return;
    talhoes[i]=novo.trim(); db.set(K.TALHOES,talhoes);
    fillSelTalhao(); renderTalhoes(); renderResumo(); renderRegistrosRecentes();
  });
  ul.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
    const i = +b.dataset.del;
    if(!confirm('Excluir talhão?')) return;
    talhoes.splice(i,1); db.set(K.TALHOES,talhoes);
    fillSelTalhao(); renderTalhoes(); renderResumo(); renderRegistrosRecentes();
  });
}
$('#btnAddTalhao').onclick = ()=>{
  const nome = $('#inpTalhao').value.trim();
  if(!nome) return alert('Informe o nome do talhão');
  talhoes.push(nome); db.set(K.TALHOES,talhoes);
  $('#inpTalhao').value=''; fillSelTalhao(); renderTalhoes();
};

// ===== Estoque
function fillSelInsumo(){ $('#selInsumo').innerHTML = `<option value="">Insumo (do estoque)…</option>` + estoque.map(e=>`<option>${e.nome}</option>`).join(''); }
function renderEstoque(){
  const tb = $('#tbEst');
  tb.innerHTML = estoque.map((e,i)=>`
    <tr>
      <td>${e.nome}</td><td>${(+e.qtd)||0}</td><td>${fmtBRL(+e.preco)}</td>
      <td class="col-acoes">
        <button class="btn" data-edit="${i}">Editar</button>
        <button class="btn btn-danger" data-del="${i}">Excluir</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="4" class="muted">Nenhum insumo no estoque</td></tr>`;

  tb.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.edit, e=estoque[i];
    const nome = prompt('Nome do insumo:', e.nome); if(!nome) return;
    const qtd  = +(prompt('Quantidade (kg):', e.qtd) ?? e.qtd);
    const p50  = +(prompt('Preço por 50kg (R$):', e.preco) ?? e.preco);
    estoque[i]={nome:nome.trim(),qtd:+qtd,preco:+p50}; db.set(K.ESTOQUE,estoque);
    fillSelInsumo(); renderEstoque(); renderResumo(); renderRegistrosRecentes();
  });
  tb.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
    if(!confirm('Excluir insumo do estoque?')) return;
    estoque.splice(+b.dataset.del,1); db.set(K.ESTOQUE,estoque);
    fillSelInsumo(); renderEstoque(); renderResumo(); renderRegistrosRecentes();
  });
}
$('#btnEstAdd').onclick = ()=>{
  const nome = $('#inpEstNome').value.trim();
  const qtd  = +($('#inpEstQtd').value||'0').replace(',','.');
  const p50  = +($('#inpEstPreco').value||'0').replace(',','.');
  if(!nome || !(qtd>=0)) return alert('Informe nome e quantidade (kg)');
  estoque.push({nome,qtd:+qtd,preco:+p50||0}); db.set(K.ESTOQUE,estoque);
  $('#inpEstNome').value = $('#inpEstQtd').value = $('#inpEstPreco').value = '';
  fillSelInsumo(); renderEstoque();
};

// ===== Registros
function custoRegistro(insumoNome, kg){
  const it = estoque.find(e=>e.nome===insumoNome);
  if(!it) return 0;
  const precoKg = (+it.preco||0)/50;
  return (+kg||0)*precoKg;
}
$('#btnSalvarAplic').onclick = ()=>{
  const talhao = $('#selTalhao').value;
  const insumo = $('#selInsumo').value;
  const qtd = +($('#inpQtd').value||'0').replace(',','.');
  const desc = $('#inpDesc').value.trim();
  if(!talhao || !insumo || !(qtd>0)) return alert('Selecione talhão, insumo e informe a quantidade (kg)');
  const custo = custoRegistro(insumo, qtd);
  registros.push({data:hojeISO(), talhao, insumo, qtd, desc, custo});
  db.set(K.REG,registros);
  $('#inpQtd').value=''; $('#inpDesc').value='';
  renderRegistrosRecentes(); renderResumo();
};
function renderRegistrosRecentes(){
  const ul = $('#listaAplic');
  const ult = [...registros].slice(-10).reverse();
  ul.innerHTML = ult.map((r,idx)=>`
    <li>
      <div>${r.data} — <strong>${r.talhao}</strong> — ${r.insumo} — ${(+r.qtd).toFixed(0)}kg — ${fmtBRL(r.custo)}</div>
      <div class="row gap">
        <button class="btn" data-edit="${registros.length-1-idx}">Editar</button>
        <button class="btn btn-danger" data-del="${registros.length-1-idx}">Excluir</button>
      </div>
    </li>
  `).join('') || `<li class="muted">Sem registros ainda</li>`;

  ul.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
    if(!confirm('Excluir registro?')) return;
    registros.splice(+b.dataset.del,1); db.set(K.REG,registros);
    renderRegistrosRecentes(); renderResumo();
  });
  ul.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.edit; const r=registros[i];
    const talhao = prompt('Talhão:', r.talhao) ?? r.talhao;
    const insumo = prompt('Insumo:', r.insumo) ?? r.insumo;
    const qtd    = +(prompt('Qtd (kg):', r.qtd) ?? r.qtd);
    const desc   = prompt('Descrição:', r.desc||'') ?? r.desc;
    const custo  = custoRegistro(insumo,qtd);
    registros[i] = {data:r.data,talhao,insumo,qtd,desc,custo};
    db.set(K.REG,registros);
    renderRegistrosRecentes(); renderResumo();
  });
}

// ===== Resumo
function fillMesAno(){
  const m = $('#selMes'), a=$('#selAno'), now = new Date();
  m.innerHTML = Array.from({length:12},(_,i)=>`<option value="${i+1}">${String(i+1).padStart(2,'0')}</option>`).join('');
  a.innerHTML = Array.from({length:6},(_,k)=>`${now.getFullYear()-2+k}`).map(y=>`<option>${y}</option>`).join('');
  m.value = String(now.getMonth()+1); a.value = String(now.getFullYear());
}
function renderResumo(){
  const mm = +$('#selMes').value, yy = +$('#selAno').value;
  const tb = $('#tbResumo'); let totKg=0, totR=0;
  const rows = registros.filter(r=>{
    const [Y,M] = r.data.split('-').map(n=>+n);
    return (Y===yy && M===mm);
  });
  tb.innerHTML = rows.map((r,i)=>{
    totKg += (+r.qtd||0); totR += (+r.custo||0);
    return `<tr>
      <td>${r.talhao}</td><td>${r.insumo}</td>
      <td>${(+r.qtd).toFixed(0)}</td><td>${fmtBRL(r.custo)}</td>
      <td>${String(mm).padStart(2,'0')}/${yy}</td>
      <td class="col-acoes"><button class="btn btn-danger" data-del-r="${i}">Excluir</button></td>
    </tr>`;
  }).join('') || `<tr><td colspan="6" class="muted">Sem dados para ${String(mm).padStart(2,'0')}/${yy}</td></tr>`;
  $('#totKg').textContent = (+totKg).toFixed(0);
  $('#totR$').textContent = fmtBRL(totR);

  tb.querySelectorAll('[data-del-r]').forEach(btn=>{
    btn.onclick=()=>{
      const idxLocal = +btn.dataset.delR;
      const alvo = rows[idxLocal];
      const realIndex = registros.findIndex(x=>x===alvo);
      if(!confirm('Excluir registro selecionado?')) return;
      registros.splice(realIndex,1); db.set(K.REG,registros);
      renderRegistrosRecentes(); renderResumo();
    };
  });
}
$('#selMes').onchange = renderResumo; $('#selAno').onchange = renderResumo;

// ===== Export
$('#btnCSV').onclick = ()=>{
  const m=$('#selMes').value, y=$('#selAno').value;
  const cab = ['Talhão','Insumo','Kg','Gasto (R$)','Mês/Ano'];
  const linhas = [];
  $('#tbResumo').querySelectorAll('tr').forEach(tr=>{
    const tds = [...tr.children].map(td=>td.innerText.trim());
    if(tds.length>=5 && !tds[0].startsWith('Sem dados')) linhas.push(tds.slice(0,5));
  });
  const csv = [cab, ...linhas].map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(';')).join('\\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`resumo-${m}-${y}.csv`; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),300);
};
$('#btnPDF').onclick = ()=>{
  const m=$('#selMes').value, y=$('#selAno').value;
  const w = window.open('', '_blank');
  w.document.write(`<html><head><meta charset="utf-8"><title>Resumo ${m}/${y}</title>
  <style>body{font-family:Arial; padding:20px} h1{font-size:18px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #777;padding:6px}</style>
  </head><body><h1>Grão Digital — Resumo ${m}/${y}</h1>${$('#tblResumo').outerHTML}</body></html>`);
  w.document.close(); w.focus(); w.print();
};

// ===== Backup local
$('#btnExportJSON').onclick = ()=>{
  const dump = {versao:APP_VERSION, talhoes, estoque, registros};
  const blob = new Blob([JSON.stringify(dump,null,2)], {type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='grao-digital-backup-v63.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),300);
};
$('#btnImportJSON').onclick = ()=>{
  const f = $('#fileImport').files?.[0];
  if(!f) return alert('Selecione um arquivo JSON.');
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const d = JSON.parse(r.result);
      if(d.talhoes) talhoes = d.talhoes;
      if(d.estoque) estoque = d.estoque;
      if(d.registros) registros = d.registros;
      db.set(K.TALHOES,talhoes); db.set(K.ESTOQUE,estoque); db.set(K.REG,registros);
      boot(); alert('Importado com sucesso.');
    }catch(e){ alert('Arquivo inválido.'); }
  };
  r.readAsText(f);
};
$('#btnClearAll').onclick = ()=>{
  if(!confirm('Tem certeza? Isso apagará TODOS os dados.')) return;
  db.del(K.TALHOES); db.del(K.ESTOQUE); db.del(K.REG);
  talhoes=[]; estoque=[]; registros=[]; boot();
};

// ===== Google Drive
let GoogleAuth = null;
function gapiInit(){
  return new Promise((resolve,reject)=>{
    gapi.load('client:auth2', async ()=>{
      try{
        await gapi.client.init({
          clientId: GOOGLE_CLIENT_ID,
          scope: GOOGLE_SCOPES,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
        });
        GoogleAuth = gapi.auth2.getAuthInstance();
        resolve();
      }catch(e){ reject(e); }
    });
  });
}
async function ensureAuth(){
  if(!GoogleAuth) await gapiInit();
  if(!GoogleAuth.isSignedIn.get()) await GoogleAuth.signIn();
}
$('#btnGAuth').onclick = async ()=>{ try{ await ensureAuth(); alert('Conectado ao Google.'); }catch(e){ alert('Falha na conexão.'); } };
$('#btnGSignout').onclick = async ()=>{ try{ if(!GoogleAuth) await gapiInit(); await GoogleAuth.signOut(); alert('Desconectado.'); }catch(e){} };

async function driveSave(){
  await ensureAuth();
  const dump = {versao:APP_VERSION, talhoes, estoque, registros, data:new Date().toISOString()};
  const file = new Blob([JSON.stringify(dump)], {type:'application/json'});
  const metadata = { name: 'grao-digital-backup-v63.json', mimeType:'application/json' };
  const accessToken = gapi.auth.getToken().access_token;
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], {type:'application/json'}));
  form.append('file', file);
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method:'POST', headers:new Headers({'Authorization':'Bearer '+accessToken}), body: form
  });
  if(!res.ok) throw new Error('Falha ao salvar');
}
async function driveFindFileId(){
  await ensureAuth();
  const resp = await gapi.client.drive.files.list({
    q: "name = 'grao-digital-backup-v63.json' and trashed = false",
    fields: "files(id,name,modifiedTime)", spaces: "drive"
  });
  const files = resp.result.files || [];
  return files[0]?.id || null;
}
async function driveLoad(){
  await ensureAuth();
  const id = await driveFindFileId();
  if(!id) throw new Error('Arquivo não encontrado no Drive.');
  const token = gapi.auth.getToken().access_token;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
    headers: new Headers({'Authorization':'Bearer '+token})
  });
  if(!res.ok) throw new Error('Falha ao baixar');
  const data = await res.json();
  if(data.talhoes) talhoes = data.talhoes;
  if(data.estoque) estoque = data.estoque;
  if(data.registros) registros = data.registros;
  db.set(K.TALHOES,talhoes); db.set(K.ESTOQUE,estoque); db.set(K.REG,registros);
  boot();
}
$('#btnGSave').onclick = async ()=>{ try{ await driveSave(); alert('Backup salvo no Drive.'); }catch(e){ alert('Erro ao salvar no Drive.'); } };
$('#btnGLoad').onclick = async ()=>{ try{ await driveLoad(); alert('Backup restaurado do Drive.'); }catch(e){ alert(e.message || 'Erro ao restaurar.'); } };

// ===== SW
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register(`${BASE_PATH}service-worker.js`, {scope: BASE_PATH})
      .then(reg=>{
        if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
        reg.addEventListener('updatefound', ()=>{
          const sw = reg.installing;
          if(!sw) return;
          sw.addEventListener('statechange', ()=>{
            if(sw.state==='installed' && navigator.serviceWorker.controller){
              reg.waiting?.postMessage({type:'SKIP_WAITING'});
            }
          });
        });
      })
      .catch(console.error);
  });
  navigator.serviceWorker.addEventListener('controllerchange', ()=>location.reload());
}

// ===== Boot
function fillSelMesAno(){ fillMesAno(); renderResumo(); }
function boot(){
  renderTalhoes(); fillSelTalhao();
  renderEstoque(); fillSelInsumo();
  renderRegistrosRecentes();
  fillMesAno(); renderResumo();
}
document.addEventListener('DOMContentLoaded', boot);
