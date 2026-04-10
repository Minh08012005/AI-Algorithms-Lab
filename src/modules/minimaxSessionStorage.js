// Minimax Practice Session Persistence
// localStorage pattern: STORAGE_KEY variant for Minimax

import { minimaxGraphsData } from "../data/minimaxGraphsData";
import { getMinimaxTrace } from "./minimaxEngine";

export const STORAGE_KEY = "ai-lab-minimax-practice-v1";

export function validatePersistedSession(state, trace) {
  if (!state || state.v !== 1) return false;
  if (!Array.isArray(trace) || trace.length < 1) return false;
  if (
    typeof state.graphIdx !== "number" ||
    state.graphIdx < 0 ||
    state.graphIdx >= minimaxGraphsData.length
  )
    return false;
  if (typeof state.step !== "number" || state.step < 0) return false;
  if (!Array.isArray(state.history)) return false;
  if (typeof state.score !== "number" || state.score < 0) return false;
  if (typeof state.completed !== "boolean") return false;
  if (typeof state.hintUsed !== "boolean") return false;

  // Step validation: if completed, step should point to last trace
  if (state.completed) {
    if (state.step >= trace.length) return false;
    if (!trace[state.step]) return false;
  } else {
    // Not completed: step should be within trace bounds and < history length
    if (state.step >= trace.length) return false;
    if (state.history.length !== state.step + 1) return false;
  }

  return true;
}

export function loadInitialPracticeState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const state = JSON.parse(raw);
    const gameTree = minimaxGraphsData[state.graphIdx];
    if (!gameTree) return null;

    const { trace } = getMinimaxTrace(gameTree, {
      maxPlayerRoot: gameTree.maxPlayerRoot,
    });
    if (!validatePersistedSession(state, trace)) return null;

    return state;
  } catch {
    return null;
  }
}

export function savePracticeState(state) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or private mode
  }
}

export function clearPracticeState() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// Helper to initialize a new session
export function newPracticeSession(graphIdx = 0) {
  return {
    v: 1,
    graphIdx,
    step: 0,
    score: 100,
    history: [],
    completed: false,
    hintUsed: false,
    lastCorrectIndex: null,
    inputs: {
      v: "",
      alpha: "",
      beta: "",
    },
    showSolution: false,
  };
}
