import { type Answers, parseAnswers } from "./eligibility";

const KEY = "hostsafe:pending-result";

/** Keeps answers in this browser only, until the user is signed in. */
export function stashPendingResult(answers: Answers) {
  try {
    localStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    // Storage may be blocked; the user can simply redo the check.
  }
}

/** The raw stored string (stable between reads), or null. */
export function readPendingRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Parses a raw stored value into clean, complete answers, or null. */
export function parsePendingRaw(raw: string | null): Answers | null {
  if (!raw) return null;
  try {
    return parseAnswers(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Returns clean, complete answers, or null if nothing valid is stashed. */
export function readPendingResult(): Answers | null {
  return parsePendingRaw(readPendingRaw());
}

export function clearPendingResult() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do.
  }
}
