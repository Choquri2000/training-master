// Coaching captions for step-by-step mode: as you scrub, each moment of the movement is
// named and explained. Phases come from the measured timing of each capture (combos.js).
import { WIN, PEAK } from './combos.js';
import { store } from '../store.js';

const CAT = {
  punch: ['jab', 'cross', 'onetwo', 'leadhook', 'rearhook', 'leaduppercut', 'rearuppercut', 'elbow'],
  kick: ['teep', 'roundhouse', 'leadkick', 'knee', 'clinchknee'],
  defence: ['slip', 'block', 'parry', 'pullcounter', 'bodyblock', 'dodge'],
  takedown: ['doubleleg'],
  move: ['stepback', 'sidestep', 'pivot'],
};
export const catOf = Object.fromEntries(Object.entries(CAT).flatMap(([c, ids]) => ids.map(id => [id, c])));

// [name, explanation] per phase: 1 start, 2 drive, 3 impact, 4 return, 5 back in guard.
const TEXT = {
  punch: [
    [['Guard', 'Hands up, chin down, weight balanced. Nothing moves before the feet.'], ['დაცვა', 'ხელები ზევით, ნიკაპი დაბლა, წონა თანაბრად. ფეხებამდე არაფერი მოძრაობს.']],
    [['Drive', 'Power starts at the floor: push off the foot and turn the hip. The fist travels last.'], ['ბიძგი', 'ძალა იატაკიდან იწყება: ფეხით მიაწექი და მენჯი მოატრიალე. მუშტი ბოლოს მიდის.']],
    [['Impact', 'Fist turns over, shoulder covers the chin, the other hand stays on your face.'], ['დარტყმა', 'მუშტი ტრიალდება, მხარი ნიკაპს ფარავს, მეორე ხელი სახეზე რჩება.']],
    [['Return', 'Bring it back on the same line, faster than it went out.'], ['დაბრუნება', 'დააბრუნე იმავე ხაზით, უფრო სწრაფად, ვიდრე გავიდა.']],
    [['Back in guard', 'Balanced and ready for the next strike or to defend.'], ['ისევ დაცვაში', 'წონასწორობაში, მზად შემდეგი დარტყმისთვის ან დაცვისთვის.']],
  ],
  kick: [
    [['Guard', 'Hands up, weight ready to shift onto the standing leg.'], ['დაცვა', 'ხელები ზევით, წონა მზადაა ბურჯ ფეხზე გადასატანად.']],
    [['Load', 'Step or pivot the standing foot and lift the knee. Hands stay up.'], ['დამუხტვა', 'ბურჯ ფეხით გადადგი ან მოტრიალდი და მუხლი აწიე. ხელები ზევით.']],
    [['Impact', 'Hip turned over or driven through. Strike with the shin, ball of the foot or knee.'], ['დარტყმა', 'მენჯი გადატრიალებული ან წინ მიწოდებული. დაარტყი წვივით, ტერფის წინა ნაწილით ან მუხლით.']],
    [['Return', 'Bring the leg back the way it came; do not let it fall.'], ['დაბრუნება', 'ფეხი იმავე გზით დააბრუნე; არ ჩამოაგდო.']],
    [['Back in guard', 'Foot down in stance, ready to move or defend.'], ['ისევ დაცვაში', 'ფეხი დგომაში, მზად მოძრაობისთვის ან დაცვისთვის.']],
  ],
  defence: [
    [['Read', 'Eyes on the chest and shoulders: they show the strike first.'], ['წაკითხვა', 'თვალი მკერდზე და მხრებზე: ისინი დარტყმას პირველები აჩვენებენ.']],
    [['React', 'Small and late: move just enough for it to miss.'], ['რეაქცია', 'მცირედ და გვიან: იმოძრავე ზუსტად იმდენი, რომ აგცდეს.']],
    [['Defended', 'The strike misses or lands on the guard. You are already loaded to counter.'], ['დაცული', 'დარტყმა გცდება ან დაცვას ხვდება. უკვე დამუხტული ხარ კონტრისთვის.']],
    [['Counter or reset', 'Hit back straight away, or return to guard balanced.'], ['კონტრი ან დაბრუნება', 'მაშინვე უპასუხე, ან წონასწორობით დაბრუნდი დაცვაში.']],
    [['Back in guard', 'Hands up, eyes forward, ready again.'], ['ისევ დაცვაში', 'ხელები ზევით, თვალი წინ, ისევ მზად.']],
  ],
  takedown: [
    [['Set up', 'Hands up as if to strike: the shot should look like a punch.'], ['მომზადება', 'ხელები ზევით, თითქოს დარტყმისთვის: შეტევა დარტყმას უნდა ჰგავდეს.']],
    [['Level change', 'Bend the knees, not the back. Head up, hips under you.'], ['დონის შეცვლა', 'მოხარე მუხლები და არა ზურგი. თავი ზევით, მენჯი შენ ქვეშ.']],
    [['Penetration step', 'Long step between their feet, rear knee touches down lightly.'], ['შეღწევის ნაბიჯი', 'გრძელი ნაბიჯი მათ ფეხებს შორის, უკანა მუხლი მსუბუქად ეხება იატაკს.']],
    [['Drive through', 'Bring the rear leg up and drive forward, head pressing in.'], ['გატანა', 'უკანა ფეხი წამოიყვანე და წინ მიაწექი, თავით მიაწექი.']],
    [['Reset', 'Back up to stance, hands up.'], ['დაბრუნება', 'დაბრუნდი დგომაში, ხელები ზევით.']],
  ],
  move: [
    [['Guard', 'Stance set, weight on the balls of the feet.'], ['დაცვა', 'დგომა მზადაა, წონა ტერფების წინა ნაწილზე.']],
    [['Push', 'Push off the foot opposite to where you go. Lead with the near foot.'], ['ბიძგი', 'მიაწექი საპირისპირო ფეხით. პირველი გადაადგილდება ახლო ფეხი.']],
    [['Arrive', 'Feet land in stance, never crossed or together.'], ['მისვლა', 'ფეხები დგომაში დადგება, არასდროს გადაჯვარედინებული ან ერთად.']],
    [['Set', 'Weight centred, hands still up, ready to strike from the new angle.'], ['მზადყოფნა', 'წონა შუაში, ხელები ზევით, მზად ახალი კუთხიდან დარტყმისთვის.']],
    [['Back in guard', 'Balanced and ready.'], ['ისევ დაცვაში', 'წონასწორობაში და მზად.']],
  ],
};

// Where we are in a capture: clip name + fraction 0..1. Returns { i (1-5), name, text } or null.
export function coachPhase(clip, f, techCat) {
  const w = WIN[clip], pk = PEAK[clip], cat = techCat || catOf[clip];
  if (!w || pk == null || !cat) return null;
  const i = f < w[0] ? 0 : f < pk - 0.06 ? 1 : f <= pk + 0.08 ? 2 : f < w[1] ? 3 : 4;
  const [en, ka] = TEXT[cat][i];
  const [name, text] = store.get().lang === 'ka' ? ka : en;
  return { i: Math.min(i + 1, 4), name, text };
}
// A technique id's caption family (for sequences built from another clip, e.g. check = knee lift).
const TECH_CAT = { check: 'defence' };
export const techCat = id => TECH_CAT[id] || null;
