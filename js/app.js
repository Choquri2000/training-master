import { TECHNIQUES, techById, DISCIPLINES } from './data/techniques.js';
import { PHASES, SESSION_TYPES, WEEK, DAY_NAMES, STRENGTH, RULES } from './data/plan.js';
import { createFigure } from './figure.js';
import { MOCAP, createMocap, webglOK, registerSeq } from './mocap.js';
import { STEPS, stepsSeq, stepsSay } from './data/combos.js';
import { LESSONS, lessonById } from './data/iq.js';
import { STYLES, styleById, STYLE_DISC, DIMS } from './data/styles.js';
import { ATTACKS, STYLE_W } from './data/spar.js';
import { DRILLS, drillById, drillOfDay, withDrill, COLORS } from './data/drills.js';

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
import { Player, availableCombos, say, bell } from './session.js';
import { store } from './store.js';
import { PRESETS, picks, programFocus, volume, blockWeek, themeOf, stage, learnedCount, fighterVolume, weekCombos, sharpenSkills, myCombos, fixActive, findWeak, eventInfo, phaseWeek } from './program.js';
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
const isDeload = () => phaseWeek(weekNumber()) === 4;

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
  const note = sessionKey ? coachNote({ key: sessionKey, bw: phaseWeek(weekNumber()), fighter, deload: isDeload() }) : '';
  const el = h(`<section>
    <h1>${L(DAY_NAMES)[d.day]} <small>· ${tr('week')} ${weekNumber()}${isDeload() ? ' (' + tr('deload') + ')' : ''}</small></h1>
    ${eventInfo() ? `<p class="evbadge">🥊 ${esc(eventInfo().name || tr('Your date'))}: ${eventInfo().days === 0 ? tr('today!') : tr('{n} days to go', { n: eventInfo().days })}</p>` : ''}
    ${fixActive() ? `<p class="note">${tr('Fix-it block')} · ${tr('day {n} of 14', { n: fixActive().day })}</p>` : ''}
    ${isDeload() ? `<p class="note">${t('deloadNote')}</p>` : ''}
    ${syncAvailable() && !cloudOn ? `<p class="note"><strong>${tr("Your progress isn't backed up yet.")}</strong> <a href="#/settings">${tr('Sign in once')}</a> ${tr('to save it to the cloud automatically.')}</p>` : ''}
    ${testsDue() ? `<p class="note">${tr('Your monthly tests are due.')} <a href="#/tests">${tr('Skill tests')}</a></p>` : ''}
    ${backupDue() ? `<p class="note">${tr('Your progress is saved only on this phone.')} <a href="#/settings">${tr('Back it up')}</a> ${tr('(takes 2 seconds).')}</p>` : ''}
    <div class="card k-combat big">
      <h3>${t('combat')}</h3>
      ${sessionKey ? `
        <p><strong>${esc(L(SESSION_TYPES[sessionKey].name))}</strong> · ${tr('about {n} min', { n: sessionMinutes(sessionKey, focus) })}<br>${esc(L(SESSION_TYPES[sessionKey].blurb).replace(/^\d+(-\d+| to \d+)? (min|წთ)[.,]? /, ''))}</p>
        ${mine ? `<p class="muted small">${tr('From')} <a href="#/plan">${tr('your plan')}</a>: ${fighter ? tr('Fighter training') + ' · ' : ''}${esc(tr((fighter ? fighterVolume : volume)(weekNumber()).label))}</p>` : `<p class="muted small"><a href="#/plan">${tr('Pick your skills')}</a> ${tr('to get a full weekly plan.')}</p>`}
        ${note ? `<p class="coach"><strong>${tr("Coach's note")}:</strong> ${esc(note)}</p>` : ''}
        ${fighter && sessionKey === 'fcombo' ? `<p class="muted">${tr('Combos of the week')}: <strong>${weekCombos(weekNumber()).map(c => esc(c.say)).join(' · ')}</strong></p>` : ''}
        ${(() => { const dd = drillOfDay(sessionKey, weekNumber(), profile()); return dd ? `<p class="muted">${tr('Drill of the day')}: <a href="#/drills/${dd.id}">${esc(L(dd.name))}</a></p>` : ''; })()}
        ${focus.length ? `<p class="muted">${fighter ? tr('Sharpen today') : t('focusToday')}:</p><ul class="chips">${focus.map(id => `<li><a href="#/tech/${id}">${esc(L(techById[id].name))}</a></li>`).join('')}</ul>` : ''}
        <a class="btn primary" href="#/session/${sessionKey}/${focus.join(',')}">${t('start')}</a>
      ` : `<p>${t('noCombatToday')}</p>
        <a class="btn" href="#/session/footwork/">${tr('10-15 min footwork (optional)')}</a>`}
    </div>
    ${other ? `<div class="card also"><h3>${tr('Also today')}</h3>
      <p><span class="dot k-run"></span>${t('run')}: ${d.run ? esc(L(d.run)) : t('rest')}</p>
      ${d.strength ? `<details><summary><span class="dot k-strength"></span>${esc(L(STRENGTH[d.strength].name))}${d.combat ? ' · ' + tr('after combat') : ''}</summary><ul class="slist">${STRENGTH[d.strength].items.map(([n, r]) => `<li>${esc(tr(n))} <em>${esc(tr(r))}</em></li>`).join('')}</ul></details>` : ''}
    </div>` : ''}
    <p class="center"><a class="btn ghost" href="#/spar">🥊 ${tr('Sparring partner')}</a> <a class="btn ghost" href="#/timer">⏱ ${tr('Round timer')}</a></p>
  </section>`);
  view.replaceChildren(el);
}

// The whole week with running and strength (only for people who show their other training).
function fullWeek() {
  const ti = todayIdx();
  return `<div class="week">
      ${WEEK.map(d => `
        <div class="wday ${d.day === ti ? 'today' : ''} type-${d.type}">
          <div class="wname">${L(DAY_NAMES)[d.day].slice(0, 3)}</div>
          <div class="wrow k-run"><span>${t('run')}</span>${d.run ? esc(L(d.run)) : '—'}</div>
          <div class="wrow k-strength"><span>${t('strength')}</span>${d.strength ? `<details><summary>${esc(L(STRENGTH[d.strength].name))}</summary><ul>${STRENGTH[d.strength].items.map(([n, r]) => `<li>${esc(tr(n))} <em>${esc(tr(r))}</em></li>`).join('')}</ul></details>` : '—'}</div>
          <div class="wrow k-combat"><span>${t('combat')}</span>${(() => { const k = dayPlan(d.day, stage() === 'fighter')?.key; return k ? `<a href="#/session/${k}/">${esc(L(SESSION_TYPES[k].name))}</a>` : '—'; })()}</div>
        </div>`).join('')}
    </div>
    <h3>${t('weekRules')}</h3>
    <ul>${L(RULES).map(r => `<li>${esc(r)}</li>`).join('')}</ul>`;
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
  const fighter = stage() === 'fighter', n = learnedCount(), sty = styleById[profile().style];
  const el = h(`<section>
    <h1>${tr('Plan')}</h1>
    <div class="stages">
      <div class="stage ${fighter ? 'past' : 'cur'}"><strong>1 · ${tr('Learn the skills')}</strong>
        <span class="muted small">${tr('{n} of {m} marked solid', { n, m: mine.length })}</span>
        <div class="progress"><div style="width:${(n / mine.length) * 100}%"></div></div></div>
      <div class="stage ${fighter ? 'cur' : ''}"><strong>2 · ${tr('Fighter training')}</strong>
        <span class="muted small">${tr('The routine you keep for years')}</span></div>
    </div>
    <div class="card stylecard">${sty ? `<span>${tr('Your style')}: <a href="#/styles/${sty.id}"><strong>${esc(SL(sty).name)}</strong></a></span> <a class="small" href="#/styles/quiz">${tr('Change')}</a>`
      : `<span>${tr('Train towards a fighting style?')}</span> <a class="btn small" href="#/styles/quiz">${tr('Find my style')}</a>`}</div>
    ${planCard(wk, false)}
    ${eventCard()}
    ${wk < first + 3 ? `<details><summary>${tr('Next weeks')}</summary><div class="week">${[1, 2, 3].map(i => first + blockWeek(wk) - 1 + i).filter(w => w <= first + 3).map(w => planCard(w, false)).join('')}</div></details>` : ''}
    ${profile().other ? `<details><summary>${tr('Running and strength this week')}</summary>${fullWeek()}</details>` : ''}
    <details><summary>${tr('How the plan works')}</summary><p>${tr(fighter ? 'FIGHTER_INTRO' : 'LEARN_INTRO')}</p>
      ${fighter ? `<button class="btn ghost" data-stage="learn">${tr('Back to learning (add new skills)')}</button>` : `<button class="btn" data-stage="fighter">${tr("I've learned them: start fighter training")}</button>`}
      <p class="small"><a href="#/pathway">${tr('Phases and checkpoints')}</a></p></details>
    <details><summary>${tr('Your skills')} (${mine.length})</summary>
      <ul class="chips">${mine.map(id => `<li><a href="#/tech/${id}">${esc(L(techById[id].name))}</a></li>`).join('')}</ul></details>
    <div class="actions"><a class="btn" href="#/plan/edit">${tr('Change skills')}</a> <a class="btn ghost" href="#/profile">${tr('Change profile')}</a></div>
  </section>`);
  el.addEventListener('click', e => {
    if (eventClick(e, el)) return Plan();
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
  const el = h(`<section><h1>${t('learn')}</h1>
    ${toolsRow()}
    <h2>${tr('Techniques')}</h2>
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
  return adaptSession(withDrill(type.build({ focus, v: fk ? fighterVolume(weekNumber()) : picks().length ? volume(weekNumber()) : undefined, combos: weekCombos(weekNumber()) }), kind, weekNumber(), profile()));
}
const sessionMinutes = (kind, focus) => Math.round(buildSession(kind, focus).reduce((a, x) => a + x.secs, 0) / 60);

function Session(kind, techCsv) {
  let focus = (techCsv || '').split(',').filter(id => techById[id]);
  let segs = extraSession(kind, techCsv);
  if (segs) focus = [];
  else if (kind === 'drill') {
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
    <div class="hint"></div>
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
      ${kind === 'spar' ? `<h2>${tr('How did you handle your partner?')}</h2><div class="sparbox"><div class="seg sparrate">${[[1, 'I got caught a lot'], [2, 'About right'], [3, 'I handled everything']].map(([v, n]) => `<button class="pill${v === 2 ? ' on' : ''}" data-r="${v}">${tr(n)}</button>`).join('')}</div></div>` : ''}
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
    const co = $('.callout', el); co.textContent = p.lastCall || '';
    co.classList.toggle('cue', !!s.silent); co.style.color = (s.colors && COLORS[p.lastCall]) || '';
    $('.hint', el).textContent = (p.lastCall && s.hints?.[p.lastCall]) || '';
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
    if (!tech) { const lg = s.legend ? `<p class="legend">${esc(L(s.legend))}</p>` : ''; if ($('.cues', el).innerHTML !== lg) $('.cues', el).innerHTML = lg; }
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
        if (kind === 'spar') { // the partner adapts: handled everything -> faster, caught a lot -> slower
          const r = +$('.sparrate .pill.on', el).dataset.r, sp = st.spar || { level: 3 };
          st.spar = { ...sp, level: Math.max(1, Math.min(10, sp.level + (r === 3 ? 1 : r === 1 ? -1 : 0))), last: { date: isoDate(), opp: techCsv, r } };
        }
      }, tr('Session saved'));
      location.hash = kind === 'formtest' ? '#/tests/form' : kind === 'spar' ? '#/spar' : '#/log';
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
    <a class="tool testscard" href="#/tests"><b>${tr('Skill tests')}</b><span>${testsDue() ? tr('Your monthly tests are due.') : tr('{n} results', { n: (s.tests || []).length })}</span></a>
    ${fixCard()}
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
  el.addEventListener('click', e => { if (fixClick(e)) Log(); });
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

// ---------- tools: my combos, quick timer, skill tests, fight IQ ----------
const toolsRow = () => `<div class="tools">
  <a class="tool wide" href="#/drills"><b>${tr('Practical drills')}</b><span>${tr('Footwork box, bands, light dumbbells, reaction cues, balance, conditioning, strong finishes')}</span></a>
  <a class="tool wide" href="#/styles"><b>${tr('Fighting styles')}</b><span>${tr('Peek-a-boo, Soviet school, Muay Khao, Dutch, wrestle-boxing and more, compared')}</span></a>
  <a class="tool" href="#/iq"><b>${tr('Fight IQ')}</b><span>${tr('Strategy, with drills')}</span></a>
  <a class="tool" href="#/combos"><b>${tr('My combos')}</b><span>${tr('Build your own, animated')}</span></a>
</div>`;

const R1 = s => ({ en: s[0], ka: s[1] });
// Extra session kinds: your combo, the quick timer, a Fight IQ drill, the form test.
function extraSession(kind, arg) {
  const warm = { label: R1(['Get ready: bounce, loosen the shoulders', 'მომზადება: ხტუნვა, მხრების მოდუნება']), kind: 'warm' };
  const rounds = (n, secs, rest, extra, name = ['Round', 'რაუნდი']) => Array.from({ length: n }, (_, i) => [
    { label: R1([`${name[0]} ${i + 1} of ${n}`, `${name[1]} ${i + 1} / ${n}`]), kind: 'work', secs, ...extra },
    ...(i < n - 1 ? [{ label: R1(['Rest', 'დასვენება']), kind: 'rest', secs: rest }] : []),
  ]).flat();
  if (kind === 'my') {
    const c = (store.get().myCombos || []).find(x => x.id === arg); if (!c) return null;
    return [{ ...warm, secs: 120 }, ...rounds(3, 120, 45, { repeat: c.say, pace: 'medium' }, ['Drill', 'დრილი'])];
  }
  if (kind === 'timer') {
    const o = timerOpts();
    const calls = { none: {}, hands: { calls: 'combos', noKicks: true }, thai: { calls: 'combos' }, defence: { calls: 'defence' }, fight: { calls: 'fight' }, mine: { pool: myCombos().map(c => c.say) } }[o.calls] || {};
    return [{ ...warm, secs: 10 }, ...rounds(o.rounds, o.secs, o.rest, { ...calls, pace: o.pace })];
  }
  if (kind === 'iq') {
    const l = lessonById[arg]; if (!l) return null;
    const d = l.drill, calls = typeof d.calls === 'string' ? { calls: d.calls } : { pool: d.calls };
    return [{ ...warm, secs: 180 }, ...rounds(d.rounds, d.secs, d.rest, { ...calls, pace: 'medium' }), { label: R1(['Cool-down', 'გაგრილება']), kind: 'cool', secs: 120 }];
  }
  if (kind === 'style') {
    const st = styleById[arg]; if (!st) return null;
    return [{ ...warm, secs: 180 }, ...rounds(4, 180, 60, { pool: st.calls, pace: 'medium' }), { label: R1(['Cool-down', 'გაგრილება']), kind: 'cool', secs: 120 }];
  }
  if (kind === 'spar') return sparSegs(arg);
  if (kind === 'x') { const d = drillById[arg]; if (!d) return null; return [{ ...warm, secs: 120 }, ...d.build({ short: false, p: profile() }), { label: R1(['Cool-down and stretch', 'გაგრილება და გაჭიმვა']), kind: 'cool', secs: 90 }]; }
  if (kind === 'vs') {
    const [a, b] = (arg || '').split(',').map(x => styleById[x]); if (!a || !b) return null;
    const extra = [...(b.rate.p >= 4 ? ['pivot', 'move', 'one, move'] : []), ...(b.rate.r >= 4 ? ['step, one two', 'slip, two three'] : []), ...(b.rate.w >= 4 ? ['block, three two', 'roll, three two'] : [])];
    return [{ ...warm, secs: 180 }, ...rounds(4, 180, 60, { pool: [...a.calls, ...extra], pace: 'medium' }), { label: R1(['Cool-down', 'გაგრილება']), kind: 'cool', secs: 120 }];
  }
  if (kind === 'formtest') return [{ ...warm, secs: 60 }, ...rounds(3, 120, 60, { callouts: true, pace: 'medium' })];
  return null;
}

// ----- My combos -----
function MyCombos(id) {
  const list = store.get().myCombos || [];
  if (id) return ComboBuilder(id === 'new' ? null : list.find(x => x.id === id));
  const el = h(`<section><a href="#/library" class="back">← ${t('library')}</a><h1>${tr('My combos')}</h1>
    <p class="muted">${tr('Put strikes, defences and moves in order. The app animates the combination from real motion capture, and the timer calls it in your rounds.')}</p>
    <a class="btn primary" href="#/combos/new">${tr('New combination')}</a>
    ${list.length ? `<ul class="mylist">${list.map(c => `<li><a href="#/combos/${c.id}"><strong>${esc(c.name || c.say)}</strong><br><span class="muted small">"${esc(c.say)}"</span></a>
      <a class="btn small" href="#/session/my/${c.id}">${tr('Drill')}</a></li>`).join('')}</ul>` : `<p class="muted">${tr('No combinations yet. Start with one you want to own, like 1-2, slip, 2.')}</p>`}
  </section>`);
  view.replaceChildren(el);
}

function ComboBuilder(c) {
  let steps = c ? [...c.steps] : [];
  const KIND = { attack: tr('Attack'), defence: tr('Defence'), move: tr('Move') };
  const el = h(`<section class="builder"><a href="#/combos" class="back">← ${tr('My combos')}</a>
    <h1>${c ? tr('Edit combination') : tr('New combination')}</h1>
    <div class="seqbar"><ol class="seq"></ol><p class="say muted"></p></div>
    <div class="fig-big"></div><div class="figcap" aria-live="polite"></div>
    ${['attack', 'defence', 'move'].map(k => `<h2>${KIND[k]}</h2><div class="pgroup">${STEPS.filter(s => s.kind === k).map(s => `<button type="button" class="pill" data-add="${s.id}">${esc(tr(s.label))}</button>`).join('')}</div>`).join('')}
    <p class="muted small">${tr('Tap to add (up to 8). Tap a step in the sequence to remove it.')}</p>
    <label class="row">${tr('Name (optional)')} <input class="cname" maxlength="40" value="${esc(c?.name || '')}"></label>
    <div class="savebar"><span class="count"></span><span>
      ${c ? `<button class="btn ghost" data-del>${tr('Delete')}</button>` : ''}
      <button class="btn primary" data-save>${t('save')}</button></span></div>
  </section>`);
  view.replaceChildren(el);
  let fig = null, timer = 0;
  const preview = () => {
    fig?.destroy(); fig = null;
    if (steps.length < 1) { $('.fig-big', el).innerHTML = `<p class="muted empty">${tr('Your combination will play here.')}</p>`; $('.figcap', el).textContent = ''; return; }
    if (!webglOK()) { $('.fig-big', el).innerHTML = `<p class="muted empty">${tr('Your combination will play here.')}</p>`; return; }
    registerSeq('preview', stepsSeq(steps));
    fig = createViewer($('.fig-big', el), 'preview', { onLabel: (txt, i, n) => { $('.figcap', el).textContent = n > 1 ? `${i}/${n} · ${txt}` : txt; } });
  };
  const sync = () => {
    $('.seq', el).innerHTML = steps.map((s, i) => `<li><button type="button" class="chip" data-rm="${i}">${esc(tr(STEPS.find(x => x.id === s).label))} ✕</button></li>`).join('');
    $('.say', el).textContent = steps.length ? `${tr('The timer will say')}: "${stepsSay(steps)}"` : '';
    $('[data-save]', el).disabled = steps.length < 2;
    clearTimeout(timer); timer = setTimeout(preview, 350);
  };
  cleanup.push(() => { clearTimeout(timer); fig?.destroy(); });
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.add && steps.length < 8) { steps.push(b.dataset.add); sync(); }
    if (b.dataset.rm) { steps.splice(+b.dataset.rm, 1); sync(); }
    if ('save' in b.dataset) {
      const item = { id: c?.id || 'u' + Date.now().toString(36), steps, say: stepsSay(steps), name: $('.cname', el).value.trim() };
      store.update(st => { st.myCombos = [...(st.myCombos || []).filter(x => x.id !== item.id), item]; }, tr('Combination saved'));
      location.hash = '#/combos';
    }
    if ('del' in b.dataset) {
      store.update(st => { st.myCombos = (st.myCombos || []).filter(x => x.id !== c.id); }, tr('Combination deleted'));
      location.hash = '#/combos';
    }
  });
  sync();
}

// ----- Quick round timer -----
const TIMER_DEF = { rounds: 3, secs: 180, rest: 60, calls: 'hands', pace: 'medium' };
const timerOpts = () => ({ ...TIMER_DEF, ...(store.get().timer || {}) });
function Timer() {
  const o = timerOpts();
  const G = {
    rounds: [[3, '3'], [5, '5'], [6, '6'], [8, '8'], [10, '10'], [12, '12']],
    secs: [[60, '1 min'], [120, '2 min'], [180, '3 min'], [300, '5 min']],
    rest: [[30, '30 s'], [45, '45 s'], [60, '1 min'], [90, '90 s']],
    calls: [['none', 'No calls (bell only)'], ['hands', 'Boxing: hands only'], ['thai', 'Muay Thai / kickboxing'], ['defence', 'Defence and counters'], ['fight', 'Fight mix'], ...(myCombos().length ? [['mine', 'My combos']] : [])],
    pace: [['easy', 'Easy'], ['medium', 'Medium'], ['fast', 'Fast']],
  };
  const NAMES = { rounds: 'Rounds', secs: 'Round length', rest: 'Rest', calls: 'Calls', pace: 'Call pace' };
  const total = () => { const x = timerOpts(); return Math.round((x.rounds * x.secs + (x.rounds - 1) * x.rest + 10) / 60); };
  const el = h(`<section class="profile"><a href="#/today" class="back">← ${t('today')}</a><h1>${tr('Round timer')}</h1>
    <p class="muted">${tr('For the bag, pads, sparring or a class. Bell at the start and end of each round, a click 10 seconds before the end.')}</p>
    ${Object.entries(G).map(([k, opts]) => `<h2>${tr(NAMES[k])}</h2><div class="pgroup" data-k="${k}">${opts.map(([v, n]) => `<button type="button" class="pill${o[k] === v ? ' on' : ''}" data-v="${v}">${esc(tr(n))}</button>`).join('')}</div>`).join('')}
    <div class="savebar"><span class="count"></span><a class="btn primary" href="#/session/timer/">${t('start')}</a></div>
  </section>`);
  const upd = () => { $('.count', el).textContent = tr('about {n} min', { n: total() }); };
  el.addEventListener('click', e => {
    const b = e.target.closest('.pill'); if (!b) return;
    const k = b.parentElement.dataset.k, v = ['rounds', 'secs', 'rest'].includes(k) ? +b.dataset.v : b.dataset.v;
    store.set({ timer: { ...timerOpts(), [k]: v } });
    b.parentElement.querySelectorAll('.pill').forEach(x => x.classList.toggle('on', x === b)); upd();
  });
  view.replaceChildren(el); upd();
}

// ----- Monthly skill tests -----
const TESTS = [
  { k: 'punch', unit: 'punches', better: 'up', secs: 30, name: 'Punch output', how: 'Straight punches (jab, cross) for 30 seconds at full speed. Every punch must come back to guard. Count one hand and double it.' },
  { k: 'react', unit: 'ms', better: 'down', name: 'Reaction time', how: 'Ten defence calls appear at random moments. Tap the big button the instant you see or hear one. Measures how fast you react.' },
  { k: 'form', unit: '/ 25', better: 'up', name: 'Form under fatigue', how: 'Do 3 rounds of 2 minutes on call, then score yourself honestly from 1 to 5 on each point. Best checked in a mirror.' },
  { k: 'engine', unit: 'reps', better: 'up', secs: 60, name: 'Work rate', how: 'Sprawls for 60 seconds, as many as you can with good form: hands down, feet back, hips to the floor, back up to stance.', alt: 'Straight punches for 60 seconds at full speed, staying in stance. Count one hand and double it.' },
];
const FORM_POINTS = ['Guard stays up', 'Chin down, eyes up', 'Every strike returns to guard', 'Balance and footwork', 'Relaxed, breathing out on strikes'];
const testsDue = () => {
  const s = store.get(), last = (s.tests || []).map(x => x.date).sort().pop();
  if (!last) return s.log.length >= 3;
  return (Date.now() - new Date(last)) / 864e5 >= 28;
};
function Tests(k) {
  if (k) return TestRun(TESTS.find(x => x.k === k));
  const res = store.get().tests || [];
  const rows = TESTS.map(x => {
    const r = res.filter(y => y.k === x.k), last = r[r.length - 1], prev = r[r.length - 2];
    const best = r.length ? (x.better === 'up' ? Math.max(...r.map(y => y.v)) : Math.min(...r.map(y => y.v))) : null;
    const d = last && prev ? last.v - prev.v : 0, good = x.better === 'up' ? d > 0 : d < 0;
    return `<a class="libcard test" href="#/tests/${x.k}"><div><strong>${tr(x.name)}</strong><br>
      ${last ? `<span class="stat">${last.v}</span> <small>${tr(x.unit)}</small> ${prev && d ? `<span class="${good ? 'ok' : 'err'}">${d > 0 ? '▲' : '▼'} ${Math.abs(d)}</span>` : ''}<br><span class="muted small">${tr('Last')}: ${last.date} · ${tr('Best')}: ${best}</span>` : `<span class="muted small">${tr('Not done yet')}</span>`}</div></a>`;
  }).join('');
  const el = h(`<section><a href="#/log" class="back">← ${t('log')}</a><h1>${tr('Skill tests')}</h1>
    <p class="muted">${tr('Do all four once a month, on a fresh day, after a warm-up. Same conditions each time, so the numbers are comparable.')}</p>
    ${testsDue() ? `<p class="note">${tr('Your monthly tests are due.')}</p>` : ''}
    <div class="libgrid">${rows}</div></section>`);
  view.replaceChildren(el);
}
function TestRun(x) {
  if (!x) return Tests();
  const noFloor = profile().limits.some(l => l === 'knees' || l === 'back');
  const how = x.k === 'engine' && noFloor ? x.alt : x.how;
  const el = h(`<section class="testrun"><a href="#/tests" class="back">← ${tr('Skill tests')}</a><h1>${tr(x.name)}</h1>
    <p>${esc(tr(how))}</p><div class="tbody"></div></section>`);
  view.replaceChildren(el);
  const body = $('.tbody', el);
  const save = v => {
    store.update(st => { st.tests = [...(st.tests || []), { date: isoDate(), k: x.k, v }]; }, tr('Result saved'));
    location.hash = '#/tests';
  };
  const countForm = () => {
    body.innerHTML = `<label class="row">${tr('Your count')} <input type="number" inputmode="numeric" min="0" max="999" class="num"></label><button class="btn primary" data-s>${t('save')}</button>`;
    $('[data-s]', body).onclick = () => { const v = +$('.num', body).value; if (v > 0) save(v); };
  };
  if (x.secs) {
    body.innerHTML = `<div class="clock">${fmt(x.secs)}</div><button class="btn primary big" data-go>${t('start')}</button> <button class="btn ghost" data-skip>${tr('I timed it myself')}</button>`;
    let iv = 0; cleanup.push(() => clearInterval(iv));
    $('[data-skip]', body).onclick = countForm;
    $('[data-go]', body).onclick = e => {
      e.target.disabled = true; let left = 3; $('.clock', body).textContent = tr('Ready') + '… 3';
      say('ready'); const t0 = Date.now() + 3000;
      iv = setInterval(() => {
        const ms = t0 - Date.now();
        if (ms > 0) { $('.clock', body).textContent = tr('Ready') + '… ' + Math.ceil(ms / 1000); return; }
        if (left === 3) { bell(1); left = 0; }
        const rem = x.secs - (Date.now() - t0) / 1000;
        $('.clock', body).textContent = fmt(Math.max(0, Math.ceil(rem)));
        if (rem <= 0) { clearInterval(iv); bell(3); countForm(); }
      }, 100);
    };
  } else if (x.k === 'react') {
    const CALLS = ['SLIP', 'BLOCK', 'ROLL', 'PARRY', 'PULL'];
    let n = 0, times = [], armed = 0, to = 0;
    body.innerHTML = `<button class="reactpad" type="button">${tr('Tap to start')}</button><p class="muted small rmsg"></p>`;
    const pad = $('.reactpad', body), msg = $('.rmsg', body);
    cleanup.push(() => clearTimeout(to));
    const arm = () => {
      pad.textContent = tr('Wait…'); pad.className = 'reactpad wait'; armed = 0;
      to = setTimeout(() => { const c = CALLS[Math.floor(Math.random() * CALLS.length)]; pad.textContent = c; pad.className = 'reactpad go'; say(c.toLowerCase()); armed = performance.now(); }, 1200 + Math.random() * 2600);
    };
    pad.onclick = () => {
      if (pad.classList.contains('done')) return;
      if (!pad.classList.contains('wait') && !armed) { arm(); return; }
      if (!armed) { clearTimeout(to); msg.textContent = tr('Too early. Wait for the call.'); arm(); return; }
      const ms = Math.round(performance.now() - armed); times.push(ms); n++; msg.textContent = `${n} / 10 · ${ms} ms`;
      if (n < 10) arm();
      else {
        const sorted = [...times].sort((a, b) => a - b), med = Math.round((sorted[4] + sorted[5]) / 2);
        pad.className = 'reactpad done'; pad.textContent = `${med} ms`;
        msg.textContent = tr('Your typical reaction (median of 10).');
        body.insertAdjacentHTML('beforeend', `<button class="btn primary" data-s>${t('save')}</button>`);
        $('[data-s]', body).onclick = () => save(med);
      }
    };
  } else if (x.k === 'form') {
    body.innerHTML = `<a class="btn" href="#/session/formtest/">${tr('Run the 3 rounds')}</a>
      <h2>${tr('Score each point 1 to 5')}</h2>
      ${FORM_POINTS.map((p, i) => `<div class="rate"><span>${tr(p)}</span><div class="seg" data-i="${i}">${[1, 2, 3, 4, 5].map(v => `<button type="button" class="pill${v === 3 ? ' on' : ''}" data-r="${v}">${v}</button>`).join('')}</div></div>`).join('')}
      <button class="btn primary" data-s>${t('save')}</button>`;
    body.addEventListener('click', e => { const r = e.target.closest('[data-r]'); if (r) r.parentElement.querySelectorAll('.pill').forEach(b => b.classList.toggle('on', b === r)); });
    $('[data-s]', body).onclick = () => save([...body.querySelectorAll('.seg')].reduce((a, s) => a + +$('.pill.on', s).dataset.r, 0));
  }
}

// ----- Practical drills -----
function Drills(id) {
  const d = drillById[id];
  if (d) {
    const shoulder = d.noShoulder && profile().limits.includes('shoulder');
    const secs = d.build({ short: false, p: profile() }).reduce((a, x) => a + x.secs, 0);
    const el = h(`<section><a href="#/drills" class="back">← ${tr('Practical drills')}</a><h1>${esc(L(d.name))}</h1>
      <p class="purpose">${esc(L(d.why))}</p>
      <p class="muted small">${tr('You need')}: ${esc(L(d.kit))} · ${tr('about {n} min', { n: Math.round(secs / 60) + 4 })}</p>
      ${shoulder ? `<p class="note">${tr('You noted shoulder trouble, so the plan leaves this drill out. Only do it if a coach or physio clears it.')}</p>` : ''}
      <h2>${tr('How to do it')}</h2><ol>${d.how.map(x => `<li>${esc(L(x))}</li>`).join('')}</ol>
      <h2>${tr('Common mistakes')}</h2><ul>${d.mistakes.map(x => `<li>${esc(L(x))}</li>`).join('')}</ul>
      <div class="actions"><a class="btn primary" href="#/session/x/${d.id}">${tr('Start the drill')}</a></div>
    </section>`);
    return view.replaceChildren(el);
  }
  const el = h(`<section><a href="#/library" class="back">← ${t('library')}</a><h1>${tr('Practical drills')}</h1>
    <p class="muted">${tr('Solo drills for a small space. Your plan puts one into each session as the drill of the day; you can also run any of them on its own.')}</p>
    <ol class="iqlist">${DRILLS.map(x => `<li><a href="#/drills/${x.id}">${esc(L(x.name))}</a><br><span class="muted small">${esc(L(x.why).split('. ')[0])}.</span></li>`).join('')}</ol>
  </section>`);
  view.replaceChildren(el);
}

// ----- Fight IQ -----
function IQ(id) {
  const ka = store.get().lang === 'ka', T = l => (ka ? l.ka : l.en);
  const done = store.get().iqDone || {};
  if (id && lessonById[id]) {
    const l = lessonById[id], x = T(l);
    const el = h(`<section><a href="#/iq" class="back">← ${tr('Fight IQ')}</a><h1>${esc(x.title)}</h1>
      <p class="purpose">${esc(x.why)}</p>
      <h2>${t('keyPoints')}</h2><ol>${x.points.map(p => `<li>${esc(p)}</li>`).join('')}</ol>
      <h2>${tr('Drill')}: ${esc(x.drill[0])}</h2><p>${esc(x.drill[1])}</p>
      <p class="muted small">${tr('{n} rounds of {t}, the timer calls it.', { n: l.drill.rounds, t: fmt(l.drill.secs) })}</p>
      <div class="actions"><a class="btn primary" href="#/session/iq/${id}">${tr('Start the drill')}</a>
      <button class="btn${done[id] ? ' ghost' : ''}" data-done>${done[id] ? '✓ ' + tr('Studied') : tr('Mark as studied')}</button></div>
    </section>`);
    el.querySelector('[data-done]').onclick = () => { store.update(st => { st.iqDone = { ...(st.iqDone || {}) }; if (st.iqDone[id]) delete st.iqDone[id]; else st.iqDone[id] = isoDate(); }, tr('Updated')); IQ(id); };
    return view.replaceChildren(el);
  }
  const el = h(`<section><a href="#/library" class="back">← ${t('library')}</a><h1>${tr('Fight IQ')}</h1>
    <p class="muted">${tr('Techniques win exchanges; understanding wins fights. Each lesson takes a few minutes to read and comes with a drill.')}</p>
    <ol class="iqlist">${LESSONS.map(l => `<li><a href="#/iq/${l.id}">${esc(T(l).title)}</a>${done[l.id] ? ' <span class="ok">✓</span>' : ''}<br><span class="muted small">${esc(T(l).why.split('. ')[0])}.</span></li>`).join('')}</ol>
  </section>`);
  view.replaceChildren(el);
}

// ----- Fighting styles -----
const SL = x => (store.get().lang === 'ka' ? x.ka : x.en);
const rateBars = (st, other) => `<div class="rbars">${DIMS.map(([k, en, ka]) => `<div class="rb"><span>${esc(store.get().lang === 'ka' ? ka : tr(en))}</span>
  <i><b style="width:${st.rate[k] * 20}%"></b></i>${other ? `<i class="b2"><b style="width:${other.rate[k] * 20}%"></b></i>` : ''}</div>`).join('')}</div>`;
function Styles(id, arg) {
  if (id === 'cmp') return StyleCompare(...(arg || '').split(','));
  if (id === 'quiz') return StyleQuiz();
  if (id === 'vs') return Matchup(arg);
  if (id && styleById[id]) return StyleDetail(styleById[id]);
  const filter = sessionStorage.getItem('styleFilter') || 'boxing';
  const el = h(`<section><a href="#/library" class="back">← ${t('library')}</a><h1>${tr('Fighting styles')}</h1>
    <p class="muted">${tr('How the great styles fight, what they are built on, where they are strong and where they can be beaten. Compare any two side by side.')}</p>
    <div class="tools"><a class="tool" href="#/styles/quiz"><b>${tr('Which style suits you?')}</b><span>${profile().style ? tr('Your style') + ': ' + esc(SL(styleById[profile().style]).name) : tr('8 quick questions')}</span></a>
      <a class="tool" href="#/styles/vs/"><b>${tr('Matchup game plan')}</b><span>${tr('Your style against theirs')}</span></a></div>
    <div class="filters">${Object.entries(STYLE_DISC).map(([k, d]) => `<button class="pill ${k === filter ? 'on' : ''}" data-f="${k}">${esc(L(d))}</button>`).join('')}</div>
    <div class="libgrid">${STYLES.filter(s => s.disc === filter).map(s => `<a class="libcard style" href="#/styles/${s.id}"><div><strong>${esc(SL(s).name)}</strong>
      <p class="muted small">${esc(SL(s).suits)}</p>${rateBars(s)}</div></a>`).join('')}</div>
  </section>`);
  el.querySelector('.filters').onclick = e => { if (e.target.dataset.f) { try { sessionStorage.setItem('styleFilter', e.target.dataset.f); } catch { /* ignore */ } Styles(); } };
  view.replaceChildren(el);
}
function StyleDetail(s) {
  const x = SL(s);
  const list = (title, items, cls) => `<h2>${title}</h2><ul class="${cls}">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
  const el = h(`<section><a href="#/styles" class="back">← ${tr('Fighting styles')}</a>
    <h1>${esc(x.name)}</h1><p class="muted">${esc(L(STYLE_DISC[s.disc]))}</p>
    <p class="purpose">${esc(x.known)}</p>
    <h2>${tr('How it fights')}</h2><p>${esc(x.look)}</p>
    ${rateBars(s)}
    <h2>${tr('Skills it is built on')}</h2>
    <ul class="chips">${s.skills.filter(id => techById[id]).map(id => `<li><a href="#/tech/${id}">${esc(L(techById[id].name))}</a></li>`).join('')}</ul>
    ${list(tr('Strengths'), x.pros, 'pros')}
    ${list(tr('Weaknesses'), x.cons, 'cons')}
    ${list(tr('How to beat it'), x.beat, '')}
    <h2>${tr('Suits you if')}</h2><p>${esc(x.suits)}</p>
    <div class="actions"><a class="btn primary" href="#/session/style/${s.id}">${tr('Train like this (4 rounds)')}</a>
      ${profile().style === s.id ? `<span class="ok">✓ ${tr('Your style')}</span>` : `<button class="btn" data-mine="${s.id}">${tr('Make it my style')}</button>`}
      <a class="btn ghost" href="#/styles/vs/${profile().style && profile().style !== s.id ? profile().style : ''},${s.id}">${tr('Plan a matchup against it')}</a></div>
    <label class="row">${tr('Compare with')} <select class="cmp"><option value="">…</option>${STYLES.filter(o => o.id !== s.id).map(o => `<option value="${o.id}">${esc(SL(o).name)}</option>`).join('')}</select></label>
  </section>`);
  el.querySelector('[data-mine]')?.addEventListener('click', e => setStyle(e.target.dataset.mine));
  $('.cmp', el).onchange = e => { if (e.target.value) location.hash = `#/styles/cmp/${s.id},${e.target.value}`; };
  view.replaceChildren(el);
}
function StyleCompare(a, b) {
  const A = styleById[a], B = styleById[b];
  if (!A || !B) return Styles();
  const xa = SL(A), xb = SL(B);
  const col = (s, x) => `<div class="cmpcol"><h3><a href="#/styles/${s.id}">${esc(x.name)}</a></h3>
    <h4>${tr('Strengths')}</h4><ul class="pros">${x.pros.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
    <h4>${tr('Weaknesses')}</h4><ul class="cons">${x.cons.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
    <h4>${tr('Suits you if')}</h4><p class="small">${esc(x.suits)}</p></div>`;
  const shared = A.skills.filter(id => B.skills.includes(id));
  const el = h(`<section><a href="#/styles/${A.id}" class="back">← ${esc(xa.name)}</a><h1>${tr('Compare styles')}</h1>
    <p class="legend"><span class="k1"></span> ${esc(xa.name)} &nbsp; <span class="k2"></span> ${esc(xb.name)}</p>
    ${rateBars(A, B)}
    ${shared.length ? `<p class="muted small">${tr('Skills both use')}: ${shared.filter(id => techById[id]).map(id => esc(L(techById[id].name))).join(', ')}</p>` : ''}
    <div class="cmpgrid">${col(A, xa)}${col(B, xb)}</div>
    <h2>${tr('When they meet')}</h2>
    <p><strong>${tr('{a} against {b}', { a: esc(xa.name), b: esc(xb.name) })}:</strong> ${esc(xb.beat.join(' '))}</p>
    <p><strong>${tr('{a} against {b}', { a: esc(xb.name), b: esc(xa.name) })}:</strong> ${esc(xa.beat.join(' '))}</p>
  </section>`);
  view.replaceChildren(el);
}

// ----- "Which style suits you?" quiz -----
// Each answer gives points to styles. [en, ka, {styleId: points}]
const QUIZ = [
  [['Compared with most people, you are…', 'სხვებთან შედარებით შენ ხარ…'], [
    [['Shorter', 'დაბალი'], { peekaboo: 2, swarmer: 2, mat: 1, wrestleboxer: 1, khao: -1, tae: -1 }],
    [['About average', 'საშუალო'], { soviet: 1, dutch: 1, sprawlbrawl: 1, femur: 1 }],
    [['Taller', 'მაღალი'], { outboxer: 2, tae: 2, khao: 2, karate: 2, soviet: 1, femur: 1, peekaboo: -1 }]]],
  [['What do you enjoy most?', 'რა მოგწონს ყველაზე მეტად?'], [
    [['Punching', 'ხელებით დარტყმა'], { peekaboo: 2, soviet: 2, philly: 2, outboxer: 2, swarmer: 2, mat: 2, dutch: 1 }],
    [['Kicking', 'წიხლები'], { tae: 3, femur: 2, karate: 2, dutch: 1 }],
    [['Clinch and knees', 'კლინჩი და მუხლები'], { khao: 3, wrestleboxer: 1 }],
    [['Takedowns and wrestling', 'ჩაგდებები და ჭიდაობა'], { wrestleboxer: 3, sprawlbrawl: 1 }]]],
  [['When the fight starts, you want to…', 'ბრძოლის დაწყებისას გინდა…'], [
    [['Walk forward and pressure', 'წინ წახვიდე და მიაწვე'], { swarmer: 2, peekaboo: 2, khao: 2, mat: 2, dutch: 2, wrestleboxer: 2 }],
    [['Control the distance and pick my shots', 'მანძილი აკონტროლო და დარტყმები შეარჩიო'], { outboxer: 2, soviet: 2, tae: 2, karate: 2, femur: 1 }],
    [['Wait, make them miss and counter', 'დაელოდო, აცდენინო და კონტრი დაარტყა'], { philly: 3, femur: 2, karate: 1, sprawlbrawl: 1 }]]],
  [['Your stamina is…', 'შენი გამძლეობა არის…'], [
    [['Huge: I can go all day', 'დიდი: მთელი დღე შემიძლია'], { swarmer: 2, khao: 2, wrestleboxer: 2, peekaboo: 1, dutch: 1 }],
    [['Average', 'საშუალო'], { soviet: 1, femur: 1, sprawlbrawl: 1, outboxer: 1 }],
    [['Best in short explosive bursts', 'საუკეთესო მოკლე ფეთქებად მონაკვეთებში'], { karate: 2, philly: 1, mat: 1, sprawlbrawl: 1 }]]],
  [['Your power is mostly…', 'შენი ძალა ძირითადად…'], [
    [['Heavy hands', 'მძიმე ხელები'], { mat: 2, peekaboo: 2, sprawlbrawl: 2, swarmer: 1 }],
    [['Speed and accuracy', 'სისწრაფე და სიზუსტე'], { soviet: 2, outboxer: 1, philly: 1, karate: 1 }],
    [['My kicks hit harder than my punches', 'წიხლები ხელებზე ძლიერია'], { tae: 2, dutch: 1, femur: 1 }]]],
  [['About getting hit…', 'დარტყმის მიღებაზე…'], [
    [['I can take it and keep coming', 'ავიტან და გავაგრძელებ'], { swarmer: 2, mat: 2, khao: 1, dutch: 1, peekaboo: 1 }],
    [['I would rather not be hit at all', 'ჯობს საერთოდ არ მომხვდეს'], { outboxer: 2, philly: 2, karate: 2, femur: 2, soviet: 1 }]]],
  [['Footwork feels…', 'ფეხის მოძრაობა…'], [
    [['Natural: I love moving', 'ბუნებრივია: მიყვარს მოძრაობა'], { outboxer: 2, soviet: 2, karate: 2, tae: 1 }],
    [['Fine', 'ნორმალურია'], {}],
    [['I prefer to stand my ground', 'მირჩევნია ადგილზე დავდგე'], { mat: 2, khao: 1, swarmer: 1, philly: 1 }]]],
  [['Which rules interest you most?', 'რომელი წესები გაინტერესებს ყველაზე მეტად?'], [
    [['Boxing', 'კრივი'], { peekaboo: 3, soviet: 3, philly: 3, outboxer: 3, swarmer: 3 }],
    [['Muay Thai or kickboxing', 'მუაი თაი ან კიკბოქსინგი'], { femur: 3, khao: 3, mat: 3, tae: 3, dutch: 3 }],
    [['MMA', 'MMA'], { wrestleboxer: 3, sprawlbrawl: 3, karate: 3 }],
    [['Not sure yet', 'ჯერ არ ვიცი'], {}]]],
];
function StyleQuiz() {
  const ka = store.get().lang === 'ka', ans = [];
  const el = h(`<section class="profile"><a href="#/styles" class="back">← ${tr('Fighting styles')}</a><h1>${tr('Which style suits you?')}</h1>
    <p class="muted">${tr('Eight quick questions. Answer for how you are now, not how you want to be.')}</p>
    ${QUIZ.map(([q, opts], i) => `<h2>${i + 1}. ${esc(q[ka ? 1 : 0])}</h2><div class="pgroup" data-q="${i}">${opts.map(([o], j) => `<button type="button" class="pill" data-a="${j}">${esc(o[ka ? 1 : 0])}</button>`).join('')}</div>`).join('')}
    <div class="savebar"><span class="count"></span><button class="btn primary" data-go disabled>${tr('Show my style')}</button></div>
    <div class="qres"></div>
  </section>`);
  const upd = () => { const n = ans.filter(x => x != null).length; $('.count', el).textContent = `${n} / ${QUIZ.length}`; $('[data-go]', el).disabled = n < QUIZ.length; };
  el.addEventListener('click', e => {
    const b = e.target.closest('.pill[data-a]');
    if (b) { const q = +b.parentElement.dataset.q; ans[q] = +b.dataset.a; b.parentElement.querySelectorAll('.pill').forEach(x => x.classList.toggle('on', x === b)); upd(); return; }
    if ('go' in (e.target.dataset || {})) showResult();
    const m = e.target.closest('[data-mine]');
    if (m) setStyle(m.dataset.mine);
  });
  const showResult = () => {
    const score = Object.fromEntries(STYLES.map(s => [s.id, 0])), why = {};
    ans.forEach((a, q) => Object.entries(QUIZ[q][1][a][1]).forEach(([id, pts]) => { score[id] += pts; if (pts >= 2) (why[id] ||= []).push(QUIZ[q][1][a][0][ka ? 1 : 0]); }));
    if (profile().limits.some(l => l === 'knees' || l === 'back')) { score.wrestleboxer -= 3; score.sprawlbrawl -= 2; }
    const top = Object.entries(score).sort((a, b) => b[1] - a[1]).slice(0, 3), max = top[0][1] || 1;
    const [best] = top, s = styleById[best[0]];
    $('.qres', el).innerHTML = `<div class="card result"><h2>${tr('Your style')}: ${esc(SL(s).name)}</h2>
      <p>${esc(SL(s).look)}</p>
      ${why[s.id] ? `<p class="muted small">${tr('Because you said')}: ${why[s.id].slice(0, 3).map(esc).join(' · ')}</p>` : ''}
      <div class="actions"><button class="btn primary" data-mine="${s.id}">${tr('Make it my style')}</button> <a class="btn ghost" href="#/styles/${s.id}">${tr('Read about it')}</a></div>
      <h3>${tr('Also a good fit')}</h3>
      <ul>${top.slice(1).map(([id, sc]) => `<li><a href="#/styles/${id}">${esc(SL(styleById[id]).name)}</a> · ${Math.max(0, Math.round((sc / max) * 100))}% · <button class="btn small ghost" data-mine="${id}">${tr('Choose')}</button></li>`).join('')}</ul></div>`;
    $('.qres', el).scrollIntoView({ behavior: 'smooth' });
  };
  view.replaceChildren(el); upd();
}
// Choosing a style: saved in the profile, and its skills join your plan.
function setStyle(id) {
  const s = styleById[id]; if (!s) return;
  store.update(st => {
    st.profile = { ...profile(), style: id };
    const add = s.skills.filter(x => techById[x] && suitable(x));
    if (st.program?.picks) st.program = { ...st.program, picks: [...new Set([...st.program.picks, ...add])] };
    add.forEach(x => { if (!st.status[x]) st.status[x] = 'learning'; });
  }, tr('Style chosen'));
  location.hash = '#/plan';
}

// ----- Matchup game plan -----
function Matchup(pair) {
  const [a0, b0] = (pair || '').split(',');
  const a = styleById[a0] || styleById[profile().style] || STYLES[0], b = styleById[b0] || STYLES.find(s => s.id !== a.id);
  const xa = SL(a), xb = SL(b), r = a.rate, o = b.rate;
  const T = (en, k) => (store.get().lang === 'ka' ? k : en);
  const range = r.r > o.r + 1 ? T('Fight long: keep them at the end of your jab and kicks, and leave on an angle every time they step in.', 'იბრძოლე შორიდან: დაიჭირე ჯების და წიხლების ბოლოზე და ყოველ შემოსვლაზე კუთხით გადი.')
    : r.r < o.r - 1 ? T('Fight close: take their range away, get inside behind a tight guard and stay there.', 'იბრძოლე ახლოს: წაართვი მანძილი, მჭიდრო დაცვით შედი შიგნით და იქ დარჩი.')
      : T('Win the middle: take the centre of the ring and be first to land.', 'მოიგე ცენტრი: დაიკავე რინგის შუა და პირველმა მოარტყი.');
  const pace = r.p >= o.p ? T('Set the pace: make them work backwards and tire.', 'დააწესე ტემპი: აიძულე უკან იმუშაონ და დაიღალონ.')
    : T('Let them come: make them miss, then counter and move.', 'მოდიან? აცდენინე, შემდეგ კონტრი და მოძრაობა.');
  const opt = sel => STYLES.map(s => `<option value="${s.id}"${s.id === sel ? ' selected' : ''}>${esc(SL(s).name)}</option>`).join('');
  const el = h(`<section><a href="#/styles" class="back">← ${tr('Fighting styles')}</a><h1>${tr('Matchup game plan')}</h1>
    <label class="row">${tr('You fight like')} <select class="ma">${opt(a.id)}</select></label>
    <label class="row">${tr('Opponent fights like')} <select class="mb">${opt(b.id)}</select></label>
    <p class="legend"><span class="k1"></span> ${esc(xa.name)} &nbsp; <span class="k2"></span> ${esc(xb.name)}</p>
    ${rateBars(a, b)}
    <h2>${tr('Your game plan')}</h2>
    <ol><li>${esc(range)}</li><li>${esc(pace)}</li>${xb.beat.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
    <h2>${tr('Watch out for')}</h2><ul class="cons">${xb.pros.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <h2>${tr('What they will try against you')}</h2><ul>${xa.beat.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="actions"><a class="btn primary" href="#/session/vs/${a.id},${b.id}">${tr('Prepare: 4 rounds')}</a></div>
  </section>`);
  const go = () => { location.hash = `#/styles/vs/${$('.ma', el).value},${$('.mb', el).value}`; };
  $('.ma', el).onchange = go; $('.mb', el).onchange = go;
  view.replaceChildren(el);
}

// ----- Virtual sparring partner -----
const sparLevel = () => store.get().spar?.level || 3;
function sparSegs(opp) {
  const st = styleById[opp], L0 = sparLevel(), ka = store.get().lang === 'ka';
  const allow = new Set(st ? { boxing: ['p', 'o'], muaythai: ['p', 'k', 'o'], mma: ['p', 'k', 's', 'o'] }[st.disc] : ['p', 'k', 'o']);
  if (profile().limits.some(l => l === 'knees' || l === 'back')) allow.delete('s');
  const w = STYLE_W[opp] || {};
  const pool = ATTACKS.filter(a => allow.has(a.t)).flatMap(a => Array(Math.max(0, 1 + (w[a.say] || 0))).fill(a.say));
  if (L0 >= 6) pool.push('jab, hook', 'one two, kick', 'hook, body'); // doubles at higher levels
  const hints = Object.fromEntries(ATTACKS.map(a => [a.say, ka ? a.ka : a.en]));
  Object.assign(hints, { 'jab, hook': ka ? 'პარირება, როლი, კონტრი' : 'Parry, roll, counter', 'one two, kick': ka ? 'ბლოკი, ბლოკი, ჩეკი, შემდეგ კონტრი' : 'Block, block, check, then counter', 'hook, body': ka ? 'როლი, იდაყვი დაბლა, შემდეგ 3-2' : 'Roll, elbow down, then 3-2' });
  const gap = Math.max(1300, 4300 - 330 * (L0 - 1)), secs = L0 >= 6 ? 180 : 120;
  return [{ label: R1(['Get ready: bounce, hands up, eyes forward', 'მომზადება: ხტუნვა, ხელები ზევით, თვალი წინ']), kind: 'warm', secs: 60 },
    ...Array.from({ length: 3 }, (_, i) => [
      { label: R1([`Sparring round ${i + 1} of 3: defend, then counter`, `სპარინგის რაუნდი ${i + 1} / 3: დაიცავი, შემდეგ კონტრი`]), kind: 'work', secs, pool, hints, gap: gap - i * 150 },
      ...(i < 2 ? [{ label: R1(['Rest', 'დასვენება']), kind: 'rest', secs: 60 }] : []),
    ]).flat()];
}
function Spar() {
  const sp = store.get().spar || {}, L0 = sparLevel(), mine = profile().style;
  const opts = `<option value="mixed">${tr('Mixed (all-rounder)')}</option>${Object.entries(STYLE_DISC).map(([k, d]) => `<optgroup label="${esc(L(d))}">${STYLES.filter(s => s.disc === k).map(s => `<option value="${s.id}"${sp.lastOpp === s.id ? ' selected' : ''}>${esc(SL(s).name)}</option>`).join('')}</optgroup>`).join('')}`;
  const el = h(`<section class="profile"><a href="#/today" class="back">← ${t('today')}</a><h1>${tr('Sparring partner')}</h1>
    <p class="muted">${tr('Your partner calls its attacks out loud. Defend each one and counter straight away; the answer is shown on screen. "Now" means an opening: attack. After the rounds, say how it went and your partner adapts.')}</p>
    <label class="row">${tr('Your partner fights like')} <select class="opp">${opts}</select></label>
    <div class="card"><h3>${tr('Partner level')}</h3><p class="stat">${L0} <small>/ 10</small></p>
      <div class="progress"><div style="width:${L0 * 10}%"></div></div>
      <p class="muted small">${tr('Higher level: faster attacks, doubles, longer rounds.')}</p></div>
    ${mine && mine !== 'mixed' ? `<p class="small"><a href="#/styles/vs/${mine},">${tr('Matchup game plan')}</a></p>` : ''}
    <div class="savebar"><span class="muted small">3 × ${L0 >= 6 ? '3' : '2'} min</span><button class="btn primary" data-go>${t('start')}</button></div>
  </section>`);
  $('[data-go]', el).onclick = () => {
    const o = $('.opp', el).value;
    store.set({ spar: { ...(store.get().spar || { level: 3 }), lastOpp: o } });
    location.hash = `#/session/spar/${o}`;
  };
  view.replaceChildren(el);
}

// ----- Fix-it block (Progress) -----
function fixCard() {
  const fx = fixActive(), ka = store.get().lang === 'ka';
  const names = ids => ids.map(id => `<a href="#/tech/${id}">${esc(L(techById[id].name))}</a>`).join(', ');
  if (fx) return `<div class="card fix"><h3>${tr('Fix-it block')} · ${tr('day {n} of 14', { n: fx.day })}</h3>
    <p>${tr('Every session starts with one of these')}: ${names(fx.skills)}</p>
    <div class="progress"><div style="width:${(fx.day / 14) * 100}%"></div></div>
    <button class="btn ghost small" data-fix="stop">${tr('End it early')}</button></div>`;
  const w = findWeak(), past = store.get().fix;
  const ended = past?.start && !fx ? `<p class="muted small">${tr('Last block ended. Re-test and rate those skills to see what changed.')} <a href="#/tests">${tr('Skill tests')}</a></p>` : '';
  if (!w.skills.length) return `<div class="card fix"><h3>${tr('Fix-it block')}</h3><p class="muted small">${tr('Rate skills after sessions or do the skill tests, and the app finds what to fix.')}</p>${ended}</div>`;
  return `<div class="card fix"><h3>${tr('Fix-it block')}</h3>
    <p>${tr('What to fix')}: ${names(w.skills)}</p>
    <ul class="small muted">${w.why.map(x => `<li>${esc(x[ka ? 1 : 0])}</li>`).join('')}</ul>
    <button class="btn primary small" data-fix="start">${tr('Start a 2-week fix-it block')}</button>${ended}</div>`;
}
function fixClick(e) {
  const a = e.target.dataset.fix; if (!a) return false;
  if (a === 'start') { const w = findWeak(); store.update(st => { st.fix = { start: isoDate(), skills: w.skills }; }, tr('Fix-it block started')); }
  if (a === 'stop') store.update(st => { st.fix = { ...st.fix, skills: [] }; }, tr('Fix-it block ended'));
  return true;
}

// ----- Fight or test date (Plan) -----
function eventCard() {
  const e = eventInfo(), raw = store.get().event || {};
  return `<div class="card event"><h3>${tr('Fight or test date')}</h3>
    ${e ? `<p><strong>${esc(e.name || tr('Your date'))}</strong> · ${e.days === 0 ? tr('today!') : tr('{n} days to go', { n: e.days })}</p>
      <p class="muted small">${tr('The last three weeks before it build up, peak, then taper so you arrive fresh.')}</p>` : `<p class="muted small">${tr('Set a fight, grading or sparring day and the plan peaks for it.')}</p>`}
    <div class="evrow"><input class="evname" maxlength="40" placeholder="${tr('Name (optional)')}" value="${esc(raw.name || '')}"><input type="date" class="evdate" value="${esc(raw.date || '')}"></div>
    <div><button class="btn small" data-ev="save">${t('save')}</button>${raw.date ? ` <button class="btn ghost small" data-ev="clear">${tr('Remove date')}</button>` : ''}</div></div>`;
}
function eventClick(e, root) {
  const a = e.target.dataset.ev; if (!a) return false;
  if (a === 'save') { const d = $('.evdate', root).value; if (!d) return true; store.update(st => { st.event = { date: d, name: $('.evname', root).value.trim() }; }, tr('Date saved')); }
  if (a === 'clear') store.update(st => { delete st.event; }, tr('Date removed'));
  return true;
}

// ---------- router ----------
const routes = { drills: Drills, spar: Spar, styles: Styles, combos: MyCombos, timer: Timer, tests: Tests, iq: IQ, profile: () => Profile(false), today: Today, week: () => Plan(), plan: Plan, pathway: Pathway, library: Library, tech: Tech, session: Session, log: Log, settings: Settings };

const NAVMAP = { drills: 'library', week: 'plan', pathway: 'plan', profile: 'settings', tech: 'library', styles: 'library', iq: 'library', combos: 'library', tests: 'log', timer: 'today', spar: 'today', session: 'today' };
function render() {
  cleanup.forEach(f => f()); cleanup = [];
  document.documentElement.lang = store.get().lang || 'en';
  const [name = 'today', ...args] = location.hash.replace(/^#\/?/, '').split('/');
  (routes[name] || Today)(...args);
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === `#/${name}` || (NAVMAP[name] || name) === a.getAttribute('href').slice(2)));
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
