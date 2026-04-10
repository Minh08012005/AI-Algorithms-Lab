// Minimax Alpha-Beta Pruning Engine
// Simplified version: compute trace from nodeTraces map

export function getMinimaxTrace(gameTree, options = {}) {
  const maxPlayerRoot = options.maxPlayerRoot ?? true;

  if (!gameTree || !gameTree.nodes) {
    return {
      trace: [],
      rootValue: null,
      nodeTraces: {},
      error: "Invalid game tree",
    };
  }

  const nodeTraces = {};
  const isLeaf = (nodeId) => {
    const node = gameTree.nodes[nodeId];
    return !node || !node.children || node.children.length === 0;
  };

  const isMaxNode = (nodeId, depth, rootIsMax) => {
    return depth % 2 === 0 ? rootIsMax : !rootIsMax;
  };

  // Standard minimax
  const minimax = (nodeId, depth, alpha, betaParam, rootIsMax) => {
    const node = gameTree.nodes[nodeId];
    if (!node) return 0;

    const isMax = isMaxNode(nodeId, depth, rootIsMax);
    const alphaBefore = alpha;
    const betaBefore = betaParam;

    if (isLeaf(nodeId)) {
      const leafValue = node.value ?? 0;
      nodeTraces[nodeId] = {
        id: nodeId,
        alphaBefore,
        betaBefore,
        alphaAfter: alpha,
        betaAfter: betaParam,
        value: leafValue,
        isMax,
        children: [],
        childVisits: [],
        cut: false,
        comment: `Leaf = ${leafValue}`,
      };
      return leafValue;
    }

    let value = isMax ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    let localAlpha = alpha;
    let localBeta = betaParam;
    const childVisits = [];
    let cut = false;
    const children = node.children || [];

    for (const childId of children) {
      const childValue = minimax(
        childId,
        depth + 1,
        localAlpha,
        localBeta,
        rootIsMax,
      );

      if (isMax) {
        if (childValue > value) value = childValue;
        localAlpha = Math.max(localAlpha, value);
        if (value >= localBeta) {
          cut = true;
        }
      } else {
        if (childValue < value) value = childValue;
        localBeta = Math.min(localBeta, value);
        if (value <= localAlpha) {
          cut = true;
        }
      }

      childVisits.push({
        id: childId,
        value: childValue,
        alphaAfter: localAlpha,
        betaAfter: localBeta,
        pruned: cut,
      });

      if (cut) break;
    }

    nodeTraces[nodeId] = {
      id: nodeId,
      alphaBefore,
      betaBefore,
      alphaAfter: localAlpha,
      betaAfter: localBeta,
      value,
      isMax,
      isLeaf: false,
      children,
      childVisits,
      cut,
      comment: `${isMax ? "MAX" : "MIN"} = ${value}${cut ? " (CUT)" : ""}`,
    };

    return value;
  };

  // Run minimax
  const rootValue = minimax(
    gameTree.root || "a",
    0,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    maxPlayerRoot,
  );

  // Build trace using State Machine: Process nodes in order following Alpha-Beta logic
  // For each node, record: alphaBefore, betaBefore (from parent), then v, alphaAfter, betaAfter (computed)
  const trace = [];
  const visited = new Set();

  const buildStateTrace = (
    nodeId,
    depth = 0,
    parentAlpha = Number.NEGATIVE_INFINITY,
    parentBeta = Number.POSITIVE_INFINITY,
  ) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const nt = nodeTraces[nodeId];
    if (!nt) return;

    const isMax = isMaxNode(nodeId, depth, maxPlayerRoot);

    // For leaves: show the leaf's value and alpha/beta update from its perspective
    if (nt.isLeaf) {
      const leafValue = nt.value;
      let alphaAfter = parentAlpha;
      let betaAfter = parentBeta;

      if (isMax) {
        // MAX leaf updates alpha
        alphaAfter = Math.max(parentAlpha, leafValue);
      } else {
        // MIN leaf updates beta
        betaAfter = Math.min(parentBeta, leafValue);
      }

      trace.push({
        step: trace.length,
        nodeId,
        value: leafValue,
        alphaBefore: parentAlpha,
        betaBefore: parentBeta,
        alphaAfter: alphaAfter,
        betaAfter: betaAfter,
        isLeaf: true,
        isMax: isMax,
      });
      return;
    }

    // For non-leaf nodes: process children and then show parent update
    let currentAlpha = parentAlpha;
    let currentBeta = parentBeta;
    let nodeValue = isMax ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

    for (const childId of nt.children) {
      // Recursively process child
      buildStateTrace(childId, depth + 1, currentAlpha, currentBeta);

      // After child returns, get its computed value from nodeTraces
      const childTrace = nodeTraces[childId];
      if (childTrace) {
        const childValue = childTrace.value;

        if (isMax) {
          if (childValue > nodeValue) nodeValue = childValue;
          currentAlpha = Math.max(currentAlpha, nodeValue);
        } else {
          if (childValue < nodeValue) nodeValue = childValue;
          currentBeta = Math.min(currentBeta, nodeValue);
        }
      }
    }

    // Add parent node step AFTER all children processed
    trace.push({
      step: trace.length,
      nodeId,
      value: nt.value,
      alphaBefore: parentAlpha,
      betaBefore: parentBeta,
      alphaAfter: currentAlpha,
      betaAfter: currentBeta,
      isLeaf: false,
      isMax: isMax,
    });
  };

  buildStateTrace(
    gameTree.root || "a",
    0,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );

  return {
    trace,
    rootValue,
    nodeTraces,
    totalNodes: Object.keys(nodeTraces).length,
  };
}

export function formatInfinity(val) {
  if (val === Number.NEGATIVE_INFINITY) return "-∞";
  if (val === Number.POSITIVE_INFINITY) return "+∞";
  return String(val);
}

export function parseUserValue(str) {
  if (!str || typeof str !== "string") return null;
  const s = str.trim();
  if (s === "-∞" || s === "-Infinity") return Number.NEGATIVE_INFINITY;
  if (s === "+∞" || s === "+Infinity" || s === "∞")
    return Number.POSITIVE_INFINITY;
  const parsed = parseFloat(s);
  return isNaN(parsed) ? null : parsed;
}

export function numbersEqual(a, b) {
  if (a === b) return true;
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  return false;
}
