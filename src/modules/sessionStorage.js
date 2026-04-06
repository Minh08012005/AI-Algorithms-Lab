import { graphsData } from "../data/graphsData";
import { getAlgorithmTrace } from "./searchEngine";

export const STORAGE_KEY = "ai-lab-search-practice-v1";

const normPersist = (s) => (s || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();

export function validatePersistedSession(s, trace) {
  if (!s || s.v !== 1 || !Array.isArray(trace) || trace.length < 1)
    return false;
  if (!["DFS", "BFS", "DLS"].includes(s.algo)) return false;
  if (
    typeof s.graphIdx !== "number" ||
    s.graphIdx < 0 ||
    s.graphIdx >= graphsData.length
  )
    return false;
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
    if (normPersist(hi.expand) !== normPersist(tr.expand)) return false;
    if (normPersist(hi.q) !== normPersist(tr.q)) return false;
    if (normPersist(hi.l) !== normPersist(tr.l)) return false;
    const goalRow = !!tr.isGoal;
    const adjHi = normPersist(hi.adj);
    const adjTr = normPersist(tr.adj);
    if (goalRow && i === s.history.length - 1) {
      const okTtkt = adjHi === normPersist("TTKT/DỪNG");
      if (!okTtkt && adjHi !== adjTr) return false;
    } else {
      if (adjHi !== adjTr) return false;
    }
  }
  return true;
}

export function loadInitialPracticeState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    const g = graphsData[s.graphIdx];
    if (!g) return null;
    const { trace } = getAlgorithmTrace(g, s.algo);
    if (!validatePersistedSession(s, trace)) return null;
    return s;
  } catch {
    return null;
  }
}

export function savePracticeState(state) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
