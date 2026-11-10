import { TECHNIQUES, techById, DISCIPLINES } from './data/techniques.js';
import { PHASES, SESSION_TYPES, WEEK, DAY_NAMES, STRENGTH, RULES } from './data/plan.js';
import { createFigure } from './figure.js';
import { Player, availableCombos } from './session.js';
import { store } from './store.js';
import { t, L, LANGS } from './i18n.js';

const $ = (sel, root = document) => root.querySelector(sel);
const view = $('#view');
let cleanup = [];

// ---------- helpers ----------
function h(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayIdx = () => (new Date().getDay() + 6) % 7; // Monday = 0
const isoDate = (d = new Date()) => d.toISOString().slice(0, 10);
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function weekNumber() {
  const start = new Date((store.get().startDate || '2026-11-16') + 'T00:00:00');
  const n = Math.floor((Date.now() - start) / 864e5 / 7) + 1;
  return Math.max(1, n);
}
const isDeload = () => weekNumber() % 4 === 0;

function statusOf(id) {
  const tech = techById[id], s = store.get();
  if (s.status[id]) return s.status[id];
  return tech.phase > s.phaseUnlocked ? 'locked' : 'notStarted';
}

// Techniques to focus on today: ones you are learning, least recently practised first.
function focusTechs(n) {
  const s = store.get();
  const last = {};
  s.log.forEach(e => (e.techs || []).forEach(id => { last[id] = e.date; }));
  let pool = TECHNIQUES.filter(x => s.status[x.id] === 'learning');
  if (pool.length < n) pool = pool.concat(TECHNIQUES.filter(x => statusOf(x.id) === 'notStarted').slice(0, n - pool.length));
  return pool.sort((a, b) => (last[a.id] || '').localeCompare(last[b.id] || '')).slice(0, n).map(x => x.id);
}

function statusBadge(st) { return `<span class="badge st-${st}">${t(st)}</span>`; }

function backupDue() {
  const s = store.get();
  if (s.log.length < 2) return false;
  return !s.lastExport || (Date.now() - new Date(s.lastExport)) / 864e5 > 14;
}

// ---------- views ----------
function Today() {
  const d = WEEK[todayIdx()];
  const sessionKey = d.combat && isDeload() && d.combat === 'main' ? 'technique' : d.combat;
  const focus = sessionKey ? focusTechs(sessionKey === 'main' ? 3 : 2) : [];
  const el = h(`<section>
    <h1>${L(DAY_NAMES)[d.day]} <small>· week ${weekNumber()}${isDeload() ? ' (deload)' : ''}</small></h1>
    ${isDeload() ? `<p class="note">${t('deloadNote')}</p>` : ''}
    ${backupDue() ? `<p class="note">Your progress is saved only on this phone. <a href="#/settings">Back it up</a> (takes 2 seconds).</p>` : ''}
    <div class="day-grid">
      <div class="card k-run"><h3>${t('run')}</h3><p>${d.run ? esc(L(d.run)) : t('rest')}</p></div>
      <div class="card k-strength"><h3>${t('strength')}${d.combat && d.strength ? ' · after combat' : ''}</h3>${d.strength ? `<details><summary>${esc(L(STRENGTH[d.strength].name))}</summary><ul class="slist">${STRENGTH[d.strength].items.map(([n, r]) => `<li>${esc(n)} <em>${esc(r)}</em></li>`).join('')}</ul></details>` : `<p>${t('rest')}</p>`}</div>
    </div>
    <div class="card k-combat big">
      <h3>${t('combat')}</h3>
      ${sessionKey ? `
        <p><strong>${esc(L(SESSION_TYPES[sessionKey].name))}</strong><br>${esc(L(SESSION_TYPES[sessionKey].blurb))}</p>
        ${focus.length ? `<p class="muted">${t('focusToday')}:</p><ul class="chips">${focus.map(id => `<li><a href="#/tech/${id}">${esc(L(techById[id].name))}</a></li>`).join('')}</ul>` : ''}
        <a class="btn primary" href="#/session/${sessionKey}/${focus.join(',')}">${t('start')}</a>
      ` : `<p>${t('noCombatToday')}</p>
        <a class="btn" href="#/session/footwork/">10-15 min footwork (optional)</a>`}
    </div>
  </section>`);
  view.replaceChildren(el);
}

function Week() {
  const ti = todayIdx();
  const el = h(`<section>
    <h1>${t('week')}</h1>
    <div class="week">
      ${WEEK.map(d => `
        <div class="wday ${d.day === ti ? 'today' : ''} type-${d.type}">
          <div class="wname">${L(DAY_NAMES)[d.day].slice(0, 3)}</div>
          <div class="wrow k-run"><span>${t('run')}</span>${d.run ? esc(L(d.run)) : '—'}</div>
          <div class="wrow k-strength"><span>${t('strength')}</span>${d.strength ? `<details><summary>${esc(L(STRENGTH[d.strength].name))}</summary><ul>${STRENGTH[d.strength].items.map(([n, r]) => `<li>${esc(n)} <em>${esc(r)}</em></li>`).join('')}</ul></details>` : '—'}</div>
          <div class="wrow k-combat"><span>${t('combat')}</span>${d.combat ? `<a href="#/session/${d.combat}/">${esc(L(SESSION_TYPES[d.combat].name))}</a>` : '—'}</div>
        </div>`).join('')}
    </div>
    <h2>${t('weekRules')}</h2>
    <ul>${L(RULES).map(r => `<li>${esc(r)}</li>`).join('')}</ul>
  </section>`);
  view.replaceChildren(el);
}

function Pathway() {
  const s = store.get();
  const el = h(`<section><h1>${t('pathway')}</h1>${PHASES.map(p => {
    const techs = TECHNIQUES.filter(x => x.phase === p.phase);
    const doneN = techs.filter(x => s.status[x.id] === 'done').length;
    const locked = p.phase > s.phaseUnlocked;
    return `<div class="phase ${locked ? 'locked' : ''}">
      <h2>${t('phase')} ${p.phase}: ${esc(L(p.name))} <small>weeks ${p.weeks}</small></h2>
      <p>${esc(L(p.goal))}</p>
      <div class="progress"><div style="width:${(doneN / techs.length) * 100}%"></div></div>
      <p class="muted">${doneN} / ${techs.length} ${t('done').toLowerCase()}</p>
      <ul class="techlist">${techs.map(x => `<li><a href="#/tech/${x.id}">${esc(L(x.name))}</a> <span class="disc">${esc(L(DISCIPLINES[x.discipline]))}</span> ${statusBadge(statusOf(x.id))}</li>`).join('')}</ul>
      <div class="checkpoint"><strong>${t('checkpoint')}:</strong> ${esc(L(p.checkpoint))}
        ${s.checkpoints[p.phase] ? `<p class="ok">✓ ${s.checkpoints[p.phase]}</p>`
          : locked ? '' : `<button class="btn" data-pass="${p.phase}">${t('passCheckpoint')}</button>`}
      </div>
    </div>`;
  }).join('')}</section>`);
  el.addEventListener('click', e => {
    const ph = e.target.dataset.pass;
    if (!ph) return;
    store.update(st => {
      st.checkpoints[ph] = isoDate();
      st.phaseUnlocked = Math.max(st.phaseUnlocked, Math.min(3, +ph + 1));
    });
    Pathway();
  });
  view.replaceChildren(el);
}

function Library() {
  const filter = sessionStorage.getItem('libFilter') || 'all';
  const list = TECHNIQUES.filter(x => filter === 'all' || x.discipline === filter);
  const el = h(`<section><h1>${t('library')}</h1>
    <div class="filters">${['all', ...Object.keys(DISCIPLINES)].map(k => `<button class="pill ${k === filter ? 'on' : ''}" data-f="${k}">${k === 'all' ? t('filterAll') : esc(L(DISCIPLINES[k]))}</button>`).join('')}</div>
    <div class="libgrid">${list.map(x => `<a class="libcard" href="#/tech/${x.id}">
      <div class="fig-slot" data-tech="${x.id}"></div>
      <div><strong>${esc(L(x.name))}</strong><br><span class="muted">${t('phase')} ${x.phase} · ${esc(L(DISCIPLINES[x.discipline]))}</span><br>${statusBadge(statusOf(x.id))}</div>
    </a>`).join('')}</div></section>`);
  el.querySelector('.filters').addEventListener('click', e => {
    if (e.target.dataset.f) { try { sessionStorage.setItem('libFilter', e.target.dataset.f); } catch { /* ignore */ } Library(); }
  });
  view.replaceChildren(el);
  // Animate thumbnails only while visible.
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    const slot = en.target;
    if (en.isIntersecting && !slot._fig) slot._fig = createFigure(slot, slot.dataset.tech, { speed: 0.6 });
    else if (!en.isIntersecting && slot._fig) { slot._fig.destroy(); slot._fig = null; }
  }));
  el.querySelectorAll('.fig-slot').forEach(s => io.observe(s));
  cleanup.push(() => { io.disconnect(); el.querySelectorAll('.fig-slot').forEach(s => s._fig?.destroy()); });
}

function Tech(id) {
  const x = techById[id];
  if (!x) return Library();
  const s = store.get();
  const st = statusOf(id);
  const el = h(`<section class="tech">
    <a href="#/library" class="back">← ${t('library')}</a>
    <h1>${esc(L(x.name))}</h1>
    <p class="muted">${t('phase')} ${x.phase} · ${esc(L(DISCIPLINES[x.discipline]))} · ${statusBadge(st)}</p>
    <p class="purpose">${esc(L(x.purpose))}</p>
    <div class="fig-big"></div>
    <div class="figcap" aria-live="polite"></div>
    <div class="figctl">
      <div class="seg" data-g="view">
        <button class="pill" data-view="side">Side</button><button class="pill on" data-view="three">3/4</button><button class="pill" data-view="front">Front</button>
      </div>
      <div class="seg" data-g="mode">
        <button class="pill" data-mode="step">Step by step</button><button class="pill" data-mode="slow">Slow</button><button class="pill on" data-mode="normal">${t('normal')}</button>
      </div>
      <p class="muted small">Orthodox stance (left side leads). Blue = lead side, grey = rear side. "Front" is what your opponent sees.</p>
    </div>
    <h2>${t('keyPoints')}</h2>
    <ol>${L(x.keyPoints).map(k => `<li>${esc(k)}</li>`).join('')}</ol>
    <h2>${t('mistakes')}</h2>
    <div class="mistakes">${L(x.mistakes).map(m => `<div class="mistake"><div class="m">✗ ${esc(m.m)}</div><div class="fix">✓ ${esc(m.fix)}</div></div>`).join('')}</div>
    <h2>${t('drills')}</h2>
    <ul>${L(x.drills).map(d => `<li><strong>${esc(d.name)}:</strong> ${esc(d.how)}</li>`).join('')}</ul>
    <h2>${t('notes')}</h2>
    <textarea class="notes" rows="3" placeholder="What felt off? What did the video show?">${esc(s.notes[id] || '')}</textarea>
    <div class="actions">
      ${st === 'locked' ? `<p class="muted">${t('locked')}: pass the phase ${x.phase - 1} checkpoint first.</p>` : `
        ${st !== 'learning' ? `<button class="btn" data-st="learning">${t('markLearning')}</button>` : ''}
        ${st !== 'done' ? `<button class="btn primary" data-st="done">${t('markDone')}</button>` : ''}
        ${st === 'learning' || st === 'done' ? `<button class="btn ghost" data-st="">${t('markReset')}</button>` : ''}
        <a class="btn" href="#/session/drill/${id}">Drill this (3 x 2 min)</a>`}
    </div>
  </section>`);
  view.replaceChildren(el);
  const cap = $('.figcap', el);
  const fig = createFigure($('.fig-big', el), id, { onLabel: (txt, i, n) => { cap.textContent = `${i}/${n} · ${txt}`; } });
  cleanup.push(() => fig.destroy());
  $('.figctl', el).addEventListener('click', e => {
    const b = e.target.closest('.pill'); if (!b) return;
    b.parentElement.querySelectorAll('.pill').forEach(x => x.classList.toggle('on', x === b));
    if (b.dataset.view) fig.setView(b.dataset.view);
    if (b.dataset.mode) { fig.setStep(b.dataset.mode === 'step'); fig.setSpeed(b.dataset.mode === 'normal' ? 1 : 0.4); }
  });
  $('.notes', el).addEventListener('change', e => store.update(st => { st.notes[id] = e.target.value; }));
  $('.actions', el).addEventListener('click', e => {
    if (!('st' in e.target.dataset)) return;
    store.update(st => { if (e.target.dataset.st) st.status[id] = e.target.dataset.st; else delete st.status[id]; });
    Tech(id);
  });
}

function Session(kind, techCsv) {
  let focus = (techCsv || '').split(',').filter(id => techById[id]);
  let segs;
  if (kind === 'drill') {
    segs = [
      { label: { en: 'Warm-up: shadowbox easy' }, kind: 'warm', secs: 120 },
      ...[1, 2, 3].flatMap(n => [{ label: { en: `Round ${n} of 3` }, kind: 'work', secs: 120, tech: focus[0], slow: n === 1 }, { label: { en: 'Rest' }, kind: 'rest', secs: 45 }]),
    ];
  } else {
    const type = SESSION_TYPES[kind] || SESSION_TYPES.technique;
    if (!focus.length && kind !== 'footwork') focus = focusTechs(kind === 'main' ? 3 : 2);
    segs = type.build({ focus });
  }
  const startedAt = Date.now();
  const el = h(`<section class="session">
    <div class="seg-label"></div>
    <div class="clock">0:00</div>
    <div class="callout"></div>
    <div class="fig-big"></div>
    <div class="cues"></div>
    <div class="ctl">
      <button class="btn primary big" data-a="toggle">${t('start')}</button>
      <button class="btn" data-a="skip">${t('skip')}</button>
      <button class="btn ghost" data-a="finish">${t('finish')}</button>
    </div>
    <ol class="seglist">${segs.map((s, i) => `<li data-i="${i}" class="kind-${s.kind}">${esc(L(s.label))}${s.tech ? `: ${esc(L(techById[s.tech].name))}` : ''} <span>${fmt(s.secs)}</span></li>`).join('')}</ol>
    <div class="logform" hidden>
      <h2>${t('howHard')}</h2>
      <input type="range" min="1" max="10" value="5" class="rpe"><output>5</output>
      <button class="btn primary" data-a="save">${t('save')}</button>
    </div>
  </section>`);
  view.replaceChildren(el);

  let fig = null, figTech = null;
  const render = p => {
    const s = p.seg || segs[segs.length - 1];
    $('.seg-label', el).textContent = p.done ? 'Done!' : `${L(s.label)}${s.tech ? ': ' + L(techById[s.tech].name) : ''}`;
    $('.clock', el).textContent = fmt(Math.max(0, Math.ceil(p.left)));
    el.className = `session kind-${p.done ? 'done' : s.kind}`;
    $('.callout', el).textContent = p.lastCall || '';
    $('[data-a=toggle]', el).textContent = p.running ? t('pause') : (p.elapsed ? t('resume') : t('start'));
    el.querySelectorAll('.seglist li').forEach(li => li.classList.toggle('cur', +li.dataset.i === p.i));
    const tech = s.tech || null;
    if (tech !== figTech) {
      figTech = tech; fig?.destroy(); fig = null;
      if (tech) {
        fig = createFigure($('.fig-big', el), tech, { speed: s.slow ? 0.4 : 1, step: !!s.slow });
        $('.cues', el).innerHTML = `<ul>${L(techById[tech].keyPoints).slice(0, 3).map(k => `<li>${esc(k)}</li>`).join('')}</ul><p class="muted">Watch for: ${esc(L(techById[tech].mistakes)[0].m)}</p>`;
      } else { $('.fig-big', el).replaceChildren(); $('.cues', el).innerHTML = ''; }
    }
    if (p.done) $('.logform', el).hidden = false;
  };
  const player = new Player(segs, render);
  render(player);
  cleanup.push(() => { player.stop(); fig?.destroy(); });

  // Keep the screen on during a session where supported.
  let lock = null;
  const wake = async () => { try { lock = await navigator.wakeLock?.request('screen'); } catch { /* ignore */ } };
  cleanup.push(() => lock?.release?.());

  el.addEventListener('click', e => {
    const a = e.target.dataset.a;
    if (a === 'toggle') { player.toggle(); if (player.running) wake(); }
    if (a === 'skip') player.next();
    if (a === 'finish') { player.stop(); player.done = true; render(player); }
    if (a === 'save') {
      const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
      store.update(st => st.log.push({ date: isoDate(), type: kind, minutes, rpe: +$('.rpe', el).value, techs: focus }));
      location.hash = '#/log';
    }
  });
  $('.rpe', el).addEventListener('input', e => { e.target.nextElementSibling.textContent = e.target.value; });
}

function Log() {
  const s = store.get();
  const monday = new Date(); monday.setDate(monday.getDate() - todayIdx());
  const wk = s.log.filter(e => e.date >= isoDate(monday));
  const load = wk.reduce((a, e) => a + e.minutes * e.rpe, 0);
  const el = h(`<section><h1>${t('log')}</h1>
    <div class="day-grid">
      <div class="card"><h3>${t('thisWeek')}</h3><p class="stat">${wk.length} <small>${t('sessions')}</small></p></div>
      <div class="card"><h3>Minutes</h3><p class="stat">${wk.reduce((a, e) => a + e.minutes, 0)}</p></div>
      <div class="card"><h3>Load (min x RPE)</h3><p class="stat">${load}</p></div>
    </div>
    ${s.log.length ? `<table class="logtable"><thead><tr><th>Date</th><th>Session</th><th>${t('minutes')}</th><th>RPE</th><th>Techniques</th></tr></thead><tbody>
      ${s.log.slice().reverse().map(e => `<tr><td>${e.date}</td><td>${esc(e.type)}</td><td>${e.minutes}</td><td>${e.rpe}</td><td>${(e.techs || []).map(id => esc(L(techById[id]?.name))).join(', ')}</td></tr>`).join('')}
    </tbody></table>` : `<p class="muted">${t('noLog')}</p>`}
  </section>`);
  view.replaceChildren(el);
}

function Settings() {
  const s = store.get();
  const el = h(`<section><h1>${t('settings')}</h1>
    <label class="row"><input type="checkbox" class="voice" ${s.voice ? 'checked' : ''}> ${t('voice')}</label>
    <label class="row">${t('language')} <select class="lang">${LANGS.map(l => `<option value="${l.code}" ${l.code === s.lang ? 'selected' : ''}>${l.label}</option>`).join('')}</select> <span class="muted small">Georgian coming next.</span></label>
    <label class="row">Plan start (Monday of week 1) <input type="date" class="start" value="${s.startDate || '2026-11-16'}"></label>
    <p class="muted small">Every 4th week from this date is a deload week.</p>
    <div class="actions">
      <button class="btn" data-a="export">${t('exportData')}</button>
      <label class="btn">${t('importData')}<input type="file" accept="application/json" class="imp" hidden></label>
      <button class="btn ghost" data-a="reset">${t('resetData')}</button>
    </div>
    <p class="muted small">Your data stays on this device (browser storage). Export it now and then as a backup.</p>
    <p class="muted small">Combos the timer can call right now: ${availableCombos().map(c => esc(c.say)).join(' · ')}</p>
  </section>`);
  view.replaceChildren(el);
  $('.voice', el).onchange = e => store.set({ voice: e.target.checked });
  $('.lang', el).onchange = e => { store.set({ lang: e.target.value }); render(); };
  $('.start', el).onchange = e => store.set({ startDate: e.target.value });
  $('.imp', el).onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { store.import(await f.text()); Settings(); } catch { e.target.value = ''; $('.actions', el).insertAdjacentHTML('afterend', '<p class="err">That file could not be read.</p>'); }
  };
  el.addEventListener('click', e => {
    if (e.target.dataset.a === 'export') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([store.export()], { type: 'application/json' }));
      a.download = `combat-coach-${isoDate()}.json`; a.click();
      store.set({ lastExport: isoDate() });
    }
    if (e.target.dataset.a === 'reset' && e.target.textContent !== 'Tap again to confirm') {
      e.target.textContent = 'Tap again to confirm'; return;
    }
    if (e.target.dataset.a === 'reset') { store.reset(); seed(); Settings(); }
  });
}

// ---------- router ----------
const routes = { today: Today, week: Week, pathway: Pathway, library: Library, tech: Tech, session: Session, log: Log, settings: Settings };

function render() {
  cleanup.forEach(f => f()); cleanup = [];
  const [name = 'today', ...args] = location.hash.replace(/^#\/?/, '').split('/');
  (routes[name] || Today)(...args);
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === `#/${name}` || (name === 'tech' && a.getAttribute('href') === '#/library')));
  document.querySelectorAll('[data-t]').forEach(n => { n.textContent = t(n.dataset.t); });
  window.scrollTo(0, 0);
}

// First run: start learning the four foundations.
function seed() {
  const s = store.get();
  if (!Object.keys(s.status).length && !s.log.length) store.update(st => { ['stance', 'step', 'jab', 'cross'].forEach(id => { st.status[id] = 'learning'; }); });
}

seed();
try { navigator.storage?.persist?.(); } catch { /* not supported */ }
window.addEventListener('hashchange', render);
render();

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
