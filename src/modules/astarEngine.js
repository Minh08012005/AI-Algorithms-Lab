const compareByFThenName = (a, b) => {
  if (a.f !== b.f) return a.f - b.f;
  return a.node.localeCompare(b.node, undefined, { sensitivity: "base" });
};

const insertSortedByF = (open, item) => {
  const out = [...open];
  let lo = 0;
  let hi = out.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (compareByFThenName(out[mid], item) <= 0) lo = mid + 1;
    else hi = mid;
  }
  out.splice(lo, 0, item);
  return out;
};

const formatListL = (open) =>
  (open || []).map((x) => `${x.node}${x.f}`).join(",");

const buildBackwardPath = (entryById, goalEntry) => {
  const path = [];
  let cur = goalEntry;
  while (cur) {
    path.push(cur.node);
    cur = cur.parentId != null ? entryById[cur.parentId] : null;
  }
  return path;
};

export const getAStarTrace = (graph) => {
  if (!graph || !graph.start || !graph.goal || !graph.heuristic) {
    return { rows: [], finalPath: [], finalCost: null };
  }

  let idSeed = 0;
  const entryById = {};

  const startEntry = {
    id: idSeed++,
    node: graph.start,
    g: 0,
    h: graph.heuristic[graph.start],
    f: graph.heuristic[graph.start],
    parentId: null,
  };
  entryById[startEntry.id] = startEntry;

  let open = [startEntry];
  const closed = new Set();
  const bestG = { [graph.start]: 0 };
  const rows = [];

  while (open.length > 0) {
    const current = open[0];
    open = open.slice(1);

    // If this entry is stale (already have a better g), skip it.
    if (bestG[current.node] !== current.g) {
      continue;
    }

    if (current.node === graph.goal) {
      const backPath = buildBackwardPath(entryById, current);
      rows.push({
        expand: current.node,
        isGoal: true,
        goalText: `TTKT/dừng, đường đi ${backPath.join(" <- ")}, độ dài ${current.g}`,
      });
      return {
        rows,
        finalPath: [...backPath].reverse(),
        finalCost: current.g,
      };
    }

    closed.add(current.node);

    const successors = graph.edges[current.node] || [];
    const details = [];

    for (const edge of successors) {
      const v = edge.to;
      const k = edge.cost;
      const h = graph.heuristic[v];
      const g = current.g + k;
      const f = g + h;

      details.push({ node: v, k, h, g, f });

      const oldBest = bestG[v];
      const isBetter = oldBest === undefined || g < oldBest;
      if (!isBetter) continue;

      bestG[v] = g;

      const childEntry = {
        id: idSeed++,
        node: v,
        g,
        h,
        f,
        parentId: current.id,
      };
      entryById[childEntry.id] = childEntry;

      // If v already exists in OPEN, remove old version then insert improved one.
      open = open.filter((x) => x.node !== v);

      // Re-open a closed node when a better path is found.
      if (closed.has(v)) closed.delete(v);

      open = insertSortedByF(open, childEntry);
    }

    rows.push({
      expand: current.node,
      isGoal: false,
      details,
      listL: formatListL(open),
    });
  }

  return { rows, finalPath: [], finalCost: null };
};
