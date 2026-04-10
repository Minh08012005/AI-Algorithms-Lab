// Debug file để hiểu trace hiện tại
import { minimaxGraphsData } from "./src/data/minimaxGraphsData.js";
import { getMinimaxTrace } from "./src/modules/minimaxEngine.js";

const gameTree = minimaxGraphsData[0]; // "Dễ 1: MAX root, 2×2"
const { trace, nodeTraces } = getMinimaxTrace(gameTree, {
  maxPlayerRoot: gameTree.maxPlayerRoot,
});

console.log("=== GAME TREE ===");
console.log("Root:", gameTree.root);
console.log("Nodes:", gameTree.nodes);

console.log("\n=== NODE TRACES ===");
for (const [nodeId, nt] of Object.entries(nodeTraces)) {
  console.log(`\nNode ${nodeId}:`);
  console.log(`  isMax: ${nt.isMax}`);
  console.log(`  value: ${nt.value}`);
  console.log(`  alphaBefore: ${nt.alphaBefore}, alphaAfter: ${nt.alphaAfter}`);
  console.log(`  betaBefore: ${nt.betaBefore}, betaAfter: ${nt.betaAfter}`);
  console.log(`  children: ${nt.children}`);
}

console.log("\n=== TRACE STEPS ===");
trace.forEach((step) => {
  console.log(
    `\nStep ${step.step}: Node ${step.nodeId} (Leaf: ${step.isLeaf})`,
  );
  console.log(`  value: ${step.value}`);
  console.log(
    `  alphaBefore: ${step.alphaBefore}, alphaAfter: ${step.alphaAfter}`,
  );
  console.log(`  betaBefore: ${step.betaBefore}, betaAfter: ${step.betaAfter}`);
});
