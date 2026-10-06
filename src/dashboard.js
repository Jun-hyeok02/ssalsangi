/* Dashboard is a view over the existing ledger engine; it does not store a second ledger. */
window.createDashboard = function (api) {
  const $ = selector => document.querySelector(selector);
  const E = api.esc;
  // Presentation only: leave ledger values and the detailed formatter untouched.
  const formatEok = value => Number(value || 0).toLocaleString('ko-KR', {maximumFractionDigits:2, minimumFractionDigits:0});
  const money = value => `${formatEok(value)}<small>억</small>`;
  const excludedDropItems = new Set(['뒤틀린 갈망의 편린', '왜곡된 욕망의 결정', '영원한 충성의 흔적']);
  const isNoteworthyDrop = name => api.getData().settings.lootPriceUnits?.[name] !== 'man' && !excludedDropItems.has(name);
  let page = 'home', filter = 'all', selected = '', chartSerial = 0;
  let previousSelection = '', drawerCharacter = '';
  let weeklyGraphOpen;
  document.addEventListener('toggle', event => { if (event.target.matches?.('details.weekly-graphs') && event.target.isConnected) weeklyGraphOpen = event.target.open; }, true);
  const main = $('.shell');
  const oldHero = $('.hero');
  const ledger = $('.loot-ledger');
  const periods = $('.period-controls');
  const settingsTabs = $('.settings-tabs');
  const rates = $('#rates-settings');
  const prices = $('#loot-settings');
  const summaries = $('.summary-grid');
  const characters = $('#character-grid').parentElement;
  const hunting = $('.hunt-editor');
  const homePriceToggle = $('#show-loot-prices').closest('.loot-price-toggle');
  const footer = $('.footer');
  const drawer = document.createElement('dialog');
  drawer.className = 'character-drawer';
  drawer.setAttribute('aria-labelledby', 'character-drawer-title');
  drawer.innerHTML = '<header class="character-drawer-head"><div><span class="kicker">QUICK SETTLEMENT</span><h2 id="character-drawer-title"></h2><p id="character-drawer-period"></p></div><button type="button" class="drawer-close" aria-label="캐릭터 정산 닫기">×</button></header><div class="drawer-period-controls"><button type="button" data-dashboard-week="-7">‹ 지난주</button><span id="character-drawer-week"></span><button type="button" data-dashboard-week="7">다음주 ›</button></div><div class="drawer-month-controls"><span>검마 월간 정산</span><button type="button" data-dashboard-month="-1" aria-label="검마 지난달">‹</button><b id="drawer-selected-month"></b><button type="button" data-dashboard-month="1" aria-label="검마 다음달">›</button></div><details class="drawer-profile"><summary>캐릭터 정보 수정 · 닉네임 / 직업 / 레벨</summary><div class="drawer-profile-fields"><label class="drawer-nickname">닉네임<input data-field="character-name" maxlength="24" aria-label="캐릭터 닉네임"></label><label>직업<select data-character-job aria-label="캐릭터 직업"></select></label><label>레벨<input data-character-level type="number" min="1" max="300" step="1" placeholder="미입력" aria-label="캐릭터 레벨"></label></div></details><nav class="drawer-section-nav" aria-label="정산 영역 바로가기"><button type="button" data-drawer-jump="weekly" aria-controls="drawer-ledger-body" aria-pressed="true">주간 보스 ↑</button><button type="button" data-drawer-jump="monthly" aria-controls="drawer-ledger-body" aria-pressed="false">검은 마법사 ↓</button></nav><div class="character-drawer-body" id="drawer-ledger-body"></div>';
  document.body.append(drawer);
  function syncDrawer() {
    if (!drawer.open) return;
    const character = api.getData().characters.find(c => c.id === drawerCharacter);
    if (!character) { drawer.close(); return; }
    $('#character-drawer-title').textContent = character.name;
    const profile = drawer.querySelector('.drawer-profile');
    const jobField = profile.querySelector('[data-character-job]');
    const levelField = profile.querySelector('[data-character-level]');
    const nicknameField = profile.querySelector('[data-field="character-name"]');
    if (document.activeElement !== nicknameField) nicknameField.value = character.name;
    if (profile.dataset.character !== character.id) {
      profile.open = false;
      profile.dataset.character = character.id;
      jobField.innerHTML = JobCatalog.options(character.job);
    }
    if (document.activeElement !== jobField) jobField.value = character.job || '';
    if (document.activeElement !== levelField) levelField.value = character.level || '';
    window.dispatchEvent(new CustomEvent('nexon-drawer', {detail:character.id}));
    const view = api.getView();
    $('#character-drawer-period').textContent = `${JobCatalog.get(character.job).name} · 검은 마법사 ${view.blackMageMonth}`;
    $('#character-drawer-week').textContent = '주간 정산 · ' + api.weekRangeLabel(view.week);
    $('#drawer-selected-month').textContent = view.blackMageMonth;
    const group = [...ledger.querySelectorAll('[data-ledger-character]')].find(node => node.dataset.character === drawerCharacter);
    if (group) { group.open = true; group.querySelector('[data-action="collapse-ledger"]').textContent = '정산 닫기'; }
  }
  function jumpDrawer(section, behavior = 'smooth') {
    const body = drawer.querySelector('.character-drawer-body');
    const group = [...ledger.querySelectorAll('[data-ledger-character]')].find(node => node.dataset.character === drawerCharacter);
    const destination = section === 'monthly' ? group?.querySelector('.ledger-monthly-section') : null;
    const top = destination ? destination.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 8 : 0;
    body.scrollTo({top:Math.max(0,top),behavior});
    drawer.querySelectorAll('[data-drawer-jump]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.drawerJump === section)));
  }
  drawer.addEventListener('click', event => {
    const jump = event.target.closest('[data-drawer-jump]');
    if (jump) jumpDrawer(jump.dataset.drawerJump);
  });
  function openDrawer(id) {
    previousSelection = selected;
    drawerCharacter = id;
    selected = id;
    render();
    drawer.querySelector('.character-drawer-body').append(ledger);
    drawer.showModal();
    syncDrawer();
    jumpDrawer('weekly', 'instant');
    drawer.querySelector('.drawer-close').focus({preventScroll:true});
  }
  drawer.querySelector('.drawer-close').addEventListener('click', () => drawer.close());
  drawer.addEventListener('click', event => {
    if (event.target === drawer) {
      const bounds = drawer.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) drawer.close();
    }
  });
  drawer.addEventListener('click', event => {
    if (event.target.closest('[data-action="collapse-ledger"]')) { event.preventDefault(); event.stopPropagation(); drawer.close(); }
  }, true);
  drawer.addEventListener('close', () => {
    const id = drawerCharacter;
    ledger.querySelectorAll('[data-action="collapse-ledger"]').forEach(button => button.textContent = '⌃ 캐릭터 정산 접기');
    $('#ledger-storage').append(ledger);
    selected = previousSelection; drawerCharacter = '';
    render();
    const card = [...$('#page-home').querySelectorAll('.game-character')].find(node => node.dataset.selectCharacter === id);
    if (page === 'home') card?.focus({preventScroll:true});
  });
  const shell = document.createElement('div');
  shell.className = 'portal-pages';
  shell.innerHTML = `<section id="page-home" class="portal-page"></section><div id="ledger-storage" hidden></div><section id="page-stats" class="portal-page" hidden><div class="page-heading"><div><span class="kicker">ACCOUNT REPORT</span><h2>수익 통계</h2></div></div><div id="stats-dashboard"></div></section><section id="page-settings" class="portal-page" hidden><div class="page-heading"><div><span class="kicker">SETTINGS</span><h2>시세 · 물욕템 가격 설정</h2></div></div></section>`;
  main.insertBefore(shell, footer);
  $('#ledger-storage').append(periods, ledger);
  // Keep the live input nodes mounted while the dashboard summaries re-render.
  $('#page-home').innerHTML = '<div id="home-before-hunting"></div><div class="home-workspace"><div id="home-character-slot"></div><aside id="home-hunting-slot" aria-label="일일 사냥 수익 입력"></aside></div><div id="home-after-hunting"></div>';
  $('#home-hunting-slot').append(hunting);
  hunting.classList.add('home-hunt-editor');
  $('#hunt-character-grid').tabIndex = 0;
  $('#hunt-character-grid').setAttribute('aria-label', '사냥 수익 입력 · 좌우로 스크롤');
  const huntDateBox = $('#daily-date').closest('.period-box');
  huntDateBox.classList.add('home-hunt-date');
  $('#daily-date').setAttribute('aria-label', '사냥 입력 날짜');
  hunting.querySelector('.hunt-editor-heading h3').textContent = '일일 사냥 수익 입력';
  hunting.querySelector('.hunt-editor-heading').append(huntDateBox);
  $('#ledger-storage').append(summaries);
  $('#page-settings').append(rates, prices);
  $('#ledger-storage').append(settingsTabs, characters);
  const storageGuide = document.createElement('section');
  storageGuide.className = 'storage-guide';
  storageGuide.innerHTML = '<strong>이 브라우저에 자동 저장됩니다</strong><p>같은 브라우저에서는 다시 열어도 기록이 유지됩니다. 다른 기기·브라우저로 자동 동기화되지는 않습니다.</p><ol><li>현재 기기에서 위의 <b>백업 저장</b>을 눌러 JSON 파일을 저장하세요.</li><li>새 기기에서 사이트를 열고 <b>백업 불러오기</b>로 파일을 선택하세요.</li></ol><small>불러오기는 현재 기록을 백업 내용으로 바꿉니다. 브라우저 데이터 삭제 전에도 백업을 저장하세요.</small>';
  $('#page-settings').prepend(storageGuide);
  rates.hidden = false;
  prices.hidden = false;
  const dailyHuntSummary = $('#total-hunt').closest('article');
  $('#ledger-storage').append(dailyHuntSummary);
  oldHero.remove();
  const nav = document.createElement('nav');
  nav.className = 'portal-nav';
  nav.setAttribute('aria-label','주 메뉴');
  const links = [['home','⌂','홈'],['stats','▥','통계'],['settings','⚙','설정']];
  nav.innerHTML = links.map(([id, icon, name]) => `<button type="button" data-page="${id}" aria-controls="page-${id}"><span aria-hidden="true">${icon}</span>${name}</button>`).join('');
  $('.topbar').after(nav);
  const mobileNav = nav.cloneNode(true);
  mobileNav.className = 'portal-nav mobile-nav';
  document.body.append(mobileNav);
  $('.brand p').textContent = '메이플 수익 계산기';

  function charStats(character) {
    const records = api.entries(character,'boss').filter(record => record.bossId !== 'black-mage');
    const bosses = records.filter(record => record.bossId);
    const completed = bosses.filter(api.bossIncomeEnabled).length;
    const current = api.sum(records) + api.lootIncome(records);
    const remaining = bosses.filter(record => !api.bossIncomeEnabled(record)).reduce((total, record) => total + api.amount(record.amount), 0);
    const total = bosses.length;
    return { character, records, completed, total, current, remaining, percent: total ? Math.round(completed / total * 100) : 0, state: total && completed === total ? 'done' : completed ? 'active' : 'pending' };
  }
  function monthRecords(month) {
    return api.getData().characters.flatMap(character => character.items.filter(item => (item.bossId === 'black-mage' ? api.bossMonth(item) : String(item.type === 'hunt' ? item.date : item.weekStart).slice(0,7)) === month));
  }
  function totals(records) {
    const boss = api.sum(records.filter(record => record.type === 'boss'));
    const hunt = api.sum(records.filter(record => record.type === 'hunt'));
    const loot = api.lootIncome(records);
    return { boss, hunt, loot, total: boss+hunt+loot };
  }
  function lootRecords() {
    const result = [];
    for (const character of api.getData().characters) {
      for (const record of character.items.filter(item => item.bossId && api.bossIncomeEnabled(item))) {
        const names = [...new Set([...(record.lootIds || []), ...api.automaticRewards(record).map(reward=>reward.name)])];
        for (const original of names) {
          if (!api.showBossReward(original)) continue;
          const quantity = api.acquiredQuantity(record,original);
          if (!quantity) continue;
          const name = original === api.CHAOS_BLACK_BOX && record.blackBoxItem ? record.blackBoxItem : original;
          const material = api.rewardDefinitions(record.bossId,record.difficulty).some(reward=>reward.name === original);
          const value = api.lootPrice(name) * quantity / (material ? 1 : Math.max(1,record.partySize || 1));
          const month = record.bossId === 'black-mage' ? api.bossMonth(record) : String(record.weekStart).slice(0,7);
          const exactDate = record.lootDates?.[original] || record.completedDate || '';
          const dateLabel = exactDate || (record.bossId === 'black-mage' ? `${month} 월간 기록` : `${record.weekStart} 주간 기록`);
          result.push({ name, quantity, value, character, record, month, dateLabel, sortDate: exactDate || record.weekStart || `${month}-01`, material });
        }
      }
    }
    return result.sort((a,b)=>b.sortDate.localeCompare(a.sortDate));
  }
  function homeLootSummary(records, compact = false) {
    const grouped = new Map();
    for (const record of records) {
      if (!record.bossId || !api.bossIncomeEnabled(record)) continue;
      const names = [...new Set([...(record.lootIds || []), ...api.automaticRewards(record).map(reward => reward.name)])];
      for (const original of names) {
        if (!api.showBossReward(original)) continue;
        const name = original === api.CHAOS_BLACK_BOX && record.blackBoxItem ? record.blackBoxItem : original;
        if (!isNoteworthyDrop(name)) continue;
        const count = api.acquiredQuantity(record, original);
        if (!count) continue;
        const material = api.rewardDefinitions(record.bossId, record.difficulty).some(reward => reward.name === original);
        const partySize = material ? 0 : Math.max(1, Number(record.partySize) || 1);
        const key = `${name}|${partySize}`;
        const item = grouped.get(key) || {name, count:0, partySize};
        item.count += count; grouped.set(key, item);
      }
    }
    if (!grouped.size) return '<span class="item-summary-empty">획득 아이템 없음</span>';
    return `<span class="item-summary">${[...grouped.values()].map(item => {
      const price = api.lootPrice(item.name) * item.count;
      const party = item.partySize > 1 ? `<span class="item-summary-party">${item.partySize}명</span>` : '';
      const priceLabel = price ? (item.partySize > 1 ? `전체 ${formatEok(price)}억 · 내 몫 ${formatEok(price / item.partySize)}억` : `내 수익 ${formatEok(price)}억 메소`) : '가격 미설정';
      const compactPrice = price ? `${item.partySize > 1 ? '내 몫' : '내 수익'} ${formatEok(price / Math.max(1,item.partySize))}억` : '가격 미설정';
      const label = `${item.name} · ${item.count}개${item.partySize > 1 ? ` · ${item.partySize}명 파티` : ''}`;
      return `<span class="item-summary-token" title="${E(label)}${api.getData().settings.showLootPrices ? ` · ${priceLabel}` : ''}" aria-label="${E(label)}">${api.itemIcon(item.name)}<span class="item-summary-value"><b>×${item.count.toLocaleString('ko-KR')}${party}</b>${api.getData().settings.showLootPrices ? `<span class="item-summary-price">${compact ? compactPrice : priceLabel}</span>` : ''}</span></span>`;
    }).join('')}</span>`;
  }
  function progress(percent) { return `<div class="game-progress" role="progressbar" aria-label="보스 완료 진행률" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div>`; }
  function card(stat) {
    const c = stat.character, job = JobCatalog.get(c.job);
    JobCatalog.preload(c.job);
    const status = {done:'완료 ✓',active:'진행중',pending:'미진행'}[stat.state];
    const month = api.getView().blackMageMonth;
    const blackRecords = c.items.filter(item => item.bossId === 'black-mage' && api.bossMonth(item) === month);
    const blackDone = blackRecords.some(api.bossIncomeEnabled);
    const blackConfigured = blackRecords.length || c.bossPresets?.['black-mage']?.difficulty;
    const blackState = blackDone ? 'done' : blackConfigured ? 'pending' : 'unset';
    const blackLabel = blackDone ? '완료 ✓' : blackConfigured ? '미완료' : '미설정';
    return `<button class="game-character ${stat.state}" data-select-character="${E(c.id)}" style="--job-accent:${job.accent};--job-image:url('${JobCatalog.background(c.job)}')" aria-label="${E(c.name)} 빠른 정산 열기"><div class="character-art" aria-hidden="true"></div>${c.nexon?.image ? `<img class="actual-character" src="${E(c.nexon.image)}" alt="" loading="lazy">` : ""}<div class="character-identity">${c.level ? `<span class="character-level">Lv.${c.level}</span>` : ''}<strong title="${E(c.name)}">${E(c.name)}</strong><span>${E(job.name)}${c.nexon?.world ? ` · ${E(c.nexon.world)}` : ""}</span><b class="state-badge">${status}</b></div><div class="character-card-bottom"><div class="card-black-mage ${blackState}"><span>검은 마법사 · ${E(month)}</span><b>${blackLabel}</b></div><div class="card-progress-label"><span>보스</span><b>${stat.completed}<small> / ${stat.total}</small></b></div>${progress(stat.percent)}<div class="progress-percent">${stat.percent}%</div><div class="card-income"><span>이번 주 수익</span><strong>${money(stat.current)}</strong><small>${api.fmtWon(stat.current)}</small></div>${stat.remaining ? `<div class="remaining-income">남은 결정 수익 <b>${formatEok(stat.remaining)}억</b></div>` : '<div class="remaining-income empty-remaining" aria-hidden="true"></div>'}<div class="home-card-loot"><span class="home-loot-caption">이번 주 획득</span>${homeLootSummary(stat.records, true)}</div><span class="card-expected">모두 완료 시 ${formatEok(stat.current + stat.remaining)}억</span><span class="character-card-action">정산 열기 →</span></div></button>`;
  }
  function managedCard(stat) {
    const id = E(stat.character.id);
    return `<div class="game-character-wrapper">${card(stat)}<button class="home-character-remove" type="button" data-remove-character="${id}" aria-label="${E(stat.character.name)} 캐릭터 삭제" title="캐릭터 삭제">×</button></div>`;
  }
  function huntBreakdown(records) {
    const hunts = records.filter(record => record.type === 'hunt');
    const meso = hunts.reduce((sum, record) => sum + api.amount(record.amount), 0);
    const shards = hunts.reduce((sum, record) => sum + Math.max(0, Math.floor(Number(record.shards) || 0)), 0);
    return `(${formatEok(meso)}억 메소 + 조각 ${shards.toLocaleString('ko-KR')}개)`;
  }
  function weeklyPanel(stats, view) {
    const chartId = 'weekly-chart-' + (++chartSerial);
    const weekRecords = start => {
      const end = new Date(`${start}T12:00:00`);
      end.setDate(end.getDate() + 7);
      const endKey = api.localDateKey(end);
      return api.getData().characters.flatMap(character => character.items.filter(item =>
        item.type === 'hunt' ? item.date >= start && item.date < endKey : item.bossId !== 'black-mage' && item.weekStart === start));
    };
    const records = weekRecords(view.week);
    const result = totals(records);
    const remaining = stats.reduce((n, stat) => n + stat.remaining, 0);
    const completed = stats.reduce((n, stat) => n + stat.completed, 0);
    const count = stats.reduce((n, stat) => n + stat.total, 0);
    const percent = count ? Math.round(completed / count * 100) : 0;
    const history = Array.from({length:6}, (_, index) => {
      const date = new Date(`${view.week}T12:00:00`);
      date.setDate(date.getDate() + (index - 5) * 7);
      const key = api.localDateKey(date);
      const items = weekRecords(key);
      return {key, label:`${date.getMonth()+1}/${date.getDate()}`, value:totals(items).total};
    }).filter(point => weekRecords(point.key).length || point.key === view.week);
    const max = Math.max(1, ...history.map(point => point.value));
    const points = history.map((point, i) => [35 + i * (320 / Math.max(1, history.length - 1)), 125 - point.value / max * 98]);
    const line = points.map(([x,y]) => `${x},${y}`).join(' ');
    const chart = history.length > 1 ? `<svg class="income-chart" viewBox="0 0 390 170" role="img" aria-label="최근 6주 수익: ${history.map(point=>`${point.key} ${formatEok(point.value)}억`).join(', ')}"><defs><linearGradient id="${chartId}" x2="0" y2="1"><stop stop-color="#fa65be" stop-opacity=".35"/><stop offset="1" stop-color="#fa65be" stop-opacity="0"/></linearGradient></defs>${[30,75,125].map(y=>`<path d="M20 ${y}H375" stroke="#647493" stroke-dasharray="3 4" opacity=".3"/>`).join('')}<polygon points="35,125 ${line} 355,125" fill="url(#${chartId})"/><polyline points="${line}" fill="none" stroke="#f383d1" stroke-width="3"/>${points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="4" fill="#a7e4ff"/><text x="${x}" y="${Math.max(14,y-10)}" text-anchor="middle">${formatEok(history[i].value)}</text><text x="${x}" y="155" text-anchor="middle">${history[i].label}</text>`).join('')}</svg>` : '<div class="chart-empty">비교할 이전 기록이 아직 없습니다.<br>수익을 기록하면 추이 그래프가 표시됩니다.</div>';
    const weeklyShards = records.filter(record => record.type === 'hunt').reduce((sum, record) => sum + Math.max(0, Math.floor(Number(record.shards) || 0)), 0);
    const shares = [['보스 결정', result.boss, '#f47cbf'], ['사냥·조각', result.hunt, '#8bdaff'], ['물욕·재료', result.loot, '#ffc86d']];
    let offset = 0;
    const stops = shares.map(([,value,color]) => {
      const start = offset;
      offset += result.total ? value / result.total * 100 : 0;
      return `${color} ${start}% ${offset}%`;
    });
    return `<section class="game-panel week-panel week-revenue-panel"><div class="panel-heading"><h2>이번 주 현황</h2>${api.getData().characters.some(c=>c.nexon?.ocid) ? `<button type="button" data-nexon-sync-all>전체 캐릭터 갱신</button>` : ""}<span>${api.weekRangeLabel(view.week)}</span><div class="week-step"><button data-dashboard-week="-7" aria-label="지난주">‹</button><button data-dashboard-week="7" aria-label="다음주">›</button></div></div><div class="weekly-compact-total"><span>완료 수익</span><strong>${money(result.total)}</strong><small>${api.fmtWon(result.total)}</small></div><details class="weekly-graphs" ${(weeklyGraphOpen ?? (!matchMedia('(max-width:760px)').matches && history.length > 1)) ? 'open' : ''}><summary>수익 추이 · 구성 그래프</summary><div class="monthly-report"><div>${chart}<details class="chart-data"><summary>주별 수익 데이터</summary><table><thead><tr><th>주 시작</th><th>총 수익</th></tr></thead><tbody>${history.map(point=>`<tr><td>${point.key}</td><td>${formatEok(point.value)}억</td></tr>`).join('')}</tbody></table></details></div><div class="composition"><div class="income-donut" style="background:conic-gradient(${result.total ? stops.join(',') : '#36435c 0% 100%'})"><span>수익 구성<br><b>${formatEok(result.total)}억</b></span></div><ul>${shares.map(([name,value,color])=>`<li><i style="background:${color}"></i><span>${name}</span><b>${formatEok(value)}억${name === '사냥·조각' ? `<span class="hunt-breakdown">${huntBreakdown(records)}</span>` : ''}</b><small>${result.total ? Math.round(value/result.total*100) : 0}%</small></li>`).join('')}</ul></div></div></details><div class="week-completion-strip"><span>보스 완료 <b>${completed} / ${count}</b></span>${progress(percent)}<b>${percent}%</b><span>완료 결정 <b>${formatEok(result.boss)}억</b></span><span>남은 결정 수익 <b>${formatEok(remaining)}억</b></span><span>남은 보스 <b>${count-completed}개</b></span><span>모두 완료 시 <b>${formatEok(result.total+remaining)}억</b></span></div><div class="home-period-loot"><span class="home-loot-caption">이번 주 획득 아이템</span>${homeLootSummary(records.filter(record=>record.type === 'boss'))}</div></section>`;
  }
  function monthlyWeekTable(month) {
    const records = monthRecords(month);
    const [year, number] = month.split('-').map(Number);
    const first = new Date(year, number - 1, 1, 12);
    const next = new Date(year, number, 1, 12);
    const weekKey = dateKey => {
      const date = new Date(`${dateKey}T12:00:00`);
      date.setDate(date.getDate() - (date.getDay() + 3) % 7);
      return api.localDateKey(date);
    };
    const groups = new Map();
    const cursor = new Date(`${weekKey(api.localDateKey(first))}T12:00:00`);
    while (cursor < next) {
      groups.set(api.localDateKey(cursor), []);
      cursor.setDate(cursor.getDate() + 7);
    }
    const black = [];
    for (const record of records) {
      if (record.bossId === 'black-mage') { black.push(record); continue; }
      const key = record.type === 'hunt' ? weekKey(record.date) : record.weekStart;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record);
    }
    const cells = items => {
      const value = totals(items);
      const shards = items.filter(item => item.type === 'hunt').reduce((sum, item) => sum + Math.max(0, Math.floor(Number(item.shards) || 0)), 0);
      return `<td>${formatEok(value.boss)}억</td><td>${formatEok(value.loot)}억</td><td>${formatEok(value.hunt)}억 <span class="hunt-breakdown">${huntBreakdown(items)}</span></td><td>${shards.toLocaleString('ko-KR')}개</td><td><b>${formatEok(value.total)}억</b><small>${api.fmtWon(value.total)}</small></td>`;
    };
    const rows = [...groups.entries()].filter(([,items]) => items.length).sort(([a],[b]) => a.localeCompare(b)).map(([key,items], index) => `<tr><th scope="row">${index + 1}주차<small>${E(api.weekRangeLabel(key))}</small></th>${cells(items)}</tr>`).join('');
    return `<div class="monthly-week-stats"><h3>주차별 수익 정산</h3><p>목요일 기준 · 보스는 주 시작일이 속한 달, 사냥은 실제 입력 날짜 기준입니다. 검은 마법사는 월간 항목으로 따로 합산합니다.</p><div class="monthly-week-scroll"><table><thead><tr><th>기간</th><th>보스 결정</th><th>물욕·재료</th><th>사냥·조각 수익</th><th>조각 개수</th><th>합계</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="table-empty">이 달의 주간 정산 기록이 없습니다.</td></tr>'}<tr class="monthly-black-row"><th scope="row">검은 마법사 · 월간</th>${cells(black)}</tr></tbody><tfoot><tr><th scope="row">월간 총합</th>${cells(records)}</tr></tfoot></table></div></div>`;
  }
  function monthlyPanel(month) {
    const chartId = 'monthly-chart-' + (++chartSerial);
    const result = totals(monthRecords(month));
    const [year, number] = month.split('-').map(Number);
    const history = Array.from({length:6},(_,index)=>{
      const date = new Date(year,number-1-5+index,1,12);
      const key = api.localDateKey(date).slice(0,7);
      return { key, label:`${date.getMonth()+1}월`, value:totals(monthRecords(key)).total };
    }).filter(point => monthRecords(point.key).length || point.key === month);
    const max = Math.max(1,...history.map(point=>point.value));
    const points = history.map((point,i)=>[35+i*(320 / Math.max(1, history.length - 1)),125-point.value/max*98]);
    const line = points.map(([x,y])=>`${x},${y}`).join(' ');
    const chart = history.length > 1 ? `<svg class="income-chart" viewBox="0 0 390 170" role="img" aria-label="최근 6개월 월간 수익: ${history.map(point=>`${point.key} ${formatEok(point.value)}억`).join(', ')}"><defs><linearGradient id="${chartId}" x2="0" y2="1"><stop stop-color="#fa65be" stop-opacity=".35"/><stop offset="1" stop-color="#fa65be" stop-opacity="0"/></linearGradient></defs>${[30,75,125].map(y=>`<path d="M20 ${y}H375" stroke="#647493" stroke-dasharray="3 4" opacity=".3"/>`).join('')}<polygon points="35,125 ${line} 355,125" fill="url(#${chartId})"/><polyline points="${line}" fill="none" stroke="#f383d1" stroke-width="3"/>${points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="4" fill="#a7e4ff"/><text x="${x}" y="${Math.max(14,y-10)}" text-anchor="middle">${formatEok(history[i].value)}</text><text x="${x}" y="155" text-anchor="middle">${history[i].label}</text>`).join('')}</svg>` : '<div class="chart-empty">비교할 이전 기록이 아직 없습니다.<br>수익을 기록하면 추이 그래프가 표시됩니다.</div>';
    const monthlyShards = monthRecords(month).filter(record => record.type === 'hunt').reduce((sum, record) => sum + Math.max(0, Math.floor(Number(record.shards) || 0)), 0);
    const entries = [['보스 결정',result.boss,'#f47cbf'],['사냥·조각',result.hunt,'#8bdaff'],['물욕·재료',result.loot,'#ffc86d']];
    let offset = 0;
    const stops = entries.map(([,value,color])=>{ const start=offset;offset+=result.total ? value/result.total*100 : 0;return `${color} ${start}% ${offset}%`;});
    return `<section class="game-panel month-panel"><div class="panel-heading"><h2>이번 달 수익</h2><div class="dashboard-month-nav"><button data-dashboard-month="-1" aria-label="지난달">‹</button><strong>${year}년 ${number}월</strong><button data-dashboard-month="1" aria-label="다음달">›</button></div></div><div class="monthly-report"><div class="month-total"><span>총 수익</span><strong>${money(result.total)}</strong><small>${api.fmtWon(result.total)}</small></div><div>${chart}<details class="chart-data"><summary>월별 수익 데이터</summary><table><thead><tr><th>월</th><th>총 수익</th></tr></thead><tbody>${history.map(point=>`<tr><td>${point.key}</td><td>${formatEok(point.value)}억</td></tr>`).join('')}</tbody></table></details></div><div class="composition"><div class="income-donut" style="background:conic-gradient(${result.total ? stops.join(',') : '#36435c 0% 100%'})"><span>수익 구성<br><b>${formatEok(result.total)}억</b></span></div><ul>${entries.map(([name,value,color])=>`<li><i style="background:${color}"></i><span>${name}</span><b>${formatEok(value)}억${name === '사냥·조각' ? `<span class="hunt-breakdown">${huntBreakdown(monthRecords(month))}</span>` : ''}</b><small>${result.total ? Math.round(value/result.total*100) : 0}%</small></li>`).join('')}</ul></div></div>${monthlyWeekTable(month)}</section>`;
  }
  function lootPanel(month, items, weekly = false) {
    const isCountedDrop = item => isNoteworthyDrop(item.name);
    const countDrops = records => records.filter(isCountedDrop).reduce((count, item) => count + item.quantity, 0);
    const periodItems = items.filter(item => weekly ? item.record.bossId !== 'black-mage' && item.record.weekStart === month : item.month === month);
    const recent = periodItems.filter(isCountedDrop);
    const current = periodItems;
    const highest = [...recent].sort((a,b)=>b.value-a.value)[0];
    return `<section class="game-panel"><div class="panel-heading"><h2>${weekly ? '주간 득템 기록' : '월간 득템 기록'}</h2><span>${E(weekly ? api.weekRangeLabel(month) : month)} · 완료한 보스 기준</span></div><div class="loot-report"><div class="recent-loot-grid">${recent.map(item=>`<article class="recent-loot-card"><div>${api.itemIcon(item.name)}</div><strong title="${E(item.name)}">${E(item.name)}</strong><b>${formatEok(item.value)}억</b><small>×${item.quantity.toLocaleString('ko-KR')} · ${E(item.character.name)}</small><time>${E(item.dateLabel)}</time></article>`).join('') || '<div class="dashboard-empty">보스 완료와 획득 아이템을 체크하면 득템 기록이 표시됩니다.</div>'}</div><dl class="loot-stats"><div><dt>${weekly ? '이번 주' : '이번 달'} 획득</dt><dd>${countDrops(current).toLocaleString('ko-KR')}개</dd></div><div><dt>${weekly ? '이번 주' : '이번 달'} 득템 수익</dt><dd>${formatEok(current.reduce((n,item)=>n+item.value,0))}억</dd></div><div><dt>${weekly ? '이번 주' : '이번 달'} 최고가 기록</dt><dd>${highest ? `${formatEok(highest.value)}억<small>${E(highest.name)}</small>` : '기록 없음'}</dd></div></dl></div></section>`;
  }
  function blackMagePanel(month) {
    const statuses = api.getData().characters.map(character => {
      const records = character.items.filter(record => record.bossId === 'black-mage' && api.bossMonth(record) === month);
      const completed = records.find(api.bossIncomeEnabled);
      const record = completed || api.entries(character, 'boss').find(record => record.bossId === 'black-mage' && api.bossMonth(record) === month) || records[0];
      const difficulty = record?.difficulty || character.bossPresets?.['black-mage']?.difficulty;
      return { character, difficulty, state: completed ? 'done' : difficulty ? 'pending' : 'unset',
        income: completed ? api.sum([completed]) + api.lootIncome([completed]) : 0,
        remaining: !completed && record ? api.amount(record.amount) : 0 };
    });
    const configured = statuses.filter(item => item.state !== 'unset').length;
    const done = statuses.filter(item => item.state === 'done').length;
    const completedIncome = statuses.reduce((sum, item) => sum + item.income, 0);
    const remainingDecision = statuses.reduce((sum, item) => sum + item.remaining, 0);
    const [year, number] = month.split('-').map(Number);
    return `<section class="game-panel black-mage-status-panel"><div class="panel-heading"><h2>검은 마법사 · 월간 현황</h2><div class="dashboard-month-nav"><button data-dashboard-month="-1" aria-label="검은 마법사 지난달 현황">‹</button><b>${year}년 ${number}월</b><button data-dashboard-month="1" aria-label="검은 마법사 다음달 현황">›</button></div><span>${done} / ${configured} 완료</span></div><div class="black-mage-income-summary"><div><span>완료 수익</span><strong>${money(completedIncome)}</strong><small>결정 + 획득 아이템</small></div><div><span>남은 결정 수익</span><strong>${money(remainingDecision)}</strong><small>미완료 · 파티 인원 분배 적용</small></div></div><div class="home-period-loot"><span class="home-loot-caption">검은 마법사 획득 아이템</span>${homeLootSummary(api.getData().characters.flatMap(character=>character.items.filter(record=>record.bossId==='black-mage' && api.bossMonth(record)===month)))}</div><div class="black-mage-status-groups">${[['done','완료 ✓'],['pending','미완료'],['unset','미설정']].map(([state,label]) => {
      const group = statuses.filter(item => item.state === state);
      if (state === 'unset' && !group.length) return '';
      return `<div class="black-mage-status-group ${state}"><h3>${label} <span>${group.length}명</span></h3><div>${group.map(item => `<button type="button" data-select-character="${E(item.character.id)}" data-focus-black-mage title="${E(item.character.name)} 검은 마법사 정산 열기"><strong>${E(item.character.name)}</strong>${item.difficulty ? `<small>${E(item.difficulty)}</small>` : ''}</button>`).join('') || '<span class="black-mage-status-empty">없음</span>'}</div></div>`;
    }).join('')}</div></section>`;
  }
  function render() {
    const priceToggleFocused = document.activeElement === $('#show-loot-prices');
    homePriceToggle.remove();
    const characterScrollLeft = $('.game-characters')?.scrollLeft || 0;
    const data=api.getData(), view=api.getView();
    const stats=data.characters.map(charStats);
    const current=stats.reduce((n,s)=>n+s.current,0), remaining=stats.reduce((n,s)=>n+s.remaining,0);
    const completed=stats.reduce((n,s)=>n+s.completed,0), count=stats.reduce((n,s)=>n+s.total,0);
    const percent=count ? Math.round(completed/count*100) : 0;
    const items=lootRecords();
    if (!data.characters.some(c=>c.id===selected)) selected='';
    const visible=stats.filter(stat=>filter==='all' || stat.state===filter);
    const homeMarkup = `<div class="dashboard-intro"><div><span class="kicker">MY MAPLE DASHBOARD</span><h1>오늘의 기록이 쌓이는 곳<span>나의 메이플 수익 대시보드</span></h1></div><button class="button primary" data-action="add-character">＋ 캐릭터 추가</button></div>${weeklyPanel(stats,view)}<!--home-characters--><section class="game-panel character-panel"><div class="panel-heading"><h2>이번 주 캐릭터 현황</h2><div class="card-month-selector"><span>검마</span><button type="button" data-dashboard-month="-1" aria-label="검은 마법사 지난달">‹</button><b>${E(view.blackMageMonth)}</b><button type="button" data-dashboard-month="1" aria-label="검은 마법사 다음달">›</button></div><div class="character-filters">${[['all','전체'],['done','완료'],['active','진행중'],['pending','미진행']].map(([key,label])=>`<button data-character-filter="${key}" aria-pressed="${filter===key}">${label} <b>${key==='all' ? stats.length : stats.filter(s=>s.state===key).length}</b></button>`).join('')}</div><div class="character-scroll-controls"><button type="button" data-scroll-characters="-1" aria-label="이전 캐릭터">‹</button><button type="button" data-scroll-characters="1" aria-label="다음 캐릭터">›</button></div></div><div class="game-characters" data-card-count="${visible.length}" tabindex="0" aria-label="캐릭터 카드 · 좌우로 스크롤">${visible.map(managedCard).join('') || `<div class="dashboard-empty">${data.characters.length ? '해당 상태의 캐릭터가 없습니다.' : '캐릭터를 추가하고 직업과 잡는 보스를 설정해 보세요.'}<button class="button primary" data-action="add-character">＋ 캐릭터 추가</button></div>`}</div></section><!--home-hunting-->${lootPanel(view.week,items,true)}`;
    const [beforeHunting, afterHunting] = homeMarkup.split('<!--home-hunting-->');
    const [overview, characterMarkup] = beforeHunting.split('<!--home-characters-->');
    $('#home-before-hunting').innerHTML = overview;
    $('#home-character-slot').innerHTML = characterMarkup;
    $('#home-after-hunting').innerHTML = afterHunting;
    const weeklyLoot = $('#page-home .week-revenue-panel .home-period-loot');
    weeklyLoot.insertBefore(homePriceToggle, weeklyLoot.children[1]);
    if (priceToggleFocused) $('#show-loot-prices').focus({preventScroll:true});
    $('.game-characters').scrollLeft = characterScrollLeft;
    // Format the home hunting readouts, keeping editable inputs and exact values intact.
    for (const character of data.characters) {
      const row = [...$('#hunt-character-grid').querySelectorAll('[data-character]')].find(node => node.dataset.character === character.id);
      if (!row) continue;
      const records = character.items.filter(item => item.type === 'hunt' && item.date === view.day);
      row.querySelector('[data-category-total="hunt"]').textContent = formatEok(api.sum(records));
      const shards = records.reduce((sum, item) => sum + Math.max(0, Math.floor(Number(item.shards) || 0)), 0);
      const shardValue = row.querySelector('.shard-meso-value');
      if (shardValue) shardValue.textContent = `(${formatEok(shards * data.settings.shardPriceMan / 10000)}억 메소)`;
    }
    $('#stats-dashboard').innerHTML=monthlyPanel(view.month)+lootPanel(view.month,items);
    applySelection();
    activate(page,false);
  }
  function applySelection() {
    $('#loot-ledger-list').querySelectorAll('[data-ledger-character]').forEach(node=>node.hidden=Boolean(selected && node.dataset.character!==selected));
    $('#hunt-character-grid').querySelectorAll('[data-character]').forEach(node=>node.hidden=false);
    syncDrawer();
  }
  function activate(next, scroll=true) {
    if (next === 'settlement') next = 'home';
    if (!['home','stats','settings'].includes(next)) return;
    if (drawer.open && next !== page) drawer.close();
    page=next;
    document.querySelectorAll('.portal-page').forEach(node=>node.hidden=node.id!==`page-${page}`);
    document.querySelectorAll('[data-page]').forEach(button=>button.setAttribute('aria-current',button.dataset.page===page ? 'page' : 'false'));
    if(scroll) { window.scrollTo({top:0,behavior:'instant'}); history.replaceState(null,'',`#${page}`); }
  }
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-page],[data-select-character],[data-character-filter],[data-dashboard-month],[data-dashboard-week],[data-manage-character],[data-remove-character],[data-scroll-characters]');
    if(!target) return;
    if (target.dataset.scrollCharacters) {
      const row = $('.game-characters');
      row.scrollBy({left:Number(target.dataset.scrollCharacters) * Math.max(200, row.clientWidth * .8),behavior:'smooth'});
      return;
    }
    if(target.dataset.page) activate(target.dataset.page);
    if(target.dataset.manageCharacter || target.dataset.removeCharacter) {
      const id = target.dataset.manageCharacter || target.dataset.removeCharacter;
      const characterCard = [...document.querySelectorAll('#character-grid [data-character]')].find(node=>node.dataset.character===id);
      if (!characterCard) return;
      if (target.dataset.manageCharacter) activate('settings');
      characterCard.querySelector(`[data-action="${target.dataset.manageCharacter ? 'edit-character-bosses' : 'delete-character'}"]`)?.click();
      return;
    }
    if(target.dataset.selectCharacter) {
      openDrawer(target.dataset.selectCharacter);
      if (target.hasAttribute('data-focus-black-mage')) {
        const group = [...ledger.querySelectorAll('[data-ledger-character]')].find(node => node.dataset.character === selected);
        jumpDrawer('monthly', 'instant');
      }
    }
    if(target.dataset.characterFilter) { filter=target.dataset.characterFilter; render(); }
    if(target.dataset.dashboardMonth) api.shiftMonth(Number(target.dataset.dashboardMonth));
    if(target.dataset.dashboardWeek) api.shiftWeek(Number(target.dataset.dashboardWeek));
  });
  window.addEventListener('job-asset-ready',render);
  window.addEventListener('hashchange',()=>activate(location.hash.slice(1),false));
  if(['home','stats','settings'].includes(location.hash.slice(1))) page=location.hash.slice(1);
  if (location.hash === '#settlement') history.replaceState(null, '', '#home');
  return { render, applySelection, activate, charStats, totals, monthRecords, lootRecords };
};
