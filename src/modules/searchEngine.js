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

  if (isDLS) {
    // Q and L store objects {node, d}
    const Q = [{ node: graph.start, d: 0 }];
    let L = [{ node: graph.start, d: 0 }];
    trace.push({ expand: "", adj: "", q: formatList(Q), l: formatList(L) });

    let success = false;
    const discovered = new Set([graph.start]);

    while (L.length > 0 && !success) {
      const uObj = L.pop();
      const u = uObj.node;
      const du = uObj.d;

      // adjacency sorted
      const adjNames = [...(graph.edges[u] || [])].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );

      const adjList = [];
      const newNodes = [];
      for (const v of adjNames) {
        const vd = du + 1;
        if (vd > depthLimit) continue;
        adjList.push({ node: v, d: vd });
        if (!discovered.has(v)) {
          discovered.add(v);
          Q.push({ node: v, d: vd });
          newNodes.push({ node: v, d: vd });
          if (!parent[v]) parent[v] = u;
        }
      }

      // Append new nodes to L (DFS-like LIFO: push to end; since we pop from end, last added is next)
      L = [...L, ...newNodes];

      const isGoal = u === graph.goal;
      trace.push({
        expand: `${u}(${du})`,
        adj: adjList.map((a) => `${a.node}(${a.d})`).join(","),
        q: formatList(Q),
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
  const Q = [graph.start];
  let L = [graph.start];
  trace.push({ expand: "", adj: "", q: Q.join(","), l: L.join(",") });

  let success = false;
  while (L.length > 0 && !success) {
    let u = algo === "DFS" ? L.pop() : L.shift();
    let adjList = [...(graph.edges[u] || [])].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    let newNodes = [];

    for (let v of adjList) {
      if (!Q.includes(v)) {
        Q.push(v);
        newNodes.push(v);
        if (!parent[v]) parent[v] = u;
      }
    }

    L = [...L, ...newNodes];

    let isGoal = u === graph.goal;
    trace.push({
      expand: u,
      adj: adjList.join(","),
      q: [...Q].join(","),
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
