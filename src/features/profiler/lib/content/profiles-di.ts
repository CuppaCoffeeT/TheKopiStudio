/**
 * DISC profile content blocks D + I — verbatim port of the legacy app's
 * `public/js/data.js`. Re-assembled into `PR` in `./profiles`.
 *
 * PARITY CONTRACT (do not edit copy without a versioning decision — see PRD):
 * - HTML entities / — escapes from the legacy source are converted to
 *   literal unicode here (emoji and em-dashes are literal characters).
 * - The `op` opening lines keep their embedded double quotes — part of the copy.
 * - `msgs` key order is engage/appt/followup/objections/close with
 *   5/5/5/6/5 items per profile (26 statements x 4 profiles).
 */

import type { DiscProfile } from '../../types';

export const PROFILE_D: DiscProfile = {
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
};

export const PROFILE_I: DiscProfile = {
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
};
