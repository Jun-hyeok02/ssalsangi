(() => {
 const api=window.MapleLedger, N=window.NexonBridge;
 const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const f=v=>Number(v||0).toLocaleString('ko-KR',{maximumFractionDigits:2});
 const attempts=new Map();
 const busy=new Set(), messages=new Map(), extras=new Map();
 let shown='';
 const drawer=document.querySelector('.character-drawer');
 const panel=document.createElement('details');panel.className='nexon-character-panel';
 drawer.querySelector('.character-drawer-body').prepend(panel);
 const date=v=>v?new Date(v).toLocaleString('ko-KR'):'아직 갱신하지 않음';
 function draw(id=shown) {
  shown=id;const c=api.getData().characters.find(c=>c.id===id);if(!c)return;
  panel.dataset.character=id;
  const n=c.nexon||{},stats=api.characterStats(id),url=new URL('https://maplescouter.com/ko/result');url.searchParams.set('name',c.nickname||c.name);
  const remaining=stats.records.filter(r=>r.type==='boss'&&r.bossId!=='black-mage'&&!api.bossIncomeEnabled(r));
  const body=extras.get(id)||'';
  panel.innerHTML=`<summary>캐릭터 상세 · API 정보 / 남은 보스 <span>${stats.total-stats.completed}개</span></summary><div class="nexon-profile">${n.image?`<img class="nexon-avatar" src="${E(n.image)}" alt="${E(c.name)} 게임 캐릭터">`:''}<div><b>${E(c.name)}</b><p>Lv.${c.level||'—'} · ${E(JobCatalog.get(c.job).name)} · ${E(n.world||'월드 미연결')}</p><small>길드 ${E(n.guild||'—')}${n.expRate?` · 경험치 ${E(n.expRate)}%`:''}</small></div></div><div class="nexon-actions"><button type="button" class="button" data-nexon-sync="${E(id)}" ${busy.has(id)?'disabled':''}>${busy.has(id)?'갱신 중…':n.ocid?'캐릭터 정보 갱신':'닉네임으로 API 연결'}</button><a class="button" href="${E(url.href)}" target="_blank" rel="noopener noreferrer">환산주스탯에서 확인 ↗</a></div><p class="nexon-status" role="status">${E(messages.get(id)||'자동 완료 연결은 API 키 소유 계정의 캐릭터만 지원합니다. 수동 체크는 우선 유지됩니다.')}</p><small class="nexon-times">기본 정보 ${E(date(n.basicUpdatedAt))}<br>보스 확인 ${E(date(n.bossUpdatedAt))}</small><div class="nexon-income"><span>현재 수익 <b>${f(stats.current)}억</b></span><span>남은 결정 <b>${f(stats.remaining)}억</b></span><span>모두 완료 시 <b>${f(stats.current+stats.remaining)}억</b></span></div><details class="remaining-bosses"><summary>이번 주 남은 보스 · ${remaining.length}개</summary><ul>${remaining.map(r=>`<li><span>${E(api.bosses.find(b=>b.id===r.bossId)?.name)} · ${E(r.difficulty)} · ${r.partySize}인</span><b>+${f(r.amount)}억</b></li>`).join('')||'<li>등록한 주간 보스를 모두 완료했습니다.</li>'}</ul></details>${n.ocid?`<div class="nexon-detail-buttons">${[['stat','스탯 · 어빌리티'],['equipment','장비 · 심볼'],['hexa','V · HEXA'],['union','유니온']].map(([key,label])=>`<button type="button" data-nexon-details="${key}" data-nexon-character="${E(id)}">${label}</button>`).join('')}</div><div class="nexon-extras">${body}</div>`:''}<small class="nexon-credit">Data based on NEXON Open API · 장비/스탯은 API 조회 기준 정보입니다.</small>`;
 }
 async function sync(id) {
  const c=api.getData().characters.find(c=>c.id===id);if(!c||busy.has(id))return;
  busy.add(id);attempts.set(id,Date.now());messages.set(id,'기본 정보와 보스 완료 정보를 확인하고 있습니다.');if(shown===id)draw();
  try {
   let basic;
   if(c.nexon?.ocid){const r=await N.request('basic',{ocid:c.nexon.ocid});basic={...r.data,ocid:c.nexon.ocid,fetchedAt:r.fetchedAt};}
   else basic=await N.lookup(c.name);
   if(typeof basic.character_name!=='string'||!basic.character_name||!Number.isFinite(basic.character_level))throw new Error('기본 정보 응답을 확인하지 못했습니다.');
   if(api.getData().characters.some(other=>other.id!==id&&other.nexon?.ocid===basic.ocid))throw new Error('이미 연결된 캐릭터입니다. 중복 연결하지 않았습니다.');
   if(!api.getData().characters.includes(c))return;
   const oldBossTime=c.nexon?.bossUpdatedAt;
   Object.assign(c,N.profile(basic));c.nexon.bossUpdatedAt=oldBossTime||'';api.save();
   // Keep the current view; confirmed live boss data is assigned to the actual current period.
   api.render();
   try {
    const r=await N.request('scheduler',{ocid:c.nexon.ocid});
    if(!Array.isArray(r.data?.boss_contents)||typeof r.data.date!=='string')throw new Error('보스 진행 정보가 아직 준비되지 않았습니다.');
    if(r.data.date.slice(0,10)!==api.localDateKey(new Date()))throw new Error('오늘의 보스 정보가 아직 준비되지 않았습니다. 기존 완료 기록은 유지됩니다.');
    api.prepareSync();
    const count=N.mergeScheduler(c,r.data,api.bosses,api.weekStartKey,api.localDateKey(new Date()));
    c.nexon.bossUpdatedAt=r.fetchedAt;messages.set(id,`정보 갱신 완료 · 보스 ${count}개 완료 확인. 수동 설정은 유지됩니다.`);
   } catch(e) {messages.set(id,'기본 정보 갱신 완료 · '+e.message);}
   api.save();api.render();
  } catch(e) {messages.set(id,e.message);}
  finally {busy.delete(id);if(shown===id)draw();}
 }
 const row=(name,value)=>`<li><span>${E(name)}</span><b>${E(value??'—')}</b></li>`;
 const list=items=>`<ul class="nexon-data-list">${items.join('')||'<li>조회 가능한 정보가 없습니다.</li>'}</ul>`;
 function format(kind,d) {
  try { return formatData(kind,d); } catch (_) { return '<p>이 정보는 아직 준비되지 않았습니다. 다른 조회와 정산은 계속 사용할 수 있습니다.</p>'; }
 }
 function formatData(kind,d) {
  if (!d || typeof d !== 'object') return '<p>정보가 아직 준비되지 않았습니다.</p>';
  const A=v=>Array.isArray(v)?v:[];
  if(kind==='stat')return list(A(d.final_stat).map(s=>row(s.stat_name,s.stat_value)));
  if(kind==='ability')return list(A(d.ability_info).map(s=>row(s.ability_grade,s.ability_value)));
  if(kind==='hyper')return list(A(d['hyper_stat_preset_'+(d.use_preset_no||1)]).map(s=>row(s.stat_type,`Lv.${s.stat_level??0} · ${s.stat_increase||''}`)));
  if(kind==='equipment')return A(d.item_equipment).map(s=>`<details class="nexon-equipment"><summary>${E(s.item_equipment_slot)} · ${E(s.item_name)} ${E(s.starforce)}★</summary>${list([row('등급',s.potential_option_grade),...['potential_option_1','potential_option_2','potential_option_3','additional_potential_option_1','additional_potential_option_2','additional_potential_option_3'].filter(k=>s[k]).map(k=>row('잠재능력',s[k])),...Object.entries(s.item_total_option||{}).filter(([,v])=>v&&v!=='0').map(([k,v])=>row(({str:'STR',dex:'DEX',int:'INT',luk:'LUK',attack_power:'공격력',magic_power:'마력',boss_damage:'보스 데미지',ignore_monster_armor:'방어율 무시',all_stat:'올스탯',max_hp:'HP',max_mp:'MP',damage:'데미지',equipment_level_decrease:'레벨 감소',speed:'이동속도',jump:'점프력',armor:'방어력'})[k]||'추가 능력치',v))])}</details>`).join('')||'<p>장비 정보가 없습니다.</p>';
  if(kind==='symbols')return list([...A(d.symbol)].map(s=>row(s.symbol_name,`Lv.${s.symbol_level} · ${s.symbol_force}`)));
  if(kind==='vmatrix')return list(A(d.character_v_core_equipment).map(s=>row(s.v_core_name,`Lv.${s.v_core_level}`)));
  if(kind==='hexa')return list(A(d.character_hexa_core_equipment).map(s=>row(s.hexa_core_name,`Lv.${s.hexa_core_level}`)));
  if(kind==='hexastat')return list(['character_hexa_stat_core','character_hexa_stat_core_2','character_hexa_stat_core_3'].flatMap(k=>A(d[k]).map(s=>row(s.main_stat_name,`Lv.${s.main_stat_level} · ${s.sub_stat_name_1||''} Lv.${s.sub_stat_level_1??0} · ${s.sub_stat_name_2||''} Lv.${s.sub_stat_level_2??0}`))));
  if(kind==='union')return list([row('유니온 레벨',d.union_level),row('등급',d.union_grade),row('아티팩트 레벨',d.union_artifact_level)]);
  if(kind==='artifact')return list(A(d.union_artifact_crystal).map(s=>row(s.name,`Lv.${s.level}`)));
  if(kind==='champion')return list(A(d.union_champion).map(s=>row(s.champion_name,`${s.champion_class} · ${s.champion_grade}`)));
  return '';
 }
 const groups={stat:[['stat','전투 스탯'],['ability','어빌리티'],['hyper','하이퍼스탯']],equipment:[['equipment','장착 장비'],['symbols','심볼']],hexa:[['vmatrix','V 매트릭스'],['hexa','HEXA 매트릭스'],['hexastat','HEXA 스탯']],union:[['union','유니온'],['artifact','아티팩트'],['champion','챔피언']]};
 document.addEventListener('click',async e=>{
  const all=e.target.closest('[data-nexon-sync-all]');if(all){all.disabled=true;for(const c of api.getData().characters.filter(c=>c.nexon?.ocid))await sync(c.id);all.disabled=false;return;}
  const button=e.target.closest('[data-nexon-sync]');if(button){await sync(button.dataset.nexonSync);return;}
  const detail=e.target.closest('[data-nexon-details]');if(!detail)return;
  const id=detail.dataset.nexonCharacter,c=api.getData().characters.find(c=>c.id===id);if(!c?.nexon?.ocid)return;
  detail.disabled=true;detail.setAttribute('aria-busy','true');
  const sections=groups[detail.dataset.nexonDetails];
  const results=await Promise.allSettled(sections.map(([kind])=>N.request(kind,{ocid:c.nexon.ocid})));
  extras.set(id,sections.map(([kind,label],i)=>`<details open><summary>${label}</summary>${results[i].status==='fulfilled'?format(kind,results[i].value.data):`<p>${E(results[i].reason.message)}</p>`}</details>`).join(''));if(shown===id)draw();
 });
 window.addEventListener('nexon-drawer',e=>{
  const changed=shown!==e.detail;draw(e.detail);
  const c=api.getData().characters.find(c=>c.id===e.detail);
  if(changed){panel.open=false;if(c?.nexon?.ocid && Date.now()-Math.max(attempts.get(c.id)||0,new Date(c.nexon.bossUpdatedAt||0).getTime())>60000) sync(c.id);}
 });
 drawer.addEventListener('close',()=>{shown='';panel.open=false;});
 document.addEventListener('error',e=>{if(e.target.matches?.('.actual-character,.nexon-avatar'))e.target.hidden=true;},true);
 const lookup=document.getElementById('nexon-lookup'),status=document.getElementById('nexon-lookup-status');
 document.getElementById('character-name-input').addEventListener('input',()=>{N.draft=null;});
 lookup.addEventListener('click',async()=>{
  const name=document.getElementById('character-name-input').value.trim();if(!name){status.textContent='닉네임을 먼저 입력해주세요.';return;}
  lookup.disabled=true;status.textContent='캐릭터 정보를 불러오는 중…';
  try{const basic=await N.lookup(name);if(document.getElementById('character-name-input').value.trim()!==name)return;N.draft=basic;const p=N.profile(basic);document.getElementById('character-name-input').value=p.name;const job=document.getElementById('character-job-input');job.value=p.job;job.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('character-level-input').value=p.level;status.textContent=`${p.name} · Lv.${p.level} · ${basic.character_class} · ${p.nexon.world} 불러왔습니다. 보스 설정 후 추가하기를 누르세요.`;}
  catch(e){status.textContent=e.message;}finally{lookup.disabled=false;}
 });
 window.NexonUI={sync,draw};
})();
