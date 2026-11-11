// The important combinations, attacking and defend-then-counter, as learnable items.
// Each one is animated by joining the real motion captures of its strikes (see mocap.js):
// every clip is cut to its active part (W) so the strikes flow into each other.

// Active window of each capture (fraction of the clip): start, end. Measured from the
// hands/feet leaving and returning to guard.
const W = {
  jab: [0.05, 0.9], cross: [0.2, 0.72], onetwo: [0.08, 0.77], leadhook: [0.12, 0.82], rearhook: [0.08, 0.75],
  leaduppercut: [0.07, 0.87], rearuppercut: [0.1, 0.88], block: [0.1, 0.6], slip: [0, 0.5], parry: [0.18, 0.77],
  pullcounter: [0.03, 0.97], teep: [0.33, 0.8], roundhouse: [0.13, 0.88], leadkick: [0.17, 0.67], knee: [0.12, 0.73],
  elbow: [0.05, 0.93], doubleleg: [0.07, 0.88], sidestep: [0.08, 0.92], stepback: [0.1, 0.9], pivot: [0.23, 1],
};
// Moment of impact (or deepest point of a defence), fraction of the clip. Used for coaching captions.
export const PEAK = {
  jab: 0.28, cross: 0.57, onetwo: 0.33, leadhook: 0.32, leaduppercut: 0.43, block: 0.25, slip: 0.4, pullcounter: 0.38, teep: 0.55,
  roundhouse: 0.45, knee: 0.38, elbow: 0.27, doubleleg: 0.45, parry: 0.47, rearhook: 0.23, rearuppercut: 0.25, leadkick: 0.5,
  bodyblock: 0.37, clinchknee: 0.38, stepback: 0.63, sidestep: 0.53, pivot: 0.63, dodge: 0.28,
};
export const WIN = W;
// Caption shown under the animation while each piece plays.
const LAB = {
  jab: 'Jab (1)', cross: 'Cross (2)', onetwo: 'Jab, cross (1-2)', leadhook: 'Lead hook (3)', rearhook: 'Rear hook (4)',
  leaduppercut: 'Lead uppercut (5)', rearuppercut: 'Rear uppercut (6)', block: 'Block', slip: 'Slip', parry: 'Parry',
  pullcounter: 'Pull back, cross (2)', teep: 'Teep', roundhouse: 'Roundhouse kick', leadkick: 'Switch kick', knee: 'Knee',
  elbow: 'Elbow', doubleleg: 'Double-leg', roll: 'Roll under', check: 'Check the kick', catch: 'Catch the kick',
  pull: 'Pull back', stepback: 'Step back', sidestep: 'Step out to the side', pivot: 'Pivot',
};
export const COMBO_LABELS = Object.values(LAB);

// 'clip' = that capture cut to its window (the first starts from guard, the last returns to guard).
function chain(items) {
  return items.map((it, i) => {
    if (Array.isArray(it)) return it;
    const [s, e] = W[it];
    return [it, i === 0 ? 0 : s, i === items.length - 1 ? 1 : e, { lab: LAB[it] }];
  });
}
const ROLL = ['stance', 0, 0.75, { add: 'roll', lab: LAB.roll }];
const CHECK = [['knee', 0, 0.36, { lab: LAB.check }], ['knee', 0.36, 0.36, { hold: 0.4, lab: LAB.check }], ['knee', 0.36, 0.1, { lab: LAB.check }]];
const CATCH = [['bodyblock', 0, 0.45, { lab: LAB.catch }], ['bodyblock', 0.45, 0.45, { hold: 0.3, lab: LAB.catch }]];

// id, discipline, phase, uses (skills it is built from), callout, animation, English text, Georgian text.
// Text: [name, purpose, keyPoints[], mistakes[[m, fix]], drills[[name, how]]]
const C = (id, discipline, phase, uses, say, seq, en, ka) => ({ id, discipline, phase, uses, say, seq, en, ka });
const LIST = [
  // ---------- Attacking ----------
  C('c12', 'combos', 1, ['jab', 'cross'], 'one two', [['onetwo', 0, 1, { lab: LAB.onetwo }]],
    ['1-2: jab, cross', 'The most important combination in striking: the jab sets up the cross.',
      ['The cross leaves as the jab comes back, like one movement.', 'Turn the rear foot and hip into the cross.', 'Both hands return to the face on the same line they went out.'],
      [['Pausing between the punches', 'Count "one-two" as one word.'], ['Dropping the jab hand as the cross goes', 'The lead hand comes back to the face before the cross lands.']],
      [['1-2 on the clock', '3 x 2 min: 1-2, reset, 1-2. Every rep fast and clean.']]],
    ['1-2: ჯები, კროსი', 'დარტყმითი ხელოვნების ყველაზე მნიშვნელოვანი კომბინაცია: ჯები ამზადებს კროსს.',
      ['კროსი მაშინ გადის, როცა ჯები ბრუნდება, თითქოს ერთი მოძრაობაა.', 'კროსში უკანა ფეხი და მენჯი მოატრიალე.', 'ორივე ხელი სახეს იმავე ხაზით უბრუნდება, რომლითაც გავიდა.'],
      [['პაუზა დარტყმებს შორის', 'თქვი „ერთი-ორი“ ერთ სიტყვად.'], ['კროსის დროს ჯების ხელის დაშვება', 'წინა ხელი სახეს უბრუნდება, სანამ კროსი მოხვდება.']],
      [['1-2 დროზე', '3 x 2 წთ: 1-2, დაბრუნება, 1-2. ყოველი გამეორება სწრაფად და სუფთად.']]]),
  C('c112', 'combos', 2, ['jab', 'cross'], 'one one two', chain(['jab', 'jab', 'cross']),
    ['1-1-2: double jab, cross', 'Two jabs close the distance and hide the cross.',
      ['The second jab steps in: it travels further than the first.', 'Keep the jabs snappy, not pushed.', 'The cross comes off the second jab\'s return.'],
      [['Two lazy jabs', 'The first jab can be lighter, the second is sharp and steps in.']],
      [['Walk-in jabs', 'Across the garage: 1-1-2, reset, repeat. 3 x 2 min.']]],
    ['1-1-2: ორმაგი ჯები, კროსი', 'ორი ჯები ამცირებს მანძილს და მალავს კროსს.',
      ['მეორე ჯები ნაბიჯით მიდის: პირველზე შორს აღწევს.', 'ჯებები იყოს მოკლე და მკვეთრი, არა მიბიძგებული.', 'კროსი მეორე ჯების დაბრუნებიდან გადის.'],
      [['ორი ზარმაცი ჯები', 'პირველი შეიძლება მსუბუქი იყოს, მეორე მკვეთრია და ნაბიჯით მიდის.']],
      [['ჯებებით წინსვლა', 'ავტოფარეხის სიგრძეზე: 1-1-2, დაბრუნება, გამეორება. 3 x 2 წთ.']]]),
  C('c123', 'combos', 2, ['jab', 'cross', 'leadhook'], 'one two three', chain(['onetwo', 'leadhook']),
    ['1-2-3: jab, cross, lead hook', 'The classic three-punch finish: the cross loads the hook.',
      ['The cross turns you to the left side, so the hook fires from there.', 'Short hook: elbow at shoulder height, turn on the lead foot.', 'Chin tucked behind the shoulder on the hook.'],
      [['Winding up the hook', 'No pull-back: the hook starts where the cross ended.'], ['Squaring up after', 'Finish back in stance or move off line.']],
      [['1-2-3 rounds', '3 x 2 min. Every 4th rep, finish with a step out to the side.']]],
    ['1-2-3: ჯები, კროსი, წინა ჰუკი', 'კლასიკური სამდარტყმიანი დასრულება: კროსი ამზადებს ჰუკს.',
      ['კროსი მარცხნივ გატრიალებს, ამიტომ ჰუკი იქიდან გადის.', 'მოკლე ჰუკი: იდაყვი მხრის სიმაღლეზე, წინა ფეხზე ტრიალი.', 'ჰუკის დროს ნიკაპი მხრის უკან.'],
      [['ჰუკის მოქნევა', 'უკან გაწევის გარეშე: ჰუკი იქიდან იწყება, სადაც კროსი დასრულდა.'], ['ბოლოს სწორად დადგომა', 'დაასრულე დგომაში ან გადი ხაზიდან.']],
      [['1-2-3 რაუნდები', '3 x 2 წთ. ყოველ მე-4 გამეორებაზე დაასრულე გვერდზე გასვლით.']]]),
  C('c1232', 'combos', 2, ['jab', 'cross', 'leadhook'], 'one two three two', chain(['onetwo', 'leadhook', 'cross']),
    ['1-2-3-2', 'Four punches that flow left-right-left-right; the last cross lands as they cover the hook.',
      ['Each punch loads the next: never reset in the middle.', 'Feet stay under you: small steps, no lunging.', 'Exhale on every punch.'],
      [['Losing balance on the last cross', 'Keep the punches short so your weight stays centred.']],
      [['Ladder', '1-2, then 1-2-3, then 1-2-3-2, repeat. 3 x 3 min.']]],
    ['1-2-3-2', 'ოთხი დარტყმა მარცხენა-მარჯვენა მონაცვლეობით; ბოლო კროსი მაშინ მოხვდება, როცა ჰუკს იფარავენ.',
      ['ყოველი დარტყმა ამზადებს შემდეგს: შუაში არ შეჩერდე.', 'ფეხები შენ ქვეშ: მცირე ნაბიჯები, გადაწოლის გარეშე.', 'ყოველ დარტყმაზე ამოისუნთქე.'],
      [['ბოლო კროსზე წონასწორობის დაკარგვა', 'დარტყმები მოკლე იყოს, რომ წონა შუაში დარჩეს.']],
      [['კიბე', '1-2, შემდეგ 1-2-3, შემდეგ 1-2-3-2, გამეორება. 3 x 3 წთ.']]]),
  C('c232', 'combos', 2, ['cross', 'leadhook'], 'two three two', chain(['cross', 'leadhook', 'cross']),
    ['2-3-2: cross, hook, cross', 'A power combination: lead with the cross when they expect the jab.',
      ['Start the cross from stance, no jab to set it up.', 'Hook and cross turn the hips back and forth.', 'Hands home between every punch.'],
      [['Telegraphing the first cross', 'Start it straight from guard, no drop of the shoulder.']],
      [['Power rounds', '3 x 2 min, full hip turn, steady pace.']]],
    ['2-3-2: კროსი, ჰუკი, კროსი', 'ძლიერი კომბინაცია: დაიწყე კროსით, როცა ჯებს ელიან.',
      ['კროსი დაიწყე დგომიდან, ჯების გარეშე.', 'ჰუკი და კროსი მენჯს აქეთ-იქით ატრიალებს.', 'ყოველ დარტყმას შორის ხელები სახესთან.'],
      [['პირველი კროსის გამჟღავნება', 'დაიწყე პირდაპირ დაცვიდან, მხრის დაშვების გარეშე.']],
      [['ძალის რაუნდები', '3 x 2 წთ, მენჯის სრული ტრიალი, თანაბარი ტემპი.']]]),
  C('c34', 'combos', 2, ['leadhook', 'rearhook'], 'three four', chain(['leadhook', 'rearhook']),
    ['3-4: lead hook, rear hook', 'Two hooks for close range, once you are inside their jab.',
      ['Stay low and close; hooks are inside punches.', 'Turn the whole body for each hook, the arm only follows.'],
      [['Swinging wide', 'Elbows at 90 degrees, fists stay in front of you.']],
      [['Inside rounds', '3 x 2 min of 3-4, then 3-4-3.']]],
    ['3-4: წინა ჰუკი, უკანა ჰუკი', 'ორი ჰუკი ახლო მანძილზე, როცა მათ ჯებს შიგნით ხარ.',
      ['დარჩი დაბლა და ახლოს; ჰუკები ახლო დარტყმებია.', 'ყოველ ჰუკზე მთელი სხეული ატრიალე, ხელი მხოლოდ მიყვება.'],
      [['ფართოდ მოქნევა', 'იდაყვები 90 გრადუსზე, მუშტები შენს წინ.']],
      [['ახლო რაუნდები', '3 x 2 წთ 3-4, შემდეგ 3-4-3.']]]),
  C('c52', 'combos', 2, ['leaduppercut', 'cross'], 'five two', chain(['leaduppercut', 'cross']),
    ['5-2: lead uppercut, cross', 'The uppercut lifts their guard, the cross goes straight through the middle.',
      ['Dip slightly to the lead side to load the uppercut.', 'Short uppercut, then the cross straight down the middle.'],
      [['Dropping the hand before the uppercut', 'Load with the legs, not by lowering the fist.']],
      [['5-2 rounds', '3 x 2 min, add a hook (5-2-3) in the last minute.']]],
    ['5-2: წინა აპერკოტი, კროსი', 'აპერკოტი მათ დაცვას აწევს, კროსი პირდაპირ შუაში გადის.',
      ['აპერკოტისთვის ოდნავ ჩაიხარე წინა მხარეს.', 'მოკლე აპერკოტი, შემდეგ კროსი პირდაპირ შუაში.'],
      [['აპერკოტამდე ხელის დაშვება', 'დაიმუხტე ფეხებით და არა მუშტის დაწევით.']],
      [['5-2 რაუნდები', '3 x 2 წთ, ბოლო წუთზე დაამატე ჰუკი (5-2-3).']]]),
  C('c632', 'combos', 3, ['rearuppercut', 'leadhook', 'cross'], 'six three two', chain(['rearuppercut', 'leadhook', 'cross']),
    ['6-3-2: rear uppercut, hook, cross', 'A close-range finisher: up the middle, round the side, then straight.',
      ['Rear uppercut from a slight dip to the rear side.', 'The hook comes off the uppercut\'s hip turn.', 'Finish with the cross and step out.'],
      [['Standing tall at close range', 'Knees bent, head off the centre line.']],
      [['Close-range rounds', '3 x 2 min.']]],
    ['6-3-2: უკანა აპერკოტი, ჰუკი, კროსი', 'ახლო მანძილის დამასრულებელი: შუაში ზევით, გვერდიდან, შემდეგ პირდაპირ.',
      ['უკანა აპერკოტი უკანა მხარეს მცირე ჩახრიდან.', 'ჰუკი აპერკოტის მენჯის ტრიალიდან გადის.', 'დაასრულე კროსით და გადი გვერდზე.'],
      [['ახლო მანძილზე სწორად დგომა', 'მუხლები მოხრილი, თავი ცენტრალური ხაზიდან გვერდზე.']],
      [['ახლო მანძილის რაუნდები', '3 x 2 წთ.']]]),
  C('c1teep', 'combos', 2, ['jab', 'teep'], 'one, teep', chain(['jab', 'teep']),
    ['1, teep', 'Jab to the head, push kick to the body: stops them walking forward.',
      ['The jab makes them raise their hands; the teep goes underneath.', 'Push through with the hip, then put the foot back down in stance.'],
      [['Kicking with the leg only', 'Lift the knee first, then push the hip forward.']],
      [['Range rounds', '3 x 2 min: 1-teep, reset.']]],
    ['1, თიპი', 'ჯები თავში, ბიძგი ტანში: აჩერებს წინსვლას.',
      ['ჯები ხელებს აწევინებს; თიპი ქვემოდან გადის.', 'მენჯით მიაწექი, შემდეგ ფეხი დგომაში დააბრუნე.'],
      [['მხოლოდ ფეხით დარტყმა', 'ჯერ მუხლი აწიე, შემდეგ მენჯი წინ მიაწოდე.']],
      [['მანძილის რაუნდები', '3 x 2 წთ: 1-თიპი, დაბრუნება.']]]),
  C('c1switch', 'combos', 2, ['jab', 'leadkick'], 'one, switch kick', chain(['jab', 'leadkick']),
    ['1, switch kick', 'The jab hides the switch of the feet, then the lead leg kicks the body.',
      ['Switch the feet as the jab comes back.', 'Turn the hip over fully and kick through.'],
      [['A big, slow switch', 'Small, quick hop: feet just change places.']],
      [['Switch kick rounds', '3 x 2 min, light on the feet.']]],
    ['1, წიხლი ფეხის შეცვლით', 'ჯები მალავს ფეხების შეცვლას, შემდეგ წინა ფეხი ტანში არტყამს.',
      ['ფეხები შეცვალე, როცა ჯები ბრუნდება.', 'მენჯი ბოლომდე გადაატრიალე და დაარტყი გამჭოლად.'],
      [['დიდი, ნელი შეცვლა', 'მცირე, სწრაფი ხტომა: ფეხები უბრალოდ ადგილს იცვლის.']],
      [['წიხლის რაუნდები', '3 x 2 წთ, მსუბუქად ფეხებზე.']]]),
  C('cdutch', 'combos', 3, ['jab', 'cross', 'leadhook', 'roundhouse'], 'one two three, kick', chain(['onetwo', 'leadhook', 'roundhouse']),
    ['1-2-3, kick (Dutch combination)', 'Hands to the head, then the rear kick: the hook turns you so the kick is already loaded.',
      ['The hook shifts your weight onto the lead leg, ready to kick.', 'Kick the body or the leg, then back to guard.', 'Keep the hands up while kicking.'],
      [['A pause before the kick', 'The kick is the 4th beat: no reset in between.']],
      [['Dutch rounds', '3 x 3 min, kick the body and the leg on alternate reps.']]],
    ['1-2-3, წიხლი (ჰოლანდიური კომბინაცია)', 'ხელები თავში, შემდეგ უკანა წიხლი: ჰუკი ისე გატრიალებს, რომ წიხლი უკვე დამუხტულია.',
      ['ჰუკი წონას წინა ფეხზე გადაიტანს, წიხლისთვის მზადაა.', 'დაარტყი ტანში ან ფეხში, შემდეგ დაბრუნდი დაცვაში.', 'წიხლის დროს ხელები ზევით.'],
      [['პაუზა წიხლამდე', 'წიხლი მე-4 დარტყმაა: შუაში დაბრუნების გარეშე.']],
      [['ჰოლანდიური რაუნდები', '3 x 3 წთ, მონაცვლეობით ტანში და ფეხში.']]]),
  C('c12knee', 'combos', 2, ['jab', 'cross', 'knee'], 'one two, knee', chain(['onetwo', 'knee']),
    ['1-2, knee', 'Punches bring you close, the knee lands as they cover up.',
      ['Step in on the cross so you are in knee range.', 'Drive the hips forward through the knee, lean back slightly.'],
      [['Knee from too far', 'The cross carries you forward; the knee comes from there.']],
      [['Knee rounds', '3 x 2 min, alternate the knee leg every 4 reps.']]],
    ['1-2, მუხლი', 'დარტყმები ახლოს მიგიყვანს, მუხლი მაშინ მოხვდება, როცა დაცვაში იმალებიან.',
      ['კროსზე ნაბიჯით შედი, რომ მუხლის მანძილზე იყო.', 'მუხლში მენჯი წინ მიაწოდე, ოდნავ უკან გადაიხარე.'],
      [['მუხლი შორიდან', 'კროსი წინ მიგიყვანს; მუხლი იქიდან გადის.']],
      [['მუხლის რაუნდები', '3 x 2 წთ, ყოველ 4 გამეორებაზე შეცვალე ფეხი.']]]),
  C('c3elbow', 'combos', 3, ['leadhook', 'elbow'], 'three, elbow', chain(['leadhook', 'elbow']),
    ['3, elbow', 'Close range: the hook turns their head, the rear elbow follows on the same line.',
      ['Only at very close range.', 'The elbow follows the hook\'s hip turn, back the other way.'],
      [['Reaching with the elbow', 'If you have to reach, throw a cross instead.']],
      [['Inside rounds', '3 x 2 min.']]],
    ['3, იდაყვი', 'ახლო მანძილი: ჰუკი თავს უტრიალებს, უკანა იდაყვი იმავე ხაზზე მიყვება.',
      ['მხოლოდ ძალიან ახლო მანძილზე.', 'იდაყვი ჰუკის მენჯის ტრიალს მიყვება, საპირისპირო მიმართულებით.'],
      [['იდაყვით გაწვდომა', 'თუ წვდომა გჭირდება, კროსი დაარტყი.']],
      [['ახლო რაუნდები', '3 x 2 წთ.']]]),
  C('c12shoot', 'combos', 3, ['jab', 'cross', 'doubleleg'], 'one two, shoot', chain(['onetwo', 'doubleleg']),
    ['1-2, double-leg', 'MMA\'s key mix: punches bring their hands up, then you change level and shoot.',
      ['Change level as the cross comes back.', 'Same look for the strike and the shot, so they cannot tell which is coming.'],
      [['Shooting from too far', 'The punches close the distance first.']],
      [['Strike to shot', '3 x 8 reps each round, on a mat or carpet.']]],
    ['1-2, ორ ფეხზე შეტევა', 'MMA-ს მთავარი შერწყმა: დარტყმები ხელებს აწევინებს, შემდეგ დონეს იცვლი და შედიხარ.',
      ['დონე შეცვალე, როცა კროსი ბრუნდება.', 'დარტყმა და შეტევა ერთნაირად გამოიყურებოდეს, რომ ვერ მიხვდნენ.'],
      [['შეტევა შორიდან', 'დარტყმები ჯერ მანძილს ამცირებს.']],
      [['დარტყმიდან შეტევაზე', '3 x 8 გამეორება რაუნდში, ხალიჩაზე ან მატზე.']]]),

  // ---------- Defend, then counter ----------
  C('dslip23', 'counters', 3, ['slip', 'cross', 'leadhook'], 'slip, two three', chain(['slip', 'cross', 'leadhook']),
    ['Slip, 2-3', 'Slip their jab to the outside and answer with cross and hook while they are open.',
      ['Slip just enough: the punch misses by a few centimetres.', 'The slip loads the cross; the cross loads the hook.'],
      [['Slipping too far', 'Your head moves outside your lead knee, no further.']],
      [['Slip-counter rounds', '3 x 2 min: picture the jab each time.']]],
    ['სლიპი, 2-3', 'ჯებს გარეთ გაუსხლტი და უპასუხე კროსით და ჰუკით, სანამ ღიაა.',
      ['გასხლტი ზუსტად იმდენი, რომ დარტყმამ რამდენიმე სანტიმეტრით აგცდეს.', 'სლიპი ამზადებს კროსს; კროსი ამზადებს ჰუკს.'],
      [['ზედმეტად შორს გასხლეტა', 'თავი წინა მუხლის გარეთ, არა უფრო შორს.']],
      [['კონტრის რაუნდები', '3 x 2 წთ: ყოველ ჯერზე წარმოიდგინე ჯები.']]]),
  C('droll32', 'counters', 3, ['roll', 'leadhook', 'cross'], 'roll, three two', chain([ROLL, 'leadhook', 'cross']),
    ['Roll, 3-2', 'Roll under their hook, come up loaded and fire your own hook and cross.',
      ['Bend the knees, not the waist; eyes stay on them.', 'You come up on the lead side, which loads your hook.'],
      [['Ducking straight down', 'Move in a U: down, across, up.']],
      [['Roll rounds', '3 x 2 min. Picture a hook, roll, counter.']]],
    ['როლი, 3-2', 'ჰუკს ქვეშ გაუძვერი, ამოდი დამუხტული და დაარტყი შენი ჰუკი და კროსი.',
      ['მოხარე მუხლები და არა წელი; თვალი მათზე.', 'ამოდიხარ წინა მხარეს, რაც შენს ჰუკს ამუხტავს.'],
      [['პირდაპირ დაბლა ჩაყუჩება', 'იმოძრავე U-ს ფორმით: დაბლა, გვერდზე, ზევით.']],
      [['როლის რაუნდები', '3 x 2 წთ. წარმოიდგინე ჰუკი, როლი, კონტრი.']]]),
  C('dblock32', 'counters', 2, ['block', 'leadhook', 'cross'], 'block, three two', chain(['block', 'leadhook', 'cross']),
    ['Block, 3-2', 'Take the punch on the guard, then answer straight away before they reset.',
      ['Block with the glove against the head, elbow tight.', 'The counter starts the moment the punch lands on your guard.'],
      [['Blocking and waiting', 'Block-hit is one rhythm: "block, three two".']],
      [['Block-counter rounds', '3 x 2 min.']]],
    ['ბლოკი, 3-2', 'დარტყმა დაცვაზე მიიღე, შემდეგ მაშინვე უპასუხე, სანამ დაბრუნდებიან.',
      ['დაბლოკე ხელთათმანით თავთან, იდაყვი მჭიდროდ.', 'კონტრი იწყება იმ წამს, როცა დარტყმა შენს დაცვას ხვდება.'],
      [['ბლოკი და ლოდინი', 'ბლოკი-დარტყმა ერთი რიტმია: „ბლოკი, სამი ორი“.']],
      [['ბლოკი-კონტრის რაუნდები', '3 x 2 წთ.']]]),
  C('dparry12', 'counters', 2, ['parry', 'jab', 'cross'], 'parry, one two', chain(['parry', 'onetwo']),
    ['Parry, 1-2', 'Knock their jab aside with the rear hand and fire back your own 1-2.',
      ['Small parry: a tap, not a swat.', 'Your jab goes as their jab comes back.'],
      [['Reaching to parry', 'Wait for the jab to come to your face, then tap.']],
      [['Parry rounds', '3 x 2 min.']]],
    ['პარირება, 1-2', 'მათი ჯები უკანა ხელით გვერდზე გადააგდე და შენი 1-2 დაარტყი.',
      ['მცირე პარირება: შეხება და არა მოქნევა.', 'შენი ჯები მაშინ გადის, როცა მათი ჯები ბრუნდება.'],
      [['პარირებისთვის გაწვდომა', 'დაელოდე, სანამ ჯები სახესთან მოვა, შემდეგ შეეხე.']],
      [['პარირების რაუნდები', '3 x 2 წთ.']]]),
  C('dpull23', 'counters', 3, ['pullcounter', 'leadhook'], 'pull, two three', chain(['pullcounter', 'leadhook']),
    ['Pull, 2-3', 'Lean back from the jab, spring back with the cross and finish with the hook.',
      ['Pull with the legs: weight onto the rear knee.', 'The hook follows the cross\'s hip turn.'],
      [['Pulling straight back with stiff legs', 'Bend the rear knee and keep your hands up.']],
      [['Pull-counter rounds', '3 x 2 min.']]],
    ['გადახრა, 2-3', 'ჯებს უკან გადაუხარე, კროსით დაბრუნდი და ჰუკით დაასრულე.',
      ['გადაიხარე ფეხებით: წონა უკანა მუხლზე.', 'ჰუკი კროსის მენჯის ტრიალს მიყვება.'],
      [['სწორი ფეხებით უკან გადახრა', 'უკანა მუხლი მოხარე და ხელები ზევით შეინარჩუნე.']],
      [['კონტრის რაუნდები', '3 x 2 წთ.']]]),
  C('dcheckkick', 'counters', 3, ['check', 'roundhouse'], 'check, kick', chain([...CHECK, 'roundhouse']),
    ['Check, kick', 'Check their low kick on the shin, then answer with your own kick straight away.',
      ['Lift the lead knee and turn the shin out to meet the kick.', 'Put the foot down and kick back while they are still turning.'],
      [['Checking and waiting', 'The kick goes as soon as your foot lands.']],
      [['Check-return rounds', '3 x 2 min.']]],
    ['ჩეკი, წიხლი', 'მათი დაბალი წიხლი წვივზე დაბლოკე, შემდეგ მაშინვე შენი წიხლით უპასუხე.',
      ['წინა მუხლი აწიე და წვივი გარეთ მოაბრუნე წიხლის შესახვედრად.', 'ფეხი დადე და დაარტყი, სანამ ჯერ კიდევ ტრიალებენ.'],
      [['ჩეკი და ლოდინი', 'წიხლი მაშინვე გადის, როგორც კი ფეხი დადგება.']],
      [['ჩეკი-პასუხის რაუნდები', '3 x 2 წთ.']]]),
  C('dcatch2kick', 'counters', 3, ['catchkick', 'cross', 'roundhouse'], 'catch, two, kick', chain([...CATCH, 'cross', 'roundhouse']),
    ['Catch, 2, kick', 'Catch the body kick, hit while they stand on one leg, then kick as they land.',
      ['Absorb, then scoop the leg; cross while they are trapped.', 'Let the leg go and kick before they get their balance.'],
      [['Holding the leg too long', 'Catch, punch, release: one second.']],
      [['Catch rounds', '3 x 2 min. Picture the kick each time.']]],
    ['დაჭერა, 2, წიხლი', 'ტანის წიხლი დაიჭირე, დაარტყი სანამ ცალ ფეხზე დგანან, შემდეგ წიხლი დაარტყი, როცა დადგებიან.',
      ['შეიწოვე და ფეხი აიტაცე; კროსი, სანამ დაჭერილია.', 'ფეხი გაუშვი და დაარტყი წიხლი, სანამ წონასწორობას აღიდგენენ.'],
      [['ფეხის დიდხანს დაჭერა', 'დაჭერა, დარტყმა, გაშვება: ერთი წამი.']],
      [['დაჭერის რაუნდები', '3 x 2 წთ. ყოველ ჯერზე წარმოიდგინე წიხლი.']]]),
];

const tx = (en, ka) => ({ en, ka });
export const COMBO_TECHS = LIST.map(c => ({
  id: c.id, discipline: c.discipline, phase: c.phase, uses: c.uses,
  name: tx(c.en[0], c.ka[0]), purpose: tx(c.en[1], c.ka[1]), keyPoints: tx(c.en[2], c.ka[2]),
  mistakes: tx(c.en[3].map(([m, fix]) => ({ m, fix })), c.ka[3].map(([m, fix]) => ({ m, fix }))),
  drills: tx(c.en[4].map(([name, how]) => ({ name, how })), c.ka[4].map(([name, how]) => ({ name, how }))),
  callout: { en: c.say }, animOf: c.uses,
}));
export const COMBO_SEQ = Object.fromEntries(LIST.map(c => [c.id, c.seq]));

// ---------- Your own combinations ----------
// Building blocks for the combo builder: what the timer says, and the capture piece that shows it.
export const STEPS = [
  { id: 'jab', say: 'one', kind: 'attack' }, { id: 'cross', say: 'two', kind: 'attack' },
  { id: 'leadhook', say: 'three', kind: 'attack' }, { id: 'rearhook', say: 'four', kind: 'attack' },
  { id: 'leaduppercut', say: 'five', kind: 'attack' }, { id: 'rearuppercut', say: 'six', kind: 'attack' },
  { id: 'elbow', say: 'elbow', kind: 'attack' }, { id: 'teep', say: 'teep', kind: 'attack', kick: true },
  { id: 'roundhouse', say: 'kick', kind: 'attack', kick: true }, { id: 'leadkick', say: 'switch kick', kind: 'attack', kick: true },
  { id: 'knee', say: 'knee', kind: 'attack', kick: true }, { id: 'doubleleg', say: 'shoot', kind: 'attack', kick: true },
  { id: 'slip', say: 'slip', kind: 'defence' }, { id: 'roll', say: 'roll', kind: 'defence' },
  { id: 'block', say: 'block', kind: 'defence' }, { id: 'parry', say: 'parry', kind: 'defence' },
  { id: 'pull', say: 'pull', kind: 'defence' }, { id: 'check', say: 'check', kind: 'defence', kick: true },
  { id: 'catch', say: 'catch', kind: 'defence', kick: true },
  { id: 'stepback', say: 'step back', kind: 'move' }, { id: 'sidestep', say: 'move', kind: 'move' }, { id: 'pivot', say: 'pivot', kind: 'move' },
].map(x => ({ ...x, label: LAB[x.id] }));
const stepById = Object.fromEntries(STEPS.map(x => [x.id, x]));
// Pieces for one building block. first/last: starts from guard / returns to guard.
function stepPieces(id, first, last) {
  if (id === 'roll') return [ROLL];
  if (id === 'check') return CHECK;
  if (id === 'catch') return CATCH;
  if (id === 'pull') return [['pullcounter', 0, 0.38, { lab: LAB.pull }], ['pullcounter', 0.38, 0.38, { hold: 0.25, lab: LAB.pull }]];
  const [s, e] = W[id];
  return [[id, first ? 0 : s, last ? 1 : e, { lab: LAB[id] }]];
}
export const stepsSeq = steps => steps.flatMap((id, i) => stepPieces(id, i === 0, i === steps.length - 1));
// "one two, slip, kick": numbers run together, words are separated by commas.
export function stepsSay(steps) {
  const out = [];
  steps.forEach(id => {
    const w = stepById[id].say, num = /^(one|two|three|four|five|six)$/.test(w);
    if (num && out.length && out[out.length - 1].num) out[out.length - 1].t += ' ' + w; else out.push({ t: w, num });
  });
  return out.map(x => x.t).join(', ');
}
export const stepsKick = steps => steps.some(id => stepById[id].kick);
export const stepsDefFirst = steps => stepById[steps[0]]?.kind === 'defence';
