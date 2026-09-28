export type Answer = "yes" | "no" | "unsure";

export type Question = {
  id: string;
  text: string;
  hint: string;
  /** The answer that fits a small, simple property. Anything else is flagged. */
  expected: Answer;
};

export const questions: Question[] = [
  {
    id: "england",
    text: "Is the property in England?",
    hint: "HostSafe is written with England in mind. Rules and guidance can differ in Scotland, Wales and Northern Ireland.",
    expected: "yes",
  },
  {
    id: "self-catering",
    text: "Is it used as self-catering holiday accommodation?",
    hint: "For example, guests book the whole property and look after themselves, with no meals or staff on site.",
    expected: "yes",
  },
  {
    id: "floors",
    text: "Does it have two floors or fewer?",
    hint: "Count every level guests can use, including a converted loft or basement.",
    expected: "yes",
  },
  {
    id: "guests",
    text: "Does it accommodate 10 overnight guests or fewer?",
    hint: "Think of the most people who can sleep there at one time.",
    expected: "yes",
  },
  {
    id: "layout",
    text: "Does it have a simple layout and a clear escape route?",
    hint: "For example, a straightforward route out that guests can follow without going through risky rooms.",
    expected: "yes",
  },
  {
    id: "unusual",
    text: "Are there any unusual fire risks, shared escape routes, or circumstances you are unsure about?",
    hint: "For example, shared stairs or doors with neighbours, unusual heating or cooking set-ups, or anything that makes you hesitate.",
    expected: "no",
  },
];

export type Answers = Partial<Record<string, Answer>>;

/** True if any answer differs from what a small, simple property would give. */
export function mayNeedTailoredAdvice(answers: Answers): boolean {
  return questions.some((q) => answers[q.id] !== q.expected);
}

export const unsuitableMessage =
  "HostSafe is designed for small, simple properties. Based on your answers, your property may need more tailored fire-safety advice. Consider speaking with a competent fire-risk assessor.";

export const suitableMessage =
  "Based on your answers, your property appears to fit the small, simple type of property HostSafe is designed for. HostSafe is an organisational and educational tool. It is not a fire-risk assessment, and it cannot tell you whether your property meets any legal requirement.";
