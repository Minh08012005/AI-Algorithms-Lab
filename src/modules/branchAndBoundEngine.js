const sortByF = (a, b) => a.f - b.f;

const formatListL = (listL) => (listL || []).map((x) => `${x.node}${x.f}`).join(",");

const reconstructPath = (state) => {
  const path = [];
  let current = state;
  while (current) {
    path.push(current.node);
    current = current.parent;
  }
  return path.reverse();
};

const inPath = (state, target) => {
  let current = state;
  while (current) {
    if (current.node === target) return true;
    current = current.parent;
  }
  return false;
};

export const getBranchAndBoundTrace = (graph) => {
  if (!graph || !graph.start || !graph.goal || !graph.heuristic) {
    return { rows: [], finalPath: [], finalCost: null };
  }

  const startState = {
    node: graph.start,
    g: 0,
    f: graph.heuristic[graph.start] ?? 0,
    parent: null,
  };

  let listL = [startState];
  let bestCost = Number.POSITIVE_INFINITY;
  let bestGoalState = null;
  const rows = [];

  while (listL.length > 0) {
    if (Number.isFinite(bestCost) && listL[0].f >= bestCost) {
      break;
    }

    const uState = listL[0];
    listL = listL.slice(1);

    if (uState.node === graph.goal) {
      if (uState.g <= bestCost) {
        bestCost = uState.g;
        bestGoalState = uState;
        rows.push({
          expand: uState.node,
          isGoal: true,
          goalText: `TTKT, tim duoc duong di tam thoi, do dai ${uState.g}`,
          listL: formatListL(listL),
        });
      }

      if (listL.length === 0 || listL[0].f >= bestCost) {
        break;
      }
      continue;
    }

    const successors = graph.edges[uState.node] || [];
    const childRecords = [];

    for (const edge of successors) {
      const v = edge.to;
      const k = edge.cost;
      const hv = graph.heuristic[v];

      if (hv === undefined || hv === null) {
        throw new Error(`Thieu heuristic cho dinh ${v}.`);
      }
      if (inPath(uState, v)) continue;

      const gv = uState.g + k;
      const fv = gv + hv;

      if (gv <= bestCost) {
        childRecords.push({
          node: v,
          k,
          h: hv,
          g: gv,
          f: fv,
          state: { node: v, g: gv, f: fv, parent: uState },
        });
      }
    }

    childRecords.sort(sortByF);
    const listL1 = childRecords.map((item) => item.state);
    listL = [...listL1, ...listL];

    if (childRecords.length === 0) {
      rows.push({
        expand: uState.node,
        isGoal: false,
        details: [],
        deadEndText: "Khong co trang thai con hop le",
        listL1: "-",
        listL: formatListL(listL),
      });
      continue;
    }

    rows.push({
      expand: uState.node,
      isGoal: false,
      details: childRecords.map(({ node, k, h, g, f }) => ({ node, k, h, g, f })),
      listL1: formatListL(listL1),
      listL: formatListL(listL),
    });
  }

  return {
    rows,
    finalPath: bestGoalState ? reconstructPath(bestGoalState) : [],
    finalCost: Number.isFinite(bestCost) ? bestCost : null,
  };
};
