/**
 * Profiler content — verbatim port of the legacy app's `public/js/data.js`.
 *
 * PARITY CONTRACT (do not edit copy without a versioning decision — see PRD):
 * - Array orders and option order within each question are FROZEN: the option
 *   index (`oi`) and NvItem ids are persisted in `public.results` rows.
 * - HTML entities / — escapes from the legacy source are converted to
 *   literal unicode here (emoji and em-dashes are literal characters).
 * - The `op` opening lines keep their embedded double quotes — part of the copy.
 * - `msgs` key order is engage/appt/followup/objections/close with
 *   5/5/5/6/5 items per profile (26 statements x 4 profiles).
 */

import type { DiscLetter, DiscProfile, NvGroup, QsQuestion } from '../types';

/** The 8 wizard questions (4 "open" + 4 "discover"). */
export const QS: readonly QsQuestion[] = [
  {
    ph: "open",
    tip: "How they answer reveals Extravert vs Introvert straight away.",
    ask: "Weekend how? Got plans or just stone at home?",
    opts: [
      { t: "Out with friends, events, always something on", d: "I", mb: { k: "EI", v: "E" } },
      { t: "Chill at home, rest, family time", d: "S", mb: { k: "EI", v: "I" } },
      { t: "Side project, gym, always productive", d: "D", mb: { k: "JP", v: "J" } },
      { t: "Research, read, sort things out", d: "C", mb: { k: "JP", v: "P" } },
    ],
  },
  {
    ph: "open",
    tip: "People person vs solo reveals trust-building approach needed.",
    ask: "You prefer working with people or doing things on your own?",
    opts: [
      { t: "Love working with others, energy from team", d: "I", mb: { k: "EI", v: "E" } },
      { t: "Prefer to figure things out alone first", d: "C", mb: { k: "EI", v: "I" } },
      { t: "Lead the team, delegate, outcome matters most", d: "D", mb: { k: "TF", v: "T" } },
      { t: "Work together but care a lot about how people feel", d: "S", mb: { k: "TF", v: "F" } },
    ],
  },
  {
    ph: "open",
    tip: "How they share wins reveals core driver and confidence level.",
    ask: "What is something you are proud of lately - work or personal?",
    opts: [
      { t: "Shares boldly - results, numbers, achievements", d: "D", mb: { k: "EI", v: "E" } },
      { t: "Gets excited telling story - people, journey, feelings", d: "I", mb: { k: "EI", v: "E" } },
      { t: "Modest - credits family or team more than self", d: "S", mb: { k: "TF", v: "F" } },
      { t: "Talks about completing something properly", d: "C", mb: { k: "TF", v: "T" } },
    ],
  },
  {
    ph: "open",
    tip: "Core work motivation = core DISC driver. This tells you the pitch language to use.",
    ask: "At work, what actually gets you fired up?",
    opts: [
      { t: "Winning, hitting targets, being the best", d: "D", mb: { k: "TF", v: "T" } },
      { t: "The people, vibes, recognition, team energy", d: "I", mb: { k: "TF", v: "F" } },
      { t: "Stability, good teammates, knowing what to expect", d: "S", mb: { k: "SN", v: "S" } },
      { t: "Doing things properly, quality, getting details right", d: "C", mb: { k: "SN", v: "N" } },
    ],
  },
  {
    ph: "discover",
    tip: "How they ended up in their career = how they make big life decisions.",
    ask: "How did you end up in your current job? Was it planned or just happened?",
    opts: [
      { t: "Deliberately chose it, switched industries - intentional", d: "D", mb: { k: "SN", v: "N" } },
      { t: "Fell into it through people and connections", d: "I", mb: { k: "SN", v: "N" } },
      { t: "Comfortable, grew into it, not shaking things up", d: "S", mb: { k: "SN", v: "S" } },
      { t: "Researched, compared options, made a logical choice", d: "C", mb: { k: "SN", v: "S" } },
    ],
  },
  {
    ph: "discover",
    tip: "Real passion reveals personality more honestly than any direct question.",
    ask: "Outside work, what do you actually enjoy? What will you always make time for?",
    opts: [
      { t: "Social - gatherings, events, meeting new people", d: "I", mb: { k: "EI", v: "E" } },
      { t: "Family time, quiet hobbies, community stuff", d: "S", mb: { k: "TF", v: "F" } },
      { t: "Achievement hobbies - sports, competition, building things", d: "D", mb: { k: "TF", v: "T" } },
      { t: "Investing, tech, learning, researching", d: "C", mb: { k: "SN", v: "N" } },
    ],
  },
  {
    ph: "discover",
    tip: "Planner vs spontaneous = Judging vs Perceiving. Critical for structuring your proposal.",
    ask: "You the type who plans everything or more just go with the flow?",
    opts: [
      { t: "Plan everything - itinerary, budget, calendar sorted", d: "C", mb: { k: "JP", v: "J" } },
      { t: "Spontaneous - boring to over-plan, see how first", d: "D", mb: { k: "JP", v: "P" } },
      { t: "Some planning but flexible, not too rigid", d: "S", mb: { k: "JP", v: "J" } },
      { t: "Depends, but I like knowing what is ahead", d: "I", mb: { k: "JP", v: "P" } },
    ],
  },
  {
    ph: "discover",
    tip: "Their real money worry = your emotional anchor for the whole conversation.",
    ask: "If you honest with me - what is the one money thing at the back of your mind?",
    opts: [
      { t: "Income protection - what if something happens to me", d: "S", mb: { k: "TF", v: "F" } },
      { t: "Not growing fast enough, missing good opportunities", d: "D", mb: { k: "SN", v: "N" } },
      { t: "Specific gap - numbers feel off, coverage not right", d: "C", mb: { k: "TF", v: "T" } },
      { t: "General anxiety - do not know where to start, feel behind", d: "I", mb: { k: "TF", v: "F" } },
    ],
  },
];

/** The 5 non-verbal observation groups (53 items, ids a1–e16). */
export const NVG: readonly NvGroup[] = [
  {
    em: "🤚",
    tt: "First 30 Seconds",
    st: "Arrival, greeting, first impression",
    items: [
      { id: "a1", t: "Firm brief handshake - one pump, done", d: "D" },
      { id: "a2", t: "Warm handshake, two hands or touched arm", d: "I" },
      { id: "a3", t: "Gentle moderate grip, pleasant not a power move", d: "S" },
      { id: "a4", t: "Precise measured grip, just right pressure", d: "C" },
      { id: "a5", t: "Arrived early, came with notes or agenda", d: "C" },
      { id: "a6", t: "On time but still finishing a call or WhatsApp", d: "I" },
      { id: "a7", t: "Sharp status-signalling outfit, power dressing", d: "D" },
      { id: "a8", t: "Colourful, expressive, on-trend clothing", d: "I" },
      { id: "a9", t: "Comfortable classic understated - nothing flashy", d: "S" },
      { id: "a10", t: "Smart but functional, neat and conservative", d: "C" },
    ],
  },
  {
    em: "🚹",
    tt: "Posture & Energy",
    st: "How they sit and carry themselves",
    items: [
      { id: "b1", t: "Leans forward, takes up space confidently", d: "D" },
      { id: "b2", t: "Sits close, animated, comfortable with small distance", d: "I" },
      { id: "b3", t: "Slight angle, non-confrontational and calm", d: "S" },
      { id: "b4", t: "Sits slightly back, needs intellectual space", d: "C" },
      { id: "b5", t: "Arms crossed but body faces you - assertive not cold", d: "D" },
      { id: "b6", t: "Arms open, relaxed, genuinely warm", d: "S" },
      { id: "b7", t: "Very still, controlled posture, minimal fidgeting", d: "C" },
      { id: "b8", t: "Checks phone or watch when conversation drags", d: "D" },
      { id: "b9", t: "Taps fingers or table when things slow down", d: "D" },
    ],
  },
  {
    em: "👁",
    tt: "Eye Contact & Face",
    st: "What their face and eyes are communicating",
    items: [
      { id: "c1", t: "Strong direct eye contact, holds your gaze", d: "D" },
      { id: "c2", t: "Frequent warm eye contact, breaks away to scan room", d: "I" },
      { id: "c3", t: "Soft steady eye contact, caring not challenging", d: "S" },
      { id: "c4", t: "Intermittent, looks away while thinking", d: "C" },
      { id: "c5", t: "Minimal facial animation, neutral focused expression", d: "D" },
      { id: "c6", t: "Very animated face, eyebrows move, reactions visible", d: "I" },
      { id: "c7", t: "Pleasant subdued smile, genuine not performative", d: "S" },
      { id: "c8", t: "Slight frown while thinking - concentration not displeasure", d: "C" },
      { id: "c9", t: "Laughs easily, even at own jokes", d: "I" },
    ],
  },
  {
    em: "🗣",
    tt: "How They Speak",
    st: "Pace, tone and the questions they ask",
    items: [
      { id: "d1", t: "Fast pace, every word deliberate, no filler words", d: "D" },
      { id: "d2", t: "Fast-medium, enthusiastic bursts, may trail off", d: "I" },
      { id: "d3", t: "Slow measured, pauses before answering", d: "S" },
      { id: "d4", t: "Slow and precise, every word carefully chosen", d: "C" },
      { id: "d5", t: "Direct: What's the return? What's the catch?", d: "D" },
      { id: "d6", t: "Open: What do people usually do? What's the story?", d: "I" },
      { id: "d7", t: "Soft: What would happen if...? Is it safe to...?", d: "S" },
      { id: "d8", t: "Precise: Where does that figure come from?", d: "C" },
      { id: "d9", t: "Takes notes or asks to note things down", d: "C" },
    ],
  },
  {
    em: "📷",
    tt: "How They React to You",
    st: "Observable in any cafe, lobby or meeting room",
    items: [
      { id: "e1", t: "Cuts your intro short - gets to the point themselves", d: "D" },
      { id: "e2", t: "Asks about you first before talking about themselves", d: "I" },
      { id: "e3", t: "Lets you finish every sentence, does not interrupt", d: "S" },
      { id: "e4", t: "Asks a clarifying question before answering yours", d: "C" },
      { id: "e5", t: "Phone face down or fully away the whole meeting", d: "D" },
      { id: "e6", t: "Phone on table, glances at notifications casually", d: "I" },
      { id: "e7", t: "Phone away, fully present, unhurried energy", d: "S" },
      { id: "e8", t: "Pulled out pen or opened notes app to write things down", d: "C" },
      { id: "e9", t: "Ordered quickly and decisively - no deliberating", d: "D" },
      { id: "e10", t: "Chatted with server or made a comment about the place", d: "I" },
      { id: "e11", t: "Polite and patient with service staff, no fuss", d: "S" },
      { id: "e12", t: "Asked what something contained before ordering", d: "C" },
      { id: "e13", t: "Bag or wallet is premium, functional, low-key status", d: "D" },
      { id: "e14", t: "Accessories expressive - phone case, bag has personality", d: "I" },
      { id: "e15", t: "Brought something practical - notebook, folder, name cards", d: "C" },
      { id: "e16", t: "Reacted warmly when family or personal topic came up", d: "S" },
    ],
  },
];

/** The 4 DISC profile content blocks, keyed by primary letter. */
export const PR: Record<DiscLetter, DiscProfile> = {
  D: {
    nm: "Dominant",
    em: "🎯",
    col: "#C0392B",
    sg: "This one damn bo chup the process - they want the answer not the story. Talk results, talk outcome, talk ROI. Waste their time and they will paiseh-ghost you quietly.",
    op: '"Eh, I will be straight with you - I looked at your situation and there are two things we can lock in today that will make a real difference. Can I show you?"',
    mb: "Usually ESTJ, ENTJ or ESTP",
    tr: ["Direct", "Results-driven", "Decisive", "Competitive", "Fast-paced"],
    dos: [
      "Get to the point fast - no fluff, no warm-up",
      "Lead with outcome and numbers: how much, by when",
      "Give them control - let them feel they are deciding",
      "Be confident and direct, not eager to please",
      "Keep meetings short and purposeful",
    ],
    dnts: [
      "Do not do long intros - they will check out",
      "Never be wishy-washy - maybe and see-how kills credibility",
      "Do not over-explain unless they specifically ask",
      "Do not be submissive - they want a peer not an order-taker",
    ],
    st: "Fast, outcome-focused, minimal filler. Be confident. Let them feel in control of the decision at all times.",
    wf: "Checks phone or watch? Losing them - cut to value NOW. Goes very quiet? Ask a direct question. Starts wrapping up early? Close with a clear next step before they leave.",
    fu: "WhatsApp is fine. Keep it short. Eh [Name], following up on what we discussed. Here is what I need from you to proceed. They respect efficiency above all.",
    msgs: {
      engage: {
        lbl: "Engage & Open",
        items: [
          "Eh [Name], straight to it — I saw one gap in what you shared that most people your age overlook until it is too late. Worth 10 minutes to hear it?",
          "Based on what you told me, I can show you exactly how much you are leaving on the table right now. Numbers ready — when are you free?",
          "I will not waste your time. What I have for you is specific to your situation, not a generic plan. Give me one shot to show you.",
          "You mentioned [goal]. I have seen people at your stage either lock that in or lose it completely depending on one decision. Let me show you which side you are on.",
          "I respect that you are busy. This will take 30 minutes max and I promise you will leave with something useful even if you decide not to move forward.",
        ],
      },
      appt: {
        lbl: "Set Next Appointment",
        items: [
          "Eh [Name], I have what you need ready. Are you free [Day] at [Time] or [Alt Day]? Pick one and I will confirm.",
          "Next step — I want to show you the actual numbers. 30 minutes, your call on when. What works this week?",
          "I have blocked some time [Day] afternoon for you. Does that work or do you need me to shift?",
          "Let us lock in the next meeting now while we are here. [Day] or [Alt Day] — which one?",
          "I will send you a calendar invite. If the time does not work, just tell me and I will adjust immediately.",
        ],
      },
      followup: {
        lbl: "Follow-Up Messages",
        items: [
          "Eh [Name]. Following up on what we discussed. Here is what I need from you to get this moving: [action]. Can you get that to me by [date]?",
          "[Name], just checking — did you get a chance to look at what I sent? Let me know if anything needs clarification.",
          "Quick update — I ran the numbers based on our chat. The picture is clear. When can we meet to go through it?",
          "[Name], one thing I forgot to mention that is relevant to you: [point]. Worth a quick call this week?",
          "Still keen to help you lock this in before [deadline]. Ball is in your court — let me know.",
        ],
      },
      objections: {
        lbl: "Handle Objections",
        items: [
          "WANT TO THINK: What specifically are you thinking about? Give me the one thing holding you back and let me address it directly.",
          "COMPARE FIRST: Go ahead. I am confident in what I built for you. Come back with what you find and I will match it point for point.",
          "TOO EXPENSIVE: What is the cost of NOT having this in place if something happens? That is the real number worth thinking about.",
          "NOT THE RIGHT TIME: There is never a perfect time — but there is a real cost to waiting. Let me show you what one year of delay looks like in figures.",
          "NEED SPOUSE: Perfect — I want to meet them too. Let us set a time when all three of us can sit down together.",
          "NOT INTERESTED: Is it the product, the timing, or something about how I presented it? I would rather know than guess.",
        ],
      },
      close: {
        lbl: "Ask for the Close",
        items: [
          "Alright [Name], everything checks out. Let us get this done today — what is the best way for you to proceed?",
          "You have seen the numbers, you know the gap. The only question left is whether you want to close it now or later.",
          "I need one thing from you to move forward: your decision. In or out — I can work with either answer.",
          "Based on everything we have covered, this is the right move for where you want to go. Let us lock it in.",
          "What would it take for you to say yes today? Tell me and I will make it happen.",
        ],
      },
    },
  },
  I: {
    nm: "Influential",
    em: "✨",
    col: "#D4680A",
    sg: "This one love to talk, love people, love being liked. They will share their whole life story if you let them. Use that. Build the relationship first - everything flows naturally from there.",
    op: '"Wah [Name]! Good to finally meet you properly. [Friend] always say good things about you. I heard you have been doing quite well in [area]?"',
    mb: "Usually ENFP, ESFP or ENTP",
    tr: ["Enthusiastic", "Social", "Optimistic", "Talkative", "People-first"],
    dos: [
      "Be warm, match their energy - do not be stiff",
      "Share client stories: my friend same situation, you know what happened...",
      "Let them talk - show genuine interest in their life",
      "Use humour naturally - they love people who can laugh",
      "Drop common connections - social proof works powerfully",
    ],
    dnts: [
      "Do not dump data on them - eyes glaze over immediately",
      "Do not be cold or transactional - relationship IS the product",
      "Do not skip the social part - straight to business feels rude",
      "Do not make them feel alone in this - many people like you also...",
    ],
    st: "Warm, story-led, celebratory. Match their enthusiasm. Make the meeting feel like catching up with a friend - not a sales call.",
    wf: "Goes quiet suddenly? You said something transactional - warm it up. Looking around the room? Tell a story or ask about them personally.",
    fu: "WhatsApp works great. Reference something personal from last meeting. Eh [Name], hope your [thing they mentioned] went well! Following up on our chat...",
    msgs: {
      engage: {
        lbl: "Engage & Open",
        items: [
          "Eh [Name]! Was so great catching up. You remind me of another client — same energy, same stage of life. The thing I helped them with — I think it applies to you too leh.",
          "You know what I keep thinking about after our chat? The thing you said about [topic]. That actually points to something important I want to share with you.",
          "[Name] your story is quite inspiring sia. That is exactly why what I do matters — I want to make sure people like you are properly protected while building all this.",
          "I shared what you told me with my colleague (without names lah) and he said — eh this one really needs sorting soon. Let me share why.",
          "Been thinking about you since we met. I have a story about someone in your exact situation — ended up changing everything for them. Can I share it?",
        ],
      },
      appt: {
        lbl: "Set Next Appointment",
        items: [
          "Eh let us catch up properly! I will bring the full picture — you bring the coffee order haha. When are you free?",
          "[Name], I have something really exciting to show you. The kind of thing you will want to tell your friends about. Coffee this [Day]?",
          "Let us make it a proper session — not rushed. I will clear my schedule for you. [Day] work?",
          "Your friend [mutual contact] says hi by the way! Let us meet up — I have got stuff to show you that is relevant to your life right now.",
          "Can we lock in [Day]? I want to show you something in person — it hits differently than over WhatsApp.",
        ],
      },
      followup: {
        lbl: "Follow-Up Messages",
        items: [
          "Eh [Name]! Hope [thing they mentioned] went well! Been meaning to follow up — got something to share that I think you will find really interesting.",
          "Hey! Just saw something that reminded me of what you shared. Think you should see this. When can we catch up?",
          "[Name] thinking of you! How did [event] go? Also — quick question on what we discussed. Got a minute?",
          "Hey just checking in! No pressure at all — just wanted to make sure you are doing well and see if you had any questions.",
          "Wah [Name] time flies sia. It has been [X] weeks! Let me know when you want to continue — I have got updates for you.",
        ],
      },
      objections: {
        lbl: "Handle Objections",
        items: [
          "WANT TO THINK: Of course! Let me share what happened with a client in the same situation — ended up being the best decision they made.",
          "TOO EXPENSIVE: It is not about the amount — it is about what it means for the people you care about. Let me show you what I mean.",
          "NOT INTERESTED: No worries at all! Can I ask — was it anything I said or just not the right time? Just want to learn.",
          "NEED SPOUSE: Yes! Bring them along next time. I love meeting the whole family — the more the merrier honestly.",
          "ALREADY HAVE COVERAGE: Most people who say that have gaps they do not know about. Let me just do a quick check — no commitment.",
          "FRIEND SAID NOT WORTH IT: Your situation is different from your friend — let me show you why what I built is specifically for you.",
        ],
      },
      close: {
        lbl: "Ask for the Close",
        items: [
          "Honestly [Name] I am quite excited for you. This is going to make such a difference. Shall we get it sorted today?",
          "You know what I love about working with people like you? You actually get it. Let us make it official — how do you want to proceed?",
          "The clients who moved forward always say they wish they did it sooner. Let us do this.",
          "I just need your go-ahead and I will handle everything from here. What do you say?",
          "Imagine telling your friends — eh I finally sorted this out. That day can be today. Shall we?",
        ],
      },
    },
  },
  S: {
    nm: "Steady",
    em: "🛡",
    col: "#1A7A40",
    sg: "This one is the ultimate long-term client - loyal like nobody business once they trust you. But do not rush. Too pushy and they will quietly disappear. Slow down, be consistent, always involve the family.",
    op: '"[Name], thank you for making time ah. Before we start, just want you to know - today no pressure one. I just want to understand your situation better first, can?"',
    mb: "Usually ISFJ, ESFJ or ISTJ",
    tr: ["Loyal", "Patient", "Calm", "Family-centred", "Risk-averse"],
    dos: [
      "Slow down your pace - match their calm energy completely",
      "Build trust first - do not pitch until they are comfortable with you",
      "Always involve the spouse or family - decisions made together",
      "Emphasise security and certainty - this protects you no matter what",
      "Give them time - never pressure a decision in the same meeting",
    ],
    dnts: [
      "Never rush or pressure - they will quietly disappear",
      "Do not skip relationship-building to get to product faster",
      "Do not talk big changes - frame as protecting what they have",
      "Never argue - they avoid conflict and will just avoid you instead",
    ],
    st: "Calm, patient, family-anchored. Let silences breathe - they need processing time. Always anchor to protecting your family, not just growing your wealth.",
    wf: "Goes very still and quiet? Uncomfortable - slow down and check in gently. Shoulders tense? You moved too fast - reassure and step back.",
    fu: "WhatsApp is fine but be warm. Always check in on something personal first. Never pressure for a decision via message. If slow to reply, give space - do not double message.",
    msgs: {
      engage: {
        lbl: "Engage & Open",
        items: [
          "[Name], no rush at all. I just want to make sure whatever we do genuinely fits your situation and your family. Can we take our time and go through it properly?",
          "You mentioned [concern]. That is exactly what I want to help you protect. Can I show you what that looks like in practice?",
          "I want you to feel completely comfortable before we go any further. Is there anything from our last conversation you are still unsure about?",
          "Most clients at your stage just want something simple, reliable, and that they do not have to worry about. That is exactly what I want to build for you.",
          "I am not here to push anything. I just want to make sure you and your family are in a good position no matter what happens. Can we explore that together?",
        ],
      },
      appt: {
        lbl: "Set Next Appointment",
        items: [
          "[Name], when is a good time that works for both you and your spouse? I would love both of you to be there — it concerns both of you after all.",
          "No rush at all — whenever you feel ready. What does your schedule look like this week or next?",
          "I was thinking we could meet somewhere you are comfortable — your usual kopitiam or wherever suits you. Where do you prefer?",
          "Let us set something up at a relaxed time — no rushing. What works best for your week?",
          "I will leave it to you to pick the time. Whenever you feel ready, just let me know and I will make it work.",
        ],
      },
      followup: {
        lbl: "Follow-Up Messages",
        items: [
          "Hi [Name], hope you and the family are well! Just checking in from our last chat — no pressure at all, just wanted to see if you had any thoughts.",
          "[Name], hope everything is okay. Whenever you are ready to continue, I am here. No rush at all.",
          "Hi [Name]! Hope [family event or thing they mentioned] went smoothly! When you have a moment, would love to catch up.",
          "Just wanted to let you know I am still here whenever you are ready. Take your time — I am not going anywhere.",
          "[Name], I was thinking about your situation and just wanted to share one thing: [reassurance or point]. Hope that helps. Talk soon.",
        ],
      },
      objections: {
        lbl: "Handle Objections",
        items: [
          "NEED TO THINK: Of course — take the time you need. Can I ask what specifically you would like to think over? I want to make sure I have answered everything.",
          "NEED SPOUSE AGREEMENT: Absolutely — let us set a time when all three of us can sit down properly. I do not want you deciding without them.",
          "WORRIED ABOUT COMMITMENT: Let us go through exactly what the commitment looks like step by step — nothing locked in until you are fully comfortable.",
          "FEELS LIKE A LOT: Let us slow down and take it one piece at a time. What part feels most important to you right now?",
          "NOT SURE IF AFFORDABLE: Let us look at the numbers together slowly. Whatever we do needs to fit comfortably — not strain anything.",
          "WHAT IF COMPANY SHUTS DOWN: Really good question. Let me walk you through exactly how your money is protected — it is more secure than most people realise.",
        ],
      },
      close: {
        lbl: "Ask for the Close",
        items: [
          "[Name], I feel like we have covered everything thoroughly. Do you feel ready to move forward — at your own pace?",
          "From everything we have discussed, I genuinely believe this is the right protection for your family. Shall we get it sorted so you can stop worrying?",
          "Is there anything at all that is still making you hesitate? I want to address every concern before we go ahead.",
          "This will give you and your family peace of mind for years to come. Whenever you feel ready, just say the word.",
          "You have been so thoughtful about this — I really respect that. I think you already know this is the right thing to do. Shall we?",
        ],
      },
    },
  },
  C: {
    nm: "Conscientious",
    em: "🔬",
    col: "#1A5F8A",
    sg: "This one kiasu in the best possible way - will research everything, ask every question, take their time. Do not fight it. Be the most prepared person in the room. Clean numbers plus solid logic equals incredibly loyal client.",
    op: '"[Name], I have prepared a full breakdown based on what you shared. Before I show you - any specific area you want me to make sure I cover?"',
    mb: "Usually INTJ, INTP or ISTJ",
    tr: ["Analytical", "Detail-focused", "Systematic", "Kiasu (best way)", "Quality-driven"],
    dos: [
      "Come fully prepared - full data, source documents, no gaps",
      "Be precise - let me confirm and get back to you beats guessing",
      "Give them time to review - never talk while they are reading",
      "Welcome every question - it means they are seriously considering",
      "Use facts - per MAS regulation, historically this returned",
    ],
    dnts: [
      "Never be sloppy or unprepared - instant credibility kill",
      "Never rush their decision - time taken is a GOOD sign",
      "Do not make big claims - they will fact-check everything",
      "Do not rely on emotion alone - feelings do not move C-types, facts do",
    ],
    st: "Precise, fact-based, patient. Let them lead with questions. Never fill silence during document review - it is normal and good, do not perform enthusiasm.",
    wf: "Stops taking notes? Lost interest or found inconsistency - pause and ask what is on their mind. Asks same detail twice? Something is off - address it head-on.",
    fu: "Email works well - gives them something to review properly. WhatsApp fine but keep it factual. Always confirm what was discussed in writing.",
    msgs: {
      engage: {
        lbl: "Engage & Open",
        items: [
          "[Name], I have put together a full breakdown based on what you shared. Before I walk you through it — is there any specific area you want me to make sure I have covered?",
          "I pulled the actual data on the product you asked about. Let me walk you through the real numbers — not the brochure version.",
          "Good question you raised last time about [detail]. I went back and checked — here is the precise answer with the source.",
          "I know you like to have all the information before deciding. I have prepared a full comparison. Want to go through it point by point?",
          "I want to be upfront — there are three things about your current plan that do not add up. I have documented all three with the figures. Can I walk you through them?",
        ],
      },
      appt: {
        lbl: "Set Next Appointment",
        items: [
          "[Name], I have the full proposal ready with all figures and documentation. Can we meet [Day] at [Time] to go through it properly?",
          "I will send you a summary before we meet so you can read it at your own pace first. Then when we sit down, you can ask me anything. Does [Day] work?",
          "I want to bring the actual policy document so you can read the exact terms yourself. When are you free?",
          "I have run three different scenarios based on your situation. It will take about 45 minutes to go through everything properly — when works?",
          "Let us schedule properly — not rushed. I want you to have time to ask every question. What day gives you the most headspace?",
        ],
      },
      followup: {
        lbl: "Follow-Up Messages",
        items: [
          "[Name], following up on our meeting. I have written a summary of everything we discussed and attached it here for your reference. Let me know if any figures need clarification.",
          "Hi [Name], did you get a chance to review what I sent? No rush — just want to make sure you have everything you need to make a properly informed decision.",
          "[Name], I checked on the specific question you raised about [detail]. Here is the exact answer with the source. Happy to clarify further.",
          "Just a note — the figures I quoted are valid until [date]. Wanted to make sure you had that information.",
          "Hi [Name], I have updated the comparison table based on the additional info you gave me. The numbers now reflect your exact situation.",
        ],
      },
      objections: {
        lbl: "Handle Objections",
        items: [
          "WANT TO COMPARE: Please do. Here is a checklist of the exact criteria you should compare — I have already filled in my proposal against each point.",
          "RETURNS NOT HIGH ENOUGH: Fair concern. Let me show you the audited 10-year track record and break down exactly where the returns come from.",
          "HIDDEN FEES: Let me show you the full fee disclosure document — every charge itemised. Take your time to read it.",
          "NEED MORE TIME TO STUDY: Of course. I will prepare a full written summary — everything we discussed, all figures, exact terms. Study it at your own pace.",
          "FRIEND GOT BETTER RETURNS: Can you find out exactly what product and period? I will do a proper like-for-like comparison — same basis, not assumptions.",
          "WHAT IF I NEED TO STOP MIDWAY: Let me show you the surrender values at each year — I have the table here. No assumptions, just actual numbers.",
        ],
      },
      close: {
        lbl: "Ask for the Close",
        items: [
          "[Name], we have gone through all the details thoroughly. Is there any remaining question you have not yet had answered? I want to be sure before we proceed.",
          "Based on your criteria — protection, returns, and flexibility — this proposal meets all three. Want to walk through the checklist one more time?",
          "I can provide everything in writing before you sign — full summary, key terms, all figures. Once you are satisfied, shall we proceed?",
          "You have had all the information for [X] days now. What is the remaining gap between where you are and a decision?",
          "If there is one last concern standing between you and moving forward, tell me what it is and I will address it with documentation — not just words.",
        ],
      },
    },
  },
};
