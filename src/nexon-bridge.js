(() => {
 const trueFlag=v=>v===true||v==='true';
 const text=v=>typeof v==='string'?v.slice(0,200):'';
 const safeImage=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname==='open.api.nexon.com'&&u.pathname.startsWith('/static/maplestory/character/')?u.href:'';}catch{return '';}};
 function normalize(character, bosses, items) {
  const raw=character.nexon, nexon=raw&&typeof raw==='object'?{ocid:/^[a-f\d]{16,80}$/i.test(raw.ocid||'')?raw.ocid:'',world:text(raw.world),image:safeImage(raw.image),guild:text(raw.guild),expRate:text(String(raw.expRate??'')),basicUpdatedAt:text(raw.basicUpdatedAt),bossUpdatedAt:text(raw.bossUpdatedAt)}:null;
  const sources={};
  if(character.completionSources&&typeof character.completionSources==='object') {
   for(const [period,values] of Object.entries(character.completionSources)) if(/^(week:\d{4}-\d{2}-\d{2}|month:\d{4}-\d{2})$/.test(period)&&values&&typeof values==='object') {
    sources[period]={};for(const boss of bosses) if(['manual','nexon_api'].includes(values[boss.id])) sources[period][boss.id]=values[boss.id];
   }
  } else {
   // Existing explicit checks (including cancellations) have manual priority.
   for(const record of items.filter(r=>r.type==='boss'&&r.bossId)) {
    const monthly=record.bossId==='black-mage', month=record.settlementMonth||record.weekStart?.slice(0,7);
    const period=monthly?'month:'+month:'week:'+record.weekStart;
    if(monthly?character.blackMageCompletedMonths?.[month]:typeof character.completedBosses?.[record.weekStart]?.[record.bossId]==='boolean'||character.bossCompletedWeeks?.[record.weekStart]) (sources[period]||={})[record.bossId]='manual';
   }
  }
  return {nexon,completionSources:sources};
 }
 const periodFor=record=>record.bossId==='black-mage'?'month:'+(record.settlementMonth||record.weekStart.slice(0,7)):'week:'+record.weekStart;
 function manual(character,record) {(character.completionSources||={})[periodFor(record)]||={};character.completionSources[periodFor(record)][record.bossId]='manual';}
 function source(character,record) {return character.completionSources?.[periodFor(record)]?.[record.bossId]||'manual';}
 function mergeScheduler(character,response,bosses,weekStart,today) {
  if(!response||!Array.isArray(response.boss_contents)||!/^\d{4}-\d{2}-\d{2}/.test(response.date||'')) return 0;
  const date=response.date.slice(0,10);
  // Live synchronization only: stale snapshots must never complete a new week/month.
  if(date!==today) return 0;
  const week=weekStart(date), month=date.slice(0,7), normalizeName=s=>String(s||'').replace(/\s/g,'');
  const difficulties={easy:'이지',normal:'노멀',hard:'하드',chaos:'카오스',extreme:'익스트림','노말':'노멀'};
  let changed=0;
  for(const entry of response.boss_contents) {
   if(!trueFlag(entry.complete_flag)) continue;
   const boss=bosses.find(b=>normalizeName(b.name)===normalizeName(entry.content_name));
   if(!boss) continue;
   const difficulty=difficulties[String(entry.difficulty).toLowerCase()]||entry.difficulty;
   const monthly=Boolean(boss.period), cycle=String(entry.cycle||'').toLowerCase();
   if(!cycle.includes(monthly?'month':'week')&&!cycle.includes(monthly?'월':'주')) continue;
   const record=character.items.find(r=>r.bossId===boss.id&&r.difficulty===difficulty&&(monthly?(r.settlementMonth||r.weekStart?.slice(0,7))===month:r.weekStart===week));
   if(!record) continue; // Do not infer a boss preset or a party size.
   const period=periodFor(record);
   if(character.completionSources?.[period]?.[record.bossId]==='manual') continue;
   if(monthly) (character.blackMageCompletedMonths||={})[month]=record.id;
   else ((character.completedBosses||={})[week]||={})[record.bossId]=true;
   ((character.completionSources||={})[period]||={})[record.bossId]='nexon_api';
   // Scheduler confirms period completion, not the precise clear date.
   changed++;
  }
  return changed;
 }
 const requests=new Map();
 async function request(kind,params) {
  if(location.protocol==='file:') throw new Error('API 연동은 Netlify에 배포한 주소에서 사용할 수 있습니다. 수동 입력은 계속 사용할 수 있습니다.');
  const url=new URL('/.netlify/functions/nexon',location.origin);url.searchParams.set('kind',kind);
  Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
  if(requests.has(url.href)) return requests.get(url.href);
  const task=(async()=>{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});let body;try{body=await r.json();}catch{throw new Error('캐릭터 연동 서버를 확인해주세요. 기존 기록은 유지됩니다.');}if(!r.ok)throw new Error(body.error||'조회에 실패했습니다.');return body;})();
  requests.set(url.href,task);try{return await task;}finally{requests.delete(url.href);}
 }
 async function lookup(name) {
  const identity=await request('id',{name:name.trim()});
  if(!/^[a-f\d]{16,80}$/i.test(identity.data?.ocid||'')) throw new Error('캐릭터 식별자를 확인하지 못했습니다.');
  const basic=await request('basic',{ocid:identity.data.ocid});
  if(typeof basic.data?.character_name!=='string'||!basic.data.character_name||!Number.isFinite(basic.data.character_level))throw new Error('기본 정보가 아직 준비되지 않았습니다.');
  return {...basic.data,ocid:identity.data.ocid,fetchedAt:basic.fetchedAt};
 }
 function profile(basic) {
  const canonical=s=>String(s).replace(/[\s,]/g,'');
  const job=JobCatalog.jobs.find(j=>canonical(j.name)===canonical(basic.character_class||''));
  return {name:basic.character_name,nickname:basic.character_name,job:job?.id||'',level:basic.character_level,nexon:{ocid:basic.ocid,world:text(basic.world_name),image:safeImage(basic.character_image),guild:text(basic.character_guild_name),expRate:String(basic.character_exp_rate??''),basicUpdatedAt:basic.fetchedAt,bossUpdatedAt:''}};
 }
 window.NexonBridge={normalize,manual,source,mergeScheduler,request,lookup,profile,safeImage};
})();
