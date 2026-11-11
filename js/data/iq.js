// Fight IQ: what separates a fighter from someone who only knows techniques.
// Each lesson: why it matters, the key ideas, and a drill the timer can run.
// drill.calls: what the timer calls during the rounds ('combos', 'defence', 'fight', 'footwork' or a list).
const C = (id, en, ka, drill) => ({ id, en, ka, drill });
export const LESSONS = [
  C('range', {
    title: 'Range: fight at your distance',
    why: 'Every exchange happens at one of three ranges: kicking, punching or clinch. The fighter who controls the range decides which weapons work.',
    points: ['Kicking range: only the teep and kicks reach. Punchers must step in to touch you here.', 'Punching range: straight punches land; hooks and uppercuts need half a step closer.', 'Clinch range: knees, elbows, short hooks, and grappling.', 'Know your best range, take the fight there, and do not stand at a range where only the opponent can hit.'],
    drill: ['In and out', '3 rounds: call by call, step into punching range and land 1-2, or step out to kicking range and teep. Never stay between ranges.'],
  }, {
    title: 'მანძილი: იბრძოლე შენს მანძილზე',
    why: 'ყოველი გაცვლა სამიდან ერთ მანძილზე ხდება: წიხლის, ხელის ან კლინჩის. ვინც მანძილს აკონტროლებს, ის წყვეტს, რომელი იარაღი იმუშავებს.',
    points: ['წიხლის მანძილი: მხოლოდ თიპი და წიხლები აღწევს. მოკრივემ აქ ნაბიჯით უნდა შემოვიდეს.', 'ხელის მანძილი: პირდაპირი დარტყმები აღწევს; ჰუკებს და აპერკოტებს ნახევარი ნაბიჯით ახლოს მისვლა სჭირდება.', 'კლინჩის მანძილი: მუხლები, იდაყვები, მოკლე ჰუკები და ჭიდაობა.', 'იცოდე შენი საუკეთესო მანძილი, გადაიტანე ბრძოლა იქ და არ დადგე იმ მანძილზე, სადაც მხოლოდ მეტოქე გწვდება.'],
    drill: ['შესვლა და გასვლა', '3 რაუნდი: ბრძანებით შედი ხელის მანძილზე და დაარტყი 1-2, ან გადი წიხლის მანძილზე და დაარტყი თიპი. შუაში არასდროს დარჩე.'],
  }, { rounds: 3, secs: 120, rest: 60, calls: ['in, one two', 'out, teep', 'in, one two', 'out', 'teep'] }),
  C('jab', {
    title: 'The jab is your most important tool',
    why: 'The jab measures distance, blinds, stops an attack, scores and sets up everything else. Fighters who jab well control fights.',
    points: ['Measure: touch the target to find your range before the power shots.', 'Blind: a jab in the face hides the cross or the kick behind it.', 'Stop: a sharp jab breaks the rhythm of someone walking forward.', 'Vary it: to the head, to the body, double, with a step. A predictable jab gets countered.'],
    drill: ['Jab only', '3 rounds using only the jab: single, double, to the body, stepping in and out. Then 1 round where every combo starts with a jab.'],
  }, {
    title: 'ჯები შენი ყველაზე მნიშვნელოვანი იარაღია',
    why: 'ჯები ზომავს მანძილს, აბრმავებს, აჩერებს შეტევას, აგროვებს ქულებს და ამზადებს ყველაფერს დანარჩენს. ვინც კარგად ჯებავს, ბრძოლას აკონტროლებს.',
    points: ['გაზომე: შეეხე სამიზნეს, რომ მანძილი იპოვო ძლიერ დარტყმებამდე.', 'დააბრმავე: ჯები სახეში მალავს მის უკან კროსს ან წიხლს.', 'შეაჩერე: მკვეთრი ჯები ამსხვრევს წინ მომავლის რიტმს.', 'შეცვალე: თავში, ტანში, ორმაგი, ნაბიჯით. პროგნოზირებად ჯებს კონტრი ხვდება.'],
    drill: ['მხოლოდ ჯები', '3 რაუნდი მხოლოდ ჯებით: ერთი, ორმაგი, ტანში, ნაბიჯით შესვლა და გასვლა. შემდეგ 1 რაუნდი, სადაც ყველა კომბინაცია ჯებით იწყება.'],
  }, { rounds: 4, secs: 120, rest: 45, calls: ['one', 'one one', 'one, body', 'step, one', 'one, step back', 'one two'] }),
  C('ring', {
    title: 'Ring control: never back up in a straight line',
    why: 'Backing straight up is the fastest way to end up against the ropes or a wall. Ring control means moving on angles and keeping the centre.',
    points: ['When pressured, step back and immediately to the side, or pivot off the line.', 'Keep your back to the centre, not to the ropes.', 'To cut off the ring, step to the side they are moving to, not where they are now.', 'Lateral movement plus a jab makes you hard to trap.'],
    drill: ['Angles', '3 rounds of footwork on call: every "step back" must be followed by "move" or "pivot". Finish each round in the centre of your space.'],
  }, {
    title: 'რინგის კონტროლი: არასდროს დაიხიო სწორ ხაზზე',
    why: 'პირდაპირ უკან დახევა თოკებთან ან კედელთან მოხვედრის ყველაზე სწრაფი გზაა. რინგის კონტროლი ნიშნავს კუთხეებით მოძრაობას და ცენტრის შენარჩუნებას.',
    points: ['ზეწოლისას ნაბიჯი უკან და მაშინვე გვერდზე, ან მოტრიალდი ხაზიდან.', 'ზურგით ცენტრისკენ იყავი და არა თოკებისკენ.', 'რინგის ჩაკეტვისთვის გადადგი ნაბიჯი იმ მხარეს, საითაც მიდიან, და არა სადაც ახლა არიან.', 'გვერდითი მოძრაობა და ჯები გაძნელებს ხაფანგში მოქცევას.'],
    drill: ['კუთხეები', '3 რაუნდი ფეხის მოძრაობა ბრძანებით: ყოველ „უკან ნაბიჯს“ უნდა მოჰყვეს „გადი“ ან „მოტრიალდი“. ყოველი რაუნდი დაასრულე შენი სივრცის ცენტრში.'],
  }, { rounds: 3, secs: 120, rest: 45, calls: ['step back, move', 'step back, pivot', 'pivot', 'move', 'one, move', 'step forward'] }),
  C('southpaw', {
    title: 'Fighting the opposite stance',
    why: 'Orthodox against southpaw changes everything: the lead hands meet, the open side moves, and the rear hand and rear kick become the best weapons.',
    points: ['Win the outside foot: keep your lead foot outside theirs. It lines up your rear straight.', 'The rear straight (cross) down the middle is the key punch against the opposite stance.', 'The rear kick to the body lands on the open side.', 'Use the lead hook as they step in; watch for their rear straight in return.'],
    drill: ['Opposite stance', '3 rounds: picture an opponent in the opposite stance. Step to the outside, then cross, or kick to the body.'],
  }, {
    title: 'ბრძოლა საპირისპირო დგომის წინააღმდეგ',
    why: 'ორთოდოქსი საუთპოუს წინააღმდეგ ყველაფერს ცვლის: წინა ხელები ერთმანეთს ხვდება, ღია მხარე იცვლება, საუკეთესო იარაღი კი უკანა ხელი და უკანა წიხლი ხდება.',
    points: ['მოიგე გარე ფეხი: შენი წინა ფეხი მის ფეხზე გარეთ შეინარჩუნე. ასე უკანა პირდაპირი ზუსტად სწორდება.', 'უკანა პირდაპირი (კროსი) შუაში მთავარი დარტყმაა საპირისპირო დგომის წინააღმდეგ.', 'უკანა წიხლი ტანში ღია მხარეს ხვდება.', 'წინა ჰუკი გამოიყენე, როცა შემოდიან; ფრთხილად იყავი მათი უკანა პირდაპირის მიმართ.'],
    drill: ['საპირისპირო დგომა', '3 რაუნდი: წარმოიდგინე საპირისპირო დგომის მეტოქე. გადადი გარეთ, შემდეგ კროსი, ან წიხლი ტანში.'],
  }, { rounds: 3, secs: 150, rest: 60, calls: ['outside, two', 'two', 'kick', 'three', 'two three', 'outside, kick'] }),
  C('habits', {
    title: 'Defensive habits that protect you',
    why: 'Most knockdowns come from small habits: a dropped hand, a raised chin, eyes closed, or staying still after punching. Good habits work when you are tired.',
    points: ['Every strike returns to guard on the same line.', 'Chin down, eyes open, look through your eyebrows.', 'Never stay in front after a combination: defend, move, or both.', 'Breathe out on every strike; tired fighters forget to breathe.'],
    drill: ['Combo, then defend', '3 rounds: every combination is followed by a defence (slip, roll or block) and a move. Say "move" out loud.'],
  }, {
    title: 'დაცვის ჩვევები, რომლებიც გიცავს',
    why: 'ნოკდაუნების უმეტესობა პატარა ჩვევებიდან მოდის: დაშვებული ხელი, აწეული ნიკაპი, დახუჭული თვალები ან დარტყმის შემდეგ ადგილზე დგომა. კარგი ჩვევები დაღლილსაც გიმუშავებს.',
    points: ['ყოველი დარტყმა დაცვას იმავე ხაზით უბრუნდება.', 'ნიკაპი დაბლა, თვალები გახელილი, უყურე წარბების ქვემოდან.', 'კომბინაციის შემდეგ არასდროს დარჩე წინ: დაიცავი, გადი, ან ორივე.', 'ყოველ დარტყმაზე ამოისუნთქე; დაღლილ მებრძოლებს სუნთქვა ავიწყდებათ.'],
    drill: ['კომბინაცია, შემდეგ დაცვა', '3 რაუნდი: ყოველ კომბინაციას მოსდევს დაცვა (სლიპი, როლი ან ბლოკი) და გასვლა. თქვი „გადი“ ხმამაღლა.'],
  }, { rounds: 3, secs: 120, rest: 60, calls: ['one two, slip, move', 'one two three, roll', 'two three two, block, move', 'one two, pivot'] }),
  C('feints', {
    title: 'Feints and rhythm',
    why: 'An opponent who can read your rhythm can time you. Feints and broken rhythm make them react to things that never come, and open them for what does.',
    points: ['Feint with the shoulder, the lead hand, or a half step. Small, quick and believable.', 'Watch their reaction: if they flinch or raise their hands, attack what opens.', 'Change speed: a slow jab followed by a fast cross.', 'Do not feint all the time: a feint only works because real attacks follow.'],
    drill: ['Feint to strike', '3 rounds: before each combination, show a feint (shoulder, jab half-way or a half step), then throw the real combination.'],
  }, {
    title: 'ფინტები და რიტმი',
    why: 'მეტოქე, რომელიც შენს რიტმს კითხულობს, დროს გიზომავს. ფინტები და დარღვეული რიტმი აიძულებს რეაგირება მოახდინოს იმაზე, რაც არ მოდის, და ხსნის მას იმისთვის, რაც მოდის.',
    points: ['ფინტი მხრით, წინა ხელით ან ნახევარი ნაბიჯით. მცირე, სწრაფი და დამაჯერებელი.', 'დააკვირდი რეაქციას: თუ შეკრთება ან ხელებს აწევს, დაარტყი იქ, რაც გაიხსნა.', 'შეცვალე სისწრაფე: ნელი ჯები, შემდეგ სწრაფი კროსი.', 'მუდმივად ნუ ფინტავ: ფინტი მხოლოდ იმიტომ მუშაობს, რომ ნამდვილი შეტევა მოსდევს.'],
    drill: ['ფინტიდან დარტყმამდე', '3 რაუნდი: ყოველ კომბინაციამდე აჩვენე ფინტი (მხარი, ნახევარი ჯები ან ნახევარი ნაბიჯი), შემდეგ ნამდვილი კომბინაცია.'],
  }, { rounds: 3, secs: 120, rest: 60, calls: ['feint, two', 'feint, one two', 'feint, three', 'feint, kick', 'one, feint, two'] }),
  C('counter', {
    title: 'Counter-punching: make them miss, make them pay',
    why: 'Counters land hardest because the opponent is open and moving into the punch. Good counter-punchers stay calm and wait for the strike they expect.',
    points: ['Know their habit: most people throw the same first strike again and again.', 'Defend small so you are still in range to hit back.', 'Counter immediately, within half a second, before they reset.', 'Draw the attack: show an opening on purpose, then counter what comes.'],
    drill: ['Counter rounds', '3 rounds of defence calls: every defence is followed straight away by its counter.'],
  }, {
    title: 'კონტრ-დარტყმა: აცდენინე და დასაჯე',
    why: 'კონტრები ყველაზე ძლიერად ხვდება, რადგან მეტოქე ღიაა და დარტყმისკენ მოძრაობს. კარგი კონტრმოკრივე მშვიდად რჩება და ელოდება დარტყმას, რომელსაც მოელის.',
    points: ['იცოდე მისი ჩვევა: ადამიანების უმეტესობა ერთსა და იმავე პირველ დარტყმას ისვრის.', 'დაიცავი მცირედ, რომ პასუხისთვის მანძილზე დარჩე.', 'კონტრი მაშინვე, ნახევარ წამში, სანამ დაბრუნდება.', 'გამოიწვიე შეტევა: განზრახ აჩვენე გახსნა, შემდეგ კონტრი იმაზე, რაც მოვა.'],
    drill: ['კონტრის რაუნდები', '3 რაუნდი დაცვის ბრძანებებით: ყოველ დაცვას მაშინვე მოსდევს კონტრი.'],
  }, { rounds: 3, secs: 150, rest: 60, calls: 'defence' }),
  C('hurt', {
    title: 'When you are hurt or exhausted',
    why: 'Every fighter gets hurt or gassed at some point. Knowing exactly what to do stops a bad moment turning into a lost fight.',
    points: ['Cover tight: elbows in, gloves on the head, chin down. Do not turn your back.', 'Move: step off the line and away from their power hand.', 'Clinch: tie up their arms and lean on them to buy seconds.', 'Breathe through the nose, slow down, and come back with a jab, not a wild swing.'],
    drill: ['Survive and recover', '3 rounds at a hard pace with short rest: when the timer calls "cover", cover and move for a few seconds, then return with a jab.'],
  }, {
    title: 'როცა დარტყმული ან გამოფიტული ხარ',
    why: 'ყველა მებრძოლი ოდესღაც იღებს ძლიერ დარტყმას ან იღლება. თუ ზუსტად იცი რა უნდა გააკეთო, ცუდი მომენტი წაგებულ ბრძოლად არ იქცევა.',
    points: ['მჭიდროდ დაიფარე: იდაყვები შიგნით, ხელთათმანები თავზე, ნიკაპი დაბლა. ზურგს ნუ შეაქცევ.', 'იმოძრავე: გადი ხაზიდან და მისი ძლიერი ხელისგან.', 'კლინჩი: შეუკარი ხელები და დაეყრდენი, რომ წამები მოიგო.', 'ისუნთქე ცხვირით, შეანელე და დაბრუნდი ჯებით და არა უაზრო მოქნევით.'],
    drill: ['გადარჩენა და აღდგენა', '3 რაუნდი მძიმე ტემპით, მოკლე დასვენებით: როცა ტაიმერი იტყვის „cover“, დაიფარე და იმოძრავე რამდენიმე წამი, შემდეგ დაბრუნდი ჯებით.'],
  }, { rounds: 3, secs: 120, rest: 40, calls: ['cover, move, one', 'one two three', 'cover, pivot', 'clinch', 'one two, move', 'cover'] }),
];
export const lessonById = Object.fromEntries(LESSONS.map(x => [x.id, x]));
