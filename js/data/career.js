// Fighter career: a fictional fighter's climb up a ranked ladder. Training sessions are your fight
// camp; a full camp gives you the edge on fight night. The fight itself is a sparring-partner fight
// against a named opponent, and how you say you handled it decides the result.
const B = (en, ka) => ({ en, ka });
export const CAMP = 4; // sessions for a full camp
export const MIN_CAMP = 2; // sessions before the next fight unlocks

const FIRST = ['Marco', 'Dani', 'Leon', 'Ivo', 'Tariq', 'Kenji', 'Rafael', 'Nikolai', 'Samir', 'Owen', 'Mateo', 'Arman', 'Felix', 'Jonah', 'Luka', 'Emre', 'Tomas', 'Kwame', 'Andrei', 'Hugo', 'Yusuf', 'Bruno', 'Sven', 'Dario'];
const LAST = ['Vargo', 'Kessler', 'Okafor', 'Brandt', 'Moreau', 'Halloway', 'Petrescu', 'Ruiz', 'Tanaka', 'Novak', 'Adeyemi', 'Castell', 'Lindqvist', 'Barros', 'Duval', 'Sokolov', 'Mensah', 'Ferreira', 'Quinlan', 'Haddad', 'Albescu', 'Corvin'];
const NICK = ['The Hammer', 'Iron', 'The Ghost', 'Bulldozer', 'The Surgeon', 'Lightning', 'The Wall', 'Cobra', 'The Professor', 'Storm', 'Silent', 'The Bull', 'Viper', 'Mad Dog', 'The Machine', 'Smooth', 'Tank', 'The Matador'];
const rnd = n => { let x = (n * 2654435761) >>> 0; return () => ((x = (x * 1103515245 + 12345) >>> 0) / 4294967296); };

export const TIERS = [
  { min: 0, name: B('Amateur', 'მოყვარული'), rounds: 3, secs: 120, edge: 0 },
  { min: 4, name: B('Pro prospect', 'პერსპექტიული პროფესიონალი'), rounds: 3, secs: 180, edge: 1 },
  { min: 10, name: B('Ranked', 'რეიტინგში'), rounds: 3, secs: 180, edge: 2 },
  { min: 18, name: B('Contender', 'პრეტენდენტი'), rounds: 4, secs: 180, edge: 2 },
  { min: 22, name: B('Title fight', 'სატიტულო ბრძოლა'), rounds: 5, secs: 180, edge: 3, title: true },
];
const CHAMP = { name: B('Champion', 'ჩემპიონი'), rounds: 5, secs: 180, edge: 3, title: true, champ: true };

export const careerOf = s => ({ pts: 0, fights: [], logAt: 0, champ: false, ...(s.career || {}) });
export function tierOf(c) { if (c.champ) return CHAMP; return [...TIERS].reverse().find(t => c.pts >= t.min); }
// Ranking number inside the ranked and contender tiers (#15 up to #1).
export function rankOf(c) {
  if (c.champ) return B('Champion', 'ჩემპიონი');
  if (c.pts >= 22) return B('#1, title shot', '#1, სატიტულო ბრძოლა');
  if (c.pts >= 10) { const r = c.pts >= 18 ? 22 - c.pts : 15 - (c.pts - 10); return B(`#${r}`, `#${r}`); }
  return B('Unranked', 'რეიტინგის გარეშე');
}
export const record = c => { const w = c.fights.filter(f => f.res === 'W').length; return { w, l: c.fights.length - w, ko: c.fights.filter(f => f.res === 'W' && /KO/.test(f.how)).length }; };

// Camp: sessions logged since the last fight (fights themselves don't count).
export const campDone = (s, c) => s.log.slice(c.logAt).filter(e => e.type !== 'career').length;

export function nextOpponent(c, styles) {
  const n = c.fights.length + 1, r = rnd(n * 97 + 13), t = tierOf(c);
  const st = styles[Math.floor(r() * styles.length)];
  return { n, name: `${FIRST[Math.floor(r() * FIRST.length)]} "${NICK[Math.floor(r() * NICK.length)]}" ${LAST[Math.floor(r() * LAST.length)]}`, style: st.id, wins: Math.floor(r() * 4) + n + t.edge * 3, losses: Math.floor(r() * 3) };
}

// How it went (1 caught a lot, 2 about right, 3 handled everything) + a full camp -> the result.
export function decide(r, fullCamp, n) {
  const score = r + (fullCamp ? 1 : 0), x = rnd(n * 31 + r)();
  if (score >= 4) return { res: 'W', how: x < 0.5 ? 'KO' : 'TKO' };
  if (score === 3) return { res: 'W', how: x < 0.7 ? 'UD' : 'SD' };
  if (score === 2) return { res: 'L', how: 'SD' };
  return { res: 'L', how: x < 0.5 ? 'UD' : 'TKO' };
}
export function applyResult(c, out, opp) {
  const t = tierOf(c), d = { ...c, fights: [...c.fights, { ...out, n: opp.n, opp: opp.name, style: opp.style, date: new Date().toISOString().slice(0, 10) }] };
  if (out.res === 'W') { d.pts = c.pts + (/KO/.test(out.how) ? 3 : 2); if (t.title && !c.champ) d.champ = true; if (c.champ) d.defences = (c.defences || 0) + 1; }
  else { d.pts = Math.max(0, c.pts - 1); if (c.champ) { d.champ = false; d.pts = 18; d.defences = 0; } }
  return d;
}
export const HOW = { KO: B('knockout', 'ნოკაუტით'), TKO: B('stoppage (TKO)', 'ტექნიკური ნოკაუტით'), UD: B('unanimous decision', 'ერთხმა გადაწყვეტილებით'), SD: B('split decision', 'გაყოფილი გადაწყვეტილებით') };
