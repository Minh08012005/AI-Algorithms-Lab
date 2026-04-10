import {
  insertSortedByHeuristic,
  formatNodeH,
  formatHList,
} from "./heuristicUtils";

export const getAlgorithmTrace = (graph, algo) => {
  const isBestFirst = algo === "BEST_FIRST";
  const isHillClimbing = algo === "HILL_CLIMBING";
  const isAStar = algo === "A_STAR";
  const H = graph.heuristic;

  if (
    (!isBestFirst && !isHillClimbing && !isAStar) ||
    !H ||
    !graph.nodes ||
    graph.nodes.some((n) => H[n] === undefined || H[n] === null)
  ) {
    return { trace: [], finalPath: [] };
  }

  if (isAStar) {
    const formatNodeAStar = (node, gScore) => {
      const g = gScore[node];
      const h = H[node];
      const f = g + h;
      return `${node}(g=${g},h=${h},f=${f})`;
    };

    const sortOpenByF = (nodes, gScore) =>
      [...nodes].sort((a, b) => {
        const fa = gScore[a] + H[a];
        const fb = gScore[b] + H[b];
        if (fa !== fb) return fa - fb;
        if (H[a] !== H[b]) return H[a] - H[b];
        return a.localeCompare(b, undefined, { sensitivity: "base" });
      });

    const formatOpenList = (nodes, gScore) =>
      (nodes || []).map((n) => formatNodeAStar(n, gScore)).join(",");

    let trace = [];
    const parent = {};
    const gScore = { [graph.start]: 0 };
    const closed = [];
    let open = [graph.start];

    trace.push({
      expand: "",
      adj: "",
      q: formatHList(graph, closed),
      l: formatOpenList(open, gScore),
      l1: "",
    });

    let success = false;
    while (open.length > 0 && !success) {
      open = sortOpenByF(open, gScore);
      const u = open.shift();

      if (u === graph.goal) {
        closed.push(u);
        trace.push({
          expand: formatNodeAStar(u, gScore),
          adj: "",
          q: formatHList(graph, closed),
          l: formatOpenList(open, gScore),
          l1: "",
          isGoal: true,
        });
        success = true;
        break;
      }

      const rawAdj = [...(graph.edges[u] || [])];
      const adjNames = [...rawAdj].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );

      for (const v of adjNames) {
        const tentative = gScore[u] + 1;
        const closedHasV = closed.includes(v);
        const hasG = gScore[v] !== undefined;
        const betterPath = !hasG || tentative < gScore[v];

        if (closedHasV && !betterPath) continue;

        if (betterPath) {
          gScore[v] = tentative;
          parent[v] = u;

          if (closedHasV) {
            const idx = closed.indexOf(v);
            if (idx >= 0) closed.splice(idx, 1);
          }

          if (!open.includes(v)) {
            open.push(v);
          }
        }
      }

      open = sortOpenByF(open, gScore);
      closed.push(u);

      trace.push({
        expand: formatNodeAStar(u, gScore),
        adj: rawAdj.map((v) => formatNodeH(graph, v)).join(","),
        q: formatHList(graph, closed),
        l: formatOpenList(open, gScore),
        l1: "",
        isGoal: false,
      });
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
