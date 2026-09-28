import { type Answers, questions } from "./eligibility";

const KEY = "hostsafe:pending-result";
const valid = new Set(["yes", "no", "unsure"]);

/** Keeps answers in this browser only, until the user is signed in. */
export function stashPendingResult(answers: Answers) {
  try {
    localStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    // Storage may be blocked; the user can simply redo the check.
  }
}

/** Returns clean, complete answers, or null if nothing valid is stashed. */
export function readPendingResult(): Answers | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean: Answers = {};
    for (const q of questions) {
      const v = parsed[q.id];
      if (typeof v !== "string" || !valid.has(v)) return null;
      clean[q.id] = v as Answers[string];
    }
    return clean;
  } catch {
    return null;
  }
}

export function clearPendingResult() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do.
  }
}
