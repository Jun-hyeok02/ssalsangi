/* Central Korean MapleStory job and local illustration catalog.
 * Bundled official artwork: assets/jobs/<id>.jpg; provenance in sources.json.
 * All illustrations are loaded locally. */
(() => {
  const groups = {
    '모험가': [['hero','히어로'],['paladin','팔라딘'],['darkknight','다크나이트'],['firepoison','아크메이지(불,독)'],['icelightning','아크메이지(썬,콜)'],['bishop','비숍'],['bowmaster','보우마스터'],['marksman','신궁'],['pathfinder','패스파인더'],['nightlord','나이트로드'],['shadower','섀도어'],['dualblade','듀얼블레이드'],['viper','바이퍼'],['captain','캡틴'],['cannoneer','캐논슈터']],
    '시그너스': [['dawnwarrior','소울마스터'],['mihile','미하일'],['blazewizard','플레임위자드'],['windarcher','윈드브레이커'],['nightwalker','나이트워커'],['thunderbreaker','스트라이커']],
    '영웅': [['aran','아란'],['evan','에반'],['luminous','루미너스'],['mercedes','메르세데스'],['phantom','팬텀'],['shade','은월']],
    '레지스탕스': [['demonslayer','데몬슬레이어'],['demonavenger','데몬어벤져'],['blaster','블래스터'],['battlemage','배틀메이지'],['wildhunter','와일드헌터'],['mechanic','메카닉'],['xenon','제논']],
    '노바': [['kaiser','카이저'],['kain','카인'],['cadena','카데나'],['angelicbuster','엔젤릭버스터']],
    '레프': [['adele','아델'],['illium','일리움'],['khali','칼리'],['ark','아크']],
    '아니마': [['lara','라라'],['hoyoung','호영'],['ren','렌'],['lete','레테']],
    '기타': [['zero','제로'],['kinesis','키네시스']]
  };
  const colors = ['#a695ff','#6ed3ef','#ff93cc','#80d6b1','#ffc674'];
  const jobs = Object.entries(groups).flatMap(([group, list]) => list.map(([id, name], i) => ({ id, name, group, background: `assets/jobs/${id}.jpg`, accent: colors[i % colors.length] })));
  const catalog = Object.fromEntries(jobs.map(job => [job.id, job]));
  const resolved = new Map();
  const pending = new Set();
  const fallback = 'assets/jobs/default.svg';
  function get(value) { return catalog[value] || jobs.find(job => job.name === value) || { id: '', name: '직업 미설정', accent: '#9da9d4', background: fallback }; }
  function options(value = '') {
    return '<option value="">직업 선택</option>' + Object.entries(groups).map(([group, list]) => `<optgroup label="${group}">${list.map(([id, name]) => `<option value="${id}" ${get(value).id === id ? 'selected' : ''}>${name}</option>`).join('')}</optgroup>`).join('');
  }
  function background(value) { return new URL(resolved.get(get(value).id) || fallback, document.baseURI).href; }
  function preload(value) {
    const job = get(value);
    if (!job.id || pending.has(job.id) || resolved.has(job.id)) return;
    pending.add(job.id);
    const paths = [job.background, ...['webp','png'].map(ext => `assets/jobs/${job.id}.${ext}`)];
    let index = 0;
    const tryNext = () => {
      if (index >= paths.length) { resolved.set(job.id, fallback); pending.delete(job.id); return; }
      const path = paths[index++];
      const image = new Image();
      image.onload = () => { resolved.set(job.id, path); pending.delete(job.id); window.dispatchEvent(new CustomEvent('job-asset-ready', { detail: job.id })); };
      image.onerror = tryNext;
      image.src = path;
    };
    tryNext();
  }
  function normalize(character) {
    const nickname = String(character.nickname ?? character.name ?? '이름 없는 캐릭터').slice(0, 24);
    const n = Number(character.level);
    return { name: nickname, nickname, job: get(character.job).id, level: Number.isFinite(n) && n >= 1 && n <= 300 ? Math.floor(n) : null };
  }
  window.JobCatalog = { jobs, get, options, background, preload, normalize, fallback };
})();
