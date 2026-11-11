import { TECHNIQUES, techById, DISCIPLINES } from './data/techniques.js';
import { PHASES, SESSION_TYPES, WEEK, DAY_NAMES, STRENGTH, RULES } from './data/plan.js';
import { createFigure } from './figure.js';
import { MOCAP, createMocap, webglOK } from './mocap.js';

// Motion-capture player where a clip exists, else the IK figure (also the fallback if 3D fails).
function createViewer(el, id, opts = {}) {
  opts = { mirror: profile().stance === 'south', ...opts };
  if (!MOCAP.has(id) || !webglOK()) return createFigure(el, id, opts);
  let cur, state = { ...opts };
  const swap = () => { cur.destroy(); cur = createFigure(el, id, state); };
  cur = createMocap(el, id, { model: store.get().model || 'fighter', ...opts, onFail: swap });
  return {
    setView: v => { state.view = v; cur.setView(v); }, setSpeed: s => { state.speed = s; cur.setSpeed(s); },
    setStep: b => { state.step = b; cur.setStep(b); }, pause: () => cur.pause(), play: () => cur.play(), destroy: () => cur.destroy(),
  };
}
import { Player, availableCombos } from './session.js';
import { store } from './store.js';
import { PRESETS, picks, programFocus, volume, blockWeek, themeOf, stage, learnedCount, fighterVolume, weekCombos, sharpenSkills } from './program.js';
import { profile, hasProfile, DEFAULT_PROFILE, CHOICES, weekDays, dayPlan, legsDay, suitable, adaptSession, coachNote, safetyNote, LEVELS } from './profile.js';
import { t, L, LANGS, tr } from './i18n.js';
import { initSync, onSync, signIn, signInGoogle, signOut, resetPassword, syncAvailable } from './sync.js';

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

let cloudOn = false;
onSync(st => {
  const was = cloudOn; cloudOn = !!st.email;
  if (was !== cloudOn && /^#?\/?(today)?$/.test(location.hash.replace('#/', ''))) render();
});
function backupDue() {
  const s = store.get();
  if (s.log.length < 2 || cloudOn) return false;
  return !s.lastExport || (Date.now() - new Date(s.lastExport)) / 864e5 > 14;
}

// ---------- views ----------
function Today() {
  if (!hasProfile()) return Profile(true);
  const d = WEEK[todayIdx()], other = profile().other;
  const fighter = stage() === 'fighter';
  const dk = dayPlan(d.day, fighter)?.key || null;
  const sessionKey = !fighter && dk === 'main' && isDeload() ? 'technique' : dk;
  const mine = picks().length > 0;
  const focus = fighter ? (sessionKey === 'ffight' || sessionKey === 'footwork' ? [] : sharpenSkills(d.day, weekNumber())) : sessionKey && sessionKey !== 'footwork' ? (mine && programFocus(d.day, weekNumber()).length ? programFocus(d.day, weekNumber()) : focusTechs(sessionKey === 'main' ? 3 : 2)) : [];
  const note = sessionKey ? coachNote({ key: sessionKey, bw: blockWeek(weekNumber()), fighter, deload: isDeload() }) : '';
  const el = h(`<section>
    <h1>${L(DAY_NAMES)[d.day]} <small>· ${tr('week')} ${weekNumber()}${isDeload() ? ' (' + tr('deload') + ')' : ''}</small></h1>
    ${isDeload() ? `<p class="note">${t('deloadNote')}</p>` : ''}
    ${syncAvailable() && !cloudOn ? `<p class="note"><strong>${tr("Your progress isn't backed up yet.")}</strong> <a href="#/settings">${tr('Sign in once')}</a> ${tr('to save it to the cloud automatically.')}</p>` : ''}
    ${backupDue() ? `<p class="note">${tr('Your progress is saved only on this phone.')} <a href="#/settings">${tr('Back it up')}</a> ${tr('(takes 2 seconds).')}</p>` : ''}
    ${other ? `<div class="day-grid">
      <div class="card k-run"><h3>${t('run')}</h3><p>${d.run ? esc(L(d.run)) : t('rest')}</p></div>
      <div class="card k-strength"><h3>${t('strength')}${d.combat && d.strength ? ' · ' + tr('after combat') : ''}</h3>${d.strength ? `<details><summary>${esc(L(STRENGTH[d.strength].name))}</summary><ul class="slist">${STRENGTH[d.strength].items.map(([n, r]) => `<li>${esc(tr(n))} <em>${esc(tr(r))}</em></li>`).join('')}</ul></details>` : `<p>${t('rest')}</p>`}</div>
    </div>` : ''}
    <div class="card k-combat big">
      <h3>${t('combat')}</h3>
      ${sessionKey ? `
        <p><strong>${esc(L(SESSION_TYPES[sessionKey].name))}</strong> · ${tr('about {n} min', { n: sessionMinutes(sessionKey, focus) })}<br>${esc(L(SESSION_TYPES[sessionKey].blurb).replace(/^\d+(-\d+| to \d+)? (min|წთ)[.,]? /, ''))}</p>
        ${mine ? `<p class="muted small">${tr('From')} <a href="#/plan">${tr('your plan')}</a>: ${fighter ? tr('Fighter training') + ' · ' : ''}${esc(tr((fighter ? fighterVolume : volume)(weekNumber()).label))}</p>` : `<p class="muted small"><a href="#/plan">${tr('Pick your skills')}</a> ${tr('to get a full weekly plan.')}</p>`}
        ${note ? `<p class="coach"><strong>${tr("Coach's note")}:</strong> ${esc(note)}</p>` : ''}
        ${fighter && sessionKey === 'fcombo' ? `<p class="muted">${tr('Combos of the week')}: <strong>${weekCombos(weekNumber()).map(c => esc(c.say)).join(' · ')}</strong></p>` : ''}
        ${focus.length ? `<p class="muted">${fighter ? tr('Sharpen today') : t('focusToday')}:</p><ul class="chips">${focus.map(id => `<li><a href="#/tech/${id}">${esc(L(techById[id].name))}</a></li>`).join('')}</ul>` : ''}
        <a class="btn primary" href="#/session/${sessionKey}/${focus.join(',')}">${t('start')}</a>
      ` : `<p>${t('noCombatToday')}</p>
        <a class="btn" href="#/session/footwork/">${tr('10-15 min footwork (optional)')}</a>`}
    </div>
  </section>`);
  view.replaceChildren(el);
}

function Week() {
  const ti = todayIdx(), other = profile().other;
  const wk = weekNumber();
  const el = h(`<section>
    <h1>${t('week')}</h1>
    ${planCard(wk, true)}
    <div class="week">
      ${WEEK.map(d => `
        <div class="wday ${d.day === ti ? 'today' : ''} type-${d.type}">
          <div class="wname">${L(DAY_NAMES)[d.day].slice(0, 3)}</div>
          ${other ? `<div class="wrow k-run"><span>${t('run')}</span>${d.run ? esc(L(d.run)) : '—'}</div>
          <div class="wrow k-strength"><span>${t('strength')}</span>${d.strength ? `<details><summary>${esc(L(STRENGTH[d.strength].name))}</summary><ul>${STRENGTH[d.strength].items.map(([n, r]) => `<li>${esc(tr(n))} <em>${esc(tr(r))}</em></li>`).join('')}</ul></details>` : '—'}</div>` : ''}
          <div class="wrow k-combat"><span>${t('combat')}</span>${(() => { const k = dayPlan(d.day, stage() === 'fighter')?.key; return k ? `<a href="#/session/${k}/">${esc(L(SESSION_TYPES[k].name))}</a>` : '—'; })()}</div>
        </div>`).join('')}
    </div>
    ${other ? `<h2>${t('weekRules')}</h2>
    <ul>${L(RULES).map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
  </section>`);
  view.replaceChildren(el);
}

// One week of the skills plan: what each training day trains and how much.
function sessionSummary(key, v) {
  if (key === 'main' && v.rounds) return tr('{n} x {t} rounds on call, after 2 min per skill', { n: v.rounds, t: fmt(v.roundSecs) });
  return tr('{n} x 2 min per skill (first set slow), then light shadowboxing', { n: v.techSets });
}
function planCard(week, compact) {
  if (!picks().length) return compact ? `<div class="card plan"><h3>${tr('My skills plan')}</h3><p>${tr('Pick the skills you want to learn and the app builds your weekly combat plan.')}</p><a class="btn primary" href="#/plan/edit">${tr('Pick skills')}</a></div>` : '';
  if (stage() === 'fighter') return fighterCard(week, compact);
  const v = volume(week), ti = todayIdx();
  return `<div class="card plan ${compact ? '' : 'wk'} ${week === weekNumber() ? 'now' : ''}">
    <h3>${tr('Week')} ${week} · ${esc(tr(v.label))}${themeOf(week) ? ` · ${tr('focus')}: ${esc(tr(themeOf(week).name))}` : ''}</h3>
    ${weekDays(false).filter(x => x.key !== 'footwork').map(({ day, key: k }) => {
      const f = programFocus(day, week), key = k === 'main' && v.rounds ? 'main' : 'technique';
      const isToday = week === weekNumber() && day === ti;
      return `<div class="pday ${isToday ? 'today' : ''}"><strong>${L(DAY_NAMES)[day].slice(0, 3)}</strong>
        <ul class="chips">${f.map(id => `<li><a href="#/tech/${id}">${esc(L(techById[id].name))}</a></li>`).join('')}</ul>
        <span class="muted small">${esc(sessionSummary(key, v))}${day === legsDay() ? '. ' + tr('No hard kicks (legs day).') : ''}</span>
        ${isToday ? `<a class="btn primary small" href="#/session/${key}/${f.join(',')}">${t('start')}</a>` : ''}</div>`;
    }).join('')}
    ${compact ? `<a class="small" href="#/plan">${tr('Full 4-week plan and your skills')} →</a>` : ''}
  </div>`;
}

function fighterCard(week, compact) {
  const v = fighterVolume(week), ti = todayIdx(), now = week === weekNumber();
  return `<div class="card plan ${now ? 'now' : ''}">
    <h3>${tr('Week')} ${week} · ${tr('Fighter training')} · ${esc(tr(v.label))}</h3>
    ${weekDays(true).filter(x => x.key !== 'footwork').map(({ day, key }) => {
      const type = SESSION_TYPES[key], f = key === 'ffight' ? [] : sharpenSkills(day, week), isToday = now && day === ti;
      const sum = key === 'fcombo' ? `${tr('Combos of the week')}: ${weekCombos(week).map(c => esc(c.say)).join(' · ')}`
        : key === 'ffight' ? tr('{n} x {t} fight rounds', { n: v.rounds, t: fmt(v.roundSecs) }) + (v.burst ? ' + ' + tr('{n} punch-outs, sprawls, core', { n: v.burst }) : '')
          : tr('Footwork, {n} defence rounds, hands-only combos', { n: Math.max(2, v.rounds - 1) });
      return `<div class="pday ${isToday ? 'today' : ''}"><strong>${L(DAY_NAMES)[day].slice(0, 3)} · ${esc(L(type.name))}</strong>
        <span class="muted small">${sum}</span>
        ${f.length ? `<ul class="chips">${f.map(id => `<li><a href="#/tech/${id}">${esc(L(techById[id].name))}</a></li>`).join('')}</ul>` : ''}
        ${isToday ? `<a class="btn primary small" href="#/session/${key}/${f.join(',')}">${t('start')}</a>` : ''}</div>`;
    }).join('')}
    ${compact ? `<a class="small" href="#/plan">${tr('Full 4-week plan and your skills')} →</a>` : ''}
  </div>`;
}

function Plan(mode) {
  const mine = picks();
  if (mode === 'edit' || !mine.length) return PlanEdit(mine);
  const wk = weekNumber(), first = wk - blockWeek(wk) + 1;
  const fighter = stage() === 'fighter', n = learnedCount();
  const el = h(`<section>
    <h1>${tr('My skills plan')}</h1>
    <div class="stages">
      <div class="stage ${fighter ? 'past' : 'cur'}"><strong>1 · ${tr('Learn the skills')}</strong>
        <span class="muted small">${tr('{n} of {m} marked solid', { n, m: mine.length })}</span>
        <div class="progress"><div style="width:${(n / mine.length) * 100}%"></div></div></div>
      <div class="stage ${fighter ? 'cur' : ''}"><strong>2 · ${tr('Fighter training')}</strong>
        <span class="muted small">${tr('The routine you keep for years')}</span></div>
    </div>
    <p>${tr(fighter ? 'FIGHTER_INTRO' : 'LEARN_INTRO')}</p>
    ${fighter ? `<button class="btn ghost" data-stage="learn">${tr('Back to learning (add new skills)')}</button>` : `<button class="btn" data-stage="fighter">${tr("I've learned them: start fighter training")}</button>`}
    <div class="week">${[0, 1, 2, 3].map(i => planCard(first + i, false)).join('')}</div>
    <h2>${tr('Your skills')}</h2>
    <ul class="chips">${mine.map(id => `<li><a href="#/tech/${id}">${esc(L(techById[id].name))}</a></li>`).join('')}</ul>
    <a class="btn" href="#/plan/edit">${tr('Change skills')}</a>
  </section>`);
  el.addEventListener('click', e => {
    const to = e.target.dataset.stage; if (!to) return;
    store.update(st => {
      st.program = { ...st.program, fighter: to === 'fighter' };
      if (to === 'learn') picks().forEach(id => { if (st.status[id] === 'done') st.program.fighter = false; });
    }, to === 'fighter' ? tr('Fighter training started') : tr('Back to learning'));
    if (to === 'learn') { location.hash = '#/plan/edit'; return; }
    Plan();
  });
  view.replaceChildren(el);
}

function PlanEdit(mine) {
  const sel = new Set(mine);
  const el = h(`<section>
    <h1>${tr('Pick your skills')}</h1>
    <p class="muted">${tr('Tap the skills you want to train. Start with a ready set if you like, then add or remove.')}</p>
    <div class="filters">${Object.entries(PRESETS).map(([k, p]) => `<button class="pill" data-preset="${k}">${esc(tr(p.name))}</button>`).join('')}</div>
    ${Object.entries(DISCIPLINES).map(([k, d]) => `<h2>${esc(L(d))}</h2><div class="pickgrid">${TECHNIQUES.filter(x => x.discipline === k).map(x => `<button class="pick" data-id="${x.id}" aria-pressed="false">${esc(L(x.name))}</button>`).join('')}</div>`).join('')}
    <div class="savebar"><span class="count"></span><button class="btn primary" data-save>${tr('Build my plan')}</button></div>
  </section>`);
  const sync = () => {
    el.querySelectorAll('.pick').forEach(b => b.setAttribute('aria-pressed', sel.has(b.dataset.id)));
    $('.count', el).textContent = tr('{n} picked', { n: sel.size });
    $('[data-save]', el).disabled = sel.size < 2;
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.preset) { sel.clear(); PRESETS[b.dataset.preset].ids.forEach(id => sel.add(id)); }
    if (b.dataset.id) sel.has(b.dataset.id) ? sel.delete(b.dataset.id) : sel.add(b.dataset.id);
    if ('save' in b.dataset) {
      const ids = TECHNIQUES.map(x => x.id).filter(id => sel.has(id));
      store.update(st => {
        st.program = { picks: ids, since: isoDate(), combosAdded: true };
        ids.forEach(id => { if (!st.status[id]) st.status[id] = 'learning'; });
      }, tr('Plan saved'));
      location.hash = '#/plan'; return;
    }
    sync();
  });
  view.replaceChildren(el); sync();
}

// ---------- profile ----------
// Who you are as a fighter. First launch asks once; Settings can change it any time.
function Profile(first) {
  const p = profile(), ka = store.get().lang === 'ka';
  const lab = c => (ka && c[2]) || tr(c[1]);
  const group = (k, multi) => `<div class="pgroup" data-k="${k}"${multi ? ' data-multi' : ''}>${CHOICES[k].map(c => `<button type="button" class="pill${(multi ? p[k].includes(c[0]) : p[k] === c[0]) ? ' on' : ''}" data-v="${c[0]}">${esc(lab(c))}${c[3] ? `<small>${esc(tr(c[3]))}</small>` : ''}</button>`).join('')}</div>`;
  const el = h(`<section class="profile">
    <h1>${first ? tr('Welcome to Combat Coach') : tr('Your profile')}</h1>
    <p class="muted">${tr('A few questions so the plan fits you. You can change any answer later in Settings.')}</p>
    ${first && syncAvailable() ? `<p class="note">${tr('Used the app on another phone?')} <a href="#/settings">${tr('Sign in')}</a> ${tr('and your plan comes back.')}</p>` : ''}
    <h2>${tr('Your experience')}</h2>${group('level')}
    <h2>${tr('Your stance')}</h2>${group('stance')}
    <h2>${tr('Training days')}</h2>
    <div class="pgroup days" data-k="days" data-multi>${L(DAY_NAMES).map((n, i) => `<button type="button" class="pill${p.days.includes(i) ? ' on' : ''}" data-v="${i}">${esc(n.slice(0, 3))}</button>`).join('')}</div>
    <p class="muted small daysmsg">${tr('Pick 2 to 6 days. Leave a day off between hard sessions if you can.')}</p>
    <h2>${tr('Time per session')}</h2>${group('minutes')}
    <h2>${tr('Your goal')}</h2>${group('goal')}
    <h2>${tr('Equipment')}</h2>${group('kit')}
    <h2>${tr('Anything to protect?')}</h2>${group('limits', true)}
    <p class="muted small">${tr('Techniques that load these areas are left out, and exercises are swapped for safer ones. If something hurts, see a doctor or physio first.')}</p>
    ${p.other ? `<label class="row"><input type="checkbox" class="other" checked> ${tr('Also show my running and strength plan')}</label>` : ''}
    <div class="savebar"><button class="btn primary" data-save>${first ? tr('Build my plan') : t('save')}</button></div>
  </section>`);
  const val = { ...p, days: [...p.days], limits: [...p.limits] };
  el.addEventListener('click', e => {
    const b = e.target.closest('.pill');
    if (b) {
      const g = b.parentElement, k = g.dataset.k, raw = b.dataset.v, v = k === 'days' || k === 'minutes' ? +raw : raw;
      if ('multi' in g.dataset) { const set = new Set(val[k]); set.has(v) ? set.delete(v) : set.add(v); val[k] = [...set]; b.classList.toggle('on'); }
      else { val[k] = v; g.querySelectorAll('.pill').forEach(x => x.classList.toggle('on', x === b)); }
      const n = val.days.length; $('[data-save]', el).disabled = n < 2 || n > 6;
      $('.daysmsg', el).classList.toggle('err', n < 2 || n > 6);
      return;
    }
    if (!('save' in (e.target.dataset || {}))) return;
    if ($('.other', el)) val.other = $('.other', el).checked;
    val.days.sort((a, b) => a - b);
    store.update(st => {
      st.profile = val;
      if (!first) return;
      const mon = new Date(); mon.setDate(mon.getDate() - (mon.getDay() + 6) % 7);
      if (!st.startDate) st.startDate = isoDate(mon);
      st.phaseUnlocked = Math.max(st.phaseUnlocked || 1, { new: 1, some: 2, exp: 3 }[val.level]);
      if (!st.program?.picks?.length) {
        const ids = PRESETS[val.level === 'new' ? 'basics' : 'allround'].ids;
        st.program = { picks: ids, since: isoDate(), combosAdded: true };
        const known = val.level === 'exp' ? TECHNIQUES.filter(x => x.phase === 1 && !x.uses).map(x => x.id) : val.level === 'some' ? ['stance', 'step', 'jab', 'cross'] : [];
        ids.forEach(id => { st.status[id] = known.includes(id) ? 'done' : (st.status[id] || 'learning'); });
      }
    }, first ? tr('Plan built') : tr('Profile saved'));
    location.hash = first ? '#/today' : '#/settings';
    if (first) render();
  });
  view.replaceChildren(el);
}

function Pathway() {
  const s = store.get();
  const el = h(`<section><h1>${t('pathway')}</h1>${PHASES.map(p => {
    const techs = TECHNIQUES.filter(x => x.phase === p.phase);
    const doneN = techs.filter(x => s.status[x.id] === 'done').length;
    const locked = p.phase > s.phaseUnlocked;
    return `<div class="phase ${locked ? 'locked' : ''}">
      <h2>${t('phase')} ${p.phase}: ${esc(L(p.name))} <small>${tr('weeks')} ${p.weeks}</small></h2>
      <p>${esc(L(p.goal))}</p>
      <div class="progress"><div style="width:${(doneN / techs.length) * 100}%"></div></div>
      <p class="muted">${doneN} / ${techs.length} ${t('done').toLowerCase()}</p>
      <ul class="techlist">${techs.map(x => `<li><a href="#/tech/${x.id}">${esc(L(x.name))}</a> <span class="disc">${esc(L(DISCIPLINES[x.discipline]))}</span> ${statusBadge(statusOf(x.id))}</li>`).join('')}</ul>
      <div class="checkpoint"><strong>${t('checkpoint')}:</strong> ${esc(L(p.checkpoint))}
        ${s.checkpoints[p.phase] ? `<p class="ok">✓ ${tr('Passed')} ${s.checkpoints[p.phase]} <button class="btn ghost small" data-unpass="${p.phase}">${tr('Undo')}</button></p>`
          : locked ? '' : `<button class="btn" data-pass="${p.phase}">${t('passCheckpoint')}</button>`}
      </div>
    </div>`;
  }).join('')}</section>`);
  el.addEventListener('click', e => {
    const { pass, unpass } = e.target.dataset;
    if (!pass && !unpass) return;
    store.update(st => {
      if (pass) st.checkpoints[pass] = isoDate(); else delete st.checkpoints[unpass];
      let n = 1; while (st.checkpoints[n] && n < 3) n++; // phases open in order
      st.phaseUnlocked = n;
    }, pass ? tr('Phase {n} checkpoint passed', { n: pass }) : tr('Phase {n} checkpoint removed', { n: unpass }));
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
      <div><strong>${esc(L(x.name))}</strong><br><span class="muted">${esc(L(LEVELS[x.phase]))} · ${esc(L(DISCIPLINES[x.discipline]))}</span><br>${statusBadge(statusOf(x.id))}</div>
    </a>`).join('')}</div></section>`);
  el.querySelector('.filters').addEventListener('click', e => {
    if (e.target.dataset.f) { try { sessionStorage.setItem('libFilter', e.target.dataset.f); } catch { /* ignore */ } Library(); }
  });
  view.replaceChildren(el);
  // Animate thumbnails only while visible.
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    const slot = en.target;
    if (en.isIntersecting && !slot._fig) slot._fig = createFigure(slot, slot.dataset.tech, { speed: 0.6, mirror: profile().stance === 'south' });
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
    <p class="muted">${esc(L(LEVELS[x.phase]))} · ${esc(L(DISCIPLINES[x.discipline]))} · ${statusBadge(st)}</p>
    ${suitable(id) ? '' : `<p class="note">${tr('Left out of your plan because of the limits in your profile.')} <a href="#/profile">${tr('Profile')}</a></p>`}
    <p class="purpose">${esc(L(x.purpose))}</p>
    ${x.uses ? `<p class="muted small">${tr('Built from')}: ${x.uses.map(u => `<a href="#/tech/${u}">${esc(L(techById[u].name))}</a>`).join(', ')}</p>` : ''}
    <div class="fig-big"></div>
    <div class="figcap" aria-live="polite"></div>
    <div class="figctl">
      <div class="seg" data-g="view">
        <button class="pill" data-view="side">${tr('Side')}</button><button class="pill on" data-view="three">3/4</button><button class="pill" data-view="front">${tr('Front')}</button>
      </div>
      <div class="seg" data-g="mode">
        <button class="pill" data-mode="step">${tr('Step by step')}</button><button class="pill" data-mode="slow">${t('slow')}</button><button class="pill on" data-mode="normal">${t('normal')}</button>
      </div>
      ${MOCAP.has(id) ? `<div class="seg" data-g="model"><button class="pill${(s.model || 'fighter') === 'fighter' ? ' on' : ''}" data-model="fighter">${tr('Fighter')}</button><button class="pill${s.model === 'mannequin' ? ' on' : ''}" data-model="mannequin">${tr('Mannequin (lead side blue)')}</button></div>` : ''}
      <p class="muted small">${MOCAP.has(id) ? tr('MOCAP_HINT') : tr('FIGURE_HINT')}</p>
    </div>
    <h2>${t('keyPoints')}</h2>
    <ol>${L(x.keyPoints).map(k => `<li>${esc(k)}</li>`).join('')}</ol>
    <h2>${t('mistakes')}</h2>
    <div class="mistakes">${L(x.mistakes).map(m => `<div class="mistake"><div class="m">✗ ${esc(m.m)}</div><div class="fix">✓ ${esc(m.fix)}</div></div>`).join('')}</div>
    <h2>${t('drills')}</h2>
    <ul>${L(x.drills).map(d => `<li><strong>${esc(d.name)}:</strong> ${esc(d.how)}</li>`).join('')}</ul>
    <h2>${tr('Safety')}</h2>
    <p class="safety">${esc(L(safetyNote(x)))}</p>
    ${profile().stance === 'south' ? `<p class="muted small">${tr('Shown southpaw (mirrored) to match your stance. Lead means your right side.')}</p>` : ''}
    <h2>${t('notes')}</h2>
    <textarea class="notes" rows="3" placeholder="${tr('What felt off? What did the video show?')}">${esc(s.notes[id] || '')}</textarea>
    <div class="actions">
      ${st === 'locked' ? `<p class="muted">${t('locked')}: ${tr('pass the phase {n} checkpoint first.', { n: x.phase - 1 })}</p>` : `
        ${st !== 'learning' ? `<button class="btn" data-st="learning">${t('markLearning')}</button>` : ''}
        ${st !== 'done' ? `<button class="btn primary" data-st="done">${t('markDone')}</button>` : ''}
        ${st === 'learning' || st === 'done' ? `<button class="btn ghost" data-st="">${t('markReset')}</button>` : ''}
        <a class="btn" href="#/session/drill/${id}">${tr('Drill this (3 x 2 min)')}</a>`}
    </div>
  </section>`);
  const rerender = () => { cleanup.forEach(f => f()); cleanup = []; Tech(id); };
  view.replaceChildren(el);
  const cap = $('.figcap', el);
  const fig = createViewer($('.fig-big', el), id, { onLabel: (txt, i, n) => { cap.textContent = n > 1 ? `${i}/${n} · ${txt}` : txt; } });
  cleanup.push(() => fig.destroy());
  $('.figctl', el).addEventListener('click', e => {
    const b = e.target.closest('.pill'); if (!b) return;
    b.parentElement.querySelectorAll('.pill').forEach(x => x.classList.toggle('on', x === b));
    if (b.dataset.model) { store.set({ model: b.dataset.model }); return rerender(); }
    if (b.dataset.view) fig.setView(b.dataset.view);
    if (b.dataset.mode) { fig.setStep(b.dataset.mode === 'step'); fig.setSpeed(b.dataset.mode === 'normal' ? 1 : 0.4); }
  });
  $('.notes', el).addEventListener('change', e => store.update(st => { st.notes[id] = e.target.value; }));
  $('.actions', el).addEventListener('click', e => {
    if (!('st' in e.target.dataset)) return;
    store.update(st => { if (e.target.dataset.st) st.status[id] = e.target.dataset.st; else delete st.status[id]; },
      tr({ learning: 'Marked as learning', done: 'Marked as solid', '': 'Status reset' }[e.target.dataset.st]));
    rerender();
  });
}

// A session as it will actually run for you (volume, profile, time limit).
function buildSession(kind, focus) {
  const type = SESSION_TYPES[kind] || SESSION_TYPES.technique;
  const fk = kind.startsWith('f') && kind !== 'footwork';
  return adaptSession(type.build({ focus, v: fk ? fighterVolume(weekNumber()) : picks().length ? volume(weekNumber()) : undefined, combos: weekCombos(weekNumber()) }));
}
const sessionMinutes = (kind, focus) => Math.round(buildSession(kind, focus).reduce((a, x) => a + x.secs, 0) / 60);

function Session(kind, techCsv) {
  let focus = (techCsv || '').split(',').filter(id => techById[id]);
  let segs;
  if (kind === 'drill') {
    segs = [
      { label: { en: 'Warm-up: shadowbox easy', ka: 'გახურება: მსუბუქი ჩრდილთან ბრძოლა' }, kind: 'warm', secs: 120 },
      ...[1, 2, 3].flatMap(n => [{ label: { en: `Round ${n} of 3`, ka: `რაუნდი ${n} / 3` }, kind: 'work', secs: 120, tech: focus[0], slow: n === 1 }, { label: { en: 'Rest' }, kind: 'rest', secs: 45 }]),
    ];
  } else {
    if (!focus.length && !['footwork', 'ffight', 'fcombo', 'fdefence'].includes(kind)) focus = focusTechs(kind === 'main' ? 3 : 2);
    segs = buildSession(kind, focus);
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
      ${focus.length ? `<h2>${t('howFelt')}</h2><div class="rates">${focus.map(id => `<div class="rate" data-id="${id}"><span>${esc(L(techById[id].name))}</span>
        <div class="seg">${[[1, 'feltEasy'], [2, 'feltOk'], [3, 'feltOff']].map(([v, k]) => `<button class="pill${v === 2 ? ' on' : ''}" data-r="${v}">${t(k)}</button>`).join('')}</div></div>`).join('')}</div>
        <p class="muted small">${t('rateHint')}</p>` : ''}
      <button class="btn primary" data-a="save">${t('save')}</button>
    </div>
  </section>`);
  view.replaceChildren(el);

  let fig = null, figTech = null;
  const render = p => {
    const s = p.seg || segs[segs.length - 1];
    $('.seg-label', el).textContent = p.done ? tr('Done!') : `${L(s.label)}${s.tech ? ': ' + L(techById[s.tech].name) : ''}`;
    $('.clock', el).textContent = fmt(Math.max(0, Math.ceil(p.left)));
    el.className = `session kind-${p.done ? 'done' : s.kind}`;
    $('.callout', el).textContent = p.lastCall || '';
    $('[data-a=toggle]', el).textContent = p.running ? t('pause') : (p.elapsed ? t('resume') : t('start'));
    el.querySelectorAll('.seglist li').forEach(li => li.classList.toggle('cur', +li.dataset.i === p.i));
    const tech = s.tech || null;
    if (tech !== figTech) {
      figTech = tech; fig?.destroy(); fig = null;
      if (tech) {
        fig = createViewer($('.fig-big', el), tech, { speed: s.slow ? 0.4 : 1, step: !!s.slow && !MOCAP.has(tech) });
        $('.cues', el).innerHTML = `<ul>${L(techById[tech].keyPoints).slice(0, 3).map(k => `<li>${esc(k)}</li>`).join('')}</ul><p class="muted">${tr('Watch for')}: ${esc(L(techById[tech].mistakes)[0].m)}</p>`;
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
    const r = e.target.closest('[data-r]');
    if (r) { r.parentElement.querySelectorAll('.pill').forEach(x => x.classList.toggle('on', x === r)); return; }
    const a = e.target.dataset.a;
    if (a === 'toggle') { player.toggle(); if (player.running) wake(); }
    if (a === 'skip') player.next();
    if (a === 'finish') { player.stop(); player.done = true; render(player); }
    if (a === 'save') {
      const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
      const ratings = {};
      el.querySelectorAll('.rate').forEach(d => { ratings[d.dataset.id] = +$('.pill.on', d).dataset.r; });
      store.update(st => {
        st.log.push({ date: isoDate(), at: new Date().toISOString().slice(11, 19), type: kind, minutes, rpe: +$('.rpe', el).value, techs: focus, ratings });
        st.feel = { ...(st.feel || {}) };
        Object.entries(ratings).forEach(([id, v]) => { st.feel[id] = { r: v, date: isoDate() }; });
      }, tr('Session saved'));
      location.hash = '#/log';
    }
  });
  $('.rpe', el).addEventListener('input', e => { e.target.nextElementSibling.textContent = e.target.value; });
}

function Log() {
  const s = store.get();
  const mon = d => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return isoDate(x); };
  const thisMon = mon(isoDate());
  const weeks = Array.from({ length: 8 }, (_, i) => { const d = new Date(thisMon + 'T00:00:00'); d.setDate(d.getDate() - 7 * (7 - i)); return isoDate(d); });
  const byWeek = {}; s.log.forEach(e => { const w = mon(e.date); (byWeek[w] ||= []).push(e); });
  const mins = w => (byWeek[w] || []).reduce((a, e) => a + e.minutes, 0);
  const max = Math.max(60, ...weeks.map(mins));
  let streak = 0; // weeks in a row with 2+ sessions (this week counts once it reaches 2)
  for (let i = weeks.length - 1; i >= 0; i--) {
    const n = (byWeek[weeks[i]] || []).length;
    if (n >= 2) streak++; else if (i !== weeks.length - 1) break;
  }
  const wk = byWeek[thisMon] || [];
  const ids = picks().length ? picks() : TECHNIQUES.map(x => x.id);
  const solid = ids.filter(id => s.status[id] === 'done').length, learning = ids.filter(id => s.status[id] === 'learning').length;
  const feel = s.feel || {};
  const off = ids.filter(id => feel[id]?.r === 3), easy = ids.filter(id => feel[id]?.r === 1 && s.status[id] !== 'done');
  const chip = id => `<li><a href="#/tech/${id}">${esc(L(techById[id].name))}</a></li>`;
  const el = h(`<section><h1>${t('log')}</h1>
    <div class="stats">
      <div class="card"><h3>${t('thisWeek')}</h3><p class="stat">${wk.length}</p><small>${t('sessions')}</small></div>
      <div class="card"><h3>${t('streak')}</h3><p class="stat">${streak}</p><small>${t('weeks')}</small></div>
      <div class="card"><h3>${t('skillsSolid')}</h3><p class="stat">${solid}<small> / ${ids.length}</small></p><small>${learning} ${t('learning').toLowerCase()}</small></div>
    </div>
    <h2>${t('minutesPerWeek')}</h2>
    <div class="bars">${weeks.map(w => `<div class="bar ${w === thisMon ? 'now' : ''}"><span style="height:${(mins(w) / max) * 100}%"></span><b>${mins(w) || ''}</b><i>${w.slice(8)}.${w.slice(5, 7)}</i></div>`).join('')}</div>
    <div class="progress"><div style="width:${(solid / ids.length) * 100}%"></div></div>
    ${off.length ? `<h2>${t('needsWork')}</h2><p class="muted small">${t('needsWorkHint')}</p><ul class="chips">${off.map(chip).join('')}</ul>` : ''}
    ${easy.length ? `<h2>${t('feelsEasy')}</h2><p class="muted small">${t('feelsEasyHint')}</p><ul class="chips">${easy.map(chip).join('')}</ul>` : ''}
    <h2>${t('history')}</h2>
    ${s.log.length ? `<table class="logtable"><thead><tr><th>${t('date')}</th><th>${t('session')}</th><th>${t('minutes')}</th><th>RPE</th><th>${t('techniques')}</th></tr></thead><tbody>
      ${s.log.slice(-30).reverse().map(e => `<tr><td>${e.date.slice(5)}</td><td>${esc(tr(e.type))}</td><td>${e.minutes}</td><td>${e.rpe}</td><td>${(e.techs || []).map(id => esc(L(techById[id]?.name)) + (e.ratings?.[id] === 3 ? ' ✗' : e.ratings?.[id] === 1 ? ' ✓' : '')).join(', ')}</td></tr>`).join('')}
    </tbody></table>` : `<p class="muted">${t('noLog')}</p>`}
  </section>`);
  view.replaceChildren(el);
}

function Settings() {
  const s = store.get();
  const el = h(`<section><h1>${t('settings')}</h1>
    ${syncAvailable() ? `<div class="card cloud">
      <h3>${tr('Cloud save')}</h3>
      <div class="cloud-in" hidden>
        <p class="cloud-status"></p>
        <button class="btn ghost" data-a="signout">${tr('Sign out')}</button>
      </div>
      <form class="cloud-out" hidden>
        <p class="small">${tr('Sign in once and everything you do is saved to your account automatically, on every phone you use.')}</p>
        <button class="btn primary" type="button" data-a="google">${tr('Continue with Google')}</button>
        <p class="small muted">${tr('Or use email (works best if the app is installed on your home screen):')}</p>
        <input type="email" name="email" placeholder="Email" autocomplete="email" required>
        <input type="password" name="pw" placeholder="${tr('Password (6+ characters)')}" autocomplete="current-password" minlength="6" required>
        <button class="btn" type="submit">${tr('Sign in')}</button>
        <button class="btn" type="button" data-a="create">${tr('Create account')}</button>
        <button class="btn ghost" type="button" data-a="forgot">${tr('Forgot password')}</button>
        <p class="cloud-msg small"></p>
      </form>
    </div>` : ''}
    <div class="card"><h3>${tr('Your profile')}</h3><p class="small">${esc(profileSummary())}</p><a class="btn" href="#/profile">${tr('Change profile')}</a></div>
    <label class="row"><input type="checkbox" class="voice" ${s.voice ? 'checked' : ''}> ${t('voice')}</label>
    <label class="row">${t('language')} <select class="lang">${LANGS.map(l => `<option value="${l.code}" ${l.code === s.lang ? 'selected' : ''}>${l.label}</option>`).join('')}</select></label>
    <label class="row">${tr('Plan start (Monday of week 1)')} <input type="date" class="start" value="${s.startDate || '2026-11-16'}"></label>
    <p class="muted small">${tr('Every 4th week from this date is a deload week.')}</p>
    <div class="actions">
      <button class="btn" data-a="export">${t('exportData')}</button>
      <label class="btn">${t('importData')}<input type="file" accept="application/json" class="imp" hidden></label>
      <button class="btn ghost" data-a="reset">${t('resetData')}</button>
    </div>
    <p class="muted small">${tr('Your data stays on this device (browser storage). Export it now and then as a backup.')}</p>
    <p class="muted small">${tr('Combos the timer can call right now:')} ${availableCombos().map(c => esc(c.say)).join(' · ')}</p>
  </section>`);
  view.replaceChildren(el);
  if (syncAvailable()) {
    const form = $('.cloud-out', el), msg = $('.cloud-msg', el);
    onSync(st => {
      if (!el.isConnected) return;
      $('.cloud-in', el).hidden = !st.email; form.hidden = !!st.email;
      if (st.email) $('.cloud-status', el).textContent = syncText(st);
    });
    const go = async create => {
      if (!form.reportValidity()) return;
      msg.textContent = tr(create ? 'Creating account...' : 'Signing in...');
      try { await signIn(form.email.value.trim(), form.pw.value, create); msg.textContent = ''; }
      catch (e) { msg.textContent = authError(e); }
    };
    form.onsubmit = e => { e.preventDefault(); go(false); };
    form.addEventListener('click', async e => {
      if (e.target.dataset.a === 'create') go(true);
      if (e.target.dataset.a === 'google') { try { msg.textContent = ''; await signInGoogle(); } catch (err) { msg.textContent = authError(err); } }
      if (e.target.dataset.a === 'forgot') {
        if (!form.email.value) { msg.textContent = tr('Type your email first.'); return; }
        try { await resetPassword(form.email.value.trim()); msg.textContent = tr('Reset email sent.'); } catch (err) { msg.textContent = authError(err); }
      }
    });
    $('[data-a=signout]', el).onclick = () => signOut();
  }
  $('.voice', el).onchange = e => store.set({ voice: e.target.checked });
  $('.lang', el).onchange = e => { store.set({ lang: e.target.value }); render(); };
  $('.start', el).onchange = e => store.set({ startDate: e.target.value });
  $('.imp', el).onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { store.import(await f.text()); Settings(); } catch { e.target.value = ''; $('.actions', el).insertAdjacentHTML('afterend', `<p class="err">${tr('That file could not be read.')}</p>`); }
  };
  el.addEventListener('click', e => {
    if (e.target.dataset.a === 'export') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([store.export()], { type: 'application/json' }));
      a.download = `combat-coach-${isoDate()}.json`; a.click();
      store.set({ lastExport: isoDate() });
    }
    if (e.target.dataset.a === 'reset' && e.target.textContent !== tr('Tap again to confirm')) {
      e.target.textContent = tr('Tap again to confirm'); return;
    }
    if (e.target.dataset.a === 'reset') { store.reset(); seed(); Settings(); }
  });
}

function profileSummary() {
  const p = profile(), ka = store.get().lang === 'ka';
  const lab = (k, v) => { const c = CHOICES[k].find(x => x[0] === v); return c ? (ka && c[2]) || tr(c[1]) : ''; };
  return [lab('level', p.level), lab('stance', p.stance).split(' (')[0], p.days.map(d => L(DAY_NAMES)[d].slice(0, 3)).join(' '), lab('minutes', p.minutes), lab('goal', p.goal), lab('kit', p.kit),
    p.limits.length ? tr('protect') + ': ' + p.limits.map(l => lab('limits', l)).join(', ') : ''].filter(Boolean).join(' · ');
}

function syncText(st) {
  if (st.state === 'saving') return `Saving... (${st.email})`;
  if (st.state === 'error') return `${tr('Not saved yet, will retry')}: ${st.error}`;
  if (st.state === 'saved') return `✓ ${tr('Saved to the cloud at')} ${new Date(st.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${st.email})`;
  return `${tr('Signed in as')} ${st.email}`;
}
function authError(e) {
  const c = e.code || '';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return tr('Email or password is wrong.');
  if (c.includes('email-already-in-use')) return tr('That email already has an account. Tap Sign in.');
  if (c.includes('popup')) return tr('Google sign-in was blocked or closed. Try again, or use email and password.');
  if (c.includes('network')) return tr('No internet. Try again when you are online.');
  return e.message;
}

// Undo toast: every user action can be taken back for 8 seconds.
let toastTimer = 0;
store.onAction(label => {
  let tEl = document.getElementById('toast');
  if (!tEl) { tEl = document.createElement('div'); tEl.id = 'toast'; tEl.setAttribute('role', 'status'); document.body.append(tEl); }
  tEl.innerHTML = `<span>${esc(tr(label))}</span><button type="button">${tr('Undo')}</button>`;
  tEl.className = 'show';
  tEl.querySelector('button').onclick = () => { store.undo(); tEl.className = ''; render(); };
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { tEl.className = ''; }, 8000);
});

// ---------- router ----------
const routes = { profile: () => Profile(false), today: Today, week: Week, plan: Plan, pathway: Pathway, library: Library, tech: Tech, session: Session, log: Log, settings: Settings };

function render() {
  cleanup.forEach(f => f()); cleanup = [];
  document.documentElement.lang = store.get().lang || 'en';
  const [name = 'today', ...args] = location.hash.replace(/^#\/?/, '').split('/');
  (routes[name] || Today)(...args);
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === `#/${name}` || (name === 'tech' && a.getAttribute('href') === '#/library') || (name === 'plan' && a.getAttribute('href') === '#/week')));
  document.querySelectorAll('[data-t]').forEach(n => { n.textContent = t(n.dataset.t); });
  window.scrollTo(0, 0);
}

// First run: start learning the four foundations.
function seed() {
  const s = store.get();
  if (!Object.keys(s.status).length && !s.log.length) store.update(st => { ['stance', 'step', 'jab', 'cross'].forEach(id => { st.status[id] = 'learning'; }); });
}

// One-time: plans saved before the combinations existed get all 21 of them (Beka asked, 2026-11-11).
function addCombos() {
  const p = store.get().program;
  if (!p?.picks?.length || p.combosAdded) return;
  store.update(st => {
    const ids = TECHNIQUES.filter(x => x.discipline === 'combos' || x.discipline === 'counters').map(x => x.id);
    st.program.picks = [...new Set([...st.program.picks, ...ids])]; st.program.combosAdded = true;
  });
}
// People who used the app before profiles existed keep exactly their setup (Mon/Wed/Fri + Sat footwork, run and strength shown).
function addProfile() {
  const s = store.get();
  if (s.profile || !(s.program?.picks?.length || s.log.length)) return;
  store.set({ profile: { ...DEFAULT_PROFILE, days: [0, 2, 4, 5], other: true } });
}
seed(); addCombos(); addProfile();
initSync(() => { addCombos(); addProfile(); render(); });
try { navigator.storage?.persist?.(); } catch { /* not supported */ }
window.addEventListener('hashchange', render);
onSync(st => {
  const dot = document.getElementById('syncdot'); if (!dot) return;
  dot.hidden = st.state === 'off';
  dot.className = 'syncdot s-' + st.state;
  dot.title = st.email ? syncText(st) : tr('Not signed in: data is only on this phone');
  dot.textContent = tr(st.state === 'saved' ? '✓ Saved' : st.state === 'saving' ? 'Saving' : st.state === 'error' ? 'Offline' : 'Not backed up');
});
render();

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
