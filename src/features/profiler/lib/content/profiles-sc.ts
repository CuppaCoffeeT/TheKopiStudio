/**
 * DISC profile content blocks S + C — verbatim port of the legacy app's
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

export const PROFILE_S: DiscProfile = {
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
};

export const PROFILE_C: DiscProfile = {
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
};
