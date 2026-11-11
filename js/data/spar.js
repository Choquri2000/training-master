// Virtual sparring partner: the timer calls the opponent's attacks; you defend and counter.
// say = what the partner "throws" (spoken), hint = the answer shown on screen.
// t: p = punch, k = kick/knee/clinch, s = shot (takedown), o = opening (your turn).
export const ATTACKS = [
  { say: 'jab', t: 'p', en: 'Slip outside or parry, then 2', ka: 'სლიპი გარეთ ან პარირება, შემდეგ 2' },
  { say: 'double jab', t: 'p', en: 'Step back, then 1-2', ka: 'ნაბიჯი უკან, შემდეგ 1-2' },
  { say: 'one two', t: 'p', en: 'Block both, answer 3-2', ka: 'დაბლოკე ორივე, უპასუხე 3-2' },
  { say: 'hook', t: 'p', en: 'Roll under, come up with 3-2', ka: 'როლი ქვემოდან, ამოდი 3-2-ით' },
  { say: 'body', t: 'p', en: 'Elbow down to block, then hook back', ka: 'იდაყვით დაბლოკე, შემდეგ ჰუკი' },
  { say: 'uppercut', t: 'p', en: 'Pull back or cover, then 2', ka: 'უკან გადაიხარე ან დაიფარე, შემდეგ 2' },
  { say: 'overhand', t: 'p', en: 'Roll or pivot away, then 3', ka: 'როლი ან მოტრიალება, შემდეგ 3' },
  { say: 'kick', t: 'k', en: 'Check or catch, then 2', ka: 'ჩეკი ან დაჭერა, შემდეგ 2' },
  { say: 'low kick', t: 'k', en: 'Check, kick straight back', ka: 'ჩეკი, მაშინვე უპასუხე წიხლით' },
  { say: 'teep', t: 'k', en: 'Step off line or catch, then kick', ka: 'გადი ხაზიდან ან დაიჭირე, შემდეგ წიხლი' },
  { say: 'knee', t: 'k', en: 'Frame on the hips, push off, 2', ka: 'ხელები მენჯზე, მოიშორე, 2' },
  { say: 'clinch', t: 'k', en: 'Inside position, then knee or break away', ka: 'შიდა პოზიცია, შემდეგ მუხლი ან გათავისუფლება' },
  { say: 'shot', t: 's', en: 'Sprawl, back up, 1-2', ka: 'სპრაული, წამოდექი, 1-2' },
  { say: 'now', t: 'o', en: 'Opening: throw your best combo', ka: 'გახსნა: დაარტყი შენი საუკეთესო კომბინაცია' },
];
// Extra weight per opponent style (on top of 1 for every allowed attack).
export const STYLE_W = {
  peekaboo: { hook: 3, uppercut: 3, body: 2 }, soviet: { jab: 3, 'double jab': 2, 'one two': 2 }, philly: { 'one two': 2, jab: 1, now: -1 },
  outboxer: { jab: 4, 'double jab': 2 }, swarmer: { body: 3, hook: 3, 'one two': 1 },
  femur: { teep: 3, kick: 2 }, khao: { knee: 3, clinch: 3, teep: 1 }, mat: { hook: 2, 'low kick': 2, overhand: 2 },
  tae: { kick: 4, teep: 2 }, dutch: { 'one two': 2, 'low kick': 3, hook: 1 },
  wrestleboxer: { shot: 4, 'one two': 2 }, sprawlbrawl: { overhand: 2, hook: 2, kick: 1 }, karate: { jab: 1, kick: 2, teep: 2, now: 1 },
};
