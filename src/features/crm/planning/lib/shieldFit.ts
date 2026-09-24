/**
 * Shield fit finder — eight questions, each option scoring points toward
 * Singlife or Income. Verbatim from `shield-comparison.html`: a three-point
 * answer means one insurer simply lacks the benefit; a one-pointer is a real
 * but modest edge. It shortlists, it does not decide.
 */

export interface FitQuestion {
  question: string;
  options: readonly string[];
  /** Points toward Singlife, per option. */
  singlife: readonly number[];
  /** Points toward Income, per option. */
  income: readonly number[];
  why: string;
}

export const FIT_QUESTIONS: readonly FitQuestion[] = [
  {
    question: 'What worries them most about hospital costs?',
    options: [
      'Cancer drug bills',
      'A big hospital bill of any kind',
      'Keeping the premium affordable for life',
    ],
    singlife: [0, 1, 3],
    income: [3, 0, 0],
    why: 'Income covers 23× the MediShield Life limit on CDL drugs against Singlife’s 5× plus $10,000, and pays more on drugs off the list. Singlife is cheaper at every age.',
  },
  {
    question: 'Is the life assured a child under 18?',
    options: ['Yes', 'No'],
    singlife: [0, 0],
    income: [3, 0],
    why: 'The strongest case for Income anywhere. CAR-T $250,000 against $150,000, proton beam $100,000 against $70,000, and a $50,000 Critical Care Benefit for four or more days in ICU. Paediatric cancers are where these actually get used.',
  },
  {
    question: 'Do they insist on a particular specialist?',
    options: ['Yes, a named doctor', 'No, happy with a panel doctor', 'Not sure yet'],
    singlife: [0, 0, 1],
    income: [2, 0, 0],
    why: 'Income’s Extended Panel charges 8% but keeps the $6,000 cap. Singlife has no such tier, though its off-panel rate is 5%.',
  },
  {
    question: 'Personal or family history of cancer?',
    options: ['Yes', 'No'],
    singlife: [0, 0],
    income: [2, 0],
    why: 'Income covers surveillance screening for a client with a cancer history, and genetic testing ordered to decide treatment. Singlife’s contract covers neither.',
  },
  {
    question: 'Would they seek treatment abroad if it were better there?',
    options: ['Yes, planned overseas matters', 'Emergency cover abroad is enough'],
    singlife: [3, 0],
    income: [0, 0],
    why: 'Income excludes planned overseas treatment outright. Singlife covers it through a Medisave-accredited referral.',
  },
  {
    question: 'Likely to need day surgery or scopes in the next few years?',
    options: ['Yes', 'No'],
    singlife: [2, 0],
    income: [0, 0],
    why: 'Singlife’s day surgery deductible is $2,000 against Income’s $3,500. On a $3,000 scope Income pays nothing at all.',
  },
  {
    question: 'Is the premium the binding constraint?',
    options: ['Yes, budget is tight', 'No, they want the strongest cover', 'Somewhere in between'],
    singlife: [3, 0, 1],
    income: [0, 1, 0],
    why: 'Singlife is cheaper at every single age. Check this client’s actual gap on the Premium tab.',
  },
  {
    question: 'Where are they insured today?',
    options: ['Nowhere, this is new cover', 'Already on one of these two', 'With another insurer'],
    singlife: [0, 2, 0],
    income: [0, 0, 0],
    why: 'Moving an existing policyholder restarts full medical underwriting on both insurers, and anything diagnosed since can be excluded. Rarely worth it for a few hundred dollars a year.',
  },
];

/** One answer per question; null = unanswered. */
export type FitAnswers = readonly (number | null)[];

export interface FitScore {
  singlife: number;
  income: number;
  answered: number;
  lean: 'none' | 'close' | 'singlife' | 'income';
}

/** A margin under three points is "too close to call". */
export function scoreFit(answers: FitAnswers): FitScore {
  let singlife = 0;
  let income = 0;
  let answered = 0;
  FIT_QUESTIONS.forEach((q, index) => {
    const choice = answers[index];
    if (choice === null || choice === undefined) return;
    singlife += q.singlife[choice];
    income += q.income[choice];
    answered += 1;
  });
  const diff = singlife - income;
  const lean =
    answered === 0 ? 'none' : Math.abs(diff) < 3 ? 'close' : diff > 0 ? 'singlife' : 'income';
  return { singlife, income, answered, lean };
}
