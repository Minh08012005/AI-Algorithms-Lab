const sortByF = (a, b) => a.f - b.f;

const formatListL = (listL) => (listL || []).map((x) => `${x.node}${x.f}`).join(",");

const buildBackwardPath = (goal, parent) => {
  const path = [];
  let t = goal;
  while (t !== undefined && t !== null && t !== "") {
    path.push(t);
    t = parent[t];
  }
  return path;
};

export const getAStarTrace = (graph) => {
  if (!graph || !graph.start || !graph.goal || !graph.heuristic) {
    return { rows: [], finalPath: [], finalCost: null };
  }

  let listL = [{ node: graph.start, f: graph.heuristic[graph.start] ?? 0 }];
  const g = { [graph.start]: 0 };
  const parent = { [graph.start]: "" };
  const rows = [];

  while (listL.length > 0) {
    const current = listL[0];
    listL = listL.slice(1);
    const u = current.node;

    if (u === graph.goal) {
      const backPath = buildBackwardPath(graph.goal, parent);
      const goalCost = g[graph.goal] ?? null;
      rows.push({
        expand: u,
        isGoal: true,
        goalText: `TTKT/dung, duong di ${backPath.join(" <- ")}, do dai ${goalCost ?? "?"}`,
      });
      return {
        rows,
        finalPath: [...backPath].reverse(),
        finalCost: goalCost,
      };
    }

    const successors = graph.edges[u] || [];
    const details = [];

    for (const edge of successors) {
      const v = edge.to;
      const k = edge.cost;
      const hv = graph.heuristic[v] ?? 0;
      const gv = (g[u] ?? 0) + k;
      const fv = gv + hv;

      g[v] = gv;
      parent[v] = u;
      listL.push({ node: v, f: fv });

      details.push({ node: v, k, h: hv, g: gv, f: fv });
    }

    listL = [...listL].sort(sortByF);

    rows.push({
      expand: u,
      isGoal: false,
      details,
      listL: formatListL(listL),
    });
  }

  return { rows, finalPath: [], finalCost: null };
};
