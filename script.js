let records = JSON.parse(localStorage.getItem('shiguang_records') || '[]');
let selectedMeal = '早餐', selectedPay = '現金';
let photoDataUrl = null, deleteTargetId = null, editingId = null;
const mealEmoji = {'早餐':'🌅','午餐':'☀️','晚餐':'🌙','點心':'🧋'};

function saveRecords() { localStorage.setItem('shiguang_records', JSON.stringify(records)); }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// Main nav
function switchMain(id) {
  document.querySelectorAll('.main-tab').forEach((b,i) => b.classList.toggle('active', ['record','album','stats'][i]===id));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id==='page-'+id));
  if (id==='album') renderAlbum();
  if (id==='stats') renderAllStats();
}

// Stats nav
function switchStats(id) {
  document.querySelectorAll('.stats-tab-btn').forEach((b,i) => b.classList.toggle('active', ['week','rank'][i]===id));
  document.querySelectorAll('.stats-page').forEach(p => p.classList.toggle('active', p.id==='stats-'+id));
}

// Upload
const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');
const previewWrap = document.getElementById('previewWrap');
const previewImg = document.getElementById('previewImg');
const uploadPrompt = document.getElementById('uploadPrompt');

function applyPhoto(dataUrl) {
  photoDataUrl = dataUrl; previewImg.src = dataUrl;
  uploadZone.style.padding='0'; uploadZone.style.border='none';
  uploadPrompt.style.display='none'; previewWrap.classList.add('show');
}
function clearPhoto() {
  photoDataUrl=null; fileInput.value='';
  previewWrap.classList.remove('show'); uploadPrompt.style.display='';
  uploadZone.style.padding=''; uploadZone.style.border='';
}
fileInput.addEventListener('change', e => {
  const file=e.target.files[0]; if(!file) return;
  const r=new FileReader(); r.onload=ev=>applyPhoto(ev.target.result); r.readAsDataURL(file);
});
document.getElementById('removeBtn').addEventListener('click', clearPhoto);
uploadZone.addEventListener('dragover', e=>{e.preventDefault();uploadZone.classList.add('dragover');});
uploadZone.addEventListener('dragleave', ()=>uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e=>{
  e.preventDefault(); uploadZone.classList.remove('dragover');
  const file=e.dataTransfer.files[0];
  if(file&&file.type.startsWith('image/')){const r=new FileReader();r.onload=ev=>applyPhoto(ev.target.result);r.readAsDataURL(file);}
});

// Tabs
document.getElementById('mealTabs').addEventListener('click', e=>{
  if(!e.target.classList.contains('meal-tab')) return;
  document.querySelectorAll('#mealTabs .meal-tab').forEach(t=>t.classList.remove('active'));
  e.target.classList.add('active'); selectedMeal=e.target.dataset.val;
});
document.getElementById('payTabs').addEventListener('click', e=>{
  if(!e.target.classList.contains('pay-tab')) return;
  document.querySelectorAll('#payTabs .pay-tab').forEach(t=>t.classList.remove('active'));
  e.target.classList.add('active'); selectedPay=e.target.dataset.val;
});

// Submit
document.getElementById('mealDate').value = new Date().toISOString().split('T')[0];
document.getElementById('submitBtn').addEventListener('click', ()=>{
  const name=document.getElementById('mealName').value.trim();
  const amount=parseInt(document.getElementById('mealAmount').value);
  if(!name){document.getElementById('mealName').focus();showToast('請填寫餐點名稱');return;}
  if(!amount||amount<=0){document.getElementById('mealAmount').focus();showToast('請輸入花費金額');return;}
  const record={id:Date.now(),name,amount,date:document.getElementById('mealDate').value,
    store:document.getElementById('storeName').value.trim(),note:document.getElementById('mealNote').value.trim(),
    meal:selectedMeal,pay:selectedPay,photo:photoDataUrl};
  records.unshift(record); saveRecords(); renderRecords();
  showToast('✅ '+name+' 已記錄！'); resetAddForm();
});

function resetAddForm() {
  document.getElementById('mealName').value='';
  document.getElementById('mealAmount').value='';
  document.getElementById('storeName').value='';
  document.getElementById('mealNote').value='';
  document.getElementById('mealDate').value=new Date().toISOString().split('T')[0];
  clearPhoto(); selectedMeal='早餐'; selectedPay='現金';
  document.querySelectorAll('#mealTabs .meal-tab').forEach((t,i)=>t.classList.toggle('active',i===0));
  document.querySelectorAll('#payTabs .pay-tab').forEach((t,i)=>t.classList.toggle('active',i===0));
}

// Delete
document.getElementById('modalCancel').addEventListener('click',()=>{document.getElementById('deleteModal').classList.remove('show');deleteTargetId=null;});
document.getElementById('modalConfirm').addEventListener('click',()=>{
  if(deleteTargetId!==null){
    const rec=records.find(r=>r.id===deleteTargetId);
    records=records.filter(r=>r.id!==deleteTargetId);
    saveRecords();renderRecords();showToast('🗑️ '+(rec?rec.name:'')+' 已刪除');deleteTargetId=null;
  }
  document.getElementById('deleteModal').classList.remove('show');
});
function confirmDelete(id){
  const rec=records.find(r=>r.id===id);if(!rec)return;
  deleteTargetId=id;
  document.getElementById('modalDesc').textContent='「'+rec.name+'」將會從記錄中移除，無法復原。';
  document.getElementById('deleteModal').classList.add('show');
}

// Render records
function renderRecords(){
  const today=new Date().toISOString().split('T')[0];
  const todayRecs=records.filter(r=>r.date===today);
  const list=document.getElementById('recordList');
  document.getElementById('recordsCount').textContent=todayRecs.length+' 筆';
  if(!todayRecs.length){
    list.innerHTML='<div class="empty-state"><div style="font-size:32px;margin-bottom:8px">🍽️</div>還沒有記錄，快去吃點東西！</div>';
    document.getElementById('dailyTotal').style.display='none';return;
  }
  list.innerHTML=todayRecs.map(r=>`
    <div class="record-item ${editingId===r.id?'editing':''}" id="item-${r.id}">
      <div class="record-main">
        <div class="record-thumb">${r.photo?`<img src="${r.photo}" alt="${r.name}">`:(mealEmoji[r.meal]||'🍽️')}</div>
        <div class="record-info">
          <div class="record-name">${r.name}</div>
          <div class="record-meta"><span class="meal-badge badge-${r.meal}">${r.meal}</span>${r.store?r.store+' · ':''}${r.date}${r.note?'<br><span style="color:var(--text-muted);font-size:11px">💬 '+r.note+'</span>':''}</div>
        </div>
        <div class="record-right"><div class="record-price">$${r.amount}</div><div class="record-pay">${r.pay}</div></div>
      </div>
      <div class="record-actions">
        <button class="btn-edit ${editingId===r.id?'active':''}" onclick="toggleEdit(${r.id})">${editingId===r.id?'✕ 收起':'✏️ 編輯'}</button>
        <button class="btn-delete" onclick="confirmDelete(${r.id})">🗑️ 刪除</button>
      </div>
      <div class="edit-panel ${editingId===r.id?'show':''}" id="edit-${r.id}">
        <div class="field"><label>餐點名稱</label><input type="text" id="en-${r.id}" value="${r.name}" maxlength="30"></div>
        <div class="row2" style="margin-bottom:10px">
          <div class="field" style="margin-bottom:0"><label>金額</label><input type="number" id="ea-${r.id}" value="${r.amount}" min="0"></div>
          <div class="field" style="margin-bottom:0"><label>店名</label><input type="text" id="es-${r.id}" value="${r.store||''}"></div>
        </div>
        <div style="margin-bottom:8px"><label style="display:block;font-size:11px;font-weight:600;color:var(--brown-mid);margin-bottom:5px">餐型</label>
          <div class="edit-meal-tabs" id="emt-${r.id}">
            ${['早餐','午餐','晚餐','點心'].map(m=>`<button class="edit-meal-tab ${r.meal===m?'active':''}" data-val="${m}" onclick="setEditMeal(${r.id},'${m}')">${mealEmoji[m]} ${m}</button>`).join('')}
          </div>
        </div>
        <div style="margin-bottom:8px"><label style="display:block;font-size:11px;font-weight:600;color:var(--brown-mid);margin-bottom:5px">付款方式</label>
          <div class="edit-pay-tabs" id="ept-${r.id}">
            ${['現金','信用卡','電子支付'].map(p=>`<button class="edit-pay-tab ${r.pay===p?'active':''}" data-val="${p}" onclick="setEditPay(${r.id},'${p}')">${p==='現金'?'💵':p==='信用卡'?'💳':'📱'} ${p}</button>`).join('')}
          </div>
        </div>
        <div class="field"><label>備註</label><textarea id="eno-${r.id}">${r.note||''}</textarea></div>
        <button class="edit-save-btn" onclick="saveEdit(${r.id})">儲存修改 ✓</button>
      </div>
    </div>`).join('');
  const total=todayRecs.reduce((s,r)=>s+r.amount,0);
  document.getElementById('totalAmount').textContent='$'+total;
  document.getElementById('dailyTotal').style.display='flex';
}

function toggleEdit(id){
  editingId=editingId===id?null:id; renderRecords();
  if(editingId) setTimeout(()=>{const el=document.getElementById('edit-'+id);if(el)el.scrollIntoView({behavior:'smooth',block:'nearest'});},50);
}
function setEditMeal(id,val){
  const rec=records.find(r=>r.id===id);if(rec)rec._editMeal=val;
  document.querySelectorAll('#emt-'+id+' .edit-meal-tab').forEach(t=>t.classList.toggle('active',t.dataset.val===val));
}
function setEditPay(id,val){
  const rec=records.find(r=>r.id===id);if(rec)rec._editPay=val;
  document.querySelectorAll('#ept-'+id+' .edit-pay-tab').forEach(t=>t.classList.toggle('active',t.dataset.val===val));
}
function saveEdit(id){
  const rec=records.find(r=>r.id===id);if(!rec)return;
  const newName=document.getElementById('en-'+id).value.trim();
  const newAmount=parseInt(document.getElementById('ea-'+id).value);
  if(!newName){showToast('請填寫餐點名稱');return;}
  if(!newAmount||newAmount<=0){showToast('請輸入有效金額');return;}
  rec.name=newName;rec.amount=newAmount;
  rec.store=document.getElementById('es-'+id).value.trim();
  rec.note=document.getElementById('eno-'+id).value.trim();
  if(rec._editMeal){rec.meal=rec._editMeal;delete rec._editMeal;}
  if(rec._editPay){rec.pay=rec._editPay;delete rec._editPay;}
  editingId=null;saveRecords();renderRecords();showToast('✏️ '+rec.name+' 已更新！');
}

// Album
function renderAlbum(){
  const content=document.getElementById('albumContent');
  const withPhoto=records.filter(r=>r.photo);
  if(!withPhoto.length){content.innerHTML='<div class="empty-state"><div style="font-size:32px;margin-bottom:8px">📷</div>還沒有餐點照片，去記錄一些吧！</div>';return;}
  const byMeal={'早餐':[],'午餐':[],'晚餐':[],'點心':[]};
  withPhoto.forEach(r=>{if(byMeal[r.meal])byMeal[r.meal].push(r);});
  const labels={'早餐':'🌅 早餐區','午餐':'☀️ 午餐區','晚餐':'🌙 晚餐區','點心':'🧋 點心區'};
  let html='';
  Object.entries(byMeal).forEach(([meal,items])=>{
    if(!items.length)return;
    html+=`<div class="album-section"><div class="album-section-title">${labels[meal]}</div><div class="album-grid">`;
    html+=items.map(r=>`<div class="album-item"><img src="${r.photo}" alt="${r.name}"><div class="album-label">${r.name}</div></div>`).join('');
    html+=`</div></div>`;
  });
  content.innerHTML=html;
}

// Stats
function renderAllStats(){
  renderWeekStats(); renderRanks();
}

function getWeekRange(){
  const now=new Date(),day=now.getDay();
  const mon=new Date(now); mon.setDate(now.getDate()-(day===0?6:day-1));
  const dates=[];
  for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);dates.push(d.toISOString().split('T')[0]);}
  return dates;
}

function renderWeekStats(){
  const dates=getWeekRange();
  const today=new Date().toISOString().split('T')[0];
  const dayNames=['一','二','三','四','五','六','日'];
  const dayAmts=dates.map(d=>records.filter(r=>r.date===d).reduce((s,r)=>s+r.amount,0));
  const total=dayAmts.reduce((s,v)=>s+v,0);
  const count=records.filter(r=>dates.includes(r.date)).length;
  const avg=total>0?Math.round(total/7):0;
  document.getElementById('sw-total').textContent='$'+total.toLocaleString();
  document.getElementById('sw-avg').textContent='$'+avg;
  document.getElementById('sw-count').textContent=count;

  const max=Math.max(...dayAmts,1);
  document.getElementById('weekBarChart').innerHTML=dates.map((d,i)=>`
    <div class="bar-row">
      <span class="bar-label">${dayNames[i]}</span>
      <div class="bar-track"><div class="bar-fill ${d===today?'today-bar':'normal-bar'}" style="width:${Math.round(dayAmts[i]/max*100)}%">
        ${dayAmts[i]/max>0.35?`<span>$${dayAmts[i]}</span>`:''}
      </div></div>
      <span class="bar-amount">$${dayAmts[i]}</span>
    </div>`).join('');

  const mealTotals=['早餐','午餐','晚餐','點心'].map(m=>({label:m,val:records.filter(r=>dates.includes(r.date)&&r.meal===m).reduce((s,r)=>s+r.amount,0)}));
  const colors=['#E07A45','#C05A25','#6B3E26','#F0C4A0'];
  const grandTotal=mealTotals.reduce((s,d)=>s+d.val,0)||1;
  const cx=55,cy=55,ro=40,ri=26;let angle=-Math.PI/2,paths='';
  mealTotals.forEach((d,i)=>{
    if(!d.val)return;
    const sweep=(d.val/grandTotal)*Math.PI*2;
    const x1=cx+ro*Math.cos(angle),y1=cy+ro*Math.sin(angle);
    angle+=sweep;
    const x2=cx+ro*Math.cos(angle),y2=cy+ro*Math.sin(angle);
    const ix1=cx+ri*Math.cos(angle-sweep),iy1=cy+ri*Math.sin(angle-sweep);
    const ix2=cx+ri*Math.cos(angle),iy2=cy+ri*Math.sin(angle);
    const lg=sweep>Math.PI?1:0;
    paths+=`<path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${ro},${ro} 0 ${lg},1 ${x2.toFixed(1)},${y2.toFixed(1)} L${ix2.toFixed(1)},${iy2.toFixed(1)} A${ri},${ri} 0 ${lg},0 ${ix1.toFixed(1)},${iy1.toFixed(1)} Z" fill="${colors[i]}" opacity="0.9"/>`;
  });
  document.getElementById('donutSvg').innerHTML=paths+`<text x="55" y="51" text-anchor="middle" font-size="11" fill="#8B6E5A" font-family="Noto Sans TC">總計</text><text x="55" y="65" text-anchor="middle" font-size="13" font-weight="700" fill="#6B3E26" font-family="Noto Sans TC">$${grandTotal.toLocaleString()}</text>`;
  document.getElementById('donutLegend').innerHTML=mealTotals.map((d,i)=>`
    <div class="legend-row"><div class="legend-dot" style="background:${colors[i]}"></div>
    <span class="legend-label">${d.label}</span>
    <span class="legend-val">$${d.val}</span>
    <span class="legend-pct">${Math.round(d.val/grandTotal*100)}%</span></div>`).join('');
}

function renderRanks(){
  const rbClass=i=>['rb-1','rb-2','rb-3','rb-n','rb-n','rb-n'][i]||'rb-n';
  const amtMap={};
  records.forEach(r=>{amtMap[r.name]=(amtMap[r.name]||{name:r.name,amt:0,count:0});amtMap[r.name].amt+=r.amount;amtMap[r.name].count++;});
  const sorted=Object.values(amtMap).sort((a,b)=>b.amt-a.amt).slice(0,6);
  document.getElementById('rankList').innerHTML=sorted.length
    ? sorted.map((d,i)=>`<div class="rank-item"><div class="rank-badge ${rbClass(i)}">${i+1}</div><div><div class="rank-name-text">${d.name}</div><div class="rank-count-text">${d.count} 次</div></div><div class="rank-amt">$${d.amt}</div></div>`).join('')
    : '<div class="empty-state" style="padding:16px">尚無記錄</div>';
  const byFreq=[...sorted].sort((a,b)=>b.count-a.count);
  document.getElementById('freqList').innerHTML=byFreq.length
    ? byFreq.map((d,i)=>`<div class="rank-item"><div class="rank-badge ${rbClass(i)}">${i+1}</div><div><div class="rank-name-text">${d.name}</div><div class="rank-count-text">均 $${Math.round(d.amt/d.count)} / 次</div></div><div class="rank-amt">${d.count} 次</div></div>`).join('')
    : '<div class="empty-state" style="padding:16px">尚無記錄</div>';
  const storeMap={};
  records.filter(r=>r.store).forEach(r=>{storeMap[r.store]=(storeMap[r.store]||{name:r.store,amt:0,count:0});storeMap[r.store].amt+=r.amount;storeMap[r.store].count++;});
  const stores=Object.values(storeMap).sort((a,b)=>b.amt-a.amt).slice(0,5);
  document.getElementById('storeRankList').innerHTML=stores.length
    ? stores.map((d,i)=>`<div class="rank-item"><div class="rank-badge ${rbClass(i)}">${i+1}</div><div><div class="rank-name-text">🏪 ${d.name}</div><div class="rank-count-text">${d.count} 次消費</div></div><div class="rank-amt">$${d.amt}</div></div>`).join('')
    : '<div class="empty-state" style="padding:16px">記錄店名後即可查看排行</div>';
}

// Init
renderRecords();