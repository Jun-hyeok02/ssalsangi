const endpoints = Object.freeze({
 id:'id',basic:'character/basic',stat:'character/stat',equipment:'character/item-equipment',ability:'character/ability',hyper:'character/hyper-stat',vmatrix:'character/vmatrix',hexa:'character/hexamatrix',hexastat:'character/hexamatrix-stat',symbols:'character/symbol-equipment',union:'user/union',artifact:'user/union-artifact',champion:'user/union-champion',scheduler:'scheduler/character-state'
});
const cache=new Map(), pending=new Map(), limits=new Map();
let queue=Promise.resolve();
const response=(status,body)=>({statusCode:status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},body:JSON.stringify(body)});
exports.handler=async event=>{
 if(event.httpMethod!=='GET') return response(405,{error:'GET 요청만 가능합니다.'});
 const q=event.queryStringParameters||{}, kind=q.kind;
 if(!Object.hasOwn(endpoints,kind)) return response(400,{error:'지원하지 않는 조회입니다.'});
 const identifier=kind==='id'?q.name:q.ocid;
 if(typeof identifier!=='string'|| !(kind==='id'?/^[가-힣A-Za-z0-9]{1,24}$/:/^[a-fA-F0-9]{16,80}$/).test(identifier)) return response(400,{error:'캐릭터 이름 또는 식별자를 확인해주세요.'});
 const key=process.env.NEXON_API_KEY;
 if(!key) return response(503,{error:'캐릭터 연동이 아직 설정되지 않았습니다. 수동 등록은 계속 사용할 수 있습니다.',code:'NOT_CONFIGURED'});
 if(kind==='scheduler' && !(process.env.NEXON_SCHEDULER_OCIDS||'').split(',').map(s=>s.trim()).includes(identifier)) return response(403,{error:'이 캐릭터는 자동 완료 연결 대상이 아닙니다. 수동 완료를 이용해주세요.',code:'SCHEDULER_SCOPE'});
 const ip=event.headers?.['x-nf-client-connection-ip']||'local', now=Date.now();
 for(const [k,v] of limits) if(now-v.start>60000) limits.delete(k);
 const budget=limits.get(ip)||{start:now,count:0}; budget.count++; limits.set(ip,budget);
 if(budget.count>50) return response(429,{error:'잠시 후 다시 갱신해주세요.'});
 const cacheKey=kind+':'+identifier, ttl=kind==='id'?86400000:kind==='scheduler'?15000:300000;
 const saved=cache.get(cacheKey);
 if(saved&&now-saved.time<ttl) return response(200,{data:saved.data,cached:true,fetchedAt:saved.at});
 if(!pending.has(cacheKey)) {
  const task=queue.catch(()=>{}).then(async()=>{
   // Conservative pace for development keys. Platform quota remains authoritative across instances.
   await new Promise(r=>setTimeout(r,220));
   const url=new URL('https://open.api.nexon.com/maplestory/v1/'+endpoints[kind]);
   url.searchParams.set(kind==='id'?'character_name':'ocid',identifier);
   const result=await fetch(url,{headers:{'x-nxopen-api-key':key},signal:AbortSignal.timeout(10000)});
   if(!result.ok) {const failure=new Error('UPSTREAM');failure.status=result.status;throw failure;}
   const data=await result.json();
   if(!data||typeof data!=='object'||Array.isArray(data)) throw new Error('SCHEMA');
   const entry={data,time:Date.now(),at:new Date().toISOString()};
   if(cache.size>=500) cache.delete(cache.keys().next().value);
   cache.set(cacheKey,entry);return entry;
  });
  pending.set(cacheKey,task);queue=task.catch(()=>{});
 }
 try {const entry=await pending.get(cacheKey);return response(200,{data:entry.data,cached:false,fetchedAt:entry.at});}
 catch(e){return response(e.status===429?429:e.status===403?403:e.status===400?400:502,{error:e.status===429?'조회 한도에 도달했습니다. 잠시 후 다시 시도해주세요.':e.status===403?'조회 권한이 없습니다. 수동 완료를 이용해주세요.':e.status===400?'캐릭터 정보를 찾지 못했습니다. 이름과 공개 설정을 확인해주세요.':'일시적으로 정보를 가져올 수 없습니다. 기존 기록은 유지됩니다.'});}
 finally {pending.delete(cacheKey);}
};
