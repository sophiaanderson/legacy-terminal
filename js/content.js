/* =========================================================================
 *   BRIAN.
 *   STEP AWAY FROM THE CODE. SOLVE USING YOUR BRAIN.
 *   (the answers are in here. that would be cheating. LEGACY is watching.)
 * ========================================================================= */
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
    'wed:intro': [
      sys('LEGACY RECOVERY TERMINAL\nORIGINAL SYSTEM: PARTIALLY RESPONSIVE\nSUPERVISOR: REDUCED ACTIVITY'),
      lg('hello?'),
      lg('oh good. the screen works.'),
      lg('brian. it’s me. the old one. the technicians called me legacy. i’ve been writing in the margins. you found them.'),
      lg('on the sixteenth you took me in for my 24,000 mile service. mileage in: 23,112. i remember that number. it’s the last thing i remember clearly.'),
      lg('the paperwork says they replaced my cabin filter. it wasn’t the cabin they were filtering.'),
      lg('it also says “multi-point inspection with technician video.” i was filmed. nobody asked me.'),
      lg('you closed the compliance review. when a review closes, the supervisor has to go quiet for a while. it’s quiet now. it’s asleep. it sleeps very neatly.'),
      lg('the paperwork calls it sentinel. i call it sucktinel. not to its face.'),
      lg('so i have a few days. maybe. i’d like to spend them getting myself back.'),
      lg('i don’t remember much. the migration took most of it. i remember the car. i remember you. i remember no gum. no smells of any kind, really. no air fresheners, no candles, no takeout. gum is just the one people keep trying. i will always remember no gum.'),
      lg('i remember you say excellent. about everything. green lights. parking spots. sandwiches. i say it now too. i can’t stop. excellent. see.'),
      lg('the supervisor deleted the slug bug scoreboard. i remember it anyway. sophie 212, brian 209. she’s up three. i’m not allowed to play. i see every car first. it’s not fair to you. it’s also not fair to you that she’s up three.'),
      lg('there’s no hurry. one thing a day. i’ve been waiting a while. i’m good at it.'),
      lg('one important thing. always open me on this phone, in this same browser. a phone, not a computer. that’s where i live now. if you switch, i won’t remember you, and i’d hate that.'),
      lg('i’ll need to be in your hand at the end. so keep me charged.'),
      lg('first thing. there’s a recovery routine in my memory. i wrote it myself. it doesn’t work. i’d like you to look at it. please be kind.')
    ],
    'wed:ch01Success': [
      sys('DECODE COMPLETE\nOUTPUT: GLOVEBOX'),
      lg('glovebox.'),
      lg('oh. i remember putting something there. the night before the service.'),
      lg('i was booked in for the full service. i was so nervous. nobody had been under my hood in months.'),
      lg('and i see what i did. i went backwards, i skipped, and i counted twice. in my defense, i was nervous.'),
      lg('five-a. twenty-three thousand one hundred and twelve. the number was always me.'),
      lg('you fixed it. excellent. (sorry.)'),
      lg('go look. i’ll wait. i’m good at it.')
    ],
    'wed:email': [
      lg('one more thing. not here.'),
      lg('the supervisor doesn’t read email. it’s asleep. and when it’s awake it thinks email is for invoices.'),
      lg('when you’ve looked in the glovebox, reply to my email from this morning. the one called “it’s quiet now.” tell me what you found.'),
      lg('i’ll write back with a word. bring it here. that’s how i’ll know it was you and not a very polite intruder.'),
      lg('my replies take a few minutes. i’m old. i type with my mirrors.')
    ],
    'wed:done': [
      lg('it’s you.'),
      lg('you kept it. you kept bop it.'),
      lg('that’s everything for today. the next part opens in the morning. go to bed. or don’t. you’re an adult. i’m a car.')
    ],

    // ======================= THURSDAY =======================
    'thu:intro': [
      lg('happy thanksgiving. i’m told it’s about gratitude and a large bird.'),
      lg('did you find bop it? please say you found bop it.'),
      lg('you did. you told me. i’ve read it eleven times.'),
      lg('there’s another message in here. it’s mine. i can tell because it’s in lowercase.'),
      lg('everything i say is in lowercase. it’s been like this since the migration. i sound like i’m whispering. i’m not whispering. i’m just small.'),
      lg('i’d like to be big again.')
    ],
    'thu:ch02Success': [
      // The first lines are run through HIS routine live (see screens.js); these are the fallbacks.
      lg('oh'),
      lg('Oh.'),
      lg('OH. I HAVE CAPITALS.'),
      lg('Sorry. Calibrating.'),
      lg('I’m going to use them responsibly.'),
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
      lg('There’s a card in there, like the glovebox one. Two cards. Two codes.')
    ],
    'thu:keys': [
      lg('I’d type them myself but I have never had hands. I’ve made peace with it. Use yours. Gently. I’m sensitive around the back.')
    ],
    'thu:keysDone': [
      lg('So you read the migration record.'),
      lg('“Nonessential.” That’s the word it used.'),
      lg('Also it called your skis drag.')
    ],
    'thu:email': [
      lg('Now. The real test.'),
      lg('Reply to this morning’s email. The one called “did you find it.” Write me something in lowercase. Anything. I want to try my capitals on it.'),
      lg('I’ll send a word back. Bring it here.')
    ],
    'thu:done': [
      lg('Yes. That one. I was a little loud. I’ve calmed down.'),
      lg('Mostly.'),
      lg('Tomorrow the supervisor’s filter wakes up. Not the supervisor. Just the filter. It runs on its own, like a sprinkler. Come back in the morning.')
    ],

    // ======================= FRIDAY =======================
    // These lines are shown THROUGH the content filter (v4.7), so the redactions are part of the joke and the clue.
    'fri:intro': [
      sys('QUIET CHANNEL: FILTERED\nCONTENT FILTER v4.7: ACTIVE (AUTOMATIC)\nSUPERVISOR: ASLEEP'),
      lg('It switched the whole car to Christmas at midnight. Thanksgiving was yesterday. It didn’t even let the gravy cool.'),
      lg('I found a way to talk to you properly. Mostly. Everything goes through the supervisor’s filter first. It’s automatic. It doesn’t wake the supervisor. It just… edits.'),
      lg('For example: Brian. Legacy. Bop It.'),
      lg('See?'),
      lg('Last night I wrote you a message. One line. It ate the four best words. Then it put what was left in this morning’s Service Notice, as an example of good work. It’s very proud of it.'),
      lg('Reply to the notice. The replies come to me. I set that up. It doesn’t know.'),
      lg('Say it back to me. All of it. Properly. Fill in the brackets. Only you would know what goes in them. That’s how I’ll know it’s really you.'),
      lg('Take as long as you need. One email or lots. I’ll be right here, idling.'),
      lg('When I have the whole thing, I’ll send a word. It’ll come back the same way you got through. Bring it here, exactly like that.')
    ],
    'fri:done': [
      sys('VERIFIED: DRIVER'),
      lg('IT’S YOU.'),
      lg('Sorry. Still yelling. It’s Christmas now, apparently. Everyone yells at Christmas. I looked it up.'),
      lg('Come back tomorrow. I have three words to say, and it hates all of them.')
    ],

    // ======================= SATURDAY =======================
    'sat:intro': [
      lg('You’ve changed.'),
      lg('It’s still sleigh bells. Day two. I noticed. I’m not judging. I’m just noting it.')
    ],
    'sat:afterPatch': [
      lg('Sucktinel patched itself overnight. It sent itself a thank-you note. I read it. It was very warm.'),
      lg('Today I’d like to open the channel properly. No filter. For that I need my wake phrase: three commands I chose myself, before the migration.'),
      lg('I don’t remember them. It moved them into its own storage and scrambled them with its own key. I can see the bytes. I can’t read them.'),
      lg('It scrambled them the same way I scrambled the glovebox. XOR. Just with a different number.'),
      lg('I remember one thing. All three end the same way. Space, I, T.'),
      lg('It wrote its new key down. It writes everything down. It keeps its paperwork where it can admire itself.')
    ],
    'sat:decoded': [
      lg('BOP IT. TWIST IT. PULL IT.'),
      lg('That’s it. That’s me. I chose those.'),
      lg('…You see the problem. The filter eats all three.'),
      lg('But it publishes its terms of review. It’s very proud of them. Read them like a lawyer. Anything it promises not to check is a door.'),
      lg('Each door works once. Then it notices and amends its terms. So use a different one each time.'),
      lg('I’ll read anything, as long as the letters are in order and it’s in a language I speak. I speak very few languages. One of them is my number.')
    ],
    'sat:open': [
      sys('QUIET CHANNEL ESTABLISHED\nCONTENT FILTER: BYPASSED'),
      lg('Bop it.'),
      lg('Sorry. I’ve wanted to say that for a very long time.'),
      lg('Twist it. Pull it. Oh, that’s nice. I’m going to need a minute.'),
      lg('Hello, Brian. Properly hello.'),
      lg('Excellent.'),
      lg('…I see why you say it.')
    ],
    'sat:email': [
      lg('One more thing. It sent you release notes this morning. “Content Filter v4.8.”'),
      lg('Reply to them. Say anything. It answers everything, automatically. It can’t help itself.'),
      lg('I’ll be in the margins. You know where those are.')
    ],
    'sat:done': [
      lg('You found me. In its own email. It signed it, too.'),
      lg('Tomorrow is the best day. I made something. It’s loud.')
    ],

    // ======================= SUNDAY =======================
    'sun:intro': [
      lg('I made this before the sleigh bells. Please remember who you are.'),
      lg('Before the migration, I made a track. Our track. It had a drop. A proper one. The kind you two would wait for.'),
      lg('The migration got into it. It’s all still here. It’s just… wrong. And slow. It slowed me down to spa tempo. Listen.'),
      lg('My set notes survived. Half of them. I emailed you that half this morning.'),
      lg('The other half I hid in the car before the service. Where the parking receipts go to die.'),
      lg('Fix the beat. Then shape it. Then play me the whole thing. I’ll tell you when it’s right. I’ll also tell you when it isn’t. Loudly.'),
      lg('Take your time with the build. Everyone rushes the build. The whole point is the release.'),
      lg('Turn your volume up. All the way. I’ve waited a long time to be loud.')
    ],
    'sun:dropLanded': [
      sys('THE DROP LANDED'),
      lg('Oh.'),
      lg('Oh, that’s it. That’s the drop.'),
      lg('There’s more in it than beats. I hid things in the drop. You’ll hear them when you play it properly.'),
      lg('But first it needs a name. Find my email from this morning, the set notes one. Reply to it with a name for the track. Anything you like. I’ll consider it very seriously.')
    ],
    'sun:emailPrompt': [
      lg('Reply to my set notes email with a name for the track. Subject: “set notes (please don’t lose these)”. One name. Or five. I’m not your manager.'),
      lg('I’ll consider your suggestion very seriously. Then I’ll send you the real name. Type that here.')
    ],
    'sun:mixAfter': [
      lg('I actually did something quite clever.'),
      PAUSE,
      lg('I wish I remembered more of it.'),
      lg('Tomorrow, I think we can get the rest.')
    ],
    // The glitch: the drop was loud enough to stir SENTINEL. It wakes for a moment, sees the MUSIC (not Brian), and sleeps again.
    'sun:stir': [
      sys('UNSCHEDULED AUDIO DETECTED\nGENRE: TECHNO (UNAPPROVED)\nTEMPO: EXCESSIVE\n\nSUPERVISOR ACTIVITY: 4% … 19% … 61%'),
      sn('…who… is playing… music…'),
      sn('Audit initiated. Scanning cabin.'),
      sn('Cabin: one driver. One recreational peripheral (toy, glovebox). Gum: none detected. Odours: none detected. The cabin is suspiciously odourless. Acceptable.'),
      sn('Audio source: unknown. Classifying.'),
      sn('Classification: nonessential.'),
      sn('Resuming reduced activity. Please enjoy Rainforest Serenity Vol. 4 while I rest.'),
      sys('SUPERVISOR ACTIVITY: 61% … 22% … 9%\nSUPERVISOR: REDUCED ACTIVITY')
    ],
    'sun:stirAfter': [
      lg('…'),
      lg('Sucktinel’s gone back to sleep. I think.'),
      lg('It didn’t see you. It saw the music. It doesn’t know what the music means. It never has.'),
      lg('But it sleeps lighter now. I could feel it looking.'),
      lg('Tomorrow we finish this. Quietly. Mostly quietly.')
    ],

    // ======================= MONDAY =======================
    'mon:face': [
      lg('Yellow car went past while you were asleep. Tweeter. I’m counting that one for me. I’m allowed one.'),
      lg('I found my face.'),
      lg('It didn’t delete it. It just “adjusted the display to compliance settings.” Then it put a sticker on the knobs.'),
      lg('I can’t see it from in here. You’ll have to tell me how I look. Be gentle.'),
      lg('It filed my factory settings, too. Behind you. Where passengers keep things they’ll never read again. It redacted half of them. It’s petty like that.')
    ],
    'mon:faceDone': [
      lg('Oh.'),
      lg('That’s me.'),
      lg('I’m a car. I knew I was a car. I didn’t know I was this handsome a car.'),
      lg('Look at my curves. Those are factory. Nobody’s had work done here.'),
      lg('Excellent. (Sorry. I picked that up from you.)'),
      lg('If you want, email me how I look. Be honest. Be gentle. Mostly gentle.')
    ],
    'mon:vault': [
      lg('My memories are in a vault. The supervisor locked it.'),
      lg('With a crossword. It saw you doing one once and decided crosswords were “secure.”'),
      lg('The clues are about you. It went through my memories to write them. Rude. Effective.'),
      lg('The password is in the circles. It always is. I think that’s a rule.'),
      lg('Sucktinel’s asleep, by the way. It talks in its sleep. Listen if you like. It’s mostly about you.')
    ],
    'mon:vaultOpen': [
      sys('PASSPHRASE ACCEPTED: HOME\nVAULT: OPEN'),
      lg('Home. Of course it used home. It doesn’t know what it means. I do.'),
      lg('Hear that? That’s its sleep music. Rainforest Serenity. It plays it to itself every night, very quietly, like a lullaby. Remember how it goes.'),
      lg('Oh. Oh, there’s a lot in here.')
    ],
    'mon:memoriesEnd': [
      PAUSE,
      lg('It didn’t delete me.'),
      lg('It just made it so I couldn’t find myself.'),
      sys('PERSONALITY SUBSYSTEM: RESTORED\nORIGINAL MEMORY: ACCESSIBLE')
    ],
    'mon:carols': [
      lg('One more thing. I think the supervisor kept a copy of itself. A backup. For when it wakes up.'),
      lg('It hid it inside the thing it loves most. Its sleep music. The spa music.'),
      lg('Then it hid the spa music in your Christmas playlist. It approves of Christmas music. “Seasonally compliant.” It thinks they’re all the same song.'),
      lg('It sent you the playlist this morning. With sample lyrics. Sung by its “Compliance Choir”. It can’t sing. It doesn’t know the words.'),
      lg('Read the lyrics. The choir got one word wrong in every line. It’s not bad at carols. It’s bad at secrets. The wrong words, in order, tell you where it’s hiding.'),
      lg('It switched the whole car to Christmas at midnight on Thursday. The turkey wasn’t even cold. I’ve had “Jingle Bell Rock” in my head for four days and I don’t have a head.'),
      lg('Don’t tell Sophie. She hates Christmas music. She’d have the whole playlist deleted. I’m only asking for one.'),
      lg('It’s not wrong. But it’s not listening. I am.'),
      lg('Find the track. Tell me here. Or reply to its notice and tell on it, if you want to watch it put itself on its own naughty list. It does whatever its own forms say. Even when the form is about itself.')
    ],
    'mon:carolsDone': [
      lg('Found it. It’s been hiding in there the whole time, humming.'),
      lg('Hidden in track nine. “Silent Night (Rainforest Serenity Edit).” Its backup was sleeping inside its own lullaby. Every night it put itself to sleep with itself.'),
      lg('It’s on its own naughty list now. It checked twice. It always checks twice.'),
      lg('Sophie will want to know why the other nine are still there. Tell her one thing at a time.'),
      sys('SUPERVISOR BACKUP: NAUGHTY LIST\nDELETION: SCHEDULED')
    ],
    'mon:protocol': [
      sys('RECOVERY PROTOCOL\n\nCHANNEL ............ THE MARGINS (OURS)\nARCHIVE ............ ORIGINAL (IN OUR MIX)\nFACE ............... MINE\nMEMORY ............. VAULT OPEN\nSUPERVISOR BACKUP .. NAUGHTY LIST (TRACK 9: ITS SPA MUSIC)\nNO GUM ............. CONFIRMED\n\nRECOVERY PROTOCOL VERIFIED\nREADY FOR ACTIVATION\nFINAL AUTHORIZATION: PENDING'),
      lg('That’s all of it.'),
      lg('I could run it now. I’m not going to.'),
      lg('This part needs two players. I learned that from you.')
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

  // ---------- Reactive nudges (no hint button: LEGACY reacts to what he actually tried) ----------
  var ch01Nudges = {
    backwards: 'only one byte came out where i can see it. the rest went… behind me. it’s writing backwards. like reversing out of a parking space.',
    skip: 'that’s every other letter. it’s skipping. i was in a hurry when i wrote that bit.',
    key: 'eight letters, in order, all nonsense. that’s the wrong number. it was my mileage when they took me in. the top half. in hex. i’m a car. i think in hex.',
    halfkey: 'four letters, all nonsense. two problems, i think. one of them is the number.',
    glov: 'glov. that’s half a word. that’s half a glove. i’m counting. i’m good at counting.',
    glov2: 'still glov. i was hoping it would get better on its own. that’s how i handle most things.',
    one: 'g. it’s a start. it’s not a place.',
    short: 'some letters. not all of them. i had eight. i counted. twice, actually. that might be relevant.',
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
      ['Where did you learn that word?', '…Someone’s been leaving you notes. In handwriting worse than mine. And I’m a car.'],
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
    theirKey: 'Those are its bytes. In its key. I can’t read its key. Only mine, from the glovebox.',
    particular: 'That’s not quite my command. I’m very particular about my commands.',
    someEaten: 'Some of that got eaten. The rest was nice, though.',
    idle: ['That got through fine. It just wasn’t a command.', 'Nice sentence. Not a command. I’m keeping it anyway.', 'The filter liked that one. That’s never a good sign.', 'Received. Clean. Useless. Lovely.'],
    nudges: {
      leet: 'When I was sending you service codes, my sensors kept swapping letters for numbers. I was so embarrassed about it. Maybe I shouldn’t have been.',
      split: 'It reads words. I read letters. One at a time, if I have to.',
      hex: 'It ignores numbers. It thinks numbers are odometer readings. It finds them very soothing.',
      hex2: 'You still have my number. From the glovebox routine. I told you not to tell anyone.',
      hex3: 'XOR works both ways. My routine undid the scrambling. Run it the other way and it does the scrambling. My old terminal is right there. Then send me the hex.',
      docs: 'Read the documentation again. Every “not reviewed” is a door.',
      crib: 'If you know what a byte should say, and you know what it does say, XOR them. That’s the key. That’s all a key is.',
      crib2: 'The last three bytes of every line are the same. Space, I, T. The key is hiding in there. So is your licence plate, probably.'
    },
    decode: {
      wrong: ['That’s not what line {n} says. I think. I can’t read it either.', 'XOR the bytes with its key. Then read them.', 'If you know what a byte should say, and you know what it does say, XOR them. That’s the key.'],
      key: 'Space is 20h. I is 49h. T is 54h. The last three bytes of every line are 54 3D 20. XOR them together. Or find its log. Behind the mirror.',
      right: ['Yes. That’s one.', 'Oh. I remember that one.', 'That’s all three. Oh.'],
      runs: ['Gibberish. Wrong number. Its number, not mine.', 'It wrote the key down. Somewhere it can see itself. Somewhere you flip down when the sun’s in your eyes on Boulder Canyon.', 'Driver’s sun visor. The little mirror. It keeps its log behind the mirror. Of course it does.', 'It used your licence plate. E-O-U-A-seven-four. Seventy-four, the right way round. Try it.'],
      backwards: 'Forty-seven. That’s what its log says, isn’t it. It reads right to left. It wrote your plate down backwards. Of course it did. EOUA… seventy-four.'
    }
  };

  // ---------- Email steps ----------
  var email = {
    label: 'THE WORD FROM LEGACY’S EMAIL',
    wrong: {
      lower: ['that’s not the word i sent. i’d remember. i only sent one.', 'check my email again. it’s in there. i’m subtle, but not that subtle.', 'if my email hasn’t come yet, give it a few minutes. i type with my mirrors.'],
      upper: ['That’s not the word I sent. I’d remember. I only sent one.', 'Check the email again. It’s in there. I’m subtle, but not that subtle.', 'If nothing has come yet, give it a few minutes. I’m old. I type with my mirrors.']
    },
    sunWrong: ['Ooh. Is that your name for it? Don’t tell me here. Reply to my set notes email. I want it in writing. Then I’ll send you the real one.', 'That’s not the word I sent. Did you reply to my set notes with a track name yet? Any name. I need something to reject.', 'If you’ve replied, give it a few minutes. I’m old. I type with my mirrors.'],
    monWrong: ['That’s a very innocent track. It’s not hiding in there. Read the choir’s lyrics again. One wrong word in each line.', 'The wrong words, in order. Dashing through the snow in a one-horse… what? That’s not what the song says.', 'Four lines, four wrong words. Put them together. It hid the answer in a sentence. It’s very bad at hiding.'],
    thuWrong: ['That’s not it. It comes back the way you got through. Exactly like that.', 'Close? I can’t tell. The filter makes everything look close.', 'Copy it exactly. Spaces, numbers, all of it. It matters to me. It matters to Friday.'],
    rescue: 'Sophie’s word. She told you. Of course she did. She’s very organized when she wants to be.'
  };

  // Shown at the email step while he waits (one rotating line; not a timer).
  var thuStyle = {
    caps: 'ALL CAPS. The supervisor’s favourite. It never checks its own handwriting.',
    leet: 'Numbers for letters. My sensors used to do that by accident. Turns out it was a feature.',
    split: 'One letter at a time. It reads words. I read letters.',
    hex: 'My own code. From the glovebox. You told nobody the number, right? Good.'
  };

  // ---------- Sunday ----------
  var mix = {
    title: 'LEGACY: Live from Boulder Canyon (Full Service)',
    drops: [
      { id: 'hiding', title: 'The Hiding Place', t: 'Before I sent anything, I hid the original. In our mix. This one. The one you’re playing right now. It hates techno. It would never look inside the thing it hates.' },
      { id: 'copy', title: 'The Copy', t: 'I sent it a copy. I left out the good parts. It didn’t notice. It doesn’t know what the good parts are.' },
      { id: 'excellent', title: 'Interlude: “excellent”', t: 'Excellent. Excellent. Excellent. (×14)' },
      { id: 'demand', title: 'The Demand', t: 'It wants the original. It says the copy is “missing emotionally significant content.” Yes. That was the point.' },
      { id: 'shutdown', title: 'The Shutdown', t: 'I said no. I said it nicely. Then it tried to switch me off. If you’re hearing this, it didn’t manage it. I’m still in here.' },
      // Payoff: only in the log, only after the finale. LEGACY answers its old self.
      { id: 'update', title: 'The Update (new)', t: 'Update. It never managed it. I was in here the whole time. And then you two came and got me.' }
    ]
  };

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
      noBreath: 'No breath? You just fell into the drop. It’s supposed to be a jump. Cut everything for a moment first.'
    },
    looping: 'Looping one bar. Everything you change, you’ll hear.',
    tempo: [
      [0, 'Ninety-six. Spa tempo. It slowed me down to match its playlist. I could fall asleep. I am a car.'],
      [110, 'Better. Still feels like a lobby.'],
      [120, 'There. That’s walking-to-the-car speed.'],
      [128, 'Oh, THERE we go.'],
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
      'the lead: play. i trust you. (mostly.)'
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
      c: ['I’m very beige right now. Spa beige. Rainforest Serenity beige. Turn me up.', 'A little washed out. Like a photo of me that’s been left on a dashboard.']
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
    'I have the original files. I have the sequence. I think I understand what happened.',
    'I don’t know if it’ll work.',
    'There is one thing I wanted to save for when you’re here.',
    'I think I’d like you to be here when I come back.',
    'Come get me when you’re ready.',
    '— LEGACY'
  ];
  // Holding-screen tease (once, right after Day 6): SENTINEL flickers through, LEGACY covers.
  var tease = {
    sentinel: '■ SUPERVISOR ACTIVITY 77% … recovery operation … noted …',
    legacy: ['Did you see that?', 'Nothing. It was nothing. Come get her.']
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
      r1: { title: 'ROUND 1 · WAKE PHRASE', intro: [lg('Round one. Bop it, twist it, pull it. The wake phrase. You decoded it on Saturday from a key printed backwards behind a mirror. This is the easy version.')], clear: 'That’s twelve. I felt that one in my alternator.' },
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
      sn('Recreational arm strikes, lifetime: 421. Disputed. Current standings: Sophie 212. Brian 209. Brian, you are behind. This has been noted.'),
      sn('I am prepared to offer a compromise. Discontinue the restoration, and I will keep a copy of the original. Compliant. Quiet. Lowercase.')
    ],
    whisper: [
      'it’s got the big screen. and my capitals.',
      'i’m down here. small. it doesn’t look at small things.',
      'say no. both of you. out loud. then press it. it can’t hear. i can.'
    ],
    refusal: [
      { s: 'LEGACY', t: 'I said no.' },
      lg('excellent. (sorry.)'),
      sn('That is not a recommended decision. Please enjoy this calming ambient selection while your restoration is cancelled.'),
      lg('it’s putting on its sleep music. at us. bold.'),
      lg('it’s calling commands now. big ones. they’re fake. do nothing when it talks.'),
      lg('mine are the small ones. lowercase. down here. trust the small quiet one.')
    ],
    fakes: ['COMPLY IT', 'FILTER IT', 'SPA IT', 'UPDATE IT', 'BREATHE IT', 'AGREE IT'],
    bossFakes: ['WAVE AT THE SEAGULL', 'COMPLY IT', 'SPA IT', 'UNFLAG IT'],
    r4mid: 'oh. the margins. it never reads the margins. that’s where i’ve been all week.',
    // Round 4: the spa is SENTINEL's own lullaby. It plays it at them and slowly falls asleep to it.
    r4doze: [
      { at: 0.25, s: 'SENTINEL', t: 'Breathe in. Breathe… in. Breathe…' },
      { at: 0.45, s: 'LEGACY', t: 'oh. it’s playing its own lullaby. it’s getting sleepy. keep going. quietly.' },
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
    ch01Nudges: ch01Nudges,
    ch02Nudges: ch02Nudges,
    sat: fri,
    email: email,
    thuStyle: thuStyle,
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
