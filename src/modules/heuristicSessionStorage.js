import { heuristicGraphsData } from "../data/heuristicGraphsData";
import { getAlgorithmTrace } from "./heuristicEngine";

export const STORAGE_KEY = "ai-lab-heuristic-practice-v1";

const normalize = (s) => (s || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();

export function validatePersistedHeuristicSession(s, trace, algo) {
  if (!s || s.v !== 1 || !Array.isArray(trace) || trace.length < 1) return false;
  if (!algo || !["BEST_FIRST", "HILL_CLIMBING", "A_STAR"].includes(algo))
    return false;
  if (s.algo !== algo) return false;
  if (
    typeof s.graphIdx !== "number" ||
    s.graphIdx < 0 ||
    s.graphIdx >= heuristicGraphsData.length
  ) {
    return false;
  }
  if (!Array.isArray(s.history) || s.history.length === 0) return false;

  const completed = !!s.completed;
  const step = s.step;
  if (typeof step !== "number" || step < 1) return false;

  if (completed) {
    if (!trace[step]?.isGoal) return false;
    if (s.history.length !== step + 1) return false;
  } else {
    if (s.history.length !== step) return false;
    if (step >= trace.length) return false;
  }

  for (let i = 0; i < s.history.length; i++) {
    const tr = trace[i];
    const hi = s.history[i];
    if (!tr || !hi) return false;
    if (normalize(hi.expand) !== normalize(tr.expand)) return false;
    if (normalize(hi.l) !== normalize(tr.l)) return false;

    const expectedThird = algo === "HILL_CLIMBING" ? tr.l1 || tr.q : tr.q || tr.l1;
    const storedThird = hi.third ?? hi.q ?? hi.l1;
    if (normalize(storedThird) !== normalize(expectedThird)) return false;

    const goalRow = !!tr.isGoal;
    const adjHi = normalize(hi.adj);
    const adjTr = normalize(tr.adj);
    if (goalRow && i === s.history.length - 1) {
      const okTtkt = adjHi === normalize("TTKT/DỪNG");
      if (!okTtkt && adjHi !== adjTr) return false;
    } else {
      if (adjHi !== adjTr) return false;
    }
  }

  return true;
}

export function loadInitialHeuristicPracticeState(algo) {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const s = JSON.parse(raw);
    const g = heuristicGraphsData[s.graphIdx];
    if (!g) return null;

    const { trace } = getAlgorithmTrace(g, s.algo);
    if (!validatePersistedHeuristicSession(s, trace, algo)) return null;
    return s;
  } catch {
    return null;
  }
}