// Simple test for minimaxEngine
// Run: node src/modules/minimaxEngine.test.js (after setting up Node environment)

import { getMinimaxTrace, formatInfinity } from "./minimaxEngine.js";
import { minimaxGraphsData } from "../data/minimaxGraphsData.js";

console.log("Running Minimax Alpha-Beta Pruning Tests\n");

// Test Graph 1
console.log("=== Test 1: Graph 1 (Depth-2, ROOT=MAX) ===");
const gameTree1 = minimaxGraphsData[0];
console.log("Name:", gameTree1.name);
console.log("maxPlayerRoot:", gameTree1.maxPlayerRoot);

const result1 = getMinimaxTrace(gameTree1, {
  maxPlayerRoot: gameTree1.maxPlayerRoot,
});
console.log("Root Value:", result1.rootValue);
console.log("Total Nodes Traced:", result1.totalNodes);
console.log("Trace Length:", result1.trace.length);
console.log("\nTrace Steps:");
result1.trace.forEach((step, i) => {
  console.log(`  Step ${i}:`, {
    nodeId: step.nodeId,
    isLeaf: step.isLeaf,
    isMax: step.isMax,
    alphaBefore: formatInfinity(step.alphaBefore),
    betaBefore: formatInfinity(step.betaBefore),
    value: step.value,
    cut: step.cut,
    childVisits: step.childVisits.length,
  });
});

// Test Graph 2: Dễ 3: MAX root, 3x2
console.log("\n=== Test 2: Graph 2 (Depth-3, ROOT=MIN) ===");
const gameTree2 = minimaxGraphsData[1];
console.log("Name:", gameTree2.name);
console.log("maxPlayerRoot:", gameTree2.maxPlayerRoot);

const result2 = getMinimaxTrace(gameTree2, {
  maxPlayerRoot: gameTree2.maxPlayerRoot,
});
console.log("Root Value:", result2.rootValue);
console.log("Total Nodes Traced:", result2.totalNodes);
console.log("Trace Length:", result2.trace.length);
console.log("\nFirst 10 Trace Steps:");
result2.trace.slice(0, 10).forEach((step, i) => {
  console.log(`  Step ${i}:`, {
    nodeId: step.nodeId,
    isLeaf: step.isLeaf,
    isMax: step.isMax,
    alphaBefore: formatInfinity(step.alphaBefore),
    betaBefore: formatInfinity(step.betaBefore),
    value: step.value,
    cut: step.cut,
  });
});

// Test Graph 3: Dễ 3: MAX root, 3x2
console.log("\n=== Test 3: Graph 3 (Dễ 3: MAX root, 3x2) ===");
const gameTree3 = minimaxGraphsData.find(
  (g) => g.name === "Dễ 3: MAX root, 3x2",
);
console.log("Name:", gameTree3.name);
console.log("maxPlayerRoot:", gameTree3.maxPlayerRoot);

const result3 = getMinimaxTrace(gameTree3, {
  maxPlayerRoot: gameTree3.maxPlayerRoot,
});
console.log("Root Value:", result3.rootValue);
console.log("Total Nodes Traced:", result3.totalNodes);
console.log("Trace Length:", result3.trace.length);
console.log("\nTrace Steps:");
result3.trace.forEach((step, i) => {
  console.log(`  Step ${i}:`, {
    nodeId: step.nodeId,
    isLeaf: step.isLeaf,
    isMax: step.isMax,
    alphaBefore: formatInfinity(step.alphaBefore),
    betaBefore: formatInfinity(step.betaBefore),
    value: step.value,
    cut: step.cut,
    childVisits: step.childVisits.length,
  });
});

console.log("\n✓ All tests completed");
