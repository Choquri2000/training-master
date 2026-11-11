// Technique library. Text fields are objects keyed by language ({ en, ka })
// so Georgian can be added later without changing any code.
// Orthodox stance: left foot and left hand lead. Southpaws mirror everything.

import { COMBO_TECHS } from './combos.js';

export const DISCIPLINES = {
  boxing: { en: 'Boxing' },
  muaythai: { en: 'Muay Thai / Kickboxing' },
  mma: { en: 'MMA fundamentals' },
  footwork: { en: 'Stance & footwork' },
  combos: { en: 'Attacking combinations', ka: 'შეტევითი კომბინაციები' },
  counters: { en: 'Defend and counter', ka: 'დაცვა და კონტრი' },
};

// Each technique:
//  id, discipline, phase (1-3), name, purpose, keyPoints[], mistakes[{m, fix}],
//  drills[{name, how}], callout (what the timer says out loud, or null),
//  anim (frames for the stick figure, see figure.js) or animOf (reuse another id's frames).
export const TECHNIQUES = [
  // ---------------- PHASE 1: FOUNDATIONS ----------------
  {
    id: 'stance', discipline: 'footwork', phase: 1,
    name: { en: 'Fighting stance & guard' },
    purpose: { en: 'The base every strike, kick and defense starts and ends in.' },
    keyPoints: { en: [
      'Feet about shoulder-width, lead foot toes and rear heel on the same line (like standing on rails, not a tightrope).',
      'Weight 50/50 or slightly back, knees soft, rear heel slightly up.',
      'Lead hand at eyebrow height a fist in front of the face; rear fist touching the cheek/chin.',
      'Elbows down protecting the ribs, chin tucked, eyes looking through the eyebrows.',
      'Stay light and relaxed: tension slows you down.',
    ]},
    mistakes: { en: [
      { m: 'Feet on one line (tightrope)', fix: 'Look down: there should be a gap between the lines of your feet roughly as wide as your hips.' },
      { m: 'Chin up', fix: 'Hold a tennis ball (or rolled sock) between chin and chest for a round.' },
      { m: 'Elbows flaring out', fix: 'Imagine holding a sheet of paper between each elbow and your ribs.' },
      { m: 'Standing square', fix: 'Your lead shoulder should be pointing roughly at your target.' },
    ]},
    drills: { en: [
      { name: 'Mirror check', how: '3 x 1 min holding stance in front of a mirror, checking each key point. Bounce lightly.' },
      { name: 'Stance reset', how: 'Walk around casually, then on a clap (or the bell) snap into stance. 20 reps.' },
    ]},
    callout: null,
  },
  {
    id: 'step', discipline: 'footwork', phase: 1,
    name: { en: 'Step-drag footwork' },
    purpose: { en: 'Move in any direction while staying in stance and balanced.' },
    keyPoints: { en: [
      'The foot nearest the direction moves first: forward = lead foot, back = rear foot, left = lead foot, right = rear foot.',
      'Push off the other foot, then drag it back to restore the same stance width.',
      'Small steps (10 to 20 cm). Never cross your feet, never bring them together.',
      'Head height stays level: no bouncing up and down while stepping.',
    ]},
    mistakes: { en: [
      { m: 'Crossing or closing the feet', fix: 'Put two lines of tape on the garage floor and keep each foot on its own line.' },
      { m: 'Overstepping and leaning', fix: 'Shorter steps. After each step you should be able to punch immediately.' },
      { m: 'Dropping the hands while moving', fix: 'Keep both fists touching your face for the whole drill.' },
    ]},
    drills: { en: [
      { name: 'Box drill', how: 'Forward, right, back, left. 2 min each direction order, 3 rounds.' },
      { name: 'Called steps', how: 'Use the timer with footwork callouts: react to each call with one clean step.' },
    ]},
    callout: { en: 'step' },
  },
  {
    id: 'pivot', discipline: 'footwork', phase: 1,
    name: { en: 'Lead-foot pivot' },
    purpose: { en: 'Change the angle so you are off the opponent\'s centre line.' },
    keyPoints: { en: [
      'Turn on the ball of the lead foot, swinging the rear foot around (to your right for orthodox, roughly 45 to 90 degrees).',
      'Hands stay up, eyes stay on the target.',
      'Finish in a normal stance facing the new angle.',
    ]},
    mistakes: { en: [
      { m: 'Pivoting on the heel', fix: 'Lift the lead heel slightly; spin on the ball of the foot.' },
      { m: 'Swinging the upper body first', fix: 'The rear foot drives the turn; shoulders follow.' },
    ]},
    drills: { en: [
      { name: 'Jab and pivot', how: 'Jab, then pivot. 3 x 2 min.' },
    ]},
    callout: { en: 'pivot' },
  },
  {
    id: 'jab', discipline: 'boxing', phase: 1,
    name: { en: 'Jab (1)' },
    purpose: { en: 'Fast lead straight punch: measures distance, sets up everything else.' },
    keyPoints: { en: [
      'Punch straight from the guard: no wind-up, no drop first.',
      'Turn the fist over (palm down) at the very end, landing with the first two knuckles.',
      'Lead shoulder rises to cover the chin; rear hand stays glued to the face.',
      'Snap it back along the same line, faster than it went out.',
      'Add a small step with the lead foot when you need range.',
    ]},
    mistakes: { en: [
      { m: 'Dropping the jab hand on the way back', fix: 'After every jab, touch your forehead with the lead glove before the next one.' },
      { m: 'Rear hand drifting off the chin', fix: 'Keep the rear thumb touching your cheek for a full round.' },
      { m: 'Leaning past the front knee', fix: 'Your nose should stay behind your front toes.' },
      { m: 'Elbow flaring (a "chicken wing")', fix: 'Elbow points down until the last moment before extension.' },
    ]},
    drills: { en: [
      { name: 'Jab only', how: '3 x 2 min: single, double and stepping jabs, moving between them.' },
      { name: 'Light band jabs', how: 'Band anchored behind you at shoulder height: 3 x 20 fast jabs, focus on snap back.' },
    ]},
    callout: { en: 'one' },
  },
  {
    id: 'cross', discipline: 'boxing', phase: 1,
    name: { en: 'Cross (2)' },
    purpose: { en: 'The power straight from the rear hand.' },
    keyPoints: { en: [
      'Power starts from the rear foot: turn the rear heel out and drive the hip forward.',
      'Rotate the shoulders so the rear shoulder ends up near the chin.',
      'The fist travels straight from the cheek, turning over at the end.',
      'Lead hand returns to the face as the cross fires.',
      'Weight shifts a little onto the lead leg but the head stays above the lead knee.',
    ]},
    mistakes: { en: [
      { m: 'Rear heel stays flat', fix: 'Think "squash the bug" with the rear foot on every cross.' },
      { m: 'Arm-only punch', fix: 'Throw slow crosses where the hip turns first and the arm last.' },
      { m: 'Lead hand drops', fix: 'Lead glove touches the forehead while the cross is out.' },
      { m: 'Over-rotating and falling forward', fix: 'Stop the rotation when the rear shoulder covers the chin.' },
    ]},
    drills: { en: [
      { name: '1-2 rhythm', how: '3 x 2 min of jab-cross, resetting stance after each pair.' },
      { name: 'Slow-motion cross', how: '10 reps at 10% speed watching the rear foot in the mirror.' },
    ]},
    callout: { en: 'two' },
  },
  {
    id: 'slip', discipline: 'boxing', phase: 1,
    name: { en: 'Slip' },
    purpose: { en: 'Move the head just off the line of a straight punch so you can counter.' },
    keyPoints: { en: [
      'Bend at the knees and turn slightly at the waist: the head moves about 15 cm, no more.',
      'Slip outside (to the right) against a jab, inside (to the left) against a cross.',
      'Keep eyes on the opponent and hands up the whole time.',
      'Come back to centre immediately or counter from the slipped position.',
    ]},
    mistakes: { en: [
      { m: 'Bending sideways at the waist', fix: 'Your head should stay above your knees: use the legs.' },
      { m: 'Slipping too far', fix: 'Small: just enough to let the punch pass your ear.' },
      { m: 'Looking at the floor', fix: 'Fix your eyes on a mark on the wall at head height.' },
    ]},
    drills: { en: [
      { name: 'String line', how: 'Tie a string across the garage at chin height; walk along it slipping side to side. 3 x 2 min.' },
      { name: 'Jab-slip-cross', how: 'Jab, slip right, cross. 3 x 2 min.' },
    ]},
    callout: { en: 'slip' },
  },
  {
    id: 'parry', discipline: 'boxing', phase: 1,
    name: { en: 'Parry' },
    purpose: { en: 'Redirect a jab with a small slap of the rear hand.' },
    keyPoints: { en: [
      'Rear hand taps the incoming punch down or across, a short movement of 5 to 10 cm.',
      'Catch it close to your face, not by reaching out.',
      'The parrying hand goes straight back to the chin.',
    ]},
    mistakes: { en: [
      { m: 'Reaching for the punch', fix: 'Parry only when the punch is a forearm\'s length from your face.' },
      { m: 'Big swatting motion', fix: 'Imagine flicking water off the palm, nothing more.' },
    ]},
    drills: { en: [
      { name: 'Shadow parry', how: 'Imagine a jab, parry, answer with a jab. 3 x 1 min.' },
    ]},
    callout: { en: 'parry' },
  },
  {
    id: 'block', discipline: 'boxing', phase: 1,
    name: { en: 'High guard block' },
    purpose: { en: 'Cover up against hooks and heavy shots.' },
    keyPoints: { en: [
      'Gloves come back to the temples, elbows tight, forearms vertical.',
      'Tuck the chin and bend the knees slightly to absorb.',
      'Return to normal guard right after; don\'t stay shelled up.',
    ]},
    mistakes: { en: [
      { m: 'Eyes closed', fix: 'Watch through the gap between your gloves.' },
      { m: 'Turning away', fix: 'Stay square to the threat and keep the feet set.' },
    ]},
    drills: { en: [
      { name: 'Block and return', how: 'Block left, block right, then 1-2. 3 x 2 min.' },
    ]},
    callout: { en: 'block' },
  },
  {
    id: 'teep', discipline: 'muaythai', phase: 1,
    name: { en: 'Lead teep (push kick)' },
    purpose: { en: 'Muay Thai\'s "jab with the leg": keeps distance and breaks rhythm.' },
    keyPoints: { en: [
      'Lift the lead knee high to the chest first (chamber).',
      'Push the ball of the foot (or heel) forward through the target\'s belly, extending the hip.',
      'Lean back slightly for balance and range; hands stay up.',
      'Bring the foot back to stance quickly, don\'t let it drop in front.',
    ]},
    mistakes: { en: [
      { m: 'Kicking upward instead of forward', fix: 'Imagine pushing a door shut with your foot.' },
      { m: 'No chamber', fix: 'Knee touches your lead elbow before you extend.' },
      { m: 'Arms drop for balance', fix: 'Practise holding a slow teep in full extension for 2 seconds with hands up.' },
    ]},
    drills: { en: [
      { name: 'Slow teeps', how: '3 x 10 each leg at half speed, holding the extension 1 second.' },
      { name: 'Jab-teep', how: 'Jab then teep. 3 x 2 min.' },
    ]},
    callout: { en: 'teep' },
  },
  {
    id: 'roundhouse', discipline: 'muaythai', phase: 1,
    name: { en: 'Rear roundhouse kick (body)' },
    purpose: { en: 'The signature Muay Thai power kick, landing with the shin.' },
    keyPoints: { en: [
      'Step the lead foot slightly out to the side and turn the toes out (opens the hip).',
      'Rise on the ball of the support foot and pivot it as you kick: heel ends pointing at the target.',
      'Swing the leg like a baseball bat, turning the hip over; contact with the lower shin.',
      'Rear arm swings down and back for counter-balance, lead hand protects the face.',
      'Let the leg return along the same path back to stance.',
    ]},
    mistakes: { en: [
      { m: 'Support foot stays flat', fix: 'Practise the pivot alone: rise and spin on the ball of the foot, 20 reps.' },
      { m: 'Kicking with the foot instead of the shin', fix: 'Kick through the target as if it isn\'t there; aim the shin, not the toes.' },
      { m: 'Both hands drop', fix: 'Lead hand stays on the face; only the rear arm swings.' },
      { m: 'Leaning far back', fix: 'Turn the hip over and keep your head roughly above the support foot.' },
    ]},
    drills: { en: [
      { name: 'Hip turn on the bench', how: 'Hold the bench for balance, 3 x 10 slow kicks each side focusing on the pivot and hip turn.' },
      { name: 'Kick and return', how: '3 x 2 min: kick, land back in stance, guard check, repeat.' },
    ]},
    callout: { en: 'kick' },
  },
  {
    id: 'check', discipline: 'muaythai', phase: 1,
    name: { en: 'Leg check (shin block)' },
    purpose: { en: 'Block a low or body kick with your shin.' },
    keyPoints: { en: [
      'Lift the lead knee up and slightly out so the shin faces the incoming kick.',
      'Knee and elbow come close together on the same side.',
      'Stand tall on the support leg; don\'t lean away.',
      'Put the foot straight back down in stance, ready to counter.',
    ]},
    mistakes: { en: [
      { m: 'Turning away from the kick', fix: 'Keep your hips facing forward; the shin does the work.' },
      { m: 'Lifting the foot but not the knee', fix: 'Knee rises to hip height at least.' },
    ]},
    drills: { en: [
      { name: 'Check and counter', how: 'Check, then 1-2 or rear kick. 3 x 2 min.' },
    ]},
    callout: { en: 'check' },
  },
  {
    id: 'switchstance', discipline: 'mma', phase: 1,
    name: { en: 'MMA stance & stance switch' },
    purpose: { en: 'A slightly lower, wider stance that defends takedowns as well as strikes.' },
    keyPoints: { en: [
      'A little wider and lower than a boxing stance, weight centred, hands a bit lower and further forward.',
      'Switch stance with a small hop or a step, landing balanced with hands up.',
      'Be equally comfortable in both stances for shadowboxing.',
    ]},
    mistakes: { en: [
      { m: 'Standing tall like boxing', fix: 'Bend the knees until your hands reach your opponent\'s hip height in a quick shot.' },
      { m: 'Feet together mid-switch', fix: 'Switch with a small scissor jump so the feet pass each other at full width.' },
    ]},
    drills: { en: [
      { name: 'Switch on the bell', how: '3 x 1 min: switch every time you hear "switch".' },
    ]},
    callout: { en: 'switch' },
  },
  {
    id: 'sprawl', discipline: 'mma', phase: 1,
    name: { en: 'Sprawl' },
    purpose: { en: 'Stop a takedown by throwing the legs back and dropping the hips on the opponent.' },
    keyPoints: { en: [
      'Throw both legs back hard and wide, landing on the balls of the feet.',
      'Drive the hips down to the floor; chest heavy, head up.',
      'Hands go down to block (or underhook) the shooting opponent.',
      'Pop back up to stance immediately.',
    ]},
    mistakes: { en: [
      { m: 'Hips stay high', fix: 'Your hips should nearly touch the floor at the bottom.' },
      { m: 'Knees hit the ground', fix: 'Land on the balls of the feet with legs straight.' },
      { m: 'Looking down', fix: 'Keep your eyes up at head height.' },
    ]},
    drills: { en: [
      { name: 'Sprawl on the bell', how: '3 x 1 min: shadowbox and sprawl on each call, then return to striking.' },
    ]},
    callout: { en: 'sprawl' },
  },

  // ---------------- PHASE 2: COMBINATIONS ----------------
  {
    id: 'leadhook', discipline: 'boxing', phase: 2,
    name: { en: 'Lead hook (3)' },
    purpose: { en: 'Short, curved power punch from the lead side.' },
    keyPoints: { en: [
      'Arm bent around 90 degrees, elbow at the height of the fist.',
      'Power comes from turning the lead foot and hip, not swinging the arm.',
      'Rear hand stays glued to the chin.',
      'Fist can be palm down or thumb up; keep the wrist straight.',
    ]},
    mistakes: { en: [
      { m: 'Winding up (pulling the arm back first)', fix: 'Start the hook from the exact guard position.' },
      { m: 'Arm too wide / too straight', fix: 'Keep the angle fixed; the body turns the arm like a door hinge.' },
      { m: 'Lead heel stays planted', fix: 'Pivot the lead foot as if putting out a cigarette.' },
    ]},
    drills: { en: [
      { name: '1-2-3', how: 'Jab, cross, lead hook. 3 x 2 min.' },
      { name: 'Hook from guard', how: '3 x 10 slow hooks per side, freezing at the end to check the elbow height.' },
    ]},
    callout: { en: 'three' },
  },
  {
    id: 'rearhook', discipline: 'boxing', phase: 2,
    name: { en: 'Rear hook (4)' },
    purpose: { en: 'A heavy hook from the rear hand, usually after a lead hook or cross.' },
    keyPoints: { en: [
      'Turn the rear foot and hip as for the cross, but the arm stays bent.',
      'Short and tight: don\'t loop it wide.',
      'Lead hand returns to the face.',
    ]},
    mistakes: { en: [
      { m: 'Looping wide', fix: 'Your elbow should not go behind your shoulder line.' },
      { m: 'Overcommitting', fix: 'Finish balanced, ready to throw the next punch.' },
    ]},
    drills: { en: [
      { name: '3-4', how: 'Lead hook, rear hook. 3 x 2 min.' },
    ]},
    callout: { en: 'four' },
  },
  {
    id: 'leaduppercut', discipline: 'boxing', phase: 2,
    name: { en: 'Lead uppercut (5)' },
    purpose: { en: 'Rising punch through the guard at close range.' },
    keyPoints: { en: [
      'Dip slightly onto the lead leg, then drive up with the legs and hip.',
      'Fist rises with palm facing you, elbow stays close to the body.',
      'Short range only: target is the chin or the body.',
    ]},
    mistakes: { en: [
      { m: 'Dropping the hand to load up', fix: 'The dip comes from the knees, not from lowering the fist.' },
      { m: 'Throwing from too far', fix: 'Practise it after a slip or a hook, when you are already close.' },
    ]},
    drills: { en: [
      { name: '5-2', how: 'Lead uppercut, cross. 3 x 2 min.' },
    ]},
    callout: { en: 'five' },
  },
  {
    id: 'rearuppercut', discipline: 'boxing', phase: 2,
    name: { en: 'Rear uppercut (6)' },
    purpose: { en: 'Power uppercut from the rear hand.' },
    keyPoints: { en: [
      'Drive the rear hip forward and up; rear heel turns out.',
      'Fist rises close to the body, palm facing you.',
      'Lead hand guards the face.',
    ]},
    mistakes: { en: [
      { m: 'Leaning back', fix: 'Your head should move slightly forward as the punch rises.' },
    ]},
    drills: { en: [
      { name: '6-3-2', how: 'Rear uppercut, lead hook, cross. 3 x 2 min.' },
    ]},
    callout: { en: 'six' },
  },
  {
    id: 'roll', discipline: 'boxing', phase: 2,
    name: { en: 'Roll (bob and weave)' },
    purpose: { en: 'Duck under a hook in a U-shape and come up in range to counter.' },
    keyPoints: { en: [
      'Bend the knees to drop under the punch; the path of the head is a "U".',
      'Move toward the punch\'s direction of travel (under a lead hook = roll to your left).',
      'Hands stay up and eyes forward.',
      'Come up ready to hit, usually with a hook.',
    ]},
    mistakes: { en: [
      { m: 'Bending at the waist', fix: 'Use the string line drill: go under the string with your legs.' },
      { m: 'Dropping too low', fix: 'Just low enough for the punch to pass over your head.' },
    ]},
    drills: { en: [
      { name: 'String line rolls', how: 'Roll under a chin-height string while moving along it. 3 x 2 min.' },
      { name: '1-2-roll-2', how: 'Jab, cross, roll, cross. 3 x 2 min.' },
    ]},
    callout: { en: 'roll' },
  },
  {
    id: 'leadkick', discipline: 'muaythai', phase: 2,
    name: { en: 'Switch kick (lead roundhouse)' },
    purpose: { en: 'A quick switch of the feet so the lead leg can kick with power.' },
    keyPoints: { en: [
      'Small hop or step to switch the feet: the lead foot goes back, the rear foot comes forward and out.',
      'Kick immediately from the switch, same mechanics as the rear roundhouse.',
      'Keep the switch small: big switches telegraph the kick.',
    ]},
    mistakes: { en: [
      { m: 'Big obvious switch', fix: 'Feet move only 15 to 20 cm during the switch.' },
      { m: 'Pausing after the switch', fix: 'Switch and kick are one movement: "ba-BAM".' },
    ]},
    drills: { en: [
      { name: '1-switch kick', how: 'Jab, then switch kick. 3 x 2 min.' },
    ]},
    callout: { en: 'switch kick' },
  },
  {
    id: 'knee', discipline: 'muaythai', phase: 2,
    name: { en: 'Straight knee' },
    purpose: { en: 'Drive the rear knee into the body at close range.' },
    keyPoints: { en: [
      'Hands reach forward (as if grabbing the head or shoulders) and pull down.',
      'Rise on the toes of the support foot and thrust the hips forward.',
      'Point the toes down so the knee is the leading tip.',
    ]},
    mistakes: { en: [
      { m: 'Lifting the knee without hip drive', fix: 'Think "hips forward", not "knee up".' },
      { m: 'Leaning forward over the knee', fix: 'Lean back slightly so the hips can push through.' },
    ]},
    drills: { en: [
      { name: 'Knees on the bell', how: '3 x 1 min alternating knees, switching stance between reps.' },
    ]},
    callout: { en: 'knee' },
  },
  {
    id: 'levelchange', discipline: 'mma', phase: 2,
    name: { en: 'Level change' },
    purpose: { en: 'Drop your hips quickly (without bending over) to set up a takedown or feint one.' },
    keyPoints: { en: [
      'Bend the knees to drop the hips; back stays upright and head up.',
      'Hands stay in front ready to defend or grab.',
      'Often thrown after a punch: 1-2 then level change.',
    ]},
    mistakes: { en: [
      { m: 'Bending at the waist (head drops below the hips)', fix: 'Keep your head above your knees.' },
    ]},
    drills: { en: [
      { name: '1-2-level change', how: '3 x 2 min.' },
    ]},
    callout: { en: 'level change' },
  },
  {
    id: 'standup', discipline: 'mma', phase: 2,
    name: { en: 'Technical stand-up' },
    purpose: { en: 'Get up from the floor safely, with your guard up and away from the opponent.' },
    keyPoints: { en: [
      'Sitting: one hand on the floor behind you, the other arm guarding the face.',
      'Push off the floor hand and the opposite foot to lift the hips.',
      'Swing the free leg back through, land in stance at a distance.',
    ]},
    mistakes: { en: [
      { m: 'Standing straight up in front of the opponent', fix: 'The leg goes back and you land a step away.' },
      { m: 'Dropping the guard hand', fix: 'Keep the free arm in front of your face the whole time.' },
    ]},
    drills: { en: [
      { name: 'Stand-ups', how: '3 x 6 each side, alternating.' },
    ]},
    callout: { en: 'stand up' },
  },

  // ---------------- PHASE 3: COUNTERS & RANGE ----------------
  {
    id: 'slipcounter', discipline: 'boxing', phase: 3,
    name: { en: 'Slip and counter cross' },
    purpose: { en: 'Slip the jab inside and land a cross at the same moment.' },
    keyPoints: { en: [
      'Slip and punch together: the slip loads the rear hip.',
      'Keep the counter straight and short.',
      'Reset or angle out after the counter; don\'t stay in front.',
    ]},
    mistakes: { en: [
      { m: 'Slip, pause, then punch', fix: 'Say "slip-two" as one word while you drill it.' },
    ]},
    drills: { en: [
      { name: 'Shadow counters', how: 'Picture the jab, slip and counter. 3 x 2 min.' },
    ]},
    callout: { en: 'slip two' },
    animOf: ['slip', 'cross'],
  },
  {
    id: 'pullcounter', discipline: 'boxing', phase: 3,
    name: { en: 'Pull counter' },
    purpose: { en: 'Lean back just out of range of the jab, then fire a cross as it retracts.' },
    keyPoints: { en: [
      'Shift weight onto the rear leg, head moves back over the rear knee.',
      'Hands stay up; the lead hand can catch the jab.',
      'Spring forward off the rear leg into the cross.',
    ]},
    mistakes: { en: [
      { m: 'Leaning back with straight legs', fix: 'Bend the rear knee so the movement is with the legs.' },
    ]},
    drills: { en: [
      { name: 'Pull-2', how: '3 x 2 min.' },
    ]},
    callout: { en: 'pull two' },
  },
  {
    id: 'angleout', discipline: 'footwork', phase: 3,
    name: { en: 'Angle out after combos' },
    purpose: { en: 'Never stay in front after you punch: finish each combo by moving off line.' },
    keyPoints: { en: [
      'Finish the combo, then pivot or side-step to the outside of the lead foot.',
      'Hands up as you move; eyes on the target.',
    ]},
    mistakes: { en: [
      { m: 'Admiring the combo while standing still', fix: 'Every combo ends with "move" said out loud.' },
    ]},
    drills: { en: [
      { name: 'Combo + move', how: '3 x 3 min of any combos, each ending with a pivot or step.' },
    ]},
    callout: { en: 'move' },
    animOf: ['jab', 'cross', 'pivot'],
  },
  {
    id: 'elbow', discipline: 'muaythai', phase: 3,
    name: { en: 'Horizontal elbow' },
    purpose: { en: 'Close-range cutting strike with the point of the elbow.' },
    keyPoints: { en: [
      'Raise the elbow to shoulder height, hand near your own ear.',
      'Turn the hips and shoulders through, slicing across the target.',
      'The other hand guards the face.',
    ]},
    mistakes: { en: [
      { m: 'Throwing it from too far', fix: 'Elbows land inside hook range.' },
      { m: 'Loose hand', fix: 'Keep the palm close to your head so the elbow point leads.' },
    ]},
    drills: { en: [
      { name: '3-elbow', how: 'Lead hook then rear elbow. 3 x 2 min.' },
    ]},
    callout: { en: 'elbow' },
  },
  {
    id: 'catchkick', discipline: 'muaythai', phase: 3,
    name: { en: 'Catch kick and return' },
    purpose: { en: 'Trap a body kick and counter while the opponent is on one leg.' },
    keyPoints: { en: [
      'Absorb the kick with the arm and body on the same side, then scoop the leg.',
      'Step back or turn to off-balance them.',
      'Return fire straight away: cross, or a kick to the standing leg.',
    ]},
    mistakes: { en: [
      { m: 'Reaching out to catch', fix: 'Let the kick come to you, then wrap.' },
    ]},
    drills: { en: [
      { name: 'Solo catch and return', how: 'Picture the kick, catch, step back, cross. 3 x 2 min.' },
    ]},
    callout: { en: 'catch' },
  },
  {
    id: 'clinch', discipline: 'muaythai', phase: 3,
    name: { en: 'Clinch posture and knees' },
    purpose: { en: 'Control the head and land knees from the Thai clinch.' },
    keyPoints: { en: [
      'Hands stacked behind the opponent\'s head (one on top of the other), not interlaced fingers.',
      'Elbows squeeze together in front of their chest, your hips pushed forward.',
      'Pull the head down while driving knees up.',
    ]},
    mistakes: { en: [
      { m: 'Interlacing fingers', fix: 'Palm on the back of the hand, fingers free.' },
      { m: 'Hips back', fix: 'Stand tall, hips in, chest up.' },
    ]},
    drills: { en: [
      { name: 'Clinch knees (solo)', how: 'Arms in clinch position, alternating knees. 3 x 1 min.' },
    ]},
    callout: { en: 'clinch knee' },
  },
  {
    id: 'doubleleg', discipline: 'mma', phase: 3,
    name: { en: 'Double-leg entry (shadow)' },
    purpose: { en: 'Penetration step for the classic double-leg takedown, practised solo.' },
    keyPoints: { en: [
      'Level change first, then a long step with the lead foot between the opponent\'s feet.',
      'Rear knee touches down lightly; head up, back straight.',
      'Hands go to the backs of the knees; bring the rear leg up and drive through.',
    ]},
    mistakes: { en: [
      { m: 'Reaching with the hands before the feet arrive', fix: 'The step does the work: hands only grab at the end.' },
      { m: 'Head down', fix: 'Your head stays up, chin forward.' },
    ]},
    drills: { en: [
      { name: 'Penetration steps', how: '3 x 8 each side across the garage. Use a mat or carpet for the knee.' },
    ]},
    callout: { en: 'shoot' },
  },
  {
    id: 'sprawlstrike', discipline: 'mma', phase: 3,
    name: { en: 'Sprawl to strike' },
    purpose: { en: 'Defend the takedown and come straight back up throwing.' },
    keyPoints: { en: [
      'Sprawl, then pop up to stance in one movement.',
      'Land the first punch as soon as your feet are set.',
    ]},
    mistakes: { en: [
      { m: 'Getting up slowly with hands down', fix: 'Hands come back to the face on the way up.' },
    ]},
    drills: { en: [
      { name: 'Sprawl-1-2', how: '3 x 1 min.' },
    ]},
    callout: { en: 'sprawl, one two' },
    animOf: ['sprawl', 'jab', 'cross'],
  },
];

TECHNIQUES.push(...COMBO_TECHS); // the important combinations (combos.js)
export const techById = Object.fromEntries(TECHNIQUES.map(t => [t.id, t]));

// Combos used by the timer's callouts, grouped by phase.
// Each combo lists technique ids so it only plays once all of them are unlocked.
export const COMBOS = [
  { say: 'one', uses: ['jab'] },
  { say: 'one one', uses: ['jab'] },
  { say: 'one two', uses: ['jab', 'cross'] },
  { say: 'one, step', uses: ['jab', 'step'] },
  { say: 'one two, pivot', uses: ['jab', 'cross', 'pivot'] },
  { say: 'slip, two', uses: ['slip', 'cross'] },
  { say: 'parry, one', uses: ['parry', 'jab'] },
  { say: 'block, one two', uses: ['block', 'jab', 'cross'] },
  { say: 'teep', uses: ['teep'] },
  { say: 'one, teep', uses: ['jab', 'teep'] },
  { say: 'kick', uses: ['roundhouse'] },
  { say: 'one two, kick', uses: ['jab', 'cross', 'roundhouse'] },
  { say: 'check, kick', uses: ['check', 'roundhouse'] },
  { say: 'check, one two', uses: ['check', 'jab', 'cross'] },
  { say: 'sprawl', uses: ['sprawl'] },
  { say: 'switch', uses: ['switchstance'] },
  { say: 'one two three', uses: ['jab', 'cross', 'leadhook'] },
  { say: 'one two three two', uses: ['jab', 'cross', 'leadhook'] },
  { say: 'three four', uses: ['leadhook', 'rearhook'] },
  { say: 'five two', uses: ['leaduppercut', 'cross'] },
  { say: 'six three two', uses: ['rearuppercut', 'leadhook', 'cross'] },
  { say: 'one two, roll, two', uses: ['jab', 'cross', 'roll'] },
  { say: 'one, switch kick', uses: ['jab', 'leadkick'] },
  { say: 'one two three, kick', uses: ['jab', 'cross', 'leadhook', 'roundhouse'] },
  { say: 'knee, knee', uses: ['knee'] },
  { say: 'one two, knee', uses: ['jab', 'cross', 'knee'] },
  { say: 'one two, level change', uses: ['jab', 'cross', 'levelchange'] },
  { say: 'slip two, move', uses: ['slipcounter', 'angleout'] },
  { say: 'pull two', uses: ['pullcounter'] },
  { say: 'three, elbow', uses: ['leadhook', 'elbow'] },
  { say: 'catch, two', uses: ['catchkick'] },
  { say: 'clinch knee', uses: ['clinch'] },
  { say: 'one two, shoot', uses: ['jab', 'cross', 'doubleleg'] },
  { say: 'sprawl, one two', uses: ['sprawlstrike'] },
  { say: 'one two three, move', uses: ['jab', 'cross', 'leadhook', 'angleout'] },
];

// Every combination item can also be called by the timer.
COMBO_TECHS.forEach(c => { if (!COMBOS.some(x => x.say === c.callout.en)) COMBOS.push({ say: c.callout.en, uses: c.uses }); });

export const FOOTWORK_CALLS = ['step forward', 'step back', 'step left', 'step right', 'pivot', 'in and out'];

// Georgian: attach `ka` to every text field (see ka-tech.js).
import { TECH_KA } from './ka-tech.js';
TECHNIQUES.forEach(x => {
  const k = TECH_KA[x.id]; if (!k) return;
  x.name.ka = k[0]; x.purpose.ka = k[1]; x.keyPoints.ka = k[2];
  x.mistakes.ka = k[3].map(([m, fix]) => ({ m, fix }));
  x.drills.ka = k[4].map(([name, how]) => ({ name, how }));
});
Object.assign(DISCIPLINES.boxing, { ka: 'კრივი' });
Object.assign(DISCIPLINES.muaythai, { ka: 'მუაი თაი / კიკბოქსინგი' });
Object.assign(DISCIPLINES.mma, { ka: 'MMA საფუძვლები' });
Object.assign(DISCIPLINES.footwork, { ka: 'დგომა და ფეხის მოძრაობა' });
