// Utility helpers for heuristic modules
export const insertSortedByHeuristic = (L, node, H) => {
  const hn = H[node];
  let lo = 0;
  let hi = L.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const m = L[mid];
    const hm = H[m];
    if (
      hm < hn ||
      (hm === hn &&
        m.localeCompare(node, undefined, { sensitivity: "base" }) < 0)
    )
      lo = mid + 1;
    else hi = mid;
  }
  const out = [...L];
  out.splice(lo, 0, node);
  return out;
};

export const formatNodeH = (graph, node) => {
  const h = graph.heuristic?.[node];
  return h !== undefined && h !== null ? `${node}(${h})` : node;
};

export const formatHList = (graph, nodes) =>
  (nodes || []).map((n) => formatNodeH(graph, n)).join(",");

export const normPersist = (s) =>
  (s || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
