// Hands-free control during a session: say "pause", "go", "next" or "again" (Georgian works too).
// Uses the browser's own speech recognition, so it costs nothing; hidden where unsupported.
const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const voiceCtlOK = () => !!SR;

const WORDS = {
  pause: ['pause', 'stop', 'wait', 'hold', 'break', 'პაუზა', 'გაჩერდი', 'მოიცადე', 'შეჩერდი'],
  go: ['go', 'start', 'resume', 'continue', 'time', 'play', 'დაიწყე', 'გააგრძელე', 'წავედით', 'დაწყება'],
  next: ['next', 'skip', 'შემდეგი', 'გამოტოვე'],
  again: ['again', 'repeat', 'say again', 'გაიმეორე', 'კიდევ', 'თავიდან'],
};
const match = text => {
  const words = text.toLowerCase().replace(/[.,!?]/g, ' ').split(/\s+/).filter(Boolean);
  if (!words.length || words.length > 3) return null; // commands are short; ignore conversation and the app's own callouts
  for (const [cmd, list] of Object.entries(WORDS)) if (words.some(w => list.includes(w))) return cmd;
  return null;
};

export function listen(onCommand, { lang = 'en-US', onState } = {}) {
  if (!SR) return () => {};
  let on = true, rec = null, last = 0;
  const start = () => {
    if (!on) return;
    rec = new SR();
    rec.lang = lang; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 3;
    rec.onresult = e => {
      const r = e.results[e.results.length - 1];
      if (window.speechSynthesis?.speaking) return; // don't react to the app's own voice
      for (let i = 0; i < r.length; i++) {
        const cmd = match(r[i].transcript);
        if (cmd && Date.now() - last > 1200) { last = Date.now(); onCommand(cmd); onState?.('heard', cmd); return; }
      }
    };
    rec.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { on = false; onState?.('denied'); } };
    rec.onend = () => { if (on) setTimeout(start, 250); }; // recognition stops by itself now and then; keep listening
    try { rec.start(); onState?.('listening'); } catch { /* already started */ }
  };
  start();
  return () => { on = false; try { rec?.abort(); } catch { /* ignore */ } onState?.('off'); };
}
