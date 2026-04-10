// Minimax Alpha-Beta Pruning Engine
// State Machine approach: Process nodes sequentially following Alpha-Beta rules

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

  const isLeaf = (nodeId) => {
    const node = gameTree.nodes[nodeId];
    // A node is a "leaf" if it has terminalValues (array of values)
    return node && node.terminalValues && Array.isArray(node.terminalValues);
  };

  const isMaxNode = (nodeId, depth, rootIsMax) => {
    return depth % 2 === 0 ? rootIsMax : !rootIsMax;
  };

  // Build trace and compute values
  const trace = [];
  const nodeValues = {};

  const processNode = (nodeId, depth, parentAlpha, parentBeta) => {
    const node = gameTree.nodes[nodeId];
    if (!node) return 0;

    const isMax = isMaxNode(nodeId, depth, maxPlayerRoot);

    // ===== LEAF NODE =====
    if (isLeaf(nodeId)) {
      const terminalValues = node.terminalValues || [];
      let v = isMax ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
      let currentAlpha = parentAlpha;
      let currentBeta = parentBeta;
      const vAtStartOfLoop = v;

      // Iterate through terminal values
      for (let i = 0; i < terminalValues.length; i++) {
        const terminalValue = terminalValues[i];

        // Save state BEFORE this terminal value update
        const vBeforeUpdate = v;
        const alphaBeforeUpdate = currentAlpha;
        const betaBeforeUpdate = currentBeta;

        // Update v with terminal value
        if (isMax) {
          v = Math.max(v, terminalValue);
        } else {
          v = Math.min(v, terminalValue);
        }

        // Check for pruning NOW (before updating alpha/beta)
        const shouldPrune =
          (isMax && v >= currentBeta) || (!isMax && v <= currentAlpha);

        // Calculate what alpha/beta will be AFTER this step
        let alphaAfterUpdate = alphaBeforeUpdate;
        let betaAfterUpdate = betaBeforeUpdate;

        if (!shouldPrune) {
          // Only update alpha/beta if NO pruning
          if (isMax) {
            currentAlpha = Math.max(currentAlpha, v);
            alphaAfterUpdate = currentAlpha;
          } else {
            currentBeta = Math.min(currentBeta, v);
            betaAfterUpdate = currentBeta;
          }
        }

        // Record this step in trace
        trace.push({
          step: trace.length,
          nodeId,
          alphaBefore: parentAlpha,
          betaBefore: parentBeta,
          alphaAtStartOfStep: alphaBeforeUpdate,
          betaAtStartOfStep: betaBeforeUpdate,
          vAtStartOfStep: i === 0 ? vAtStartOfLoop : vBeforeUpdate,
          value: v,
          alphaAfter: alphaAfterUpdate,
          betaAfter: betaAfterUpdate,
          isLeaf: true,
          isMax,
          isTerminalValue: true,
          terminalValueIdx: i,
          terminalValueCount: terminalValues.length,
          pruned: shouldPrune,
          initialState: {
            v: i === 0 ? vAtStartOfLoop : vBeforeUpdate,
            alpha: alphaBeforeUpdate,
            beta: betaBeforeUpdate,
          },
          expectedState: {
            v: v,
            alpha: alphaAfterUpdate,
            beta: betaAfterUpdate,
          },
        });

        // Stop if pruning occurs AND add remaining values as pruned
        if (shouldPrune) {
          // Mark remaining terminal values as pruned (no steps needed for these)
          // Just skip them - they won't appear in trace
          break;
        }
      }

      nodeValues[nodeId] = v;
      return { value: v, alpha: currentAlpha, beta: currentBeta };
    }

    // ===== NON-LEAF NODE =====
    const children = node.children || [];
    let currentAlpha = parentAlpha;
    let currentBeta = parentBeta;
    let v = isMax ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    const vAtStartOfLoop = v;

    for (let i = 0; i < children.length; i++) {
      const childId = children[i];

      // Recursively process child
      const childResult = processNode(
        childId,
        depth + 1,
        currentAlpha,
        currentBeta,
      );
      const childValue = childResult.value;

      // Save state BEFORE this child's value update
      const vBeforeUpdate = v;
      const alphaBeforeUpdate = currentAlpha;
      const betaBeforeUpdate = currentBeta;

      // Update v with child value
      if (isMax) {
        v = Math.max(v, childValue);
      } else {
        v = Math.min(v, childValue);
      }

      // Check for pruning NOW (before updating alpha/beta)
      const shouldPrune =
        (isMax && v >= currentBeta) || (!isMax && v <= currentAlpha);

      // Calculate what alpha/beta will be AFTER this step
      let alphaAfterUpdate = alphaBeforeUpdate;
      let betaAfterUpdate = betaBeforeUpdate;

      if (!shouldPrune) {
        // Only update alpha/beta if NO pruning
        if (isMax) {
          currentAlpha = Math.max(currentAlpha, v);
          alphaAfterUpdate = currentAlpha;
        } else {
          currentBeta = Math.min(currentBeta, v);
          betaAfterUpdate = currentBeta;
        }
      }

      // Record this step in trace
      trace.push({
        step: trace.length,
        nodeId,
        alphaBefore: parentAlpha,
        betaBefore: parentBeta,
        alphaAtStartOfStep: currentAlpha,
        betaAtStartOfStep: currentBeta,
        vAtStartOfStep: i === 0 ? vAtStartOfLoop : vBeforeUpdate,
        value: v,
        alphaAfter: alphaAfterUpdate,
        betaAfter: betaAfterUpdate,
        isLeaf: false,
        isMax,
        childIdx: i,
        pruned: shouldPrune,
        // Add initialState and expectedState
        initialState: {
          v: i === 0 ? vAtStartOfLoop : vBeforeUpdate,
          alpha: alphaBeforeUpdate,
          beta: betaBeforeUpdate,
        },
        expectedState: {
          v: v,
          alpha: alphaAfterUpdate,
          beta: betaAfterUpdate,
        },
      });

      // Stop if pruning occurs
      if (shouldPrune) break;
    }

    nodeValues[nodeId] = v;
    return { value: v, alpha: currentAlpha, beta: currentBeta };
  };

  const rootId = gameTree.root || "a";
  processNode(rootId, 0, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);

  // Compute pruning status for visualization
  const prunedNodes = new Set();
  const nodeAlphaBetaMap = {};

  const computePruningStatus = (nodeId, depth, alpha, beta) => {
    const node = gameTree.nodes[nodeId];
    if (!node) return;

    nodeAlphaBetaMap[nodeId] = { alpha, beta, depth };

    const isMax = isMaxNode(nodeId, depth, maxPlayerRoot);
    if (isLeaf(nodeId)) return;

    const children = node.children || [];
    let currentAlpha = alpha;
    let currentBeta = beta;
    let v = isMax ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

    for (let i = 0; i < children.length; i++) {
      const childId = children[i];
      const childValue = nodeValues[childId];

      if (isMax) {
        v = Math.max(v, childValue);
        // Check for pruning BEFORE updating alpha
        if (v >= currentBeta) {
          for (let j = i + 1; j < children.length; j++) {
            markSubtreeAsPruned(children[j]);
          }
          break;
        }
        // Only update alpha if NO pruning
        currentAlpha = Math.max(currentAlpha, v);
      } else {
        v = Math.min(v, childValue);
        // Check for pruning BEFORE updating beta
        if (v <= currentAlpha) {
          for (let j = i + 1; j < children.length; j++) {
            markSubtreeAsPruned(children[j]);
          }
          break;
        }
        // Only update beta if NO pruning
        currentBeta = Math.min(currentBeta, v);
      }

      computePruningStatus(childId, depth + 1, currentAlpha, currentBeta);
    }
  };

  const markSubtreeAsPruned = (nodeId) => {
    prunedNodes.add(nodeId);
    const node = gameTree.nodes[nodeId];
    if (node && node.children) {
      node.children.forEach((child) => markSubtreeAsPruned(child));
    }
  };

  computePruningStatus(
    rootId,
    0,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );

  return {
    trace,
    rootValue: nodeValues[rootId] ?? 0,
    nodeTraces: {},
    totalNodes: Object.keys(gameTree.nodes).length,
    nodeValues,
    prunedNodes,
    nodeAlphaBetaMap,
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

/**
 * Normalize user input string - remove whitespace, handle edge cases
 * @param {string} str - User input string
 * @returns {string} Normalized string
 */
export function normalizeInputString(str) {
  if (!str || typeof str !== "string") return "";
  // Remove all whitespace
  let normalized = str.trim().replace(/\s+/g, "");
  // Normalize infinity representations
  normalized = normalized.replace(/[+-]?Infinity/gi, (match) => {
    if (match.toLowerCase() === "-infinity") return "-∞";
    if (match.toLowerCase() === "+infinity") return "+∞";
    if (match.toLowerCase() === "infinity") return "+∞"; // Default to positive
    return match;
  });
  return normalized;
}

/**
 * Compare user input with expected value using normalized string comparison first
 * Falls back to numeric comparison for numbers
 * @param {string} userInput - Raw user input string
 * @param {number|string} expectedValue - Expected numeric or string value
 * @returns {boolean} Whether inputs match
 */
export function compareInputWithExpected(userInput, expectedValue) {
  // Normalize both inputs
  const normalizedUserInput = normalizeInputString(userInput);
  const normalizedExpected = formatInfinity(expectedValue);

  // String comparison after normalization
  if (normalizedUserInput === normalizedExpected) {
    return true;
  }

  // Fallback to numeric comparison
  const parsed = parseUserValue(userInput);
  return numbersEqual(parsed, expectedValue);
}

/**
 * Sinh toàn bộ các bước (steps) của thuật toán Alpha-Beta Pruning
 * Tuân theo cấu trúc chuẩn mực: cập nhật α/β chính xác, kiểm tra cắt tỉa đúng điều kiện
 *
 * @param {Object} gameTree - Cây game với nodes
 * @param {boolean} maxPlayerRoot - Root node có phải MAX hay không
 * @returns {Array} Mảng steps với {nodeId, v, alpha, beta, action, pruned}
 */
export function generateAlphaBetaSteps(gameTree, maxPlayerRoot = true) {
  if (!gameTree || !gameTree.nodes) {
    return { steps: [], error: "Invalid game tree" };
  }

  const steps = [];
  let stepCounter = 0;

  const isLeaf = (nodeId) => {
    const node = gameTree.nodes[nodeId];
    return !node || !node.children || node.children.length === 0;
  };

  // eslint-disable-next-line no-unused-vars
  const isMaxNode = (nodeId, depth) => {
    return depth % 2 === 0 ? maxPlayerRoot : !maxPlayerRoot;
  };

  // Helper: Lấy tất cả nút con từ vị trí index trở đi
  // eslint-disable-next-line no-unused-vars
  const getRemainingChildren = (node, startIndex) => {
    if (!node || !node.children) return [];
    return node.children.slice(startIndex);
  };

  // Helper: Lấy ID của tất cả nút con từ vị trí index trở đi
  const getRemainingChildIds = (nodeId, startIndex) => {
    const node = gameTree.nodes[nodeId];
    if (!node || !node.children) return [];
    return node.children.slice(startIndex);
  };

  // HÀNG ĐỀ QUI CHÍNH: Traverse với Alpha-Beta Pruning
  const traverseAlphaBeta = (nodeId, alpha, beta, isMax) => {
    const node = gameTree.nodes[nodeId];
    if (!node) return 0;

    // ========== 1. TRƯỜNG HỢP LÀ NÚT LÁ (Terminal Node) ==========
    if (isLeaf(nodeId)) {
      let v = node.value ?? 0;

      // Cập nhật alpha hoặc beta tùy vào loại nút
      if (isMax) {
        alpha = Math.max(alpha, v);
      } else {
        beta = Math.min(beta, v);
      }

      // GHI LẠI STEP TẠI NÚT LÁ
      steps.push({
        step: stepCounter++,
        nodeId,
        v,
        alpha,
        beta,
        action: "EVALUATED_LEAF",
        isMax,
      });

      return v;
    }

    // ========== 2. TRƯỜNG HỢP LÀ NÚT TRUNG GIAN (MAX/MIN) ==========
    let v = isMax ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

    // GHI LẠI STEP: Khởi tạo nút (VISIT_NODE)
    steps.push({
      step: stepCounter++,
      nodeId,
      v,
      alpha,
      beta,
      action: "VISIT_NODE",
      isMax,
    });

    const children = node.children || [];

    // Duyệt qua từng con
    for (let i = 0; i < children.length; i++) {
      const childId = children[i];

      // Gọi đệ quy với isMax đảo chiều
      const childVal = traverseAlphaBeta(childId, alpha, beta, !isMax);

      if (isMax) {
        // ===== NÚT MAX: Chọn Max, cập nhật Alpha =====
        v = Math.max(v, childVal);
        alpha = Math.max(alpha, v);

        // GHI LẠI STEP: Nhận giá trị từ child, cập nhật v và alpha
        steps.push({
          step: stepCounter++,
          nodeId,
          v,
          alpha,
          beta,
          action: "UPDATE_MAX",
          childIdx: i,
          isMax,
        });

        // KIỂM TRA CẮT TỈA (BETA-CUT)
        // Nếu v >= beta, cắt đứt nhánh
        if (v >= beta) {
          const prunedNodeIds = getRemainingChildIds(nodeId, i + 1);

          // GHI LẠI STEP: Cắt tỉa BETA
          steps.push({
            step: stepCounter++,
            nodeId,
            v,
            alpha,
            beta,
            action: "PRUNE_BETA",
            pruned: prunedNodeIds,
            isMax,
          });

          break;
        }
      } else {
        // ===== NÚT MIN: Chọn Min, cập nhật Beta =====
        v = Math.min(v, childVal);
        beta = Math.min(beta, v);

        // GHI LẠI STEP: Nhận giá trị từ child, cập nhật v và beta
        steps.push({
          step: stepCounter++,
          nodeId,
          v,
          alpha,
          beta,
          action: "UPDATE_MIN",
          childIdx: i,
          isMax,
        });

        // KIỂM TRA CẮT TỈA (ALPHA-CUT)
        // Nếu v <= alpha, cắt đứt nhánh
        if (v <= alpha) {
          const prunedNodeIds = getRemainingChildIds(nodeId, i + 1);

          // GHI LẠI STEP: Cắt tỉa ALPHA
          steps.push({
            step: stepCounter++,
            nodeId,
            v,
            alpha,
            beta,
            action: "PRUNE_ALPHA",
            pruned: prunedNodeIds,
            isMax,
          });

          break;
        }
      }
    }

    return v;
  };

  // Bắt đầu từ root
  const rootId = gameTree.root || "a";
  const rootValue = traverseAlphaBeta(
    rootId,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    maxPlayerRoot,
  );

  return {
    steps,
    rootValue,
    totalSteps: stepCounter,
  };
}
