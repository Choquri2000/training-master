// Corner coach: in the rest between rounds a voice gives one short instruction, like a real
// cornerman. Spoken in English; the screen shows it in the app language.
const B = (en, ka) => ({ en, ka });
const OPEN = [B('Breathe. Good round.', 'ისუნთქე. კარგი რაუნდი იყო.'), B('Big breaths, drop the shoulders.', 'ღრმად ისუნთქე, მხრები მოადუნე.'), B('Relax. In through the nose.', 'მოდუნდი. ცხვირით ჩაისუნთქე.'), B('Good work. Slow the breathing down.', 'კარგია. სუნთქვა დაამშვიდე.')];
const FIGHT = [
  B('Double the jab before you throw the right.', 'მარჯვენამდე ჯები გააორმაგე.'),
  B('Hands back to the chin after every combination.', 'ყოველი კომბინაციის შემდეგ ხელები ნიკაპთან.'),
  B('Move your head after you punch. Never stay on the line.', 'დარტყმის შემდეგ თავი გაამოძრავე. ხაზზე არ დარჩე.'),
  B('Finish every combination with an angle out.', 'ყოველი კომბინაცია კუთხით გასვლით დაასრულე.'),
  B('Feint first, then go in.', 'ჯერ ფინტი, შემდეგ შედი.'),
  B('Body first, then the head.', 'ჯერ ტანზე, შემდეგ თავზე.'),
  B('Circle away from the power hand.', 'ძლიერი ხელისგან მოშორებით იმოძრავე წრეზე.'),
  B('Stay on your toes. Small steps, never cross the feet.', 'იყავი თითებზე. პატარა ნაბიჯები, ფეხები არ გადააჯვარედინო.'),
  B('Counter straight away. Defend and answer in one beat.', 'კონტრი მაშინვე. დაცვა და პასუხი ერთ რიტმში.'),
  B('Chin down, eyes up.', 'ნიკაპი დაბლა, თვალები ზევით.'),
  B('Throw in threes. One shot is easy to read.', 'ურტყი სამ-სამად. ერთი დარტყმა ადვილად იკითხება.'),
  B('Check every kick, then kick back.', 'ყოველი წიხლი დაბლოკე და მაშინვე უპასუხე წიხლით.'),
];
const DRILL = [
  B('Quality over speed. Clean reps only.', 'ხარისხი სისწრაფეზე მეტია. მხოლოდ სუფთა გამეორებები.'),
  B('Exhale on every strike.', 'ყოველ დარტყმაზე ამოისუნთქე.'),
  B('Return to stance after every rep.', 'ყოველი გამეორების შემდეგ დგომაში დაბრუნდი.'),
  B('Turn the hips, not just the arms.', 'მენჯი მოატრიალე და არა მარტო ხელები.'),
  B('Guard hand stays home.', 'დამცავი ხელი ადგილზე რჩება.'),
];
const LAST = [B('Last round. Empty the tank.', 'ბოლო რაუნდია. დახარჯე ყველაფერი.'), B('Last one. Win this round.', 'ბოლოა. ეს რაუნდი მოიგე.')];
const pick = (arr, n) => arr[Math.abs(n) % arr.length];
const join = (a, b) => B(`${a.en} ${b.en}`, `${a.ka} ${b.ka}`);

// Adds `corner` to every rest that sits between two work rounds. focus: [{ en, ka }] skill cues to weave in.
export function addCorner(segs, { fight = false, focus = [], seed = Date.now() } = {}) {
  const works = segs.filter(s => s.kind === 'work').length;
  let done = 0, n = Math.floor(seed / 86400000);
  return segs.map((s, i) => {
    if (s.kind === 'work') done++;
    if (s.kind !== 'rest' || s.secs < 20 || segs[i - 1]?.kind !== 'work' || segs[i + 1]?.kind !== 'work') return s;
    n++;
    const left = works - done;
    const tip = left === 1 ? pick(LAST, n) : focus.length && n % 3 === 0 ? pick(focus, n) : pick(fight ? FIGHT : DRILL, n * 7 + done);
    return { ...s, corner: s.secs >= 40 ? join(pick(OPEN, n + done), tip) : tip };
  });
}
