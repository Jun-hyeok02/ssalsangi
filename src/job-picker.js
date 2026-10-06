/* Searchable UI over the existing job select. Stored job IDs are unchanged. */
window.createJobPicker = function (select) {
  const prefix = select.id;
  const picker = document.createElement('div');
  picker.className = 'job-picker';
  picker.innerHTML = `<div class="job-search-field"><span aria-hidden="true">⌕</span><input id="${prefix}-search" type="search" placeholder="직업 검색..." autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${prefix}-results" aria-haspopup="listbox"></div><div class="job-picker-selection" aria-live="polite"></div><div id="${prefix}-results" class="job-picker-results" role="listbox" aria-label="직업 목록" hidden></div>`;
  select.after(picker);
  const search = picker.querySelector('input');
  const list = picker.querySelector('.job-picker-results');
  const selection = picker.querySelector('.job-picker-selection');
  let choices = [], active = -1, open = false;
  const normalized = text => text.replace(/\s+/g, '').toLowerCase();
  function setActive(index) {
    active = choices.length ? Math.max(0, Math.min(choices.length - 1, index)) : -1;
    const options = [...list.querySelectorAll('[role="option"]')];
    options.forEach((button, i) => button.classList.toggle('active', i === active));
    if (active < 0) { search.removeAttribute('aria-activedescendant'); return; }
    const option = options[active];
    search.setAttribute('aria-activedescendant', option.id);
    const row = option.getBoundingClientRect(), box = list.getBoundingClientRect();
    if (row.top < box.top) list.scrollTop -= box.top - row.top;
    else if (row.bottom > box.bottom) list.scrollTop += row.bottom - box.bottom;
  }
  function renderResults() {
    choices = JobCatalog.jobs.filter(job => normalized(job.name).includes(normalized(search.value)));
    list.replaceChildren();
    const groups = new Map();
    choices.forEach((job, index) => {
      if (!groups.has(job.group)) {
        const group = document.createElement('div');
        group.setAttribute('role', 'group'); group.setAttribute('aria-label', job.group);
        const heading = document.createElement('div'); heading.className = 'job-picker-group'; heading.textContent = job.group;
        group.append(heading); groups.set(job.group, group); list.append(group);
      }
      const button = document.createElement('button');
      button.type = 'button'; button.tabIndex = -1; button.id = `${prefix}-option-${job.id}`;
      button.setAttribute('role', 'option'); button.setAttribute('aria-selected', String(select.value === job.id));
      button.dataset.jobChoice = String(index); button.textContent = job.name;
      groups.get(job.group).append(button);
    });
    if (!choices.length) {
      const empty = document.createElement('div'); empty.className = 'job-picker-empty'; empty.setAttribute('role', 'status');
      empty.textContent = '검색 결과가 없습니다.'; list.append(empty);
    }
    list.scrollTop = 0;
    setActive(0);
  }
  function show() {
    open = true; list.hidden = false; search.setAttribute('aria-expanded', 'true'); renderResults();
  }
  function sync() {
    const job = JobCatalog.get(select.value);
    selection.textContent = job.id ? `선택: ${job.name}` : '선택된 직업 없음';
    if (!open) search.value = job.id ? job.name : '';
  }
  function close() {
    open = false; list.hidden = true; search.setAttribute('aria-expanded', 'false');
    search.removeAttribute('aria-activedescendant'); sync();
  }
  function choose(index) {
    const job = choices[index]; if (!job) return;
    select.value = job.id; close(); select.dispatchEvent(new Event('change', {bubbles:true}));
  }
  search.addEventListener('focus', () => { if (!open) { search.value = ''; show(); } });
  search.addEventListener('click', () => { if (!open) { search.value = ''; show(); } });
  search.addEventListener('input', () => { if (!open) show(); else renderResults(); });
  search.addEventListener('keydown', event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) { search.value = ''; show(); }
      else setActive(active + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Enter' && open) { event.preventDefault(); choose(active); }
  });
  list.addEventListener('pointerdown', event => { if (event.target.closest('[data-job-choice]')) event.preventDefault(); });
  list.addEventListener('click', event => {
    const button = event.target.closest('[data-job-choice]'); if (button) choose(Number(button.dataset.jobChoice));
  });
  document.addEventListener('pointerdown', event => { if (open && !picker.contains(event.target)) close(); });
  picker.addEventListener('focusout', () => setTimeout(() => { if (!picker.contains(document.activeElement)) close(); }, 0));
  select.addEventListener('change', sync);
  sync();
  return {close, reset: () => { select.value = ''; close(); }};
};
