import {
  insertSortedByHeuristic,
  formatNodeH,
  formatHList,
} from "./heuristicUtils";

export const getAlgorithmTrace = (graph, algo) => {
  const isBestFirst = algo === "BEST_FIRST";
  const isHillClimbing = algo === "HILL_CLIMBING";
  const H = graph.heuristic;

  if (
    (!isBestFirst && !isHillClimbing) ||
    !H ||
    !graph.nodes ||
    graph.nodes.some((n) => H[n] === undefined || H[n] === null)
  ) {
    return { trace: [], finalPath: [] };
  }

  let trace = [];
  const parent = {};
  const Q = [graph.start];
  let L = [graph.start];
  trace.push({
    expand: "",
    adj: "",
    q: formatHList(graph, Q),
    l: formatHList(graph, L),
    l1: "",
  });

  let success = false;
  while (L.length > 0 && !success) {
    const u = L.shift();
    const rawAdj = [...(graph.edges[u] || [])];
    const adjNames = [...rawAdj].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );

    const newForL = [];
    for (const v of adjNames) {
      if (!Q.includes(v)) {
        Q.push(v);
        newForL.push(v);
        if (!parent[v]) parent[v] = u;
      }
    }

    const L1sorted = [...newForL].sort((a, b) => {
      if (H[a] !== H[b]) return H[a] - H[b];
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
    const l1Formatted = isHillClimbing ? formatHList(graph, L1sorted) : "";

    if (isBestFirst) {
      for (const v of newForL) {
        L = insertSortedByHeuristic(L, v, H);
      }
    } else {
      L = [...L1sorted, ...L];
    }

    const isGoal = u === graph.goal;
    trace.push({
      expand: formatNodeH(graph, u),
      // show adjacency in original graph order (don't sort display)
      adj: rawAdj.map((v) => formatNodeH(graph, v)).join(","),
      q: formatHList(graph, Q),
      l: formatHList(graph, L),
      l1: l1Formatted,
      isGoal,
    });
    if (isGoal) success = true;
  }

  let finalPath = [];
  if (success) {
    let cur = graph.goal;
    finalPath.push(cur);
    while (cur !== graph.start && parent[cur]) {
      cur = parent[cur];
      finalPath.push(cur);
    }
    finalPath = finalPath.reverse();
  }

  return { trace, finalPath };
};
