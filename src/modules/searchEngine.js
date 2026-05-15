// Pure algorithm engine for SearchModule
// Exports: getAlgorithmTrace(graph, algo)

// helper to format list of {node,d} objects
const formatList = (arr) =>
  (arr || []).map((x) => `${x.node}(${x.d})`).join(",");

export function getAlgorithmTrace(graph, algo) {
  if (!graph) return { trace: [], finalPath: [] };
  // Depth-limited search (DLS) will annotate nodes with their depth: A(0), B(1), ...
  const isDLS = algo === "DLS";
  const depthLimit = isDLS ? graph.depthLimit || 3 : null;

  let trace = [];
  const parent = {};
  const MAX_STEPS = 200;
  let steps = 0;

  if (isDLS) {
    let L = [{ node: graph.start, d: 0 }];
    trace.push({ expand: "", adj: "", l: formatList(L) });

    let success = false;

    while (L.length > 0 && !success && steps < MAX_STEPS) {
      steps++;
      const uObj = L.pop();
      const u = uObj.node;
      const du = uObj.d;

      const adjNames = [...(graph.edges[u] || [])].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );

      const adjList = [];
      const newNodes = [];
      for (const v of adjNames) {
        const vd = du + 1;
        if (vd > depthLimit) continue;
        adjList.push({ node: v, d: vd });
        newNodes.push({ node: v, d: vd });
        if (!parent[v]) parent[v] = u;
      }

      L = [...L, ...newNodes];

      const isGoal = u === graph.goal;
      trace.push({
        expand: `${u}(${du})`,
        adj: adjList.map((a) => `${a.node}(${a.d})`).join(","),
        l: formatList(L),
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
  }

  // Standard DFS/BFS behavior
  let L = [graph.start];
  trace.push({ expand: "", adj: "", l: L.join(",") });

  let success = false;
  while (L.length > 0 && !success && steps < MAX_STEPS) {
    steps++;
    let u = algo === "DFS" ? L.pop() : L.shift();
    let adjList = [...(graph.edges[u] || [])].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    let newNodes = [];

    for (let v of adjList) {
      newNodes.push(v);
      if (!parent[v]) parent[v] = u;
    }

    L = [...L, ...newNodes];

    let isGoal = u === graph.goal;
    trace.push({
      expand: u,
      adj: adjList.join(","),
      l: [...L].join(","),
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
}

export default { getAlgorithmTrace };
