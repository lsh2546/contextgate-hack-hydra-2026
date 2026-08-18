let state; let selected = 0;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

async function load(){
  state = await fetch('/api/state').then(r=>r.json());
  $('#dbLabel').textContent=state.status.label;
  document.querySelector('.live').classList.toggle('offline', !state.status.connected);
  document.querySelector('.live').classList.toggle('development', state.status.mode==='memory');
  $('#entityCount').textContent=state.stats.entities;
  $('#claimCount').textContent=state.stats.claims;
  renderActions(); select(0);
}
function renderActions(){
  $('#actionList').innerHTML=state.actions.map((a,i)=>`<div class="action-item ${i===selected?'active':''}" data-i="${i}"><strong><i></i>${esc(a.title)}</strong><span>${esc(a.actor)} → ${esc(a.tool)}</span></div>`).join('');
  document.querySelectorAll('.action-item').forEach(el=>el.onclick=()=>select(Number(el.dataset.i)));
}
function select(i){selected=i;renderActions();const a=state.actions[i];$('#actionTitle').textContent=a.title;$('#payload').textContent=a.payload;reset();}
function reset(){
  $('#result').className='result waiting';$('#result').innerHTML='<div class="decision-orb"><span>?</span></div><div><p class="label">DECISION</p><h3>Ready to verify</h3><p>Run the proposed action through the temporal evidence graph.</p></div><div class="confidence"><b>—</b><span>confidence</span></div>';
  $('#timeline').className='timeline empty';$('#timeline').textContent='Evidence appears after verification.';$('#evidenceCount').textContent='0 sources';$('#graph').innerHTML='<div class="empty">No traversal yet.</div>';
}
async function execute(){
  const btn=$('#execute');btn.disabled=true;btn.textContent='Traversing evidence…';
  try {
    const response=await fetch(`/api/evaluate/${state.actions[selected].id}`,{method:'POST'});
    const result=await response.json();
    if(!response.ok) throw new Error(result.error||'Evaluation failed');
    renderResult(result);
  } catch(error) {
    $('#result').className='result block';
    $('#result').innerHTML=`<div class="decision-orb"><span>×</span></div><div><p class="label">HYDRADB REQUIRED</p><h3>Decision unavailable</h3><p>${esc(error.message)}</p></div>`;
  } finally {
    btn.disabled=false;btn.innerHTML='Execute action <span>→</span>';
  }
}
function renderResult(r){
  const cls=r.decision.toLowerCase(), icon=r.decision==='BLOCK'?'×':r.decision==='ALLOW'?'✓':'!';
  $('#result').className=`result ${cls}`;$('#result').innerHTML=`<div class="decision-orb"><span>${icon}</span></div><div><p class="label">DECISION</p><h3>${r.decision}</h3><p>${esc(r.reason)}</p></div><div class="confidence"><b>${Math.round(r.confidence*100)}%</b><span>confidence · ${r.latencyMs}ms</span></div>`;
  $('#evidenceCount').textContent=`${r.evidence.length} sources`;$('#timeline').className='timeline';
  $('#timeline').innerHTML=r.evidence.length?r.evidence.map(e=>`<div class="event"><time>${new Date(e.at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</time><i class="dot"></i><div><strong>${esc(e.sourceDetail?.kind||'Source')} · ${esc(e.value)}</strong><span>${esc(e.status)} · authority ${Math.round((e.sourceDetail?.authority||0)*100)}%</span></div></div>`).join(''):'<div class="empty">No evidence path found. Human input required.</div>';
  renderGraph(r);
}
function renderGraph(r){
  if(!r.path.length){$('#graph').innerHTML='<div class="empty">Traversal returned no path → CLARIFY</div>';return}
  const nodes=[{label:'Agent action',x:20,y:108,hot:true},...r.path.slice(0,3).map((p,i)=>({label:p.label,x:160+i*145,y:i%2?165:52,hot:i===r.path.length-1}))];
  let html=nodes.map(n=>`<div class="node ${n.hot?'hot':''}" style="left:${n.x}px;top:${n.y}px">${esc(n.label)}</div>`).join('');
  for(let i=0;i<nodes.length-1;i++){const a=nodes[i],b=nodes[i+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.sqrt(dx*dx+dy*dy),angle=Math.atan2(dy,dx)*180/Math.PI;html+=`<div class="edge" style="left:${a.x+75}px;top:${a.y+17}px;width:${Math.max(35,len-70)}px;transform:rotate(${angle}deg)"><label>${esc(r.path[i]?.relationship||'CHECKS')}</label></div>`}$('#graph').innerHTML=html;
}
$('#execute').onclick=execute;$('#tour').onclick=()=>{select(0);setTimeout(execute,350)};load().catch(e=>{$('#dbLabel').textContent='Demo graph unavailable';console.error(e)});
