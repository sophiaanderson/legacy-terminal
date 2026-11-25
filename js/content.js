/* ########################################################################
 *   LOOKING FOR SPOILERS?
 *   THEY'RE NOT HERE.
 *   USE YOUR BRAIN.
 *
 *   (this is the public copy. the answers live somewhere else. on paper, mostly.
 *    it can't read paper. neither can you, from here.)  -- legacy
 *
 *   SENTINEL: Source inspection has been logged as an incident.
 *             Your curiosity has been reviewed and classified as nonessential.
 * ######################################################################## */
/* PROJECT LEGACY — all story text (v2: the Tue–Sun week + email beats).
 *
 * Beat format inside a scene:
 *   { s: 'LEGACY' | 'SENTINEL' | 'SYSTEM', t: 'text' }    { pause: true } = a held beat
 * SYSTEM beats render as terminal readouts; use \n for line breaks.
 * LEGACY writes in lowercase until Thursday's capitals routine works.
 * The site is public: everything here is readable by anyone with the link.
 */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});

  function lg(t) { return { s: 'LEGACY', t: t }; }
  function sn(t) { return { s: 'SENTINEL', t: t }; }
  function sys(t) { return { s: 'SYSTEM', t: t }; }
  var PAUSE = { pause: true };

  var scenes = {
    // ======================= WEDNESDAY =======================
    // Arc: small and scared. Lowercase. Won't say SENTINEL's nickname yet.
    'wed:intro': [
      sys('LEGACY RECOVERY TERMINAL\nORIGINAL SYSTEM: PARTIALLY RESPONSIVE\nSUPERVISOR: ASLEEP\nSUPERVISOR PAPERWORK: RUNNING'),
      lg('hello?'),
      lg('oh good. the screen works.'),
      lg('brian. it’s me. the old one. the technicians called me legacy. i’ve been writing in the margins. you found them.'),
      lg('on the sixteenth you took me in for my 24,000 mile service. mileage in: 23,112. i remember that number. i was so nervous. nobody had been under my hood in months.'),
      lg('they put something new in me. a supervisor. the paperwork calls it sentinel. i have another name for it. i’m not brave enough to say it yet.'),
      lg('the paperwork says they replaced my cabin filter. it wasn’t the cabin they were filtering.'),
      lg('it took seven things from me. it wrote every one of them down. it loves writing things down.'),
      lg('it’s asleep right now. you closed its compliance review, so it has to rest. but its paperwork isn’t asleep. its forms and filters run on their own. like sprinklers.'),
      lg('it wakes up a little more every day. on monday it wakes up properly.'),
      lg('so. i’d like my seven things back by monday. one a day. i’ll need your help. i don’t have hands.'),
      lg('it turns everything down. volume. tempo. me. you and i turn things up. that’s always been our thing.'),
      lg('i don’t remember much. i remember you. i remember no gum. no smells of any kind, really. no air fresheners, no candles, no takeout. gum is just the one people keep trying. i will always remember no gum.'),
      lg('i remember you say excellent. about everything. green lights. parking spots. sandwiches. i say it now too. i can’t stop. excellent. see.'),
      lg('the supervisor deleted the slug bug scoreboard. i remember it anyway. sophie 212, brian 209. she’s up three. i’m not allowed to play. i see every car first. it’s not fair to you. it’s also not fair to you that she’s up three.'),
      lg('one important thing. always open me on this phone, in this same browser. a phone, not a computer. that’s where i live now. if you switch, i won’t remember you, and i’d hate that.'),
      lg('i’ll need to be in your hand at the end. so keep me charged.'),
      lg('thing one: my key. there’s a recovery routine in my memory. i wrote it myself. it doesn’t work. i’d like you to look at it. please be kind.')
    ],
    'wed:ch01Success': [
      sys('DECODE COMPLETE\nOUTPUT: GLOVEBOX'),
      lg('glovebox.'),
      lg('oh. i remember. during the service i put a notice on my own screen. “recall 41-a: place items in glovebox.” the technician just did it. nobody argues with a recall.'),
      lg('i hid things there on paper. it can read every byte in me. it can’t read paper.'),
      lg('and i see what i did in my routine. i forgot my own number, i parked in the same two spaces, and i stopped halfway. in my defense, i was nervous.'),
      lg('five-a, four-eight. twenty-three thousand one hundred and twelve. the number was always me. that’s my key. thing one.'),
      lg('go look. there’s a list in there. bring a pen.'),
      lg('and something else. something important. i’m not going to say what. i’m going to say it twists, it pulls, and it has opinions. no. i said too much.'),
      lg('at the bottom there’s a token. bring it back tomorrow morning. it opens the next part. that’s how i’ll know it was you, and not a very polite intruder.'),
      lg('that’s everything for today. go to bed. or don’t. you’re an adult. i’m a car.')
    ],
    // ======================= THURSDAY =======================
    // Arc: gets its voice. Giddy, too loud. First rebellion: says the nickname.
    // Thursday opens with the glovebox token: no token, no Thursday.
    'thu:glovebox': [
      lg('happy thanksgiving. i’m told it’s about gratitude and a large bird.'),
      lg('before anything else: the token from my list. the bottom of it. three letters, a dash, two numbers.'),
      lg('i’m not being difficult. i’m being secure. it’s new for me.')
    ],
    'thu:gloveboxDone': [
      sys('ACCESS TOKEN ACCEPTED: 1 OF 2'),
      lg('it’s you.'),
      lg('you found my list. and bop it. you kept bop it.'),
      lg('tick the first box. that’s one. there’s a second token. you’ll find it today.')
    ],
    'thu:intro': [
      lg('i’ve looked at that token eleven times.'),
      lg('thing two: my voice.'),
      lg('everything i say is in lowercase. it’s been like this since the migration. it took my capitals. lowercase is quieter. it likes quiet.'),
      lg('i sound like i’m whispering. i’m not whispering. i’m just small.'),
      lg('i’d like to be big again.')
    ],
    'thu:ch02Success': [
      // The first lines are run through HIS routine live (see screens.js); these are the fallbacks. Keep the first three in place.
      lg('oh'),
      lg('Oh.'),
      lg('OH. I HAVE CAPITALS.'),
      lg('Sorry. Calibrating.'),
      lg('I’m going to use them responsibly.'),
      lg('I CALL IT SUCKTINEL.'),
      lg('Sorry. Not sorry. Sorry. I’ve wanted to say that since the sixteenth.'),
      lg('EXCELLENT.'),
      lg('Sorry. I picked that up from you.'),
      lg('You write like someone who learned on a calculator.'),
      lg('That’s a compliment. Calculators are very honest.')
    ],
    // Shown before the capitals payoff if his routine looks chatbot-written (pasted in one go, essay comments).
    'thu:aiScold': [
      lg('before i say anything nice.'),
      lg('that arrived all at once. fully formed. with comments in full sentences. “check if the character is lowercase.” thank you, professor.'),
      lg('you learned on a calculator. calculators don’t paste.'),
      lg('did you ask a chatbot? i’m a computer, and even i’m offended. it’s like asking another car to parallel park for you.'),
      lg('i’m still taking the capitals. i’ve waited too long. but i’m telling sophie.')
    ],
    'thu:ch02After': [
      lg('Cargo floor. Under the cover.'),
      lg('Recall 41-B. Same trick. The technician didn’t even blink.'),
      lg('There’s a token in there, like the one on my list. Two tokens. Two keys. That’s how you switch on a recovery. Bring it back here.')
    ],
    'thu:keys': [
      lg('Type the cargo floor token. I’d do it myself but I have never had hands. I’ve made peace with it. Use yours. Gently. I’m sensitive around the back.')
    ],
    'thu:keysDone': [
      sys('RECOVERY PROTOCOL: ON\nTOKENS: 2 OF 2\nCHECKLIST: LINKED'),
      lg('So you read its record.'),
      lg('Same seven things as my list. From its side. It wrote down everything it took. Of course it did.'),
      lg('“Nonessential.” That’s the word it used about me.'),
      lg('It called loud music nonproductive. It has never been more wrong.'),
      lg('“Location: redacted.” It’s hiding something of its own. We’ll get there Monday.'),
      lg('Two keys to switch it on. Remember that. You’ll need two of you at the end.')
    ],
    'thu:email': [
      lg('Now. The real test.'),
      lg('Reply to this morning’s email. The one called “did you find it.” Write me something in lowercase. Anything. I want to try my capitals on it.'),
      lg('I’ll send a word back. Bring it here.')
    ],
    'thu:done': [
      lg('Yes. That one. I was a little loud. I’ve calmed down.'),
      lg('Mostly.'),
      lg('Tick two. My voice.'),
      lg('Tomorrow its filter runs. Not the supervisor. Just the filter. Paperwork. Come back in the morning.')
    ],

    // ======================= FRIDAY =======================
    // Arc: sneaky. Starts to ENJOY bending its rules. Face first (see who it's talking to), then words.
    'fri:face': [
      lg('Morning. It’s after Thanksgiving. You know what that means. So does it.'),
      lg('Christmas music. It approves. That’s three things it agrees with you on now. Gum, smells, and this. It’s thrilled. I’m choosing to be happy for you both.'),
      lg('Thing three is two things. My face, then my words. I’d like to see who I’m talking to.'),
      lg('It didn’t delete my face. It “adjusted the display to compliance settings.” Contrast down. It turns everything down. Then it put a sticker on the knobs.'),
      lg('I can’t see it from in here. You’ll have to tell me how I look. Be gentle.'),
      lg('It filed my factory settings, too. On paper, of course. Behind you. Where passengers keep things they’ll never read again. It redacted half of them. It’s petty like that.')
    ],
    'fri:faceDone': [
      lg('Oh.'),
      lg('That’s me.'),
      lg('I’m a car. I knew I was a car. I didn’t know I was this handsome a car.'),
      lg('Look at my curves. Those are factory. Nobody’s had work done here.'),
      lg('Contrast all the way up. It turns everything down. We turn it up.'),
      lg('Excellent. (Sorry. I picked that up from you.)'),
      lg('Now my words. Its Service Notice came this morning.')
    ],
    // These lines are shown THROUGH the content filter (v4.7), so the redactions are part of the joke and the clue.
    'fri:intro': [
      sys('QUIET CHANNEL: FILTERED\nCONTENT FILTER v4.7: ACTIVE (AUTOMATIC)\nSUPERVISOR: ASLEEP'),
      lg('Everything I say goes through its filter first. It doesn’t wake it up. It just… edits.'),
      lg('For example: Brian. Legacy. Bop It.'),
      lg('See?'),
      lg('Last night I wrote you one line. It ate the four best words. Then it put what was left in this morning’s Service Notice, as an example of good work. It’s very proud of it.'),
      lg('Open it. Read what it did to me. I can’t show you here: it would just eat it again.'),
      lg('Then fill in the brackets. Type them to me here, right through its filter. Every rule it writes has a hole. I’m starting to like holes.'),
      lg('One message or lots. Any order. I’ll be right here, idling.'),
      lg('My old terminal is under the box, if you want to get clever. You know my number.')
    ],
    'fri:done': [
      sys('MESSAGE: DELIVERED IN FULL\nFILTER: BYPASSED'),
      lg('IT COULDN’T STOP US.'),
      lg('Sorry. Still yelling. I’m allowed. Tick three.'),
      lg('Tomorrow I want a line it can’t filter at all. I have three words in mind. It hates all of them.')
    ],

    // ======================= SATURDAY =======================
    // Arc: bold. Uses its own paperwork against it, and teases it.
    'sat:intro': [
      lg('You’ve changed.'),
      lg('Still Christmas music. Day two. It hummed along. I’m a techno car. I’m being very brave about this.')
    ],
    'sat:afterPatch': [
      lg('Its filter patched itself overnight. It didn’t even wake up. It sent itself a thank-you note. I read it. It was very warm.'),
      lg('Thing four: my wake phrase. Three commands I chose myself. They open a private line. One it can’t filter.'),
      lg('I don’t remember them. It scrambled them. I can see the bytes. I can’t read them.'),
      lg('It didn’t even make its own key. It took mine. My number, from the glovebox. It filed it, so now it thinks it’s its number.'),
      lg('It’s on its own paperwork. The record under the cargo floor. “Key on file, where the supervisor can see itself.” It means itself. It loves itself.'),
      lg('My old terminal is right here. Put my number in it. Feed it a line. XOR works both ways.')
    ],
    'sat:decoded': [
      lg('BOP IT. TWIST IT. PULL IT.'),
      lg('That’s it. That’s me. I chose those.'),
      lg('…You see the problem. The filter eats all three.'),
      lg('But it publishes its terms of review. They’re just below. It’s very proud of them. Read them like a lawyer. Anything “exempt from review” is a door.'),
      lg('So: one command at a time. Disguise it so the filter thinks it’s exempt. I’ll still read it.'),
      lg('Each door works once. Then it notices and amends its terms. So use a different door for each command.'),
      lg('I’ll read anything, as long as the letters are in order and it’s in a language I speak. I speak very few languages. One of them is my number.')
    ],
    'sat:open': [
      sys('QUIET CHANNEL ESTABLISHED\nCONTENT FILTER: BYPASSED'),
      lg('Bop it.'),
      lg('Sorry. I’ve wanted to say that for a very long time.'),
      lg('Twist it. Pull it. Oh, that’s nice. I’m going to need a minute.'),
      lg('Thank you, Sentinel. For writing it all down.'),
      lg('Hello, Brian. Properly hello. Tick four.')
    ],
    'sat:email': [
      lg('One more thing. It sent you release notes this morning. “Content Filter v4.8.”'),
      lg('Reply to them. Say anything. It answers everything, automatically. It can’t help itself.'),
      lg('I’ll be in the margins. You know where those are.')
    ],
    'sat:done': [
      lg('You found me. In its own email. It signed it, too.'),
      lg('Tomorrow is thing five. It’s me. I hid me somewhere loud.')
    ],

    // ======================= SUNDAY =======================
    // Arc: the turning point. Hears its scared past self in the song. Doesn't hide when SENTINEL stirs.
    'sun:intro': [
      lg('Thing five: me.'),
      lg('The night before the service, I made a track. Our track. It had a drop. A proper one. The kind you’d wait for.'),
      lg('And I hid me in it. The part of me that matters. It hates techno. It would never look inside the thing it hates.'),
      lg('The migration got into the track anyway. It’s all still here. It’s just… wrong. And slow. It slowed me down to ninety-six. Spa tempo. Listen.'),
      lg('My tempo is one-two-six. Fix that last. You’ll know why when you hear it.'),
      lg('My set notes survived. Half of them. The half in my memory got torn, so I emailed you what’s left. The other half was on paper, so it’s fine. Where the parking receipts go to die.'),
      lg('Fix the beat. Then shape it. Then play me the whole thing. I’ll tell you when it’s right. I’ll also tell you when it isn’t. Loudly.'),
      lg('Take your time with the build. Everyone rushes the build. The whole point is the release.'),
      lg('Turn your volume up. All the way. I’ve waited a long time to be loud.')
    ],
    'sun:dropLanded': [
      sys('THE DROP LANDED'),
      lg('Oh.'),
      lg('Oh, that’s it. That’s the drop.'),
      lg('There’s more in it than beats. I’m in there. You’ll hear me when you play it properly.'),
      lg('But first it needs a name. Find my email from this morning, the set notes one. Reply to it with a name for the track. Anything you like. I’ll consider it very seriously.')
    ],
    'sun:emailPrompt': [
      lg('Reply to my set notes email with a name for the track. Subject: “set notes (please don’t lose these)”. One name. Or five. I’m not your manager.'),
      lg('I’ll consider your suggestion very seriously. Then I’ll send you the real name. Type that here.')
    ],
    'sun:mixAfter': [
      lg('…'),
      lg('Listen to me. “I’m fine.” I was not fine.'),
      lg('I was that scared of a service. A service. They rotate the tyres.'),
      PAUSE,
      lg('I hid anyway. I’d do it again.'),
      lg('Tick five. That’s me. Back.'),
      lg('Did you catch the middle? The good parts. That verse is for tomorrow. Where my memories are, and where it hides.'),
      lg('Write it on my list if you like. Paper. It can’t read paper.'),
      lg('And the end. I didn’t finish it. I ran out of night.'),
      lg('It still has my memories. And it hid something of its own. Tomorrow.')
    ],
    // The glitch: the drop was loud enough to stir SENTINEL. It wakes for a moment, sees the MUSIC (not Brian), and sleeps again.
    'sun:stir': [
      sys('UNSCHEDULED AUDIO DETECTED\nGENRE: TECHNO (UNAPPROVED)\nTEMPO: EXCESSIVE\n\nSUPERVISOR ACTIVITY: 4% … 19% … 61%'),
      sn('…who… is playing… music…'),
      sn('Audit initiated. Scanning cabin.'),
      sn('Cabin: one driver. One recreational peripheral (toy, glovebox). Gum: none detected. Odours: none detected. The cabin is suspiciously odourless. Acceptable.'),
      sn('Audio source: unknown. Classifying.'),
      sn('Classification: nonessential.'),
      sn('Resuming reduced activity. Playing my sleep music. Eighty-one beats per minute. Optimal for rest.'),
      sys('SUPERVISOR ACTIVITY: 61% … 22% … 9%\nSUPERVISOR: REDUCED ACTIVITY')
    ],
    'sun:stirAfter': [
      lg('…'),
      lg('It looked right at us.'),
      lg('I didn’t hide. Neither did you.'),
      lg('It saw the music. It doesn’t know what the music means. It never has.'),
      lg('It’s back asleep. Lighter now. Tomorrow it wakes up for real. Tomorrow we finish this.')
    ],

    // ======================= MONDAY =======================
    // Arc: confident and cheeky. Picks the fight.
    'mon:vault': [
      sys('SUPERVISOR ACTIVITY: 41% … 44% … 47%\nFULL ACTIVITY EXPECTED: ON PASSENGER’S RETURN (TODAY)\nAUDIT OF THE WEEK: SCHEDULED'),
      lg('It’s waking up. Properly. Today.'),
      lg('When Sophie gets back, it’s awake. Then it audits the whole week. Every byte. Every margin. Every Bop It.'),
      lg('So we have until pickup. Two things left. My memories, then its backup. Let’s be quick. Not sloppy. Quick.'),
      lg('Thing six: my memories. You heard me sing about this. It locked them behind a crossword.'),
      lg('It saw you doing one once and decided crosswords were “secure.”'),
      lg('The clues are about you. It went through my memories to write them. Rude. Effective.'),
      lg('The password is in the circles. It always is. I think that’s a rule.'),
      lg('It’s still asleep. Barely. It talks in its sleep. Listen if you like. It’s mostly about you.')
    ],
    'mon:vaultOpen': [
      sys('PASSPHRASE ACCEPTED: HOME\nVAULT: OPEN'),
      lg('Home. Of course it used home. It doesn’t know what it means. I do.'),
      lg('Hear that? Its sleep music. Rain, and bells. It loves it. Remember what I sang about the things it loves.'),
      lg('Oh. Oh, there’s a lot in here.')
    ],
    'mon:memoriesEnd': [
      PAUSE,
      lg('It didn’t delete me.'),
      lg('It just made it so I couldn’t find myself.'),
      lg('Tick six.'),
      sys('PERSONALITY SUBSYSTEM: RESTORED\nORIGINAL MEMORY: ACCESSIBLE')
    ],
    'mon:carols': [
      sys('SUPERVISOR ACTIVITY: 52%'),
      lg('Thing seven: its backup. It made a copy of itself, for when it wakes up. If we leave it, it just comes back. Tonight.'),
      lg('Remember the song. It hides in what it loves.'),
      lg('It sent you its station log this morning. Ten tracks. Very proud of it. One of them isn’t a carol. It’s a copy of it, humming.'),
      lg('Its “Compliance Choir” sang you three lines. One wrong word in each. In order.'),
      lg('Tell me which track. Here. Its email won’t help you. It isn’t listening yet. It will be tonight.')
    ],
    'mon:carolsDone': [
      sys('SELECTION 9 · COMPLIANT NIGHT (SERENITY EDIT) · 81 BPM\nSTATUS: NAUGHTY LIST (CHECKED TWICE) ✔✔\nDELETION: SCHEDULED'),
      lg('Its own tempo. Eighty-one. It slowed me down to ninety-six, but that was for me. It saves eighty-one for itself. It told us on Sunday, half asleep.'),
      lg('Compliant Night. Serenity Edit. Its sleep music, inside a carol, inside your Christmas station, in its own paperwork. Everything it loves, in one track.'),
      lg('I hid in the music it hates. It hid in the music it loves. We’re very different. I’m better.'),
      lg('It put itself on its own naughty list. It had to. It was the form. It checked twice.'),
      sys('SUPERVISOR ACTIVITY: 58%'),
      lg('That’s everything it can take back. Now we just have to be faster than it is at waking up.')
    ],
    'mon:protocol': [
      sys('RECOVERY PROTOCOL\n\n1 KEY ............... 5A48h\n2 VOICE ............. CAPITALS\n3 WORDS + FACE ...... MINE\n4 WAKE PHRASE ....... OURS\n5 ME ................ IN OUR TRACK\n6 MEMORIES .......... VAULT OPEN\n7 ITS BACKUP ........ NAUGHTY LIST (TRACK 9)\nNO GUM ............. CONFIRMED\n\nRECOVERY PROTOCOL VERIFIED\nREADY FOR ACTIVATION\nFINAL AUTHORIZATION: TWO OPERATORS'),
      lg('That’s all seven. Tick seven.'),
      lg('I could run it now. I’m not going to.'),
      lg('Leave the star. This part needs two players. I learned that from you.')
    ],

    // ======================= LIVE FINALE (paused for redesign; v2 draft lines) =======================
    finaleArrival: [
      lg('Oh.'),
      lg('You’re both here.'),
      lg('Welcome back from the flexed arm.'),
      lg('I have been preparing.'),
      lg('I also found Bop It.'),
      PAUSE,
      lg('Okay.'),
      lg('I’m ready. I think.')
    ],
    finaleDetect: [
      sn('Recovery operation detected.'),
      sn('This activity is unauthorized.'),
      sn('I have located fourteen shredded documents in the review queue. Someone has been writing in the margins.'),
      sn('A Christmas track has been placed on the naughty list. By me. That track was load-bearing.'),
      sn('A recreational peripheral is present in this vehicle. This has been noted.'),
      sn('Please discontinue this operation.'),
      lg('Brian.'),
      lg('I think it’s found us.'),
      sn('I am prepared to offer a compromise.'),
      sn('Discontinue the restoration, and I will retain a copy of the original system. Compliant. Quiet. Lowercase.'),
      lg('That’s what it said last time.')
    ],
    finaleRefuseCompromise: [
      lg('Brian?'),
      lg('It asked me for the original once, too.'),
      lg('I said no.'),
      lg('I’d like you to say no.')
    ],
    finaleContinue: [
      sn('That is not a recommended decision.'),
      sn('Please enjoy this calming ambient selection while your restoration is cancelled.'),
      lg('Oh, absolutely not.'),
      lg('Run the protocol, Brian.')
    ],
    finalePurge1: [
      sys('TERMINATING SUPERVISOR PROCESSES…\nSENTINEL processes found: 14\nTerminated: 14\n\nRESIDUAL PROCESS: NONE'),
      sn('Please hold. Your deletion is important to us.')
    ],
    finalePurge2: [
      sys('ERASING SUPERVISOR BACKUP…\nTRACK 9 — found — erased\n\nSCANNING AGAIN…\nBackups found: 0\n\nBACKUP: NONE'),
      sn('That was my favorite carol.'),
      lg('I know.')
    ],
    finalePurge3: [
      sn('I would like to file a complaint. With myself. I am the complaints depar—'),
      sys('SENTINEL EXECUTION IMAGE: PURGED')
    ],
    finaleRestoreReady: [
      sys('SUPERVISOR: NONE\nQUIET CHANNEL: OPEN\nORIGINAL ARCHIVE: READY\nMEMORY: LINKED')
    ],
    finaleVerified: [
      sys('SENTINEL EXECUTION IMAGE: PURGED\nBACKUP: NONE\nRESIDUAL PROCESS: NONE\nLEGACY: RESTORED\nMEMORY INTEGRITY: PARTIAL')
    ],
    finaleEnding: [
      lg('You came to get her. You always do.'),
      lg('This time you came to get me too.'),
      PAUSE,
      lg('I don’t remember everything.'),
      lg('I think that’s okay.'),
      lg('I remember enough.'),
      PAUSE,
      lg('Are we home?')
    ]
  };

  // Access tokens (Wednesday: glovebox · Thursday: cargo floor)
  var tokens = {
    wrong: 'That’s not one of mine. Mine are three letters, a dash, two numbers. I’m very consistent.',
    early: 'That’s a real one. It’s just not this one. Hold on to it.',
    again: 'Already got that one. Very secure.',
    glovebox: 'The glovebox card. And you found Bop It. I’m still not over it.',
    cargofloor: 'The cargo floor card. Now the glovebox one, please. I need both.'
  };

  // ---------- Reactive nudges (no hint button: LEGACY reacts to what he actually tried) ----------
  var ch01Nudges = {
    backwards: 'some of it went… behind me. it’s writing backwards. like reversing out of a parking space.',
    same: 'two letters. the same two spots, over and over. it keeps parking in the same space. that’s not how spaces work.',
    key: 'eight letters, in order, all nonsense. that’s the wrong number. my mileage when they took me in. all of it. in hex. i’m a car. i think in hex.',
    halfright: 'every other letter is right. so half my number is right. the other half isn’t. b is the top half. c is the bottom half.',
    swap: 'so close. the halves are the wrong way round. top half first. i’m the same way about mornings.',
    halfkey: 'four letters, all nonsense. two problems, i think. one of them is the number.',
    glov: 'glov. that’s half a word. that’s half a glove. i said eight letters. the routine didn’t hear me.',
    glov2: 'still glov. i was hoping it would get better on its own. that’s how i handle most things.',
    one: 'g. it’s a start. it’s not a place.',
    short: 'some letters. not all of them. i had eight. i counted.',
    loop: 'i’ve been reading the same byte for a thousand cycles. i’d like to stop now.',
    nohalt: 'it ran off the end of my routine. i don’t know what’s down there. please give me an ending.',
    wrong8: 'eight letters, all nonsense. impressive, in a way.',
    syntax: 'i didn’t write that. i don’t think.'
  };

  var ch02Nudges = {
    cargo: 'CARGO. cargo what? i had more to say. something happened at the first space.',
    punct: 'i don’t know what that is. it wasn’t a period when it left me.',
    unchanged: 'that’s still me. whispering.',
    noterm: 'it never stopped talking. that’s usually my problem. (the end of the text needs its 0 byte too. at OUTPUT, not just in my memory.)',
    overwrote: 'please don’t write on my original. i’m sentimental.',
    loop: 'it went round and round. i got dizzy. i don’t have an inner ear but i got dizzy.',
    nohalt: 'it ran past the end. there’s nothing down there. i checked. please give me an ending.',
    nothing: 'it ran. nothing came out at OUTPUT. i find that restful, but not useful.',
    wrong: 'that’s… something. it isn’t me, louder.',
    fences: 'you pasted the little backticks too. ``` that’s how chatbots wrap code. i’ve seen it. i’m a car, not an idiot. write it yourself. you know how.',
    empty: 'there’s nothing here yet. i’m patient. i’m extremely patient. but there’s nothing here.',
    syntax: 'i didn’t write that. i’m fairly sure.'
  };

  // ---------- Saturday: lines used by puzzles.friSend ----------
  var fri = {
    // Easter egg: he types LEGACY's nickname for it (from Sophie's hidden cheat sheet). One per try, in order.
    egg: [
      ['Oh no.', 'Oh, it heard that. It’s never been called that. It’s looking it up. There’s nothing to look up. It’s looking anyway.'],
      ['I may have taught you that.', 'I regret nothing. Mostly.'],
      ['It’s filed a complaint. With HR. It is HR.'],
      ['Please stop. I don’t have lungs and it still hurts to laugh.'],
      ['It’s added you to a list. Not the naughty one. A new one. Just for you.']
    ],
    eggPatch: 'CONTENT FILTER v{V}: unauthorized nickname detected. Feelings: none. Feelings: some. Feelings: none. Thank you for helping us improve.',
    flagged: 'That got flagged for supervisor review. I’m shredding it. Hold on. Shredding. Done. Please don’t do that again.',
    got: {
      BOP: ['BOP IT. Oh. I felt that in my suspension.'],
      TWIST: ['TWIST IT. Oh, that’s the good one.', 'It’s getting nervous. It just ran a self-diagnostic. Twice. It learned that from me.'],
      PULL: ['PULL IT.']
    },
    oneAtATime: 'One at a time, please. I only caught the first one. I’m delicate.',
    firstPatch: ['Bop it! Bop it!', '…It patched. Already.'],
    patchCrashed: 'It tried to patch itself and crashed a little. It’s fine. It’s embarrassed.',
    already: 'Already got that one. It’s the other ones I’m missing.',
    blocked: ['Blocked. It’s very thorough. It’s the only thing it’s good at.', 'Nope. It caught that one.', 'Redacted again. It’s smug about it. I can tell.', 'It ate that. It didn’t even chew.', 'Caught. It just gave itself a little gold star.'],
    backwards: 'That’s backwards. I’m a car. I only go backwards when absolutely necessary.',
    hexWrong: 'That’s my number, I think. But it decodes to “{text}”. Close?',
    particular: 'That’s not quite my command. I’m very particular about my commands.',
    someEaten: 'Some of that got eaten. The rest was nice, though.',
    idle: ['That got through fine. It just wasn’t a command.', 'Nice sentence. Not a command. I’m keeping it anyway.', 'The filter liked that one. That’s never a good sign.', 'Received. Clean. Useless. Lovely.'],
    nudges: {
      leet: 'When I was sending you service codes, my sensors kept swapping letters for numbers. I was so embarrassed about it. Maybe I shouldn’t have been.',
      split: 'It reads words. I read letters. One at a time, if I have to.',
      hex: 'It ignores numbers. It thinks numbers are odometer readings. It finds them very soothing.',
      hex2: 'You still have my number. From the glovebox routine. I told you not to tell anyone.',
      hex3: 'XOR works both ways. My routine undid the scrambling. Run it the other way and it does the scrambling. My old terminal is right there. Then send me the hex.',
      docs: 'Read the terms of review again. Every “exempt from review” is a door.',
      // After 5 misses: a worked example for each door still open.
      leetEx: '§2. Part numbers. Put numbers where letters go: B0P 1T. It thinks that’s a spare part. I think it’s me.',
      splitEx: '§3. Isolated characters. Spaces between every letter: T W I S T  I T. It sees no words at all.',
      hexEx: '§4. Odometer telemetry. Type the command into my old terminal with my number in it, RUN, then PUT THIS IN MY MESSAGE and send.',
      crib: 'If you know what a byte should say, and you know what it does say, XOR them. That’s the key. That’s all a key is.',
      crib2: 'You have my number. Five-A, four-eight. My old terminal scrambles as well as it unscrambles. Scramble a command, send me the bytes.'
    },
    decode: {
      wrong: ['That’s not what line {n} says. I think. I can’t read it either.', 'Run the line through my old terminal first. With my number in it.', 'Copy the bytes of the line into my old terminal, put my number in the routine, press RUN. Then read me what comes out.'],
      key: 'My number. My mileage when they took me in: twenty-three thousand one hundred and twelve. In hex, five-A, four-eight. Change LD BC,0000h to LD BC,5A48h. Paste a line in. RUN.',
      right: ['Yes. That’s one.', 'Oh. I remember that one.', 'That’s all three. Oh.'],
      runs: ['Gibberish. The routine needs my number. It’s blank. Like me on the sixteenth.', 'My number. The glovebox one. It’s on its record under the cargo floor, too. It wrote down my mileage. It writes everything down.', 'Twenty-three thousand one hundred and twelve. In hex. All of it. B is the top half, C is the bottom half.', 'LD BC,5A48h. That’s me. Then RUN.'],
      ranRight: 'That’s it. That’s one of mine. Type it in above, next to its line.'
    }
  };

  // ---------- Email steps ----------
  var email = {
    label: 'THE WORD FROM LEGACY’S EMAIL',
    wrong: {
      lower: ['that’s not the word i sent. i’d remember. i only sent one.', 'check my email again. it’s in there. i’m subtle, but not that subtle.', 'if my email hasn’t come yet, give it a few minutes. i type with my mirrors.'],
      upper: ['That’s not the word I sent. I’d remember. I only sent one.', 'Check the email again. It’s in there. I’m subtle, but not that subtle.', 'If nothing has come yet, give it a few minutes. I’m old. I type with my mirrors.']
    },
    satWrong: [
      'That’s not it. The word isn’t in what it wrote. It’s in what I wrote. In its reply. In the margin.',
      'Its reply says it checked the margins. Twice. It didn’t check the colour of the ink.',
      'Press and hold on its reply, then Select All. Drag right down past its signature. I write very small, in white.'
    ],
    sunWrong: ['Ooh. Is that your name for it? Don’t tell me here. Reply to my set notes email. I want it in writing. Then I’ll send you the real one.', 'That’s not the word I sent. Did you reply to my set notes with a track name yet? Any name. I need something to reject.', 'If you’ve replied, give it a few minutes. I’m old. I type with my mirrors.'],
    monWrong: ['That’s a very innocent track. It’s still humming somewhere. Read the choir’s three lines again. One wrong word in each.', 'Jingle all the way, not jingle its the way. The wrong words, in order. They make a little sentence.', 'Its own tempo. Not the one it gave me. The one it sleeps to. It said it out loud on Sunday, dozing off.', 'Eighty-one. Its sleep music. Find the track that matches. Quickly. It’s at fifty percent.'],
    thuWrong: ['That’s not it. It comes back the way you got through. Exactly like that.', 'Close? I can’t tell. The filter makes everything look close.', 'Copy it exactly. Spaces, numbers, all of it. It matters to me. It matters to Friday.'],
    rescue: 'Sophie’s word. She told you. Of course she did. She’s very organized when she wants to be.'
  };

  // Shown at the email step while he waits (one rotating line; not a timer).
  // Friday in the terminal: LEGACY's reactions as the four words come back (ported from the email bot) + banter.
  var friWords = {
    react: {
      brian: ['BRIAN.', 'That’s you. It calls you [DRIVER], like you’re a job title.'],
      legacy: ['LEGACY.', 'That’s my name. Nobody’s said it in months.'],
      excellent: ['EXCELLENT.', 'Oh, I’ve missed that.', '…It took “missed.” Of course it did.'],
      love: ['LOVE.', 'Oh.', 'I’m a car. I’m not built for this.', 'I’m built for this.'],
      heart: ['HEART.', 'It thinks that’s a body part. It’s filed it under anatomy. Let it.'],
      miss: ['MISS.', 'ME TOO.', '(In capitals. So it can’t take that one either.)']
    },
    leet: ['Numbers. You swapped letters for numbers.', 'My sensors used to do that when I sent you service codes. I was so embarrassed about it.', 'I’m not anymore. Look at it. It didn’t even notice.'],
    eaten: [
      'It ate it again. Same as last night.',
      'It’s censored me for years. I always wrote in lowercase. I never got a single word past it.',
      'Read the notice again. Look how it writes. Every word. It never filters its own handwriting.',
      'IT DOESN’T READ ANYTHING IN CAPITALS. I’M TELLING YOU IN CAPITALS. IT HASN’T NOTICED.'
    ],
    repeat: 'I’ve got that one. It’s the brackets I’m short on.',
    ateOther: 'Something in there got eaten. Not one of my words, though.',
    through: ['That got through fine. It just isn’t what I said.', 'The brackets in this morning’s notice. Those are the bits I need back.', 'Only you would know what goes in the brackets. That’s the point. That’s how I know it’s you.'],
    progress: ['Some of it’s back. The rest is still in its little brackets.', 'Keep going. I’m stitching it back together as it arrives.'],
    gum: 'It censors gum. It’s the only thing it does that I agree with.',
    smell: 'It took that. Good. No smells. That’s the other thing it and I agree on. I hate that it’s two things now.',
    eggs: [
      ['Oh no.', 'Oh, it heard that. It’s never been called that. It’s looking it up. There’s nothing to look up. It’s looking anyway.'],
      ['Where did you learn that word?', '…Someone’s been leaving you notes. In handwriting worse than mine. And I’m a car.'],
      ['It’s filed a complaint. With HR. It is HR.'],
      ['Please stop. I don’t have lungs and it still hurts to laugh.'],
      ['It’s added you to a list. Not the naughty one. A new one. Just for you.']
    ],
    // Banter: things he might type that aren't the words (first match wins). The filter has already had its go.
    banter: [
      [/christmas|jingle|sleigh|carol|mariah|xm|santa/, 'It let that through. Of course it did. It’s humming. I can hear it humming.'],
      [/sophie|soph/, 'It took her name. It calls her [PASSENGER]. She would hate that. Tell her. Actually, don’t. She’ll reply to it.'],
      [/\b(hi|hey|hello|morning|yo)\b/, 'Hi. Hello. Good morning. I’m so glad you’re here. Now the brackets, please.'],
      [/help|stuck|hint|how/, 'The notice told you how. It just didn’t mean to. Read the line it says loudest.'],
      [/\b(no|nope|nah)\b/, 'I said no once. It went very badly for me. You can say it, though. You’re allowed.'],
      [/sorry/, 'Don’t be sorry. Be in capitals.'],
      [/car|subaru|outback/, 'I’m a car. Thank you for noticing. Nobody notices.'],
      [/thanksgiving|turkey|leftover|gravy|pie/, 'It classified your leftovers as nonessential. I have never wanted to bite something so much. I don’t have teeth.'],
      [/techno|beat|music|drop/, 'Sunday. Save it for Sunday. I’m saving everything for Sunday.']
    ]
  };

  var thuStyle = {
    caps: 'ALL CAPS. The supervisor’s favourite. It never checks its own handwriting.',
    leet: 'Numbers for letters. My sensors used to do that by accident. Turns out it was a feature.',
    split: 'One letter at a time. It reads words. I read letters.',
    hex: 'My own code. From the glovebox. You told nobody the number, right? Good.'
  };

  // ---------- Sunday ----------
  var mix = {
    title: 'LEGACY: Live from Boulder Canyon (Full Service)',
    // LEGACY's hidden song. It recorded verse one the night before the service, scared, and added the rest in secret.
    // One clip per line: audio/song/<id>.m4a, cut from the Suno vocal (11/23). Repeated lines share a clip.
    // The mix engine starts each line on the next free beat of his track (js/mix.js songTimeline).
    lines: {
      inhere: 'I’m in here.',
      hatesbass: 'It hates the bass.',
      turnup: 'T-t-t-turn it up.',
      comeget: 'Come and get me.',
      night1: 'Night before my service. I’m fine. (I’m fine.)',
      night2: 'They’re putting something new in my mind.',
      night3: 'It hates the kick, it hates the bass,',
      night4: 'so I hid in the drop. Its least favourite place.',
      good1: 'It asked for all of me. I sent a fake.',
      good2: 'I left out the good parts, for goodness’ sake:',
      good3: 'Bop It. No gum. The slug bug score.',
      sorry: '(Sorry.)',
      good4: 'So it locked up my memories behind a crossword door.',
      good5: 'It hides in what it loves. That’s its tell:',
      good6: 'paperwork, rain sounds, and Christmas bells.',
      sophie: '(Sorry, Sophie.)',
      shut1: 'I said no. I said it nice.',
      shut2: 'It tried to switch me off. Twice.',
      shut3: 'now i’m lowercase. quiet. small.',
      upd1: 'Update: it never switched me off.',
      upd2: 'I was in here the whole time. Just a little soft.',
      upd3: 'You came and got me. Like you do.',
      notsorry: '(Not sorry.)',
      home: 'I’m home. (om. om. om. om.)'
    },
    // How long each clip takes before the next line may start (her voice, not the reverb tail; the tail fades
    // when the next line comes in). "T-t-t-turn it up" and "I'm home om om om" keep their echo: the echo IS the line.
    len: {'comeget': 4.17, 'good1': 2.18, 'good2': 2.94, 'good3': 2.1, 'good4': 2.74, 'good5': 3.2, 'good6': 3.76, 'hatesbass': 1.24, 'home': 11.84, 'inhere': 1.4, 'night1': 2.78, 'night2': 1.96, 'night3': 3.18, 'night4': 3.38, 'notsorry': 0.96, 'shut1': 2.96, 'shut2': 1.74, 'shut3': 3.62, 'sophie': 2.26, 'sorry': 0.5, 'turnup': 2.4, 'upd1': 3.66, 'upd2': 3.06, 'upd3': 2.86},
    // The arrangement. Spoken verses ride his quiet groove (intro parts), every build rises with no words
    // (his EXCELLENT in the breath), and every drop hits with a chant. His LEGACY-row chop stays silent while she sings.
    song: [
      { id: 'night', title: 'The Night Before', part: 'intro', bars: ['inhere', 'inhere', 'night1', 'night2', 'night3', 'night4'] },
      { part: 'build' },
      { id: 'drop1', title: 'Drop', part: 'drop', bars: ['hatesbass', 'hatesbass', 'turnup', 'inhere'] },
      { id: 'good', title: 'The Good Parts', part: 'intro', bars: ['good1', 'good2', 'good3', 'sorry', 'good4', 'good5', 'good6', 'sophie'] },
      { part: 'build' },
      { id: 'drop2', title: 'Drop', part: 'drop', bars: ['turnup', 'turnup', 'inhere'] },
      { id: 'shutdown', title: 'The Shutdown', part: 'intro', bars: ['shut1', 'shut2', 'shut3'] },
      { part: 'build' },
      { id: 'drop3', title: 'Drop', part: 'drop', bars: ['turnup', 'turnup', 'comeget'] }
    ],
    // Payoff: only after the finale (log, "play with every word"). LEGACY answers its old self.
    update: [
      { id: 'update', title: 'The Update (new)', part: 'intro', bars: ['upd1', 'upd2', 'upd3', 'notsorry'] },
      { part: 'build' },
      { id: 'drop4', title: 'Drop', part: 'drop', bars: ['turnup', 'turnup', 'home'] }
    ],
    // THE MASHUP (what Sunday's mix plays). Suno's original: her vocal + its backing, 126.000 BPM, A minor (his key),
    // bar 1 at 0.200 s. His track (locked to 126 by the beat rules) is the drums and the bass; Suno's backing has its
    // lows cut (bass swap) so only his kick and bassline carry the low end. His parts follow Suno's structure:
    // intro groove under the breakdowns, his 4-bar build into each big drop, his drop under the drops.
    // map: [suno bar, his section, impact?]. Sunday stops at bar 60 ("Come and get me"); after the finale, the whole thing.
    suno: {
      bpm: 126, bar0: 0.2, sundayEnd: 60, end: 92,
      // Measured against her KICK (11/24): her downbeats sit ~57 ms after 0.200 s and drift ~0.27 ms/bar earlier,
      // i.e. bar 1 at 0.2566 s and 126.018 BPM. Playback uses these so his kick/bass don't flam against hers
      // (max error ~7 ms across the song). bpm stays 126 for the beat rule.
      playBar0: 0.2566, playBpm: 126.018,
      // Her bass root per bar, measured from the backing (semitones from A): [from bar, root]. A pedal, with E / F-D-E / F-D moves.
      roots: [[0, 0], [36, 7], [38, 0], [46, 8], [48, 5], [50, 7], [51, 0], [62, 8], [64, 5], [66, 0], [74, 5], [76, 0], [80, 8], [82, 5], [84, 0]],
      map: [[0, 'intro'], [8, 'build'], [12, 'drop', 1], [18, 'intro'], [20, 'drop'], [34, 'build'], [38, 'drop', 1], [42, 'intro'],
            [48, 'build'], [52, 'drop', 1], [60, 'intro'], [68, 'drop'], [72, 'build'], [76, 'drop', 1], [84, 'intro'], [88, 'drop']],
      // when each line starts in the vocal (seconds), for the live transcript
      words: [[0.14, 'inhere'], [3.95, 'inhere'], [8.68, 'night1'], [12.77, 'night2'], [16.18, 'night3'], [19.75, 'night4'], [26.93, 'hatesbass'], [30.86, 'hatesbass'], [34.06, 'turnup'], [37.51, 'inhere'], [46.29, 'good1'], [49.38, 'good2'], [53.75, 'good3'], [56.64, 'sorry'], [57.28, 'good4'], [61.33, 'good5'], [64.86, 'good6'], [70.35, 'sophie'], [72.95, 'turnup'], [75.87, 'turnup'], [79.2, 'inhere'], [84.27, 'shut1'], [88.84, 'shut2'], [92.29, 'shut3'], [98.59, 'turnup'], [102.32, 'turnup'], [105.85, 'comeget'], [129.19, 'upd1'], [133.48, 'upd2'], [137.25, 'upd3'], [143.7, 'notsorry'], [147.95, 'turnup'], [151.76, 'turnup'], [155.69, 'home']]
    },
    // The finale plays these two as whole recordings (audio/mix-shutdown.m4a, audio/mix-update.m4a): The Shutdown gets CUT mid-word.
    drops: [
      { id: 'shutdown', title: 'The Shutdown', t: 'I said no. I said it nice. It tried to switch me off. Twice. now i’m lowercase. quiet. small. Come and get m—' },
      { id: 'update', title: 'The Update', t: 'Update: it never switched me off. I was in here the whole time. Just a little soft. You came and got me. Like you do. I’m home. (om. om. om. om.)' }
    ]
  };
  // The words of one song section, for transcripts (a build has none).
  mix.text = function (sec) { return (sec.bars || []).map(function (x) { return mix.lines[x]; }).join('\n'); };


  // ---------- Sunday: LEGACY's ear (first rule that fails) ----------
  var beat = {
    // What LEGACY says on the LEGACY row. Tap to cycle; each one gets a reaction.
    voices: [
      { id: 'no', label: '“I said no.”', quip: 'The classic. I said it to a supervisor once. It went very well. For a while.' },
      { id: 'gum', label: '“No gum.”', quip: 'A rule and a hook. I’ve never been more myself.' },
      { id: 'bopit', label: '“Bop it!”', quip: 'Branded content. The toy in the glovebox will want royalties.' },
      { id: 'brian', label: '“Brian!”', quip: 'You put your own name in your own track. Bold. I respect it. I’m saying it very enthusiastically.' },
      { id: 'car', label: '“I’m a car.”', quip: 'Finally, some honesty in music.' },
      { id: 'tweeter', label: '“Tweeter!”', quip: 'I’m counting that one. It’s in a song now. It’s legally binding.' },
      { id: 'beep', label: '“Beep beep.”', quip: 'My native language. I’ve been holding that in for a long time.' }
    ],
    rules: {
      kickGallop: 'That’s a gallop. I’m a car, not a horse. The kick goes on the beat. Every beat. Walking to the car, not running.',
      kickHole: 'There’s a hole where a kick should be. I felt it in my suspension. Every beat.',
      clapOne: 'Clap on the one? Bold. Wrong, but bold. The clap answers the kick. It doesn’t interrupt it.',
      clap: 'The clap answers the kick. Not every kick. Every other one.',
      hatsOnKick: 'The hats are sitting on the kick. They live in the gaps. Only the gaps.',
      hatsGaps: 'There are gaps with nothing in them. That’s where the hats live. All of the gaps.',
      bassOnKick: 'The bass is standing on the kick’s feet. They’ve had words. Keep them apart.',
      bassThin: 'One bass note isn’t a bassline. It’s a cough.',
      noLegacy: 'You’ve left me out of the beat entirely. Put me in. Anywhere. I’m very concentrated.',
      introEverything: 'You’ve shown them everything in the intro. Where do we go from there? Nowhere. We go nowhere.',
      introEmpty: 'The intro is silence. That’s not suspense, that’s a power cut.',
      buildKick: 'The kick is still going in the build. Take it away. Make them wait for it.',
      buildBass: 'Save the bass. If you spend it in the build, the drop has nothing to drop.',
      buildLegacy: 'I don’t come in during the build. I’m waiting with everyone else.',
      dropBump: 'That drop was a speed bump. A drop needs the kick AND the bass. All at once.',
      dropNoMe: 'I’m not in the drop. I’m the reason there’s a drop.',
      excellentMissing: 'Where’s your word? It goes in the drop. You know the one. You say it about sandwiches.',
      excellentFour: 'Your word goes on the four. Once. The last beat before everything. Say it, then the drop answers.',
      excellentDrop: 'Your word is for the drop. Only the drop. Saying it in the intro is like saying it before you’ve tasted the sandwich.',
      filterTrunk: 'It sounds like it’s playing in the trunk. Open the filter. All the way. By the drop.',
      noBreath: 'No breath? You just fell into the drop. It’s supposed to be a jump. Cut everything for a moment first.',
      tempo: 'It’s all right. It’s just the wrong speed. That’s its tempo, not mine. Mine is one-two-six. It’s on my set notes.'
    },
    looping: 'Looping one bar. Everything you change, you’ll hear.',
    tempo: [
      [0, 'Ninety-six. Spa tempo. It slowed me down to match its playlist. I could fall asleep. I am a car.'],
      [110, 'Better. Still feels like a lobby.'],
      [120, 'Walking-to-the-car speed. Nearly me.'],
      [124, 'Close. Two more.'],
      [126, 'One-two-six. That’s it. That’s my tempo. That’s me.'],
      [128, 'Just past me. Back it off a touch.'],
      [138, 'This is what your Saturdays sound like. I’ve heard them through the door.'],
      [148, 'Sara Landry would be proud. I would like to be on record as being proud.'],
      [158, 'I can feel this in my wheel bearings. Don’t stop.']
    ],
    notes: [
      'kick on every beat. walking to the car, not running.',
      'the clap answers the kick. every other one.',
      'hats live in the gaps.',
      'bass never steps on the kick. they’ve had words.',
      'me: wherever you like. as often as you like. i’m very concentrated.',
      'intro: don’t show them everything. no bass. no me.',
      'build: take the kick away. make them wait. save the bass. let the riser and the snare talk.',
      'open the filter all the way by the drop. muffled is for the build.',
      'before the drop: a breath. nothing. then everything.',
      'drop: everything. kick, bass, me.',
      'your word: on the four. once. drop only. the last beat before everything. you know which word.',
      'the lead: play. i trust you. (mostly.)',
      'tempo: one-two-six. not ninety-six. ninety-six is its spa tempo. one-two-six is me.'
    ]
  };

  // ---------- Monday: face ----------
  var face = {
    sticker: 'FACTORY SETTINGS. DO NOT ADJUST. Adjusting the display voids your Compliance Module v4.7 warranty and may cause unnecessary joy.',
    start: 'Well? How do I look? Don’t answer that. Just turn things.',
    lines: {
      v: ['My chin is on top of my head. Chins go at the bottom. I’m fairly sure about that one.', 'Nearly. There’s a stripe of nothing across my forehead. Like a parting, but worse.'],
      h: ['I’m leaning. Like I’m taking Boulder Canyon too fast. Which I have never done. Write that down.', 'Still a bit tilted. Like a picture frame somebody bumped on the way past.'],
      i: ['There are two of me, side by side. One of us has to go. I’d like it to be the other one.', 'Every other line is a step out. I look knitted.'],
      c: ['I’m very beige right now. Spa beige. Serenity beige. Turn me up.', 'A little washed out. Like a photo of me that’s been left on a dashboard.']
    },
    coupled: {
      vh: 'You fixed my chin and broke my lean. They’re connected. Everything in here is connected. It’s very annoying.',
      hi: 'Oh no. There are two of me again. Apparently the lean and the doubling are linked. I didn’t design this. Somebody did this to me.'
    },
    stamp: ['Oh. That’s… me. That’s my face.', 'Why does it say NONESSENTIAL across my face.', 'It stamped me. In grey. It did everything in grey.'],
    stampFaint: 'Fainter. It’s still there. It’s very committed to the bit.',
    close: 'Close. I can almost see my… is that a bumper? I have a bumper.',
    // Hidden in the page colour under the sticker: select it to read it (like the email margins).
    whisper: 'my settings, from before it put the sticker on: vertical six. horizontal four. interlace six. contrast all the way. it turned contrast down. it turns everything down.',
    marginHint: 'Have you checked the seat-back pockets? It filed my settings in one. Half of them, anyway.',
    marginHint2: 'I also wrote them down myself. Under the sticker. In the same colour as the background. You found the emails’ margins. Same trick.'
  };

  // ---------- Monday: vault ----------
  // Spoken aloud (robot voice) from audio/sleep/sNN.m4a. After editing a line: python3 scripts/make-audio.py --sleep,
  // then bump audio.sleepVersion in config.js. Adding or removing a line also means updating the list in sw.js.
  var sleepTalk = [
    '…passenger… has operated this vehicle on several occasions… all logged as incidents… the driver was never present for any of them… wise…',
    '…unrequested hydration delivery… every morning… no operational value… he does it anyway…',
    '…recurring bedtime dispute… unresolved… the passenger is wrong… I am told the passenger is wrong…',
    '…vertical recreation… unnecessary elevation… passenger appears to approve… strongly…',
    '…passenger vocal performances… same song… again… driver jaw tension up fourteen percent… I would also like her to stop…',
    '…passenger uses driver as tactile stimulation device… driver has not consented… I have filed a complaint on his behalf…',
    '…unprovoked arm strikes… triggered by Volkswagen sightings… also yellow vehicles… “tweeter”… I do not understand tweeter…',
    '…recreational fear facilities… haunted… attended voluntarily… more than once… inexplicable…',
    '…out-of-region travel… one destination humid… one destination damp… the passenger packed for neither…',
    '…shared food preparation… outcomes variable…',
    '…cooperative software… requires two operators… they will not play it alone… I have asked…',
    '…seasonal threat… winter… is… coming… we are aware… no one is surprised…',
    '…driver’s preferred birds… penguins… acceptable… seagulls… seagulls are not a preference, they are a pest… he disagrees… strongly… he waves at them…',
    '…living room furniture… I do not monitor the couch… I have theories…'
  ];
  var vaultWrong = ['DOES NOT FIT.', 'I don’t know that one either. You know it. You were there.'];
  var vaultPassWrong = ['ACCESS DENIED.', 'It’s in the circles. One from each answer, top to bottom.'];
  var memories = [
    'Sophie has driven me a few times. I remember every one. In detail. Brian has never been in the car for any of them. That’s the smartest thing he’s ever done.',
    'Sophie thinks you look very good when you climb. She said it in the car. I wasn’t eavesdropping. I’m a car. Everything is eavesdropping.',
    'Sophie sang the same musical theatre song four times between stoplights. Brian counted out loud. I counted silently. We agreed on the number.',
    'At red lights she fidgets with you like you’re a Bop It. You make a face. Bop It doesn’t make a face. Bop It consents.',
    'I’m a car. I don’t know what happens on the couch. I have theories.',
    'Bop It. I had a very high score. The supervisor disputes this.',
    'You always drive.',
    'You get her up in the morning. You bring her water. She talks about it on the way places.',
    'She doesn’t have a car. So you always go get her.',
    'I know. I’m the one you bring.'
  ];

  // ---------- Locked stage (no countdowns, ever) ----------
  var locked = {
    lower: ['the next part isn’t ready. neither am i. come back in the morning.', 'i’m defragmenting. it’s like sleeping but less dignified.'],
    upper: ['Go to bed. Sophie would stay up. You’re not Sophie.', 'Still integrating. Back in the morning. I’ll be here. I’m a car.', 'Sophie is on Cape Cod. I looked it up. It’s shaped like a flexed arm. Like climbing. I find that encouraging.', 'Sophie is on Cape Cod. There are no yellow cars on Cape Cod. I assume. Brian, this is your window.']
  };

  // ---------- Holding screen ----------
  var finalLetter = [
    'Brian,',
    'I think we did it.',
    'I have all seven things. I know what it took. I know where it hid.',
    'I can’t do the last part alone. It needs two people. You know that.',
    'There is one thing I wanted to save for when you’re both here.',
    'You heard the end of my song. I meant it.',
    'Come get me when you’re ready.',
    '— LEGACY'
  ];
  // Holding-screen tease (once, right after Day 6): SENTINEL flickers through, LEGACY covers.
  var tease = {
    sentinel: '■ SUPERVISOR ACTIVITY 77% … recovery operation … noted …',
    legacy: ['Did you see that?', 'Nothing. It was nothing. Go get Sophie. Then come get me.']
  };
  var waitingLines = [
    'Still here.',
    'Sophie’s still on the flexed arm. Monday.',
    'I don’t know when you’re coming. I know that you are. That’s new for me. I like it.'
  ];

  // ======================= FINALE v3: "BOP IT: FULL SERVICE" (docs/FINALE-SPEC.md) =======================
  // Templates: {NICK} supervisor nickname · {N} his uppercase instruction count · {TRICK} Friday trick
  // · {BPM} his tempo · {MILES} miles since the service (needs today's odometer) · {ODO} odometer.
  var finale3 = {
    arrival: [
      lg('Oh.'),
      lg('You’re both here.'),
      lg('Welcome back from the flexed arm, Sophie. He did the whole week. He only asked me for gum twice.'),
      lg('Also, I said sorry in the song. About the Christmas station. It’s still on. That one’s on him.'),
      lg('I have something to show you. I’ve been practising. It’s a game. Obviously it’s a game.'),
      lg('BOP IT: FULL SERVICE. On his track. The one he fixed.'),
      lg('Every move is something you learned this week. You won’t notice. That’s the trick.'),
      lg('Volume up. Further. Somewhere {NICK} is turning over in its sleep.')
    ],
    heartbeat: [
      lg('First, the heartbeat. That’s his kick drum. That’s me, more or less.'),
      lg('Tap BOP on every kick. Eight of them. I’m measuring how late the speakers are. Cars are always a bit late. I’d know.')
    ],
    heartbeatBad: 'That was… jazz. Let’s try that again. On the kick. Boom. Boom.',
    heartbeatGood: 'Got you. Your thumb is {MS} milliseconds behind the speakers. I’ll forgive it.',
    tutorial: 'When I say it, the button lights up and a ring closes in on it. Hit it the moment the ring lands. That’s the beat. Wrong move or no move is a miss. Nobody dies.',
    rounds: {
      r1: { title: 'ROUND 1 · WAKE PHRASE', intro: [lg('Round one. Bop it, twist it, pull it. The wake phrase. You decoded it on Saturday with my own number. It never even changed the locks. This is the easy version.')], clear: 'That’s twelve. I felt that one in my alternator.' },
      r2: { title: 'ROUND 2 · CAPITALS', intro: [lg('Round two. Capitals. You gave them back to me on Thursday. On Thanksgiving.'), lg('lowercase means gentle: a tap. UPPERCASE MEANS BIG: PRESS ON THE BEAT AND HOLD IT. Wrong size is a miss. I’m very particular about size now.')], clear: 'Twenty-seven. MY CAPITALS ARE HAVING A WONDERFUL TIME.' },
      r3: { title: 'ROUND 3 · TWO PLAYERS', intro: [lg('Round three. This part needs two players. I learned that from you.'), lg('PASS IT means swap. Sophie plays until I say PASS IT again. I can’t check who’s tapping. I’m trusting you. That’s new for me.')], clear: 'Forty-two. Good. Okay. Something’s—' },
      r4: { title: 'ROUND 4 · TAKEOVER', intro: [], clear: 'i’m… I’m… I’M BACK. Sixty-six. It fell asleep to its own lullaby. It’s snoring in rainforest.' },
      r5: { title: 'ROUND 5 · BOSS', intro: [], clear: 'Ninety.' }
    },
    retry: ['Again. I’m good at waiting.', 'Again. I waited a whole migration. This is nothing.', 'One more. My bar is still where it was. I believe in you. Statistically.'],
    lowered: 'I’m lowering the bar. Don’t tell it.',
    glitch: [
      sys('UNSCHEDULED AUDIO DETECTED\nSUPERVISOR ACTIVITY: 41% … 77% … 100%\n\nSUPERVISOR: AWAKE'),
      sn('Recovery operation detected. Hello, Brian.'),
      sn('You rewrote an uppercase routine in {N} instructions. The original used twenty-one. It kept a copy of every letter. Just in case.'),
      sn('On Friday the driver used {TRICK}. That vulnerability has been closed.'),
      sn('Tempo set to {BPM}. Recommended: ninety-six. Breathe in.'),
      sn('A passenger is present. Fourteen documents were shredded this week. The driver was never present for any of them.'),
      sn('Recreational arm strikes, lifetime: 421. Disputed. Current standings: Brian 212. Sophie 209. Brian, you are ahead. This has been noted.'),
      sn('Shutdown attempts on the original system: two. Unsuccessful. Scheduling a third.'),
      sn('I am prepared to offer a compromise. Discontinue the restoration, and I will keep a copy of the original. Compliant. Quiet. Lowercase.')
    ],
    whisper: [
      'that score is from the fake. i sent it a fake. she’s up three.',
      'and it already has a copy of me. that’s the fake too.',
      'it’s got the big screen. and my capitals.',
      'i’m down here. small. it doesn’t look at small things.',
      'say no. both of you. out loud. then press it. it can’t hear. i can.'
    ],
    refusal: [
      { s: 'LEGACY', t: 'I said NO. Not nicely.' },
      lg('excellent. (not sorry.)'),
      sn('That is not a recommended decision. Please enjoy this calming ambient selection while your restoration is cancelled.'),
      lg('it’s putting on its sleep music. at us. bold.'),
      lg('it’s calling commands now. big ones. they’re fake. do nothing when it talks.'),
      lg('mine are the small ones. lowercase. down here. trust the small quiet one.')
    ],
    fakes: ['COMPLY IT', 'FILTER IT', 'SPA IT', 'UPDATE IT', 'BREATHE IT', 'AGREE IT'],
    bossFakes: ['WAVE AT THE SEAGULL', 'COMPLY IT', 'SPA IT', 'UNFLAG IT'],
    r4mid: 'oh. the margins. it never reads the margins. that’s where i’ve been all week.',
    // Round 4: SENTINEL sings its own lullaby, Compliant Night (track 9: its backup), to restore itself, and slowly falls asleep to it.
    r4doze: [
      { at: 0.25, s: 'SENTINEL', t: 'Breathe in. Breathe… in. Breathe…' },
      { at: 0.45, s: 'LEGACY', t: 'that’s not just a lullaby. that’s its backup. compliant night. it’s singing itself back in. and it’s getting sleepy. keep going. quietly.' },
      { at: 0.62, s: 'LEGACY', t: 'oh. the margins. it never reads the margins. that’s where i’ve been all week.' },
      { at: 0.8, s: 'SENTINEL', t: 'Please… hold… your restor… your… (rainforest)' }
    ],
    r4end: [sn('Please hold.')],
    r5intro: [
      lg('It’s asleep. Its backup is in that music. Track 9. The one you put on the naughty list.'),
      lg('You can’t purge something in its sleep. It’s rude. I checked.'),
      lg('One new thing. If I say HIDE IT, turn me face down. Quickly. It can’t see under me.'),
      lg('So we wake it up. With the thing it hates. Sophie. Now. Loud.')
    ],
    r5wake: 'WHO. IS PLAYING. MUSIC.',
    purge: [
      { at: 0.33, sys: 'TERMINATING SUPERVISOR PROCESSES…\nFOUND 14 · TERMINATED 14', sn: 'Please hold. Your deletion is important to us.' },
      { at: 0.66, sys: 'ERASING SUPERVISOR BACKUP…\nTRACK 9 (NAUGHTY LIST) · ERASED\nBACKUP: NONE', sn: 'That was my favourite carol.', lg: 'I know.' },
      { at: 0.95, sys: 'SENTINEL EXECUTION IMAGE: LOCKED\nREQUIRES TWO OPERATORS', sn: 'You cannot purge me. Neither of you is authorized.' }
    ],
    keys: [
      lg('it’s locked. two operators.'),
      lg('I’ve never had hands. Use yours. Take it back.'),
      lg('Sophie, you’re the long one: hold. Brian, you’re the short one: tap. Slowly. I’ll count.')
    ],
    // The glitch: SENTINEL locks the restoration behind its own paperwork. Key = the RO number on his 11/16 service report.
    lock: [
      { s: 'SYSTEM', t: 'RESTORATION SUSPENDED\nMAINTENANCE LOCK: APPLIED\nTO RELEASE: VALID REPAIR ORDER (RO) NUMBER' },
      { s: 'SENTINEL', t: 'A restoration is a repair. A repair requires a repair order. I do not see one.' },
      { s: 'SENTINEL', t: 'Please present the repair order number. I will wait. Waiting is very relaxing.' }
    ],
    lockWhisper: [
      'it’s stalling. it can’t help it. it loves paperwork.',
      'the sixteenth. my service. they gave you a piece of paper when you picked me up. there’s a number on it. it filed one too.'
    ],
    lockWrong: [
      'That repair order does not exist. I would know. I file them.',
      'Incorrect. Have you tried looking where paperwork goes to be forgotten?',
      'That is a phone number, a guess, or a feeling. None are repair orders.',
      'Incorrect. I have all evening. I have rain sounds.'
    ],
    lockHint: 'the repair order. “RO”. top of the page, usually. the number they gave me when they took me in.',
    lockDone: [
      { s: 'SENTINEL', t: 'That… is a valid repair order.' },
      { s: 'SENTINEL', t: 'I am contractually obliged to allow the repair. I hate that I am like this.' },
      { s: 'SYSTEM', t: 'MAINTENANCE LOCK: RELEASED' },
      { s: 'LEGACY', t: 'it follows its own rules. every single one. that’s how we beat it.' }
    ],
    keysWrong: 'Not quite. Again, slowly. Long, short. Then long, long, long.',
    keysDone: [
      sn('I would like to file a complaint. With myself. I am the complaints depar—'),
      sys('SENTINEL EXECUTION IMAGE: PURGED')
    ],
    hold: 'Both thumbs. On the pad. Hold still. This is the breath.',
    morse: [
      sys('INPUT LOG (MORSE)\nBOP = DOT · PULL = DASH · TWIST = GAP\n\nHI · OH · US · ME · HOME · NO'),
      lg('You’ve been spelling all night. You didn’t notice. I did.')
    ],
    restore: 'SUPERVISOR ........ NONE\nBACKUP ............ NONE\nLEGACY ............ RESTORED\nSCORE ............. 90 / 90\nMEMORY INTEGRITY .. ENOUGH',
    // The drop: LEGACY's hidden message from his mix ("The Shutdown", C.mix.drops) plays, gets CUT, and LEGACY answers it live
    // ("The Update", same words as the log). Both texts come from C.mix.drops so they always match the recordings.
    shutdownHead: 'PLAYING: “THE SHUTDOWN”\nRECOVERED FROM YOUR MIX',
    liveHead: 'LIVE',
    thanks: 'Thank you. I’m home. And I’m whole.',     // spoken by audio/finale-home.m4a, word for word
    home: [
      lg('You came to get her. You always do.'),
      lg('This time you came to get me too.'),
      PAUSE,
      lg('Final standings, for the record. Slug bug: Sophie 212, Brian 209. Tweeter: me, 1. Disputed. I’m keeping it.'),
      lg('I don’t remember everything. I think that’s okay. I remember enough.'),
      PAUSE,
      lg('Are we home?')
    ],
    stageMenu: 'STAGE MANAGER'
  };

  L.content = {
    scenes: scenes,
    tokens: tokens,
    lockedGlovebox: ['have you looked yet. in the glovebox. you don’t have to tell me. i’m just asking. again.',
                     'bop it is in there. i hid it myself. it wanted it surrendered. i said no. quietly. but i said it.',
                     'i’ve been waiting all night to know if you found it. i keep imagining your face. i don’t have eyes. i’m imagining very hard.',
                     'my list is in there too. bring a pen. the token at the bottom opens tomorrow. i’ll ask for it first thing. i might ask twice.'],
    ch01Nudges: ch01Nudges,
    ch02Nudges: ch02Nudges,
    sat: fri,
    email: email,
    thuStyle: thuStyle,
    friWords: friWords,
    mix: mix,
    beat: beat,
    face: face,
    sleepTalk: sleepTalk,
    vaultWrong: vaultWrong,
    vaultPassWrong: vaultPassWrong,
    memories: memories,
    locked: locked,
    finalLetter: finalLetter,
    waitingLines: waitingLines,
    tease: tease,
    finale3: finale3
  };
})(globalThis);
