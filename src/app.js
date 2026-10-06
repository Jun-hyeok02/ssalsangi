(() => {
      const STORAGE_KEY = 'maple-ledger-v1';
      const REMOVED_LOOT_ITEMS = new Set(['루인 포스실드', '루인 포스 쉴드', '거울세계의 코어 젬스톤', '미트라의 코어 젬스톤']);
      // User-provided price table, 2026-10-05. Unit: 100 million mesos.
      // Prices over 1억 are rounded at the second decimal place (one decimal retained).
      const INITIAL_LOOT_PRICES = {
        '1단계 소울 에테르': 8.1, '2단계 소울 에테르': 11, '3단계 소울 에테르': 8.8,
        '4단계 소울 에테르': 24.4, '거대한 공포': 45.9,
        '고통의 근원': 54, '굶주리는 핏빛 원혼': 800, '근원의 속삭임': 614.5,
        '남겨진 칼로스의 의지': 0.025, '남겨진 칼로스의 의지 조각': 0.0125,
        '뒤엉킨 흉수의 고리': 0.025, '뒤엉킨 흉수의 고리 조각': 0.0125,
        '루즈 컨트롤 머신 마크': 14.1,
        '리스트레인트 링 4레벨': 40, '마력이 깃든 안대': 31, '모상하견 상자': 0.25,
        '몽환의 벨트': 42.4, '미트라의 분노 선택 상자': 10,
        '불멸의 유산': 770, '생명의 연마석': 10, '신념의 연마석': 32.8,
        '에리온의 조각 교환권': 0.007, '오만의 원죄': 0,
        '이어진 고대의 결의': 0.025, '이어진 고대의 결의 조각': 0.0125,
        '익셉셔널 해머 (귀고리)': 0, '익셉셔널 해머 (눈장식)': 245.6,
        '익셉셔널 해머 (벨트)': 59.6, '익셉셔널 해머 (얼굴장식)': 72.2,
        '익셉셔널 해머 (훈장)': 750, '장신망 상자': 18, '저주받은 마도서 선택 상자': 45,
        '죽음의 맹세': 750, '창세의 뱃지': 180, '커맨더 포스 이어링': 15.6,
        '컨티뉴어스 링 4레벨': 28.7, '컴플리트 언더컨트롤': 226.6,
        '황홀한 악몽': 635, '황홀한 환상의 단편': 0.025, '황홀한 환상의 단편 조각': 0.0125
      };
      const ETERNAL_BOX_PRICES = {
        '의지의 에테르넬 방어구 상자': 0.25, '고대의 에테르넬 방어구 상자': 0.25,
        '흉수의 에테르넬 방어구 상자': 0.25, '환상의 에테르넬 방어구 상자': 0.25,
        '광기의 에테르넬 방어구 상자': 18, '욕망의 에테르넬 방어구 상자': 18,
        '맹세의 에테르넬 방어구 상자': 18, '갈망의 에테르넬 방어구 상자': 18
      };
      const ETERNAL_BOX_NAMES = Object.fromEntries(Object.entries(ETERNAL_BOX_PRICES).map(([name, price]) => [name, price === 18 ? '장신망 상자' : '모상하견 상자']));
      const UNIFIED_ETERNAL_BOX_PRICES = { '모상하견 상자': 0.25, '장신망 상자': 18 };
      function canonicalLootName(name) { return ETERNAL_BOX_NAMES[name] || name; }
      Object.assign(INITIAL_LOOT_PRICES, UNIFIED_ETERNAL_BOX_PRICES);
      const DEFAULT_SETTINGS = { wonPerEok: 1500, shardPriceMan: 700, shardPriceDefaultApplied: true, showLootPrices: false, eternalBoxDefaultsApplied: true, screenshotPricesApplied: true, grimoirePrice45Applied: true };
      const AUCTION_NO_LISTINGS = ["저주받은 마도서 선택 상자","미트라의 분노 선택 상자","남겨진 칼로스의 의지 조각","남겨진 칼로스의 의지","의지의 에테르넬 방어구 상자","고대의 에테르넬 방어구 상자","뒤엉킨 흉수의 고리 조각","흉수의 에테르넬 방어구 상자","뒤엉킨 흉수의 고리","익셉셔널 해머 (귀고리)","환상의 에테르넬 방어구 상자","광기의 에테르넬 방어구 상자","욕망의 에테르넬 방어구 상자","맹세의 에테르넬 방어구 상자","오만의 원죄","갈망의 에테르넬 방어구 상자"];
      const CHAOS_BLACK_BOX = '혼돈의 칠흑 장신구 상자';
      const CHAOS_BLACK_BOX_ITEMS = ['루즈 컨트롤 머신 마크', '마력이 깃든 안대', '몽환의 벨트', '저주받은 마도서 선택 상자', '거대한 공포', '커맨더 포스 이어링', '고통의 근원'];
      const BOSS_DATA = [
        { id: 'su', name: '스우', modes: [['노멀', 8350000], ['하드', 48900000], ['익스트림', 545000000]] },
        { id: 'damien', name: '데미안', modes: [['노멀', 8750000], ['하드', 46400000]] },
        { id: 'guardian-slime', name: '가디언 엔젤 슬라임', modes: [['노멀', 12700000], ['카오스', 71300000]] },
        { id: 'lucid', name: '루시드', modes: [['이지', 14900000], ['노멀', 17800000], ['하드', 59700000]] },
        { id: 'will', name: '윌', modes: [['이지', 16100000], ['노멀', 20500000], ['하드', 73200000]] },
        { id: 'dusk', name: '더스크', modes: [['노멀', 22000000], ['카오스', 66300000]] },
        { id: 'jin-hilla', name: '진 힐라', modes: [['노멀', 67600000], ['하드', 100000000]] },
        { id: 'dunkel', name: '듄켈', modes: [['노멀', 23700000], ['하드', 89600000]] },
        { id: 'seren', name: '선택받은 세렌', modes: [['노멀', 167000000], ['하드', 302000000], ['익스트림', 1840000000]] },
        { id: 'kalos', name: '감시자 칼로스', modes: [['이지', 238000000], ['노멀', 479000000], ['카오스', 1230000000], ['익스트림', 4104000000]] },
        { id: 'first-adversary', name: '최초의 대적자', modes: [['이지', 261000000], ['노멀', 532000000], ['하드', 1390000000], ['익스트림', 4712000000]] },
        { id: 'kaling', name: '카링', modes: [['이지', 320000000], ['노멀', 593000000], ['하드', 1560000000], ['익스트림', 5387000000]] },
        { id: 'star', name: '찬란한 흉성', modes: [['노멀', 576000000], ['하드', 2678000000]] },
        { id: 'bellona', name: '벨로나', modes: [['이지', 396000000], ['노멀', 824000000], ['하드', 2950000000]] },
        { id: 'limbo', name: '림보', modes: [['노멀', 995000000], ['하드', 2385000000]] },
        { id: 'baldricks', name: '발드릭스', modes: [['노멀', 1320000000], ['하드', 3078000000]] },
        { id: 'upieter', name: '유피테르', modes: [['노멀', 1560000000], ['하드', 4845000000]] },
        { id: 'black-mage', name: '검은 마법사', period: '월간', modes: [['하드', 465000000], ['익스트림', 5680000000]] }
      ];
      // Official major rewards + current difficulty tables; see the source links in the tracker.
      // Keep item names separate from quantities so saved acquisition records remain stable.
      const ABSOLAB_BOXES = ['앱솔랩스 무기 상자', '앱솔랩스 방어구 상자'];
      const ARCANE_BOXES = ['아케인셰이드 무기 상자', '아케인셰이드 방어구 상자'];
      const BOSS_REWARDS = {
        su: { common: ['특수형 에너지 코어(S급)'], modes: {
          '노멀': [], '하드': [...ABSOLAB_BOXES, '루즈 컨트롤 머신 마크', '스우로이드'],
          '익스트림': [...ABSOLAB_BOXES, '루즈 컨트롤 머신 마크', '컴플리트 언더컨트롤', '섬멸병기 스우로이드'] } },
        damien: { common: ['뒤틀린 낙인의 영혼석'], modes: {
          '노멀': [], '하드': [...ABSOLAB_BOXES, '마력이 깃든 안대', '데미안로이드'] } },
        'guardian-slime': { common: ['가디언 엔젤 링'], modes: { '노멀': [], '카오스': [] } },
        lucid: { common: [], modes: { '이지': [], '노멀': ['트와일라이트 마크', '나비날개 물방울석'],
          '하드': [...ARCANE_BOXES, '몽환의 벨트', '트와일라이트 마크', '나비날개 물방울석', '루시드로이드'] } },
        will: { common: [], modes: { '이지': [], '노멀': ['트와일라이트 마크', '코브웹 물방울석'],
          '하드': [...ARCANE_BOXES, '저주받은 마도서 선택 상자', '트와일라이트 마크', '코브웹 물방울석'] } },
        dusk: { common: ['에스텔라 이어링'], modes: { '노멀': [], '카오스': [...ARCANE_BOXES, '거대한 공포'] } },
        'jin-hilla': { common: [...ARCANE_BOXES, '데이브레이크 펜던트'], modes: { '노멀': [], '하드': ['고통의 근원'] } },
        dunkel: { common: ['에스텔라 이어링'], modes: { '노멀': [], '하드': [...ARCANE_BOXES, '커맨더 포스 이어링'] } },
        seren: { common: ['데이브레이크 펜던트'], modes: { '노멀': [],
          '하드': ['미트라의 분노 선택 상자'],
          '익스트림': ['미트라의 분노 선택 상자', '익셉셔널 해머 (얼굴장식)'] } },
        kalos: { common: [], modes: { '이지': [],
          '노멀': ['남겨진 칼로스의 의지 조각', '니키로이드', '생명의 연마석'],
          '카오스': ['남겨진 칼로스의 의지', '의지의 에테르넬 방어구 상자', '니키로이드', '생명의 연마석'],
          '익스트림': ['남겨진 칼로스의 의지', '의지의 에테르넬 방어구 상자', '니키로이드', '생명의 연마석', '익셉셔널 해머 (눈장식)'] } },
        'first-adversary': { common: [], modes: { '이지': [],
          '노멀': ['이어진 고대의 결의 조각', '대적자로이드', '생명의 연마석', '1단계 소울 에테르'],
          '하드': ['불멸의 유산', '고대의 에테르넬 방어구 상자', '이어진 고대의 결의', '대적자로이드', '생명의 연마석', '1단계 소울 에테르'],
          '익스트림': ['불멸의 유산', '고대의 에테르넬 방어구 상자', '이어진 고대의 결의', '대적자로이드', '생명의 연마석', '1단계 소울 에테르', '익셉셔널 해머 (훈장)'] } },
        kaling: { common: [], modes: { '이지': ['뒤엉킨 흉수의 고리 조각'],
          '노멀': ['뒤엉킨 흉수의 고리 조각', '카링로이드', CHAOS_BLACK_BOX, '생명의 연마석', '1단계 소울 에테르'],
          '하드': ['흉수의 에테르넬 방어구 상자', '뒤엉킨 흉수의 고리', '카링로이드', CHAOS_BLACK_BOX, '신념의 연마석', '1단계 소울 에테르'],
          '익스트림': ['흉수의 에테르넬 방어구 상자', '뒤엉킨 흉수의 고리', '카링로이드', CHAOS_BLACK_BOX, '신념의 연마석', '1단계 소울 에테르', '익셉셔널 해머 (귀고리)'] } },
        star: { common: ['흉성로이드', CHAOS_BLACK_BOX, '2단계 소울 에테르'], modes: {
          '노멀': ['황홀한 환상의 단편 조각', '생명의 연마석'],
          '하드': ['황홀한 악몽', '환상의 에테르넬 방어구 상자', '황홀한 환상의 단편', '신념의 연마석'] } },
        bellona: { common: [], modes: { '이지': [],
          '노멀': ['저주받은 원혼의 잔재', '벨로나로이드', CHAOS_BLACK_BOX, '생명의 연마석', '2단계 소울 에테르'],
          '하드': ['굶주리는 핏빛 원혼', '광기의 에테르넬 방어구 상자', '저주받은 원혼의 잔재', '벨로나로이드', CHAOS_BLACK_BOX, '신념의 연마석', '2단계 소울 에테르'] } },
        limbo: { common: ['왜곡된 욕망의 결정', '림보로이드', CHAOS_BLACK_BOX, '신념의 연마석', '3단계 소울 에테르'], modes: {
          '노멀': [], '하드': ['근원의 속삭임', '욕망의 에테르넬 방어구 상자'] } },
        baldricks: { common: ['영원한 충성의 흔적', '발드릭스로이드', CHAOS_BLACK_BOX, '신념의 연마석', '3단계 소울 에테르'], modes: {
          '노멀': [], '하드': ['죽음의 맹세', '맹세의 에테르넬 방어구 상자'] } },
        upieter: { common: ['뒤틀린 갈망의 편린', '유피테르로이드', CHAOS_BLACK_BOX, '신념의 연마석', '4단계 소울 에테르'], modes: {
          '노멀': [], '하드': ['오만의 원죄', '갈망의 에테르넬 방어구 상자'] } },
        'black-mage': { common: [...ARCANE_BOXES, '창세의 뱃지'], modes: {
          '하드': [], '익스트림': ['익셉셔널 해머 (벨트)'] } }
      };
      const BOSS_RING_BOXES = {
        su: { '노멀': '녹옥', '하드': '홍옥', '익스트림': '백옥' }, damien: { '노멀': '녹옥', '하드': '홍옥' },
        'guardian-slime': { '노멀': '녹옥', '카오스': '흑옥' },
        lucid: { '이지': '녹옥', '노멀': '녹옥', '하드': '홍옥' }, will: { '이지': '녹옥', '노멀': '녹옥', '하드': '홍옥' },
        dusk: { '노멀': '녹옥', '카오스': '흑옥' }, 'jin-hilla': { '노멀': '홍옥', '하드': '흑옥' }, dunkel: { '노멀': '녹옥', '하드': '흑옥' },
        seren: { '노멀': '흑옥', '하드': '백옥', '익스트림': '백옥' },
        kalos: { '이지': '백옥', '노멀': '백옥', '카오스': '생명', '익스트림': '생명' },
        'first-adversary': { '이지': '백옥', '노멀': '백옥', '하드': '생명', '익스트림': '생명' },
        kaling: { '이지': '백옥', '노멀': '백옥', '하드': '생명', '익스트림': '생명' },
        star: { '노멀': '백옥', '하드': '생명' }, bellona: { '이지': '백옥', '노멀': '백옥', '하드': '생명' },
        limbo: { '노멀': '생명', '하드': '생명' }, baldricks: { '노멀': '생명', '하드': '생명' }, upieter: { '노멀': '생명', '하드': '생명' },
        'black-mage': { '하드': '백옥', '익스트림': '백옥' }
      };
      const LEVEL_FOUR_RINGS = ['리스트레인트 링 4레벨', '컨티뉴어스 링 4레벨'];
      const ERION_REWARD_MODES = {
        seren: ['익스트림'], kalos: ['익스트림'], 'first-adversary': ['하드', '익스트림'],
        kaling: ['하드', '익스트림'], star: ['하드'], bellona: ['하드'], limbo: ['하드'],
        baldricks: ['하드'], upieter: ['노멀', '하드']
      };
      const ERION_REWARD_COUNTS = {
        seren: { '익스트림': 30 }, kalos: { '익스트림': 180 },
        'first-adversary': { '하드': 30, '익스트림': 240 },
        kaling: { '하드': 60, '익스트림': 480 }, star: { '하드': 90 },
        bellona: { '하드': 100 }, limbo: { '하드': 60 }, baldricks: { '하드': 120 },
        upieter: { '노멀': 45, '하드': 360 }
      };
      // Guaranteed materials: shared totals become automatic only for solo clears.
      const FIXED_BOSS_REWARDS = {
        su: { '노멀': [['특수형 에너지 코어(S급)', '수량 변동']], '하드': [['특수형 에너지 코어(S급)', '수량 변동']], '익스트림': [['특수형 에너지 코어(S급)', '수량 변동']] },
        damien: { '노멀': [['뒤틀린 낙인의 영혼석', '수량 변동']], '하드': [['뒤틀린 낙인의 영혼석', '수량 변동']] },
        lucid: { '노멀': [['나비날개 물방울석', '수량 변동']], '하드': [['나비날개 물방울석', '수량 변동']] },
        will: { '노멀': [['코브웹 물방울석', '수량 변동']], '하드': [['코브웹 물방울석', '수량 변동']] },
        kalos: { '노멀': [['남겨진 칼로스의 의지 조각', '파티 보상 3개']], '카오스': [['남겨진 칼로스의 의지', '파티 보상 5개']], '익스트림': [['남겨진 칼로스의 의지', '파티 보상 14개']] },
        'first-adversary': { '노멀': [['이어진 고대의 결의 조각', '파티 보상 4개']], '하드': [['이어진 고대의 결의', '파티 보상 6개']], '익스트림': [['이어진 고대의 결의', '파티 보상 16개']] },
        kaling: { '이지': [['뒤엉킨 흉수의 고리 조각', '파티 보상 1개']], '노멀': [['뒤엉킨 흉수의 고리 조각', '파티 보상 5개']], '하드': [['뒤엉킨 흉수의 고리', '파티 보상 7개']], '익스트림': [['뒤엉킨 흉수의 고리', '파티 보상 18개']] },
        star: { '노멀': [['황홀한 환상의 단편 조각', '파티 보상 6개']], '하드': [['황홀한 환상의 단편', '파티 보상 18개']] },
        bellona: { '노멀': [['저주받은 원혼의 잔재', '1개']], '하드': [['저주받은 원혼의 잔재', '2개']] },
        limbo: { '노멀': [['왜곡된 욕망의 결정', '1개']], '하드': [['왜곡된 욕망의 결정', '2개']] },
        baldricks: { '노멀': [['영원한 충성의 흔적', '1개']], '하드': [['영원한 충성의 흔적', '2개']] },
        upieter: { '노멀': [['뒤틀린 갈망의 편린', '1개']], '하드': [['뒤틀린 갈망의 편린', '2개']] }
      };
      function rewardDefinitions(bossId, difficulty) {
        const rewards = (FIXED_BOSS_REWARDS[bossId]?.[difficulty] || []).filter(([name]) => showBossReward(name)).map(([name, label]) => ({
          name, count: Number(label.match(/(\d+)개/)?.[1]) || 0,
          scope: label.startsWith('파티 보상') ? 'shared' : 'personal'
        })).filter(reward => reward.count > 0);
        const erionCount = ERION_REWARD_COUNTS[bossId]?.[difficulty];
        if (erionCount) rewards.push({ name: '에리온의 조각 교환권', count: erionCount, scope: 'shared', unitNote: '교환 후 조각 수 기준' });
        return rewards;
      }
      function automaticRewards(record) {
        return rewardDefinitions(record.bossId, record.difficulty).filter(reward => reward.scope === 'personal' || Number(record.partySize) === 1);
      }
      function isAutomaticReward(record, name) { return automaticRewards(record).some(reward => reward.name === name); }
      function acquiredQuantity(record, name) {
        if (quantityLimit(record, name) === 1) return isAutomaticReward(record, name) || (record.lootIds || []).includes(name) ? 1 : 0;
        if (Object.hasOwn(record.lootQuantities || {}, name)) return shardCount(record.lootQuantities[name]);
        const automatic = automaticRewards(record).find(reward => reward.name === name);
        return automatic ? automatic.count : (record.lootIds || []).includes(name) ? 1 : 0;
      }
      function quantityLimit(record, name) {
        const reward = rewardDefinitions(record.bossId, record.difficulty).find(candidate => candidate.name === name);
        return reward ? (reward.unitNote ? 99999 : reward.count) : 1;
      }
      function updateLootQuantity(character, target) {
        const item = bossRecord(character, target.dataset.bossId);
        const name = target.dataset.lootName;
        const boss = BOSS_DATA.find(candidate => candidate.id === item?.bossId);
        if (!item || !boss || !(getBossLoot(boss, item.difficulty).includes(name) || (item.lootIds || []).includes(name) || Object.hasOwn(item.lootQuantities || {}, name))) return false;
        const quantity = Math.min(quantityLimit(item, name), shardCount(target.value));
        item.lootQuantities ||= {};
        item.lootQuantities[name] = quantity;
        if (!isAutomaticReward(item, name)) {
          const collected = new Set(item.lootIds || []);
          if (quantity > 0) collected.add(name); else collected.delete(name);
          item.lootIds = [...collected];
          if (name === CHAOS_BLACK_BOX && !quantity) item.blackBoxItem = '';
        }
        save();
        return true;
      }
      function quantityInput(record, name, automatic = false) {
        if (quantityLimit(record, name) === 1) return '';
        return `<label class="loot-quantity-field">내 획득 수량 <input type="number" min="0" max="${quantityLimit(record, name)}" step="1" inputmode="numeric" data-loot-quantity data-boss-id="${esc(record.bossId)}" data-loot-name="${esc(name)}" value="${acquiredQuantity(record, name)}" aria-label="${esc(name)} 내 획득 수량" ${!automatic && !(record.lootIds || []).includes(name) ? 'disabled' : ''}>개</label>`;
      }
      function lootEntry(record, name, currentLoot) {
        const reward = rewardDefinitions(record.bossId, record.difficulty).find(candidate => candidate.name === name);
        const needsQuantity = reward?.count > 1 && (record.lootIds || []).includes(name) && !Object.hasOwn(record.lootQuantities || {}, name);
        const selected = (record.lootIds || []).includes(name);
        const price = selected && name !== CHAOS_BLACK_BOX ? acquisitionPriceText(name, record) : '';
        return `<div class="boss-loot-entry"><label><input type="checkbox" data-boss-loot data-boss-id="${esc(record.bossId)}" data-loot-name="${esc(name)}" ${selected ? 'checked' : ''}><span>${esc(name)}${selected && quantityLimit(record, name) === 1 ? ' · 1개' : ''}${currentLoot.includes(name) ? '' : ' <small>(이전 기록)</small>'}${price}</span></label>${reward ? `<div class="boss-loot-meta">파티 공용 · 전체 ${reward.count}개${reward.unitNote ? ` · ${reward.unitNote}` : ''}${needsQuantity ? ' · 이전 체크의 수량을 확인하세요' : ''}</div>` : ''}${quantityInput(record, name)}</div>`;
      }
      const BOSS_ICONS = {
        su: [1, 19, 3], damien: [1, 19, 41], 'guardian-slime': [1, 19, 79], lucid: [1, 19, 117], will: [1, 19, 155],
        dusk: [1, 19, 193], 'jin-hilla': [1, 19, 231], dunkel: [1, 19, 269], seren: [1, 19, 307], kalos: [1, 19, 345],
        'first-adversary': [1, 19, 383], kaling: [2, 23, 4], star: [2, 23, 42], bellona: [2, 23, 80],
        limbo: [2, 23, 118], baldricks: [2, 23, 156], upieter: [2, 23, 194], 'black-mage': [2, 23, 271]
      };
      const grid = document.getElementById('character-grid');
      const modal = document.getElementById('character-modal');
      const jobPicker = createJobPicker(document.getElementById('character-job-input'));
      const nameInput = document.getElementById('character-name-input');
      const toast = document.getElementById('toast');
      let toastTimer;
      let view = { day: localDateKey(), week: weekStartKey(localDateKey()), month: localDateKey().slice(0, 7), blackMageMonth: localDateKey().slice(0, 7) };
      let storageReadError = false;
      let data = load();
      let dashboard;

      function uid() { return Math.random().toString(36).slice(2, 10); }
      function localDateKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      function validDateKey(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
        const parsed = new Date(`${value}T12:00:00`);
        return !Number.isNaN(parsed.getTime()) && localDateKey(parsed) === value;
      }
      function shiftDate(value, offset) {
        const date = new Date(`${value}T12:00:00`);
        date.setDate(date.getDate() + offset);
        return localDateKey(date);
      }
      function weekStartKey(value) {
        const date = new Date(`${value}T12:00:00`);
        date.setDate(date.getDate() - ((date.getDay() + 3) % 7));
        return localDateKey(date);
      }
      function weekRangeLabel(start) {
        const end = shiftDate(start, 6);
        const options = { month: 'long', day: 'numeric' };
        const startText = new Date(`${start}T12:00:00`).toLocaleDateString('ko-KR', options);
        const endText = new Date(`${end}T12:00:00`).toLocaleDateString('ko-KR', { ...options, year: 'numeric' });
        return `${startText} (목) – ${endText} (수)`;
      }
      function load() {
        try {
          const original = localStorage.getItem(STORAGE_KEY);
          const saved = JSON.parse(original || 'null');
          if (original && (!saved || !Array.isArray(saved.characters))) throw new Error('invalid stored data');
          if (original && !localStorage.getItem('maple-ledger-before-nexon-v1')) { try { localStorage.setItem('maple-ledger-before-nexon-v1', original); } catch (_) {} }
          if (saved && Array.isArray(saved.characters)) {
            const today = localDateKey();
            const currentWeek = weekStartKey(today);
            const migrated = {
              settings: normalizeSettings(saved.settings),
              characters: saved.characters.map(character => {
                const items = (Array.isArray(character.items) ? character.items : []).filter(Boolean).map(item => {
                  const type = item.type === 'hunt' ? 'hunt' : 'boss';
                  const bossFields = type === 'boss' ? normalizeBossFields(item) : {};
                  return {
                    id: String(item.id || uid()), type,
                    label: String(item.label || '').slice(0, 48), amount: bossFields.bossId ? mesoToEok(bossFields.priceMeso, bossFields.partySize) : amount(item.amount),
                    ...(type === 'hunt' ? { date: validDateKey(item.date) ? item.date : today, shards: shardCount(item.shards) } : { weekStart: validDateKey(item.weekStart) ? weekStartKey(item.weekStart) : currentWeek, ...bossFields })
                  };
                });
                return {
                  id: String(character.id || uid()),
                  ...JobCatalog.normalize(character),
                  ...NexonBridge.normalize(character, BOSS_DATA, items),
                  items,
                  bossPresets: normalizeBossPresets(character.bossPresets, items),
                  bossCompletedWeeks: normalizeCompletedWeeks(character.bossCompletedWeeks),
                  completedBosses: normalizeCompletedBosses(character.completedBosses),
                  blackMageCompletedMonths: normalizeBlackMageMonths(character.blackMageCompletedMonths, items),
                  ledgerExpanded: character.ledgerExpanded !== false
                };
              })
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            return migrated;
          }
        } catch (_) { storageReadError = true; }
        return { settings: normalizeSettings(DEFAULT_SETTINGS), characters: [] };
      }
      function normalizeSettings(settings) {
        const values = settings && typeof settings === 'object' ? settings : {};
        const savedShardPrice = Math.floor(Math.max(0, Number.isFinite(Number(values.shardPriceMan)) ? Number(values.shardPriceMan) : (Number.isFinite(Number(values.shardPriceMeso)) ? Number(values.shardPriceMeso) / 10000 : DEFAULT_SETTINGS.shardPriceMan)));
        const savedPrices = Object.fromEntries(Object.entries(values.lootPrices && typeof values.lootPrices === 'object' && !Array.isArray(values.lootPrices) ? values.lootPrices : {}).filter(([name]) => name.length <= 100).map(([name, price]) => [name, amount(price)]));
        if (!values.eternalBoxDefaultsApplied) {
          for (const [name, price] of Object.entries(ETERNAL_BOX_PRICES)) {
            if (!savedPrices[name]) savedPrices[name] = price;
          }
        }
        for (const [name, defaultPrice] of Object.entries(UNIFIED_ETERNAL_BOX_PRICES)) {
          if (!Object.hasOwn(savedPrices, name)) {
            const oldNames = Object.keys(ETERNAL_BOX_NAMES).filter(oldName => ETERNAL_BOX_NAMES[oldName] === name && Object.hasOwn(savedPrices, oldName));
            const selected = oldNames.find(oldName => savedPrices[oldName] !== defaultPrice) || oldNames[0];
            savedPrices[name] = selected ? savedPrices[selected] : defaultPrice;
          }
        }
        for (const oldName of Object.keys(ETERNAL_BOX_NAMES)) delete savedPrices[oldName];
        if (!values.screenshotPricesApplied) Object.assign(savedPrices, INITIAL_LOOT_PRICES);
        // Apply this requested price once; later user edits remain saved.
        if (!values.grimoirePrice45Applied) savedPrices['저주받은 마도서 선택 상자'] = 45;
        for (const name of REMOVED_LOOT_ITEMS) delete savedPrices[name];
        const lootPrices = { ...INITIAL_LOOT_PRICES, ...savedPrices };
        // Storage stays in 억. Each field retains its input unit across edits and reloads.
        const savedUnits = values.lootPriceUnits && typeof values.lootPriceUnits === 'object' ? values.lootPriceUnits : {};
        const lootPriceUnits = Object.fromEntries(Object.entries(lootPrices).map(([name, price]) => [name,
          ['man', 'eok'].includes(savedUnits[name]) ? savedUnits[name] : price > 0 && price < 1 ? 'man' : 'eok'
        ]));
        return {
          grimoirePrice45Applied: true,
          screenshotPricesApplied: true,
          shardPriceDefaultApplied: true,
          eternalBoxDefaultsApplied: true,
          showLootPrices: values.showLootPrices === true,
          wonPerEok: Math.floor(Math.max(0, Number.isFinite(Number(values.wonPerEok)) ? Number(values.wonPerEok) : DEFAULT_SETTINGS.wonPerEok)),
          shardPriceMan: !values.shardPriceDefaultApplied && savedShardPrice === 0 ? 700 : savedShardPrice,
          lootPrices,
          lootPriceUnits
        };
      }
      function normalizeBossPresets(savedPresets, items) {
        const presets = {};
        const hasPresets = savedPresets && typeof savedPresets === 'object' && !Array.isArray(savedPresets);
        if (hasPresets) {
          for (const boss of BOSS_DATA) {
            const saved = savedPresets[boss.id];
            const mode = boss.modes.find(candidate => candidate[0] === saved?.difficulty);
            if (!mode) continue;
            const size = Number(saved.partySize);
            presets[boss.id] = { difficulty: mode[0], partySize: Number.isFinite(size) ? Math.max(1, Math.min(6, Math.floor(size))) : 1 };
          }
        } else {
          const previousClears = items.filter(item => item.bossId).sort((a, b) => String(b.weekStart).localeCompare(String(a.weekStart)));
          for (const item of previousClears) {
            if (presets[item.bossId]) continue;
            presets[item.bossId] = { difficulty: item.difficulty, partySize: item.partySize || 1 };
          }
        }
        return presets;
      }
      function normalizeCompletedWeeks(saved) {
        return Object.fromEntries(Object.entries(saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}).filter(([week, completed]) => validDateKey(week) && completed === true).map(([week]) => [weekStartKey(week), true]));
      }
      function normalizeCompletedBosses(saved) {
        return Object.fromEntries(Object.entries(saved && typeof saved === 'object' ? saved : {}).filter(([week, values]) => validDateKey(week) && values && typeof values === 'object').map(([week, values]) => [weekStartKey(week), Object.fromEntries(Object.entries(values).filter(([id, done]) => BOSS_DATA.some(boss => boss.id === id && !boss.period) && typeof done === 'boolean'))]));
      }
      function recordMetadata(item) {
        return {
          ...(validDateKey(item.completedDate) ? {completedDate:item.completedDate} : {}),
          lootDates: Object.fromEntries(Object.entries(item.lootDates && typeof item.lootDates === 'object' ? item.lootDates : {}).filter(([name,date]) => name.length <= 100 && validDateKey(date)))
        };
      }
      function bossWeekCompleted(character, week) { return character.bossCompletedWeeks?.[week] === true; }
      function weeklyAllCompleted(character, week) {
        const records = character.items.filter(item=>item.bossId && item.bossId !== 'black-mage' && item.weekStart === week);
        return records.length > 0 && records.every(bossIncomeEnabled);
      }
      function bossMonth(record) { return record.settlementMonth || String(record.weekStart).slice(0, 7); }
      function normalizeBlackMageMonths(saved, items) {
        return Object.fromEntries(Object.entries(saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}).filter(([month, id]) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && items.some(item => item.id === id && item.bossId === 'black-mage' && bossMonth(item) === month)));
      }
      function blackMageMonthCompleted(character, month) { return Boolean(character.blackMageCompletedMonths?.[month]); }
      function bossRecord(character, bossId) {
        if (bossId === 'black-mage') {
          const completedId = character.blackMageCompletedMonths?.[view.blackMageMonth];
          const completed = character.items.find(item => item.id === completedId && item.bossId === bossId && bossMonth(item) === view.blackMageMonth);
          if (completed) return completed;
        }
        return character.items.find(item => item.bossId === bossId && (bossId === 'black-mage' ? bossMonth(item) === view.blackMageMonth : item.weekStart === view.week));
      }
      function bossIncomeEnabled(item) {
        const character = data.characters.find(candidate => candidate.items.includes(item));
        if (!character) return false;
        if (item.bossId === 'black-mage') return character.blackMageCompletedMonths?.[bossMonth(item)] === item.id;
        const override = character.completedBosses?.[item.weekStart]?.[item.bossId];
        return typeof override === 'boolean' ? override : bossWeekCompleted(character, item.weekStart);
      }
      function save() {
        if (storageReadError) { showToast('기존 저장 데이터를 읽지 못해 덮어쓰기를 중지했습니다. 백업 복원을 이용해주세요.'); return; }
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
        catch (_) { showToast('저장 공간에 접근할 수 없습니다. 내보내기로 백업해 주세요.'); }
      }
      function esc(value) {
        return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      }
      function bossIcon(bossId) {
        const icon = BOSS_ICONS[bossId];
        if (!icon) return '';
        return `<span class="boss-icon" aria-hidden="true" style="background-image:url('assets/boss-icons-${icon[0]}.png');background-position:-${icon[1]}px -${icon[2]}px"></span>`;
      }
      function amount(value) {
        const n = Number(value);
        return Number.isFinite(n) && n > 0 ? n : 0;
      }
      function normalizeBossFields(item) {
        const boss = BOSS_DATA.find(candidate => candidate.id === item.bossId);
        const mode = boss?.modes.find(candidate => candidate[0] === item.difficulty);
        if (!boss || !mode) return {};
        const rawPrice = Number(item.priceMeso);
        const priceMeso = Number.isFinite(rawPrice) && rawPrice > 0 ? Math.floor(rawPrice) : mode[1];
        const rawPartySize = Number(item.partySize);
        const partySize = Number.isFinite(rawPartySize) ? Math.max(1, Math.min(6, Math.floor(rawPartySize))) : 1;
        const lootIds = Array.isArray(item.lootIds) ? item.lootIds.filter(name => typeof name === 'string' && name.length > 0 && name.length <= 100).map(canonicalLootName) : [];
        const blackBoxItem = lootIds.includes(CHAOS_BLACK_BOX) && CHAOS_BLACK_BOX_ITEMS.includes(item.blackBoxItem) ? item.blackBoxItem : '';
        const lootQuantities = Object.fromEntries(Object.entries(item.lootQuantities && typeof item.lootQuantities === 'object' && !Array.isArray(item.lootQuantities) ? item.lootQuantities : {}).filter(([name]) => typeof name === 'string' && name.length > 0 && name.length <= 100).map(([name, count]) => [canonicalLootName(name), Math.min(99999, shardCount(count))]));
        return { ...recordMetadata(item), bossId: boss.id, difficulty: mode[0], priceMeso, partySize, lootIds: [...new Set(lootIds)], lootQuantities, blackBoxItem, ...(boss.id === 'black-mage' && /^\d{4}-(0[1-9]|1[0-2])$/.test(item.settlementMonth || '') ? { settlementMonth: item.settlementMonth } : {}) };
      }
      function showBossReward(name) {
        const excludedRewards = [
          '가디언 엔젤 링', '여명의 가디언 엔젤 링', '트와일라이트 마크', '에스텔라 이어링', '데이브레이크 펜던트',
          '특수형 에너지 코어(S급)', '뒤틀린 낙인의 영혼석', '나비날개 물방울석', '코브웹 물방울석'
        ];
        return !REMOVED_LOOT_ITEMS.has(name) && !name.includes('보스 반지 상자') && !name.endsWith('로이드') && !/아케인|앱솔/.test(name) && !excludedRewards.includes(name);
      }
      function getBossLoot(boss, difficulty) {
        const rewards = BOSS_REWARDS[boss.id];
        if (!rewards || !Object.hasOwn(rewards.modes, difficulty)) return [];
        const loot = [...rewards.common, ...rewards.modes[difficulty]];
        if (ERION_REWARD_MODES[boss.id]?.includes(difficulty)) loot.push('에리온의 조각 교환권');
        const box = BOSS_RING_BOXES[boss.id]?.[difficulty];
        if (box && box !== '녹옥') loot.push(...LEVEL_FOUR_RINGS);
        return [...new Set(loot.map(canonicalLootName))].filter(showBossReward);
      }
      function mesoToEok(meso, partySize = 1) {
        return Math.floor(Number(meso) / Math.max(1, Number(partySize) || 1)) / 100000000;
      }
      function formatBossPrice(meso) { return `${fmt(Number(meso) / 100000000)}억`; }
      function shardCount(value) {
        const n = Number(value);
        return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
      }
      function fmtWon(mesoEok) { return `₩${Math.round(amount(mesoEok) * data.settings.wonPerEok).toLocaleString('ko-KR')}`; }
      function fmt(value) {
        return amount(value).toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
      }
      function entries(character, type) {
        return character.items.filter(item => item.type === type && (type === 'hunt' ? item.date === view.day : item.bossId === 'black-mage' ? item === bossRecord(character, 'black-mage') : item.weekStart === view.week));
      }
      const LINKED_LOOT_PRICES = {
        ...Object.fromEntries(Object.entries(INITIAL_LOOT_PRICES).filter(([, price]) => price === 0.0125 || price === 0.025).map(([name, price]) => [name, { base: '모상하견 상자', divisor: price === 0.0125 ? 20 : 10 }])),
        ...Object.fromEntries(['뒤틀린 갈망의 편린', '영원한 충성의 흔적', '왜곡된 욕망의 결정', '저주받은 원혼의 잔재'].map(name => [name, { base: '장신망 상자', divisor: 10 }]))
      };
      const BOX_SEARCH_NAMES = { '장신망 상자': '에테르넬 메이지슈즈', '모상하견 상자': '에테르넬 메이지로브' };
      function lootPrice(name) {
        if (REMOVED_LOOT_ITEMS.has(name)) return 0;
        const rule = LINKED_LOOT_PRICES[name];
        return rule ? Math.round(amount(data.settings.lootPrices?.[rule.base]) / rule.divisor * 100000000) / 100000000 : amount(data.settings.lootPrices?.[name]);
      }
      function lootPriceInputValue(name, price = lootPrice(name)) {
        return data.settings.lootPriceUnits?.[name] === 'man' ? Number((price * 10000).toFixed(4)) : price;
      }
      function syncLinkedLootPrices() {
        let changed = false;
        for (const name of Object.keys(LINKED_LOOT_PRICES)) {
          const price = lootPrice(name);
          if (data.settings.lootPrices[name] !== price) { data.settings.lootPrices[name] = price; changed = true; }
          const input = document.querySelector(`[data-loot-price="${name}"]`);
          if (input) { input.value = lootPriceInputValue(name, price); input.readOnly = true; input.title = `${LINKED_LOOT_PRICES[name].base} 가격의 ${LINKED_LOOT_PRICES[name].divisor}분의 1 · 자동 계산`; }
        }
        for (const [name, searchName] of Object.entries(BOX_SEARCH_NAMES)) {
          const input = document.querySelector(`[data-loot-price="${name}"]`);
          if (input) input.title = `시세 검색: ${searchName}`;
        }
        if (changed) save();
      }
      function sum(items) { return items.reduce((total, item) => item.type === 'boss' && !bossIncomeEnabled(item) ? total : total + amount(item.amount) + (item.type === 'hunt' ? shardCount(item.shards) * data.settings.shardPriceMan * 10000 / 100000000 : 0), 0); }
      // Price-editor presentation categories; item identities and saved prices stay unchanged.
      const LOOT_PRICE_CATEGORIES = [
        {name:'칠흑', matches: name => [...CHAOS_BLACK_BOX_ITEMS, '미트라의 분노 선택 상자', '창세의 뱃지', '컴플리트 언더컨트롤'].includes(name)},
        {name:'익셉셔널 해머', matches: name => name.includes('익셉셔널')},
        {name:'에테르넬', matches: name => name.includes('에테르넬') || ['모상하견 상자', '장신망 상자'].includes(name)},
        {name:'자동 계산 재료', matches: name => Object.hasOwn(LINKED_LOOT_PRICES, name)},
        {name:'광휘', matches: name => ['굶주리는 핏빛 원혼', '근원의 속삭임', '불멸의 유산', '오만의 원죄', '죽음의 맹세', '황홀한 악몽'].includes(name)},
        {name:'시드링 · 연마석', matches: name => name.includes(' 링 ') || name.includes('연마석') || name.includes('소울 에테르')},
        {name:'기타', matches: () => true}
      ];
      function renderLootPriceSettings() {
        const names = [...new Set(BOSS_DATA.flatMap(boss => boss.modes.flatMap(([difficulty]) => getBossLoot(boss, difficulty))).concat(CHAOS_BLACK_BOX_ITEMS))].filter(name => name !== CHAOS_BLACK_BOX && !name.includes('보스 반지 상자')).sort((a, b) => a.localeCompare(b, 'ko'));
        document.getElementById('loot-price-grid').innerHTML = `<details class="price-settings-guide"><summary>초기 가격 · 입력 단위 · 자동 계산 안내</summary><p>초기 가격: 2026.10.05 첨부 가격표 기준. 마도서 선택 상자는 45억 메소입니다. 모상하견은 2,500만, 장신망은 18억, 에리온의 조각 교환권은 개당 70만 메소로 초기 설정됩니다. 1억 미만으로 설정된 아이템은 만 메소 단위로 입력합니다. 예: 125 입력 → 125만 메소. 연결된 재료 가격은 상자 가격을 바꾸면 자동 계산됩니다. 0은 가격 미설정이며, 직접 수정한 가격은 저장됩니다.</p></details>` + (() => {
          const groups = LOOT_PRICE_CATEGORIES.map(category => ({...category, items:[]}));
          for (const name of names) groups.find(category => category.matches(name)).items.push(name);
          return groups.filter(category => category.items.length).map(category => `<h3 class="loot-price-category">${esc(category.name)}<small>${category.items.length}종</small></h3>` + category.items.map(name => {
          const unit = data.settings.lootPriceUnits?.[name] === 'man' ? '만' : '억';
          const linked = Object.hasOwn(LINKED_LOOT_PRICES, name);
          const displayName = ['모상하견 상자', '장신망 상자'].includes(name) ? name.replace(' 상자', '') : name;
          const linkedNote = linked ? `<small class="linked-price-note">${esc(LINKED_LOOT_PRICES[name].base.replace(' 상자', ''))} ÷ ${LINKED_LOOT_PRICES[name].divisor} · 자동 계산</small>` : '';
          return `<label class="loot-price-field"><span>${esc(displayName)}${linkedNote}${AUCTION_NO_LISTINGS.includes(name) && !lootPrice(name) ? '<small style="display:block;color:#adc5e1;margin-top:2px">조회 매물 없음 · 직접 설정</small>' : ''}</span><span><input type="number" min="0" step="${unit === '만' ? '0.0001' : '0.00000001'}" inputmode="decimal" data-loot-price="${esc(name)}" data-loot-price-unit="${unit === '만' ? 'man' : 'eok'}" value="${lootPriceInputValue(name) || ''}" placeholder="0" aria-label="${esc(displayName)} 가격 (${unit} 메소)" ${linked ? 'readonly' : ''}>${unit}</span></label>`;
        }).join('')).join('');
        })();
      }
      function acquisitionPriceText(name, record, quantityName = name) {
        if (!data.settings.showLootPrices || name.includes('보스 반지 상자')) return '';
        const price = lootPrice(name) * acquiredQuantity(record, quantityName);
        if (!price) return '<small>가격 미설정</small>';
        const size = Math.max(1, Number(record.partySize) || 1);
        const material = rewardDefinitions(record.bossId, record.difficulty).some(reward => reward.name === name);
        return `<small>${size > 1 && !material ? `전체 ${fmt(price)}억 메소 · 내 몫 ${fmt(price / size)}억 메소 (${size}명 균등 분배)` : `내 수익 ${fmt(price)}억 메소`}</small>`;
      }
      function sumShards(items) { return items.reduce((total, item) => total + shardCount(item.shards), 0); }
      function lootIncome(records) {
        let total = 0;
        for (const record of records) {
          if (!record.bossId || !bossIncomeEnabled(record)) continue;
          const definitions = rewardDefinitions(record.bossId, record.difficulty);
          const names = [...new Set([...(record.lootIds || []), ...automaticRewards(record).map(reward => reward.name)])];
          for (const original of names) {
            if (!showBossReward(original)) continue;
            const name = original === CHAOS_BLACK_BOX && record.blackBoxItem ? record.blackBoxItem : original;
            const material = definitions.some(reward => reward.name === original);
            const divisor = material ? 1 : Math.max(1, Number(record.partySize) || 1);
            total += lootPrice(name) * acquiredQuantity(record, original) / divisor;
          }
        }
        return total;
      }
      function shardMesoText(count) { return `${fmt(count * data.settings.shardPriceMan / 10000)}억 메소`; }
      function categorySection(character, type, label, emoji) {
        const list = entries(character, type);
        const manualList = type === 'boss' ? list.filter(item => !item.bossId) : list;
        const emptyText = type === 'boss' ? '선택한 주에 기록된 보스 수익이 없습니다.' : '선택한 날짜에 기록된 사냥 수익이 없습니다.';
        const rows = manualList.length ? manualList.map(item => `
          <div class="entry-row ${type === 'hunt' ? 'hunt-row' : 'boss-row'}" data-entry="${esc(item.id)}">
            ${type === 'boss' ? `<input class="entry-input" data-field="label" aria-label="${label} 항목 이름" value="${esc(item.label)}" placeholder="항목 이름">` : ''}
            <input class="entry-input amount" data-field="amount" aria-label="${label} 메소 수익 (억 메소)" type="number" min="0" step="${type === 'hunt' ? '1' : '0.01'}" inputmode="decimal" value="${amount(item.amount) || ''}" placeholder="억 메소">
            ${type === 'hunt' ? `<input class="entry-input amount shards" data-field="shards" aria-label="사냥 솔 에르다 조각 개수" type="number" min="0" step="1" inputmode="numeric" value="${shardCount(item.shards) || ''}" placeholder="조각 수">` : ''}
          ${type === 'boss' ? '<button class="delete-entry" data-action="delete-entry" title="항목 삭제" aria-label="항목 삭제">×</button>' : ''}
          </div>`).join('') : (type === 'boss' && list.some(item => item.bossId) ? '' : `<div class="empty-entries">${emptyText}</div>`);
        const total = sum(list);
        return `<div class="income-section" data-category="${type}">
          <div class="income-head"><div class="income-name"><span class="emoji">${emoji}</span>${label}</div><div class="income-sums"><span class="income-total">합계 <b data-category-total="${type}">${fmt(total)}</b>억</span><span class="income-won" data-category-won="${type}">${fmtWon(total)}</span>${type === 'hunt' ? `<span class="income-shards"><b data-category-shards>${sumShards(list)}</b>개 조각</span>` : ''}</div></div>
          ${type === 'boss' ? `<label class="boss-week-completion"><input type="checkbox" data-boss-week-completed ${weeklyAllCompleted(character, view.week) ? 'checked' : ''} aria-label="${esc(character.name)} 선택 주 보스 완료"><strong>${weeklyAllCompleted(character, view.week) ? '주간 보스 완료' : '주간 보스 미완료'}</strong><small>선택 주 · 완료 체크 시 수익 반영</small></label>` : ''}
          ${type === 'boss' ? `<div class="month-navigation"><strong>${esc(view.month.replace('-', '년 '))}월 · 월간 정산 기준</strong></div><label class="boss-week-completion"><input type="checkbox" data-black-mage-completed ${blackMageMonthCompleted(character, view.blackMageMonth) ? 'checked' : ''} ${bossRecord(character, 'black-mage') ? '' : 'disabled'} aria-label="${esc(character.name)} 검은 마법사 월간 완료"><strong>검은 마법사 ${blackMageMonthCompleted(character, view.blackMageMonth) ? '완료' : '미완료'}</strong><small>${bossRecord(character, 'black-mage') ? '월간 · 주간 완료와 별도 정산' : '검은 마법사 난이도를 먼저 선택하세요'}</small></label>` : ''}
          ${type === 'hunt' && manualList.length ? '<div class="hunt-input-caption"><span>메소 (억 메소)</span><span>솔 에르다 조각 (개)</span></div>' : ''}
          <div class="entry-list">${rows}</div>
          ${type === 'boss' ? bossTracker(character) : ''}
        </div>`;
      }
      function bossTracker(character) {
        const count = BOSS_DATA.filter(boss => bossRecord(character, boss.id) || character.bossPresets?.[boss.id]?.difficulty).length;
        const showAll = !count || !!grid.querySelector(`[data-character="${CSS.escape(character.id)}"] .boss-tracker.show-all-bosses`);
        const cards = [...BOSS_DATA].sort((a, b) => Number(Boolean(b.period)) - Number(Boolean(a.period))).map((boss, index) => {
          const record = bossRecord(character, boss.id);
          const selectedDifficulty = record?.difficulty || character.bossPresets?.[boss.id]?.difficulty;
          const monthlySettledElsewhere = boss.period === '월간' && blackMageMonthCompleted(character, view.blackMageMonth);
          const periodTag = boss.period ? `${boss.period} · ${monthlySettledElsewhere ? '이번 달 정산 완료 · 설정 유지' : '별도 월간 완료 체크 시 정산'}` : '';
          const personalPrice = record ? Math.floor(Number(record.priceMeso) / record.partySize) : 0;
          const modes = boss.modes.map(([difficulty, price]) => `
            <label class="boss-mode">
              <input type="checkbox" data-action="toggle-boss" data-boss-id="${boss.id}" data-difficulty="${difficulty}" ${selectedDifficulty === difficulty ? 'checked' : ''} aria-label="${boss.name} ${difficulty} 처치">
              <span>${difficulty}</span><small>${formatBossPrice(price)}</small>
            </label>`).join('');
          const loot = record ? `
            <div class="boss-clear-info">
              <span class="boss-clear-amount" data-clear-price="${boss.id}">인당 ${personalPrice.toLocaleString('ko-KR')} 메소 · ${fmt(mesoToEok(record.priceMeso, record.partySize))}억</span>
              <label class="party-size-field">파티 인원
                <select data-party-size data-boss-id="${boss.id}" aria-label="${boss.name} 파티 인원">
                  ${[1, 2, 3, 4, 5, 6].map(size => `<option value="${size}" ${record.partySize === size ? 'selected' : ''}>${size}명</option>`).join('')}
                </select>
              </label>
            </div>

            <div class="boss-loot-title">획득 아이템은 맨 위 획득 목록에서 체크하세요.</div>` : '';
          return `${boss.period ? '<div class="boss-settings-period-heading">월간 보스 설정</div>' : index === 1 ? '<div class="boss-settings-period-heading">주간 보스 설정</div>' : ''}<section class="boss-item" data-boss-row="${boss.id}" data-boss-selected="${!!selectedDifficulty}">
            <div class="boss-item-head"><span class="boss-item-name">${bossIcon(boss.id)}${boss.name}</span>${periodTag ? `<span class="boss-period-tag">${periodTag}</span>` : ''}</div>
            <div class="boss-modes">${modes}</div>${loot}
          </section>`;
        }).join('');
        return `<details class="boss-tracker${showAll ? ' show-all-bosses' : ''}" data-boss-tracker>
          <summary>보스 처치 체크 <span class="boss-tracker-count" data-boss-count>${count}개 선택</span></summary>
          <div class="boss-tracker-content">
            <div class="boss-list-filter"><span>선택한 보스 ${count}개 · 획득 체크는 맨 위 목록에서</span><button type="button" data-action="toggle-all-bosses">${showAll ? '선택한 보스만 보기' : '전체 보스 보기 / 추가'}</button></div>
            <p class="boss-tracker-note">난이도·파티 인원 설정은 유지됩니다. 주간 보스와 검은 마법사는 각각 완료 체크 시 결정 수익에 반영됩니다. 물욕템 체크·실제 획득 수량 입력은 맨 위 획득 목록에서 하세요.</p>
            <div class="boss-list">${cards}</div>
            <div class="boss-collapse-bar"><button class="boss-collapse-button" type="button" data-action="collapse-boss-tracker">⌃ 보스 처치 목록 접기</button></div>
            <div class="boss-source-note">2026.10.05 확인 · 선택한 난이도의 물욕템·주요 재료·반지 상자를 표시합니다. 개인 지급과 파티 공용 재료를 구분하며, 공용 재료는 솔로 전량 / 파티 실제 획득량으로 기록합니다. 에리온의 조각 교환권은 교환 후 조각 수 기준으로 입력합니다. 에리온의 기본 수량은 익스트림 카링 480개, 하드 벨로나 100개를 적용했습니다. 일부 자료에 400개·90개로 기재되어 있어 실제 게임 수량이 다르면 획득 수량을 수정하세요. 4레벨 반지는 상자를 개봉한 결과로 체크하며, 직접 드롭되는 반지가 아닙니다. 혼돈의 칠흑 장신구 상자는 실제 나온 1종을 선택하세요. 일반 소비템·큐브·퀘스트 지급품은 생략했습니다. 보상 목록과 다른 기존 체크는 ‘이전 기록’으로 보존합니다.<br>출처: <a href="https://maplestory.nexon.com/guide/n23gameinformation/articles/459" target="_blank" rel="noopener noreferrer">넥슨 주요 보상</a> · <a href="https://maplestory.nexon.com/news/update/779" target="_blank" rel="noopener noreferrer">재료·연마석 개편</a> · <a href="https://maplestory.nexon.com/news/update/813" target="_blank" rel="noopener noreferrer">소울 에테르</a> · <a href="https://matsu1207.tistory.com/937" target="_blank" rel="noopener noreferrer">난이도별 보상 대조</a></div>
          </div>
        </details>`;
      }
      // Exact item names are matched to Nexon Open API item icons.
      const ITEM_ICONS = {
        "루즈 컨트롤 머신 마크": "assets/item-KEPDJBND.png",
        "마력이 깃든 안대": "assets/item-KEPAJFJJ.png",
        "커맨더 포스 이어링": "assets/item-KEPBJEPH.png",
        "몽환의 벨트": "assets/item-KEOBJEOJ.png",
        "고통의 근원": "assets/item-KEOAJDNB.png",
        "죽음의 맹세": "assets/item-KEOAJDKG.png",
        "리스트레인트 링 4레벨": "assets/item-KEODIHHJ.png",
        "컨티뉴어스 링 4레벨": "assets/item-KEODIEMI.png",
        "거대한 공포": "assets/item-KEODIEOH.png",
        "황홀한 악몽": "assets/item-KEODIEIB.png",
        "근원의 속삭임": "assets/item-KEODIEKA.png",
        "불멸의 유산": "assets/item-KEOGIDJA.png",
        "창세의 뱃지": "assets/item-KEOKJFGE.png",
        "컴플리트 언더컨트롤": "assets/item-KEJFJHHE.png"
};
      Object.assign(ITEM_ICONS, {
        '생명의 연마석': 'assets/item-life-grindstone.png'
      });
      // Reward-sheet images from the official boss guide; each entry is a 40px tile.
      const REWARD_ITEM_ICONS = {
        '에리온의 조각 교환권': ['0cc49a5b4da1774c',869,719,147],
        '루인 포스실드': ['c5d175d9c0bf0b22',460,15,46],
        '저주받은 마도서 선택 상자': ['7243260b9a92dfd1',600,498,43],
        '거울세계의 코어 젬스톤': ['7243260b9a92dfd1',600,406,89],
        '미트라의 분노 선택 상자': ['65d8c5d8a9e3ac36',698,256,44],
        '미트라의 코어 젬스톤': ['65d8c5d8a9e3ac36',698,351,44],
        '남겨진 칼로스의 의지 조각': ['0cc49a5b4da1774c',869,230,46],
        '남겨진 칼로스의 의지': ['0cc49a5b4da1774c',869,499,46],
        '모상하견 상자': ['0cc49a5b4da1774c',869,449,46],
        '이어진 고대의 결의': ['b01d456d6ca46a31',851,537,45],
        '이어진 고대의 결의 조각': ['b01d456d6ca46a31',851,224,45],
        '1단계 소울 에테르': ['b01d456d6ca46a31',851,485,143],
        '뒤엉킨 흉수의 고리': ['ff016e9da310997a',847,485,42],
        '뒤엉킨 흉수의 고리 조각': ['ff016e9da310997a',847,222,44],
        '혼돈의 칠흑 장신구 상자': ['ff016e9da310997a',847,326,92],
        '황홀한 환상의 단편 조각': ['b018af4cea867cd3',453,11,46],
        '황홀한 환상의 단편': ['b018af4cea867cd3',453,347,46],
        '2단계 소울 에테르': ['b018af4cea867cd3',453,11,143],
        '굶주리는 핏빛 원혼': ['19bb206f401f2ad5',659,456,44],
        '저주받은 원혼의 잔재': ['19bb206f401f2ad5',659,233,44],
        '신념의 연마석': ['53fc53bb9765cfb2',460,403,102],
        '왜곡된 욕망의 결정': ['53fc53bb9765cfb2',460,15,50],
        '장신망 상자': ['53fc53bb9765cfb2',460,306,50],
        '3단계 소울 에테르': ['53fc53bb9765cfb2',460,163,102],
        '영원한 충성의 흔적': ['15ee52f72365db6e',454,13,46],
        '오만의 원죄': ['656144a06299ee04',453,255,47],
        '뒤틀린 갈망의 편린': ['656144a06299ee04',453,13,47],
        '4단계 소울 에테르': ['656144a06299ee04',453,14,147],
        '익셉셔널 해머 (벨트)': ['854c020fa2b97fdd',461,258,48],
        '익셉셔널 해머 (얼굴장식)': ['65d8c5d8a9e3ac36',698,499,44],
        '익셉셔널 해머 (눈장식)': ['0cc49a5b4da1774c',869,669,46],
        '익셉셔널 해머 (귀고리)': ['ff016e9da310997a',847,435,42],
        '익셉셔널 해머 (훈장)': ['b01d456d6ca46a31',851,650,45]
      };
      function itemIcon(name) {
        const icon = ITEM_ICONS[name];
        if (icon) return `<span class="item-icon" aria-hidden="true" style="background-image:url('${icon}')"></span>`;
        const tile = REWARD_ITEM_ICONS[name];
        if (tile) return `<span class="item-icon" aria-hidden="true" style="background-image:url('assets/rewards-${tile[0]}.png');background-size:${tile[1] * .7}px auto;background-position:-${tile[2] * .7}px -${tile[3] * .7}px"></span>`;
        return `<span class="item-icon generic" aria-hidden="true">${/상자/.test(name) ? '▣' : /해머/.test(name) ? '⚒' : '◆'}</span>`;
      }
      function itemSummary(records, includePending = false) {
        const totals = new Map();
        for (const record of records) {
          if (!record.bossId) continue;
          const completed = bossIncomeEnabled(record);
          if (!includePending && !completed) continue;
          const names = [...new Set([...(record.lootIds || []), ...automaticRewards(record).map(reward => reward.name)])];
          for (const original of names) {
            if (!showBossReward(original)) continue;
            const count = acquiredQuantity(record, original);
            if (!count) continue;
            const name = original === CHAOS_BLACK_BOX && record.blackBoxItem ? record.blackBoxItem : original;
            const pending = !completed && isAutomaticReward(record, original);
            const personalReward = rewardDefinitions(record.bossId, record.difficulty).some(reward => reward.name === original && reward.scope === 'personal');
            const partySize = personalReward ? 0 : Math.max(1, Math.min(6, Number(record.partySize) || 1));
            const key = name + '|' + pending + '|' + partySize;
            const entry = totals.get(key) || {name, count: 0, pending, partySize};
            entry.count += count;
            totals.set(key, entry);
          }
        }
        return totals.size ? `<span class="item-summary">${[...totals.values()].map(item => {
          const unitPrice = lootPrice(item.name);
          const priceLabel = unitPrice ? `${fmt(unitPrice * item.count)}억 메소` : '가격 미설정';
          const price = data.settings.showLootPrices ? `<span class="item-summary-price">${priceLabel}</span>` : '';
          const party = item.partySize > 1 ? `<span class="item-summary-party">${item.partySize}명</span>` : '';
          const partyLabel = item.partySize > 1 ? ` · ${item.partySize}명 파티` : item.partySize === 0 ? ' · 개인 지급' : ' · 솔로';
          return `<span class="item-summary-token${item.pending ? ' pending' : ''}" title="${esc(item.name)} · ${item.count}개${partyLabel}${item.pending ? ' 예정' : ''}${data.settings.showLootPrices ? ` · ${priceLabel}` : ''}" aria-label="${esc(item.name)} ${item.count}개${partyLabel}${item.pending ? ' 예정' : ''}${data.settings.showLootPrices ? ` ${priceLabel}` : ''}">${itemIcon(item.name)}<span class="item-summary-value"><b>×${item.count.toLocaleString('ko-KR')}${party}</b>${price}</span></span>`;
        }).join('')}</span>` : '<span class="item-summary-empty">획득 아이템 없음</span>';
      }
      function renderPeriodItemSummaries() {
        const weekly = data.characters.flatMap(character => entries(character, 'boss'));
        const monthly = data.characters.flatMap(character => character.items.filter(item => item.type === 'boss' && (item.bossId === 'black-mage' ? bossMonth(item) : String(item.weekStart).slice(0, 7)) === view.month));
        const blackMage = weekly.filter(record => record.bossId === 'black-mage');
        document.getElementById('weekly-loot-summary').innerHTML = itemSummary(weekly.filter(record => record.bossId !== 'black-mage'));
        document.getElementById('black-mage-loot-summary').innerHTML = itemSummary(blackMage);
        const monthlyBlackMage = monthly.filter(record => record.bossId === 'black-mage');
        document.getElementById('monthly-loot-summary').innerHTML = itemSummary(monthly.filter(record => record.bossId !== 'black-mage')) + (monthlyBlackMage.length ? `<div class="black-mage-summary"><div class="summary-loot-title">검은 마법사 · 월간</div>${itemSummary(monthlyBlackMage)}</div>` : '');
      }
      function blackBoxPicker(character, record) {
        if (!(record.lootIds || []).includes(CHAOS_BLACK_BOX)) return '';
        return `<div class="black-box-choice"><div class="black-box-choice-title">칠흑 상자에서 나온 아이템 선택</div><div class="black-box-options">${CHAOS_BLACK_BOX_ITEMS.map(name => `<label><input type="radio" name="ledger-black-box-${esc(character.id)}-${record.bossId}" data-black-box-item data-boss-id="${record.bossId}" value="${esc(name)}" ${record.blackBoxItem === name ? 'checked' : ''}><span>${esc(name)}${record.blackBoxItem === name ? acquisitionPriceText(name, record, CHAOS_BLACK_BOX) : ''}</span></label>`).join('')}</div></div>`;
      }
      // Presentation state only; no changes to character or settlement storage.
      const bossListExpanded = new Map();
      const bossListShowAll = new Map();
      document.addEventListener('click', event => {
        const button = event.target.closest('[data-boss-list-all]');
        if (!button) return;
        const characterId = button.closest('[data-character]')?.dataset.character;
        bossListShowAll.set(characterId, !bossListShowAll.get(characterId));
        bossListExpanded.set(characterId, true);
        renderAcquisitionLedger();
      });
      document.addEventListener('toggle', event => {
        const panel = event.target;
        if (panel.matches?.('details.boss-completion-panel') && panel.isConnected) {
          bossListExpanded.set(panel.dataset.bossListCharacter, panel.open);
        }
      }, true);
      function bossCompletionPanel(character, records) {
        const showAll = bossListShowAll.get(character.id) === true;
        const completed = records.filter(bossIncomeEnabled).length;
        return `<details class="boss-completion-panel" data-boss-list-character="${esc(character.id)}" ${bossListExpanded.get(character.id) === true ? 'open' : ''}><summary class="boss-completion-heading"><strong>보스별 완료 체크 · 빠른 설정</strong><span>${completed} / ${records.length} 완료</span><span class="boss-list-toggle" aria-hidden="true"></span></summary><div class="boss-list-mode"><span>${showAll ? '전체 보스 설정' : '설정한 보스만 표시'}</span><button type="button" class="button small" data-boss-list-all>${showAll ? '설정한 보스만 보기' : '＋ 전체 보스 수정'}</button></div>${!records.length && !showAll ? '<p>설정한 주간 보스가 없습니다. 전체 보스 수정에서 추가하세요.</p>' : ''}<div class="boss-completion-grid">${BOSS_DATA.filter(boss => !boss.period && (showAll || records.some(record => record.bossId === boss.id))).map(boss => {
          const record = records.find(item => item.bossId === boss.id);
          const done = record && bossIncomeEnabled(record);
          return `<div class="boss-completion-option${done ? ' completed' : ''}${record ? '' : ' unconfigured'}"><label class="boss-quick-status"><input type="checkbox" data-boss-record-completed data-boss-id="${esc(boss.id)}" ${done ? 'checked' : ''} ${record ? '' : 'disabled'} aria-label="${esc(boss.name)} 완료">${bossIcon(boss.id)}<span><strong>${esc(boss.name)}</strong><small>${record ? (done ? (NexonBridge.source(character,record)==='nexon_api' ? '완료 · API 자동' : '완료 · 수동') : '미완료') : '보스 미설정'}</small></span></label><div class="boss-quick-fields"><label>난이도<select data-boss-difficulty data-boss-id="${boss.id}" aria-label="${esc(boss.name)} 난이도"><option value="">선택 안 함</option>${boss.modes.map(([mode]) => `<option value="${esc(mode)}" ${record?.difficulty === mode ? 'selected' : ''}>${esc(mode)}</option>`).join('')}</select></label><label>파티 인원<select data-party-size data-boss-id="${boss.id}" ${record ? '' : 'disabled'} aria-label="${esc(boss.name)} 파티 인원">${[1,2,3,4,5,6].map(size => `<option value="${size}" ${record?.partySize === size ? 'selected' : ''}>${size === 1 ? '솔로' : `${size}명`}</option>`).join('')}</select></label></div></div>`;
        }).join('')}</div><p>난이도를 선택해 보스를 추가하고, 잡은 보스만 완료 체크하세요. 파티 인원 변경은 분배 금액에 바로 반영됩니다.</p></details><label class="boss-all-completion"><input type="checkbox" data-boss-week-completed ${weeklyAllCompleted(character, view.week) ? 'checked' : ''} ${records.length ? '' : 'disabled'}><span>주간 보스 전체 완료<small>체크하면 모두 완료 · 해제하면 모두 미완료</small></span></label>`;
      }
      function blackMageQuickSettings(record) {
        const boss = BOSS_DATA.find(item => item.id === 'black-mage');
        return `<div class="black-mage-quick-fields"><label>검은 마법사 난이도<select data-boss-difficulty data-boss-id="black-mage"><option value="">선택 안 함</option>${boss.modes.map(([mode]) => `<option value="${esc(mode)}" ${record?.difficulty === mode ? 'selected' : ''}>${esc(mode)}</option>`).join('')}</select></label><label>파티 인원<select data-party-size data-boss-id="black-mage" ${record ? '' : 'disabled'}>${[1,2,3,4,5,6].map(size => `<option value="${size}" ${record?.partySize === size ? 'selected' : ''}>${size === 1 ? '솔로' : `${size}명`}</option>`).join('')}</select></label></div>`;
      }
      function renderAcquisitionLedger() {
        document.getElementById('show-loot-prices').checked = data.settings.showLootPrices;
        const list = document.getElementById('loot-ledger-list');
        const scrollPositions = new Map([...list.querySelectorAll('[data-ledger-character]')].map(group => [group.dataset.character, {scope:group.dataset.ledgerScope, top:group.querySelector('.ledger-scroll')?.scrollTop || 0}]));
        list.querySelectorAll('[data-ledger-character]').forEach(group => {
          const character = data.characters.find(item => item.id === group.dataset.character);
          if (character) character.ledgerExpanded = group.open;
        });
        document.getElementById('loot-ledger-period').textContent = `${weekRangeLabel(view.week)} · 검은 마법사 ${view.blackMageMonth}`;
        const groups = data.characters.map(character => {
          const records = entries(character, 'boss').filter(record => record.bossId);
          const weeklyRecords = records.filter(record => record.bossId !== 'black-mage');
          const monthlyRecords = records.filter(record => record.bossId === 'black-mage');
          const bossRows = selectedRecords => selectedRecords.map(record => {
            const boss = BOSS_DATA.find(candidate => candidate.id === record.bossId);
            const currentLoot = getBossLoot(boss, record.difficulty);
            const availableLoot = [...new Set([...currentLoot, ...(record.lootIds || [])])].filter(name => showBossReward(name) && !isAutomaticReward(record, name));
            const fixedItems = automaticRewards(record).map(reward => `<div class="ledger-fixed-item"><span class="loot-chip fixed-reward">${esc(reward.name)} · ${acquiredQuantity(record, reward.name)}개${reward.unitNote ? ' (조각 기준)' : ''}${acquiredQuantity(record, reward.name) ? acquisitionPriceText(reward.name, record) : ''}</span>${quantityInput(record, reward.name, true)}</div>`);
            return `<div class="loot-ledger-row"><span class="loot-ledger-boss"><span class="boss-name-with-icon">${bossIcon(record.bossId)}<span>${esc(boss?.name || record.bossId)} · ${esc(record.difficulty)}</span></span><label class="ledger-party-control">파티<select data-party-size data-boss-id="${record.bossId}" aria-label="${esc(boss.name)} 파티 인원">${[1,2,3,4,5,6].map(size => `<option value="${size}" ${record.partySize === size ? 'selected' : ''}>${size === 1 ? '솔로' : `${size}명`}</option>`).join('')}</select></label>${record.bossId !== 'black-mage' ? `<label class="ledger-boss-completed"><input type="checkbox" data-boss-record-completed data-boss-id="${record.bossId}" ${bossIncomeEnabled(record) ? 'checked' : ''} aria-label="${esc(boss.name)} 완료">${bossIncomeEnabled(record) ? (NexonBridge.source(character,record)==='nexon_api'?'완료 · API 자동':'완료 · 수동') : '미완료'}</label>` : ''}</span><div class="ledger-boss-rewards">${fixedItems.length ? `<div class="ledger-reward-group"><span class="ledger-reward-label">확정 재료${bossIncomeEnabled(record) ? '' : ' · 예정'}</span>${fixedItems.join('')}</div>` : ''}${availableLoot.length ? `<div class="boss-loot-title">획득한 아이템을 여기서 체크하세요</div><div class="boss-loot">${availableLoot.map(name => lootEntry(record, name, currentLoot)).join('')}</div>` : ''}${blackBoxPicker(character, record)}</div></div>`;
          }).join('');
          const blackRecord = bossRecord(character, 'black-mage');
          return `<details class="loot-character-group" data-ledger-character data-ledger-scope="${esc(view.week)}|${esc(view.blackMageMonth)}" data-character="${esc(character.id)}" ${character.ledgerExpanded !== false ? 'open' : ''}><summary><span>${esc(character.name)}</span><span class="character-loot-preview">${weeklyRecords.length ? `<span class="ledger-preview-section"><small>주간</small>${itemSummary(weeklyRecords, true)}</span>` : ''}${monthlyRecords.length ? `<span class="ledger-preview-section"><small>검은 마법사 · 월간</small>${itemSummary(monthlyRecords, true)}</span>` : ''}</span></summary><div class="ledger-scroll">${bossCompletionPanel(character, weeklyRecords)}${bossRows(weeklyRecords)}${`<section class="ledger-monthly-section"><div class="ledger-monthly-heading">월간 보스 · ${esc(view.blackMageMonth)}</div>${blackMageQuickSettings(blackRecord)}<div class="ledger-completion-controls"><label><input type="checkbox" data-black-mage-completed ${blackRecord ? '' : 'disabled'} ${blackMageMonthCompleted(character, view.blackMageMonth) ? 'checked' : ''}>검은 마법사 완료${blackRecord && bossIncomeEnabled(blackRecord) ? (NexonBridge.source(character,blackRecord)==='nexon_api'?' · API 자동':' · 수동') : ''}</label></div>${bossRows(monthlyRecords)}</section>`}</div><div class="ledger-close-bar"><button type="button" data-action="collapse-ledger">⌃ 캐릭터 정산 접기</button></div></details>`;
        }).filter(Boolean);
        renderPeriodItemSummaries();
        list.innerHTML = groups.length ? groups.join('') : '<div class="loot-ledger-empty">아래 보스 처치 체크에서 난이도를 선택하면 여기서 획득 아이템을 체크할 수 있습니다.</div>';
        dashboard?.applySelection();
        list.querySelectorAll('[data-ledger-character]').forEach(group => {
          const previous = scrollPositions.get(group.dataset.character);
          if (previous?.scope === group.dataset.ledgerScope) group.querySelector('.ledger-scroll').scrollTop = previous.top;
        });
      }
      function applyBossPresetsToWeek() {
        let changed = false;
        for (const character of data.characters) {
          for (const [bossId, preset] of Object.entries(character.bossPresets || {})) {
            const boss = BOSS_DATA.find(candidate => candidate.id === bossId);
            const mode = boss?.modes.find(candidate => candidate[0] === preset.difficulty);
            if (!boss || !mode) continue;
            const existing = bossRecord(character, boss.id);
            if (existing) continue;
            const partySize = Math.max(1, Math.min(6, Number(preset.partySize) || 1));
            const next = {
              id: uid(), type: 'boss', label: `${boss.name} ${mode[0]} 결정`, amount: mesoToEok(mode[1], partySize),
              weekStart: view.week, bossId: boss.id, difficulty: mode[0], priceMeso: mode[1], partySize, lootIds: [], blackBoxItem: ''
            };
            if (boss.id === 'black-mage') next.settlementMonth = view.blackMageMonth;
            character.items.push(next);
            changed = true;
          }
        }
        if (changed) save();
      }
      function renderHuntEditor() {
        let changed = false;
        for (const character of data.characters) {
          const daily = entries(character, 'hunt');
          if (!daily.length) {
            character.items.push({ id: uid(), type: 'hunt', label: '', amount: 0, shards: 0, date: view.day });
            changed = true;
          } else if (daily.length > 1) {
            daily[0].amount = daily.reduce((total, item) => total + amount(item.amount), 0);
            daily[0].shards = sumShards(daily);
            const duplicateIds = new Set(daily.slice(1).map(item => item.id));
            character.items = character.items.filter(item => !duplicateIds.has(item.id));
            changed = true;
          }
        }
        if (changed) save();
        document.getElementById('hunt-editor-date').textContent = view.day;
        document.getElementById('hunt-character-grid').innerHTML = data.characters.length ? data.characters.map(character => `<div class="hunt-character-section" data-character="${esc(character.id)}"><strong data-hunt-character-name>${esc(character.name)}</strong>${categorySection(character, 'hunt', '사냥 수익', '⚔️')}</div>`).join('') : '<div class="empty-entries">캐릭터를 추가하면 이곳에서 일일 사냥 수익을 입력할 수 있습니다.</div>';
      }
      function render() {
        applyBossPresetsToWeek();
        renderLootPriceSettings();
        syncLinkedLootPrices();
        const openTrackers = new Set([...grid.querySelectorAll('[data-boss-tracker][open]')].map(node => node.closest('[data-character]')?.dataset.character).filter(Boolean));
        document.getElementById('daily-date').value = view.day;
        document.getElementById('boss-week-date').value = view.week;
        document.getElementById('boss-week-range').textContent = weekRangeLabel(view.week);
        document.getElementById('won-per-eok').value = data.settings.wonPerEok;
        document.getElementById('shard-price-man').value = data.settings.shardPriceMan;
        document.getElementById('character-count').textContent = data.characters.length;
        renderAcquisitionLedger();
        renderHuntEditor();
        if (!data.characters.length) {
          grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🍁</div><h4>첫 캐릭터를 등록해 보세요</h4><p>캐릭터별 수익을 모아 전체 정산을 시작할 수 있어요.</p><button class="button primary" data-action="add-character" type="button">＋ 캐릭터 추가</button></div>`;
        } else {
          grid.innerHTML = data.characters.map(character => {
            return `<article class="character-card" data-character="${esc(character.id)}">
              <div class="character-head">
                <div class="character-title-wrap"><input class="character-title" data-field="character-name" aria-label="캐릭터 이름" value="${esc(character.name)}" maxlength="24"><div class="character-subtitle">캐릭터 이름 · 주간/월간 보스 설정</div></div>
              </div>
              <div class="character-profile-fields"><label>직업<select data-character-job aria-label="${esc(character.name)} 직업">${JobCatalog.options(character.job)}</select></label><label>레벨<input data-character-level type="number" min="1" max="300" step="1" value="${character.level || ''}" placeholder="미입력" aria-label="${esc(character.name)} 레벨"></label></div>
              <div class="character-management-actions"><button class="button small" data-action="edit-character-bosses" type="button">⚙ 보스 수정</button><button class="button small danger" data-action="delete-character" type="button" aria-label="${esc(character.name)} 캐릭터 삭제">캐릭터 삭제</button></div>
              ${bossTracker(character)}
            </article>`;
          }).join('');
          for (const characterId of openTrackers) {
            grid.querySelector(`[data-character="${CSS.escape(characterId)}"] [data-boss-tracker]`)?.setAttribute('open', '');
          }
        }
        updateTotals();
      }
      function updateTotals() {
        let boss = 0, hunt = 0, huntMeso = 0, shards = 0;
        for (const character of data.characters) {
          const bossItems = entries(character, 'boss');
          const huntItems = entries(character, 'hunt');
          const b = sum(bossItems);
          const h = sum(huntItems);
          const characterShards = sumShards(huntItems);
          boss += sum(bossItems.filter(item => item.bossId !== 'black-mage')); hunt += h;
          huntMeso += huntItems.reduce((total, item) => total + amount(item.amount), 0);
          shards += characterShards;
          const card = grid.querySelector(`[data-character="${CSS.escape(character.id)}"]`);
          const huntCard = document.getElementById('hunt-character-grid').querySelector(`[data-character="${CSS.escape(character.id)}"]`);
          if (huntCard) {
            huntCard.querySelector('[data-hunt-character-name]').textContent = character.name;
            huntCard.querySelector('[data-category-total="hunt"]').textContent = fmt(h);
            huntCard.querySelector('[data-category-won="hunt"]').textContent = fmtWon(h);
            huntCard.querySelector('[data-category-shards]').textContent = characterShards.toLocaleString('ko-KR');
            const shardLabel = huntCard.querySelector('.income-shards');
            let shardValue = shardLabel.querySelector('.shard-meso-value');
            if (!shardValue) { shardValue = document.createElement('small'); shardValue.className = 'shard-meso-value'; shardLabel.appendChild(shardValue); }
            shardValue.textContent = `(${shardMesoText(characterShards)})`;
          }
          if (card) {
            const total = card.querySelector('[data-character-total]');
            const totalWon = card.querySelector('[data-character-total-won]');
            const bEl = card.querySelector('[data-character-boss]');
            const hEl = card.querySelector('[data-character-hunt]');
            const shardsEl = card.querySelector('[data-character-shards]');
            if (total) total.textContent = `${fmt(b + h)}억`;
            if (totalWon) totalWon.textContent = fmtWon(b + h);
            if (bEl) bEl.textContent = fmt(b);
            if (hEl) hEl.textContent = fmt(h);
            if (shardsEl) shardsEl.textContent = characterShards.toLocaleString('ko-KR');
            for (const type of ['boss', 'hunt']) {
              const target = card.querySelector(`[data-category-total="${type}"]`);
              const wonTarget = card.querySelector(`[data-category-won="${type}"]`);
              const items = type === 'boss' ? bossItems : huntItems;
              if (target) target.textContent = fmt(sum(items));
              if (wonTarget) wonTarget.textContent = fmtWon(sum(items));
            }
            const characterShardTotal = card.querySelector('[data-category-shards]');
            if (characterShardTotal) characterShardTotal.textContent = characterShards.toLocaleString('ko-KR');
          }
        }
        const monthlyItems = data.characters.flatMap(character => character.items.filter(item => (item.bossId === 'black-mage' ? bossMonth(item) : String(item.type === 'hunt' ? item.date : item.weekStart).slice(0, 7)) === view.month));
        const monthlyBossIncome = sum(monthlyItems.filter(item => item.type === 'boss'));
        const monthlyHuntIncome = sum(monthlyItems.filter(item => item.type === 'hunt'));
        const monthly = monthlyBossIncome + monthlyHuntIncome;
        const monthlyHuntRecords = monthlyItems.filter(item => item.type === 'hunt');
        const monthlyRawMeso = monthlyHuntRecords.reduce((total, item) => total + amount(item.amount), 0);
        const monthlyShardCount = sumShards(monthlyHuntRecords);
        const monthlyLootValue = lootIncome(monthlyItems);
        const weeklyLootValue = lootIncome(data.characters.flatMap(character => entries(character, 'boss').filter(item => item.bossId !== 'black-mage')));
        const weeklyBossTotal = boss + weeklyLootValue;
        const [monthYear, monthNumber] = view.month.split('-');
        document.getElementById('income-month').textContent = `${monthYear}년 ${Number(monthNumber)}월`;
        document.getElementById('total-all').innerHTML = `${fmt(monthly + monthlyLootValue)}<small>억 메소</small><span class="monthly-income-breakdown">결정 <b>${fmt(monthlyBossIncome)}억</b> + 물욕 <b>${fmt(monthlyLootValue)}억</b> + 메소 <b>${fmt(monthlyRawMeso)}억</b> + 조각 <b>${monthlyShardCount.toLocaleString('ko-KR')}개</b></span>`;
        document.getElementById('total-boss').innerHTML = `${fmt(weeklyBossTotal)}<small>억 메소</small><span class="monthly-income-breakdown">결정 <b>${fmt(boss)}억</b> + 물욕 <b>${fmt(weeklyLootValue)}억</b></span>`;
        document.getElementById('total-hunt').innerHTML = `${fmt(hunt)}<small>억 메소</small>`;
        document.getElementById('total-hunt-meso').innerHTML = `${fmt(huntMeso)}<small>억 메소</small>`;
        document.getElementById('total-all-won').textContent = fmtWon(monthly + monthlyLootValue);
        document.getElementById('total-boss-won').textContent = fmtWon(weeklyBossTotal);
        const blackMageRecords = data.characters.flatMap(character => entries(character, 'boss').filter(item => item.bossId === 'black-mage'));
        const blackMageDecision = sum(blackMageRecords);
        const blackMageLoot = lootIncome(blackMageRecords);
        const blackMageIncome = blackMageDecision + blackMageLoot;
        document.getElementById('black-mage-income-period').textContent = `${monthYear}년 ${Number(monthNumber)}월 · 완료 체크 기준`;
        document.getElementById('total-black-mage').innerHTML = `${fmt(blackMageIncome)}<small>억 메소</small><span class="monthly-income-breakdown">결정 <b>${fmt(blackMageDecision)}억</b> + 물욕 <b>${fmt(blackMageLoot)}억</b></span>`;
        document.getElementById('total-black-mage-won').textContent = fmtWon(blackMageIncome);
        document.getElementById('total-hunt-won').textContent = fmtWon(hunt);
        document.getElementById('total-shards').innerHTML = `${shards.toLocaleString('ko-KR')}<small>개</small><small class="shard-meso-value">${shardMesoText(shards)}</small>`;
        document.getElementById('total-characters').innerHTML = `${data.characters.length}<small>명</small>`;
        const monthlyHuntItems = data.characters.flatMap(character => character.items.filter(item => item.type === 'hunt' && String(item.date).slice(0, 7) === view.month));
        const monthlyHuntMeso = monthlyHuntItems.reduce((total, item) => total + amount(item.amount), 0);
        const monthlyHuntTotal = sum(monthlyHuntItems);
        document.getElementById('monthly-hunt-period').textContent = `${monthYear}년 ${Number(monthNumber)}월`;
        document.getElementById('monthly-hunt-meso').innerHTML = `${fmt(monthlyHuntMeso)}<small>억 메소</small>`;
        document.getElementById('monthly-hunt-shards').innerHTML = `${sumShards(monthlyHuntItems).toLocaleString('ko-KR')}<small>개</small><small class="shard-meso-value">${shardMesoText(sumShards(monthlyHuntItems))}</small>`;
        document.getElementById('monthly-hunt-total').innerHTML = `${fmt(monthlyHuntTotal)}<small>억 메소</small>`;
        document.getElementById('monthly-hunt-won').textContent = fmtWon(monthlyHuntTotal);
        renderPeriodItemSummaries();
        dashboard?.render();
      }
      function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
      }
      function openModal() {
        NexonBridge.draft = null; document.getElementById("nexon-lookup-status").textContent = "닉네임으로 불러오거나 직접 입력해 등록하세요.";
        document.getElementById('new-character-bosses').innerHTML = [...BOSS_DATA].sort((a, b) => Number(Boolean(b.period)) - Number(Boolean(a.period))).map(boss => `<div class="new-boss-row"><span class="boss-name-with-icon">${bossIcon(boss.id)}<span>${esc(boss.name)}${boss.period ? ' · 월간' : ''}</span></span><select data-new-boss-mode="${boss.id}" aria-label="${esc(boss.name)} 난이도"><option value="">선택 안 함</option>${boss.modes.map(([difficulty]) => `<option value="${esc(difficulty)}">${esc(difficulty)}</option>`).join('')}</select><select data-new-boss-party="${boss.id}" aria-label="${esc(boss.name)} 파티 인원" disabled>${[1,2,3,4,5,6].map(size => `<option value="${size}">${size === 1 ? '솔로' : `${size}명`}</option>`).join('')}</select></div>`).join('');
        document.getElementById('character-job-input').innerHTML = JobCatalog.options();
        jobPicker.reset();
        document.getElementById('character-level-input').value = '';
        updateModalJobPreview();
        modal.classList.add('open');
        setTimeout(() => nameInput.focus(), 30);
      }
      function closeModal() { jobPicker.close(); modal.classList.remove('open'); nameInput.value = ''; }
      function updateModalJobPreview() {
        const job = JobCatalog.get(document.getElementById('character-job-input').value);
        JobCatalog.preload(job.id);
        const preview = document.getElementById('modal-job-preview');
        preview.style.setProperty('--job-image', `url('${JobCatalog.background(job.id)}')`);
        preview.textContent = job.name;
      }
      window.addEventListener('job-asset-ready',updateModalJobPreview);
      modal.addEventListener('change', event => {
        if (event.target.id === 'character-job-input') { updateModalJobPreview(); return; }
        if (!event.target.matches('[data-new-boss-mode]')) return;
        const row = event.target.closest('.new-boss-row');
        const selected = Boolean(event.target.value);
        row.querySelector('[data-new-boss-party]').disabled = !selected;
        row.classList.toggle('selected', selected);
      });
      function addCharacter(name) {
        const bossPresets = {};
        for (const select of modal.querySelectorAll('[data-new-boss-mode]')) {
          const bossId = select.dataset.newBossMode;
          const boss = BOSS_DATA.find(candidate => candidate.id === bossId);
          if (!boss?.modes.some(([difficulty]) => difficulty === select.value)) continue;
          const partySize = Number(modal.querySelector(`[data-new-boss-party="${bossId}"]`).value) || 1;
          bossPresets[bossId] = { difficulty: select.value, partySize };
        }
        const profile = JobCatalog.normalize({nickname:name, job:document.getElementById('character-job-input').value, level:document.getElementById('character-level-input').value});
        const draft = NexonBridge.draft;
        const linked = draft && (data.characters.find(c=>c.nexon?.ocid === draft.ocid) || data.characters.find(c=>c.name === draft.character_name && !c.nexon?.ocid));
        if (linked) {
          Object.assign(linked, NexonBridge.profile(draft));
          Object.assign(linked.bossPresets, bossPresets);
          save(); render(); showToast('기존 캐릭터에 API 정보를 연결했어요.'); return;
        }
        data.characters.push({ id: uid(), ...profile, ...(draft ? NexonBridge.profile(draft) : {}), completionSources:{}, completedBosses:{}, items: [], bossPresets, bossCompletedWeeks: {}, blackMageCompletedMonths: {}, ledgerExpanded: true });
        save(); render(); showToast(`${name} 캐릭터를 추가했어요.`);
      }
      function exportData() {
        const blob = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `쌀산기-백업-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
        showToast('백업 파일을 저장했어요.');
      }
      function importData(file) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(reader.result);
            if (!parsed || !Array.isArray(parsed.characters)) throw new Error('invalid');
            const characters = parsed.characters.map(character => {
              if (!character || typeof character !== 'object') throw new Error('invalid');
              const items = Array.isArray(character.items) ? character.items.map(item => {
                const type = item.type === 'hunt' ? 'hunt' : 'boss';
                const bossFields = type === 'boss' ? normalizeBossFields(item) : {};
                return {
                  id: String(item.id || uid()), type,
                  label: String(item.label || '').slice(0, 48), amount: bossFields.bossId ? mesoToEok(bossFields.priceMeso, bossFields.partySize) : amount(item.amount),
                  ...(type === 'hunt' ? { date: validDateKey(item.date) ? item.date : localDateKey(), shards: shardCount(item.shards) } : { weekStart: validDateKey(item.weekStart) ? weekStartKey(item.weekStart) : weekStartKey(localDateKey()), ...bossFields })
                };
              }) : [];
              return {
                id: String(character.id || uid()),
                ...JobCatalog.normalize(character),
                  ...NexonBridge.normalize(character, BOSS_DATA, items),
                items,
                bossPresets: normalizeBossPresets(character.bossPresets, items),
                bossCompletedWeeks: normalizeCompletedWeeks(character.bossCompletedWeeks),
                  completedBosses: normalizeCompletedBosses(character.completedBosses),
                blackMageCompletedMonths: normalizeBlackMageMonths(character.blackMageCompletedMonths, items),
                ledgerExpanded: character.ledgerExpanded !== false
              };
            });
            if (!window.confirm('현재 정산 내역을 백업 파일의 내용으로 바꿀까요?')) return;
            storageReadError = false;
            data = { settings: normalizeSettings(parsed.settings), characters };
            save(); render(); showToast('백업 내용을 불러왔어요.');
          } catch (_) { showToast('올바른 메소 정산 백업 파일이 아닙니다.'); }
        };
        reader.onerror = () => showToast('파일을 읽지 못했습니다.');
        reader.readAsText(file);
      }

      document.addEventListener('click', event => {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        if (action === 'edit-character-bosses') {
          const card = button.closest('[data-character]');
          const tracker = card?.querySelector('[data-boss-tracker]');
          if (!tracker) return;
          tracker.open = true;
          tracker.classList.add('show-all-bosses');
          tracker.querySelector('[data-action="toggle-all-bosses"]').textContent = '선택한 보스만 보기';
          tracker.querySelector('summary').focus({preventScroll:true});
          tracker.scrollIntoView({block:'nearest',behavior:'instant'});
          return;
        }
        if (['expand-ledgers', 'collapse-ledgers', 'collapse-ledger'].includes(action)) {
          const groups = action === 'collapse-ledger' ? [button.closest('[data-ledger-character]')] : [...document.querySelectorAll('[data-ledger-character]')].filter(group => !group.hidden);
          for (const group of groups.filter(Boolean)) {
            group.open = action === 'expand-ledgers';
            const character = data.characters.find(item => item.id === group.dataset.character);
            if (character) character.ledgerExpanded = group.open;
          }
          save();
          if (action === 'collapse-ledger') button.closest('[data-ledger-character]').querySelector('summary').focus({preventScroll:true});
          return;
        }
        if (action === 'toggle-all-bosses') {
          const tracker = button.closest('[data-boss-tracker]');
          if (!tracker) return;
          const showAll = tracker.classList.toggle('show-all-bosses');
          button.textContent = showAll ? '선택한 보스만 보기' : '전체 보스 보기 / 추가';
          return;
        }
        if (action === 'collapse-boss-tracker') {
          const tracker = button.closest('[data-boss-tracker]');
          if (!tracker) return;
          tracker.open = false;
          const summary = tracker.querySelector('summary');
          summary?.focus({ preventScroll: true });
          summary?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
          return;
        }
        if (action === 'add-character') openModal();
        if (action === 'add-entry') {
          const card = button.closest('[data-character]');
          const character = data.characters.find(item => item.id === card.dataset.character);
          const type = button.dataset.type;
          character.items.push({ id: uid(), type, label: '', amount: 0, ...(type === 'hunt' ? { date: view.day, shards: 0 } : { weekStart: view.week }) });
          save(); render();
          const updatedCard = (type === 'hunt' ? document.getElementById('hunt-character-grid') : grid).querySelector(`[data-character="${CSS.escape(character.id)}"]`);
          const rows = updatedCard.querySelectorAll(`[data-category="${type}"] [data-entry]`);
          rows[rows.length - 1]?.querySelector(type === 'hunt' ? '[data-field="amount"]' : '[data-field="label"]')?.focus();
        }
        if (action === 'delete-entry') {
          const card = button.closest('[data-character]');
          const entryRow = button.closest('[data-entry]');
          const character = data.characters.find(item => item.id === card.dataset.character);
          character.items = character.items.filter(item => item.id !== entryRow.dataset.entry);
          save(); render();
        }
        if (action === 'delete-character') {
          const card = button.closest('[data-character]');
          const character = data.characters.find(item => item.id === card.dataset.character);
          if (window.confirm(`'${character.name}' 캐릭터와 수익 내역을 삭제할까요?`)) {
            data.characters = data.characters.filter(item => item.id !== character.id);
            save(); render(); showToast('캐릭터를 삭제했어요.');
          }
        }
      });
      document.getElementById('loot-ledger-list').addEventListener('toggle', event => {
        const group = event.target;
        if (!group.matches('[data-ledger-character]') || !group.isConnected) return;
        const character = data.characters.find(item => item.id === group.dataset.character);
        if (character && character.ledgerExpanded !== group.open) {
          character.ledgerExpanded = group.open;
          save();
        }
      }, true);
      document.addEventListener('input', event => {
        const field = event.target.dataset.field;
        const card = event.target.closest('[data-character]');
        const character = data.characters.find(item => item.id === card?.dataset.character);
        if (!character) return;
        if (event.target.matches('[data-loot-quantity]')) {
          if (updateLootQuantity(character, event.target) && !event.target.closest('#loot-ledger-list')) renderAcquisitionLedger();
          return;
        }
        if (!field) return;
        if (field === 'character-name') { character.name = event.target.value; character.nickname = event.target.value; }
        else {
          const row = event.target.closest('[data-entry]');
          const item = character.items.find(entry => entry.id === row?.dataset.entry);
          if (!item) return;
          if (field === 'label') item.label = event.target.value;
          if (field === 'amount') item.amount = amount(event.target.value);
          if (field === 'shards') item.shards = shardCount(event.target.value);
        }
        save(); updateTotals(); renderAcquisitionLedger();
      });
      document.addEventListener('change', event => {
        const card = event.target.closest('[data-character]');
        const character = data.characters.find(item => item.id === card?.dataset.character);
        if (!character) return;
        if (event.target.matches('[data-character-job]')) {
          character.job = JobCatalog.get(event.target.value).id;
          save(); dashboard?.render(); return;
        }
        if (event.target.matches('[data-character-level]')) {
          character.level = JobCatalog.normalize({name:character.name,level:event.target.value}).level;
          save(); dashboard?.render(); return;
        }
        if (event.target.matches('[data-boss-record-completed]')) {
          const record = bossRecord(character,event.target.dataset.bossId);
          if (!record || record.bossId === 'black-mage') return;
          character.completedBosses ||= {};
          character.completedBosses[view.week] ||= {};
          NexonBridge.manual(character,record);
          character.completedBosses[view.week][record.bossId] = event.target.checked;
          if (event.target.checked) record.completedDate = localDateKey();
          else delete record.completedDate;
          save(); render(); return;
        }
        if (event.target.matches('[data-black-mage-completed]')) {
          const record = bossRecord(character, 'black-mage');
          if (!record) return;
          NexonBridge.manual(character,record);
          character.blackMageCompletedMonths ||= {};
          if (event.target.checked) { character.blackMageCompletedMonths[view.blackMageMonth] = record.id; record.completedDate ||= localDateKey(); }
          else delete character.blackMageCompletedMonths[view.blackMageMonth];
          save(); render();
          return;
        }
        if (event.target.matches('[data-boss-week-completed]')) {
          for(const r of entries(character,'boss').filter(r=>r.bossId !== 'black-mage')) NexonBridge.manual(character,r);
          character.bossCompletedWeeks ||= {};
          if (character.completedBosses) delete character.completedBosses[view.week];
          if (event.target.checked) for (const record of entries(character,'boss').filter(item => item.bossId !== 'black-mage')) record.completedDate ||= localDateKey();
          if (event.target.checked) character.bossCompletedWeeks[view.week] = true;
          else delete character.bossCompletedWeeks[view.week];
          save(); render();
          return;
        }
        if (event.target.matches('[data-loot-quantity]')) {
          if (updateLootQuantity(character, event.target)) render();
          return;
        }
        if (event.target.matches('[data-action="toggle-boss"], [data-boss-difficulty]')) {
          const boss = BOSS_DATA.find(candidate => candidate.id === event.target.dataset.bossId);
          const quickSelect = event.target.matches('[data-boss-difficulty]');
          const selected = quickSelect ? Boolean(event.target.value) : event.target.checked;
          const difficulty = quickSelect ? event.target.value : event.target.dataset.difficulty;
          const mode = boss?.modes.find(candidate => candidate[0] === difficulty);
          if (!boss || (selected && !mode)) return;
          const existing = bossRecord(character, boss.id);
          if (selected) {
            if (!existing && !boss.period) {
              character.completedBosses ||= {};
              character.completedBosses[view.week] ||= {};
              character.completedBosses[view.week][boss.id] = false;
            }
            character.bossPresets[boss.id] = { difficulty: mode[0], partySize: existing?.partySize || 1 };
            const availableLoot = getBossLoot(boss, mode[0]);
            const lootIds = (existing?.lootIds || []).filter(name => availableLoot.includes(name));
            const record = {
              id: existing?.id || uid(), type: 'boss', label: `${boss.name} ${mode[0]} 결정`, amount: mesoToEok(mode[1], existing?.partySize || 1),
              weekStart: existing?.weekStart || view.week, bossId: boss.id, difficulty: mode[0], priceMeso: mode[1], partySize: existing?.partySize || 1, lootIds,
              ...(boss.id === 'black-mage' ? { settlementMonth: view.blackMageMonth } : {}),
              ...recordMetadata(existing || {}),
              lootQuantities: Object.fromEntries(Object.entries(existing?.lootQuantities || {}).filter(([name]) => availableLoot.includes(name))),
              blackBoxItem: lootIds.includes(CHAOS_BLACK_BOX) ? (existing?.blackBoxItem || '') : ''
            };
            character.items = character.items.filter(item => item !== existing);
            character.items.push(record);
          } else {
            delete character.bossPresets[boss.id];
            character.items = character.items.filter(item => item !== existing);
            if (boss.id === 'black-mage') delete (character.blackMageCompletedMonths || {})[view.blackMageMonth];
            else if (character.completedBosses?.[view.week]) delete character.completedBosses[view.week][boss.id];
          }
          save(); render();
          return;
        }
        if (event.target.matches('[data-party-size]')) {
          const item = bossRecord(character, event.target.dataset.bossId);
          if (!item) return;
          const previousSize = item.partySize;
          item.partySize = Math.max(1, Math.min(6, Number(event.target.value) || 1));
          if ((previousSize === 1) !== (item.partySize === 1)) {
            const sharedNames = rewardDefinitions(item.bossId, item.difficulty).filter(reward => reward.scope === 'shared').map(reward => reward.name);
            item.lootIds = (item.lootIds || []).filter(name => !sharedNames.includes(name));
            for (const name of sharedNames) delete (item.lootQuantities || {})[name];
          }
          character.bossPresets[item.bossId] = { difficulty: item.difficulty, partySize: item.partySize };
          item.amount = mesoToEok(item.priceMeso, item.partySize);
          save(); render();
          return;
        }
        if (event.target.matches('[data-boss-loot]')) {
          const boss = BOSS_DATA.find(candidate => candidate.id === event.target.dataset.bossId);
          const item = bossRecord(character, event.target.dataset.bossId);
          const requestedLoot = event.target.dataset.lootName;
          const lootName = item && boss && (getBossLoot(boss, item.difficulty).includes(requestedLoot) || (item.lootIds || []).includes(requestedLoot)) ? requestedLoot : null;
          if (!item || !lootName) return;
          const collected = new Set(item.lootIds || []);
          item.lootQuantities ||= {};
          item.lootDates ||= {};
          if (event.target.checked) { collected.add(lootName); item.lootQuantities[lootName] = 1; item.lootDates[lootName] = localDateKey(); }
          else { collected.delete(lootName); delete item.lootQuantities[lootName]; delete item.lootDates[lootName]; }
          item.lootIds = [...collected];
          if (lootName === CHAOS_BLACK_BOX && !event.target.checked) item.blackBoxItem = '';
          save(); render();
          return;
        }
        if (event.target.matches('[data-black-box-item]')) {
          const item = bossRecord(character, event.target.dataset.bossId);
          if (!item || !(item.lootIds || []).includes(CHAOS_BLACK_BOX) || !CHAOS_BLACK_BOX_ITEMS.includes(event.target.value)) return;
          item.blackBoxItem = event.target.value;
          save(); render();
        }
      });
      let lastCalendarMonth = localDateKey().slice(0, 7);
      let lastCalendarDay = localDateKey();
      let lastCalendarWeek = weekStartKey(lastCalendarDay);
      function refreshCalendarMonth() {
        const day = localDateKey(), week = weekStartKey(day), current = day.slice(0, 7);
        if (current === lastCalendarMonth && day === lastCalendarDay && week === lastCalendarWeek) return;
        if (view.day === lastCalendarDay) view.day = day;
        if (view.week === lastCalendarWeek) view.week = week;
        if (view.month === lastCalendarMonth) view.month = current;
        view.blackMageMonth = view.month;
        lastCalendarMonth = current;
        lastCalendarDay = day;
        lastCalendarWeek = week;
        render();
      }
      window.addEventListener('focus', refreshCalendarMonth);
      setInterval(refreshCalendarMonth, 60000);
      document.querySelector('.settings-panel').addEventListener('input', event => {
        if (event.target.id === 'won-per-eok') data.settings.wonPerEok = Math.floor(amount(event.target.value));
        if (event.target.id === 'shard-price-man') data.settings.shardPriceMan = Math.floor(amount(event.target.value));
        if (!['won-per-eok', 'shard-price-man'].includes(event.target.id)) return;
        save(); updateTotals(); renderAcquisitionLedger();
      });
      document.querySelectorAll('[data-settings-tab]').forEach(button => {
        button.addEventListener('click', () => {
          const selected = button.dataset.settingsTab;
          document.querySelectorAll('[data-settings-tab]').forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.settingsTab === selected)));
          document.getElementById('rates-settings').hidden = selected !== 'rates';
          document.getElementById('loot-settings').hidden = selected !== 'loot';
        });
      });
      document.getElementById('loot-price-grid').addEventListener('input', event => {
        const name = event.target.dataset.lootPrice;
        if (!name || REMOVED_LOOT_ITEMS.has(name) || Object.hasOwn(LINKED_LOOT_PRICES, name)) return;
        const scale = event.target.dataset.lootPriceUnit === 'man' ? 10000 : 1;
        data.settings.lootPrices[name] = Math.round(amount(event.target.value) / scale * 100000000) / 100000000;
        syncLinkedLootPrices();
        save(); updateTotals(); renderAcquisitionLedger();
      });
      document.getElementById('show-loot-prices').addEventListener('change', event => {
        data.settings.showLootPrices = event.target.checked;
        save(); renderAcquisitionLedger();
        dashboard?.render();
      });
      document.querySelectorAll('[data-month-step]').forEach(button => {
        button.addEventListener('click', () => {
          const [year, month] = view.month.split('-').map(Number);
          const next = new Date(year, month - 1 + Number(button.dataset.monthStep), 1, 12);
          const nextMonth = localDateKey(next).slice(0, 7);
          if (!validDateKey(`${nextMonth}-01`)) return;
          view.month = nextMonth;
          view.blackMageMonth = nextMonth;
          render();
        });
      });
      document.getElementById('character-form').addEventListener('submit', event => {
        event.preventDefault();
        const name = nameInput.value.trim();
        if (!name) return;
        addCharacter(name); closeModal();
      });
      document.getElementById('cancel-modal').addEventListener('click', closeModal);
      modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
      document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });
      document.getElementById('export-button').addEventListener('click', exportData);
      document.getElementById('import-button').addEventListener('click', () => document.getElementById('import-file').click());
      document.getElementById('import-file').addEventListener('change', event => {
        const file = event.target.files?.[0];
        if (file) importData(file);
        event.target.value = '';
      });
      document.querySelectorAll('[data-period-step]').forEach(button => {
        button.addEventListener('click', () => {
          const key = button.dataset.periodStep === 'day' ? 'day' : 'week';
          const next = shiftDate(view[key], Number(button.dataset.offset));
          if (!validDateKey(next)) return;
          view[key] = next;
          render();
        });
      });
      document.getElementById('daily-date').addEventListener('change', event => {
        if (!validDateKey(event.target.value)) return;
        view.day = event.target.value;
        render();
      });
      document.getElementById('boss-week-date').addEventListener('change', event => {
        if (!validDateKey(event.target.value)) return;
        view.week = weekStartKey(event.target.value);
        render();
      });
      document.getElementById('today-button').addEventListener('click', () => {
        view.day = localDateKey();
        render();
      });
      document.getElementById('this-week-button').addEventListener('click', () => {
        view.week = weekStartKey(localDateKey());
        render();
      });

      dashboard = createDashboard({
        getData:()=>data, getView:()=>view, esc, amount, entries, sum, lootIncome, bossIncomeEnabled,
        automaticRewards, acquiredQuantity, rewardDefinitions, lootPrice, showBossReward, itemIcon,
        bossMonth, weekRangeLabel, localDateKey, fmt, fmtWon, CHAOS_BLACK_BOX,
        shiftMonth:offset=>{const [y,m]=view.month.split('-').map(Number);view.month=localDateKey(new Date(y,m-1+offset,1,12)).slice(0,7);view.blackMageMonth=view.month;render();},
        shiftWeek:offset=>{view.week=weekStartKey(shiftDate(view.week,offset));render();}
      });
      const backupControls = document.createElement('div');
      backupControls.className='portal-settings-backup';
      backupControls.append(document.getElementById('import-button'),document.getElementById('export-button'));
      document.getElementById('page-settings').prepend(backupControls);
      // Testable read-only calculations and normal public actions for regression verification.
      window.MapleLedger = {getData:()=>data,getView:()=>({...view}),save,render,bosses:BOSS_DATA,weekStartKey,localDateKey,prepareSync:()=>{const oldWeek=view.week, oldMonth=view.blackMageMonth;try{const today=localDateKey();view.week=weekStartKey(today);view.blackMageMonth=today.slice(0,7);applyBossPresetsToWeek();}finally{view.week=oldWeek;view.blackMageMonth=oldMonth;}},sum,lootIncome,bossIncomeEnabled,normalizeSettings,
        monthTotals:month=>dashboard.totals(dashboard.monthRecords(month)),characterStats:id=>dashboard.charStats(data.characters.find(c=>c.id===id)),
        selectPeriod:period=>{Object.assign(view,period);if(period.month)view.blackMageMonth=period.month;render();},exportData,importData};
      render();
      if (storageReadError) showToast('기존 저장 데이터를 읽지 못했습니다. 원본은 보존되며 백업으로 복원할 수 있습니다.');
    })();
  
