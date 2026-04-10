// Minimax Alpha-Beta Pruning Sample Graphs - 8 Bộ đề
// Mỗi node có field `isMax` để xác định MAX (▼) hay MIN (△)
// Leaf nodes sử dụng terminalValues (mảng) thay vì value

const makeNode = (id, children, terminalValues, isMax, x, y) => ({
  id,
  children,
  terminalValues, // Mảng các giá trị terminal
  isMax,
  positions: { x, y },
});

export const minimaxGraphsData = [
  // ========== NÂNG CAO 1: Nhành cụt - MAX root ==========
  {
    id: 0,
    name: "Nâng cao 1: Nhành cụt (MAX root)",
    maxPlayerRoot: true,
    difficulty: "Nâng cao",
    description:
      "ROOT=MAX. Nút B có 2 giá trị terminal, nút E có 3 giá trị. Pruning tại tầng lá.",
    root: "a",
    triangleShape: { max: "down", min: "up" },
    nodes: {
      a: makeNode("a", ["b", "c"], null, true, 300, 40),
      b: makeNode("b", ["d", "e"], null, false, 150, 120),
      c: makeNode("c", ["f", "g"], null, false, 450, 120),
      // Node d + e là leaf nodes với multi-values
      d: makeNode("d", [], [3, 5], null, 75, 200),
      e: makeNode("e", [], [1, 5, 2], null, 225, 200),
      f: makeNode("f", [], [8], null, 375, 200),
      g: makeNode("g", [], [2], null, 525, 200),
    },
  },

  // ========== NÂNG CAO 2: Đa nhánh - MIN root ==========
  {
    id: 1,
    name: "Nâng cao 2: Đa nhánh (MIN root)",
    maxPlayerRoot: false,
    difficulty: "Nâng cao",
    description:
      "ROOT=MIN. 3 nhánh MAX, C có 3 giá trị, F có 2 giá trị. Pruning rộng.",
    root: "a",
    triangleShape: { max: "down", min: "up" },
    nodes: {
      a: makeNode("a", ["b", "c", "d"], null, false, 300, 40),
      b: makeNode("b", ["e", "f"], null, true, 100, 120),
      c: makeNode("c", ["g", "h"], null, true, 300, 120),
      d: makeNode("d", ["i", "j"], null, true, 500, 120),
      e: makeNode("e", [], [5], false, 50, 200),
      f: makeNode("f", [], [3, 9], false, 150, 200),
      g: makeNode("g", [], [4], false, 250, 200),
      h: makeNode("h", [], [7, 6, 8], false, 350, 200),
      i: makeNode("i", [], [2], false, 450, 200),
      j: makeNode("j", [], [5], false, 550, 200),
    },
  },

  // ========== NÂNG CAO 3: Cây bất đối xứng - MAX root ==========
  {
    id: 2,
    name: "Nâng cao 3: Cây bất đối xứng (MAX)",
    maxPlayerRoot: true,
    difficulty: "Nâng cao",
    description:
      "ROOT=MAX. Depth không đồng nhất. B có 2 giá trị, C→I có 2 giá trị. Pruning chiều sâu.",
    root: "a",
    triangleShape: { max: "down", min: "up" },
    nodes: {
      a: makeNode("a", ["b", "c"], null, true, 300, 40),
      // Branch B: chỉ 1 tầng con
      b: makeNode("b", ["d", "e"], null, false, 150, 120),
      // Branch C: 2 tầng con
      c: makeNode("c", ["f", "g"], null, false, 450, 120),
      // Leaf nodes - d, e có multi-values | f, g là internal
      d: makeNode("d", [], [4, 6], null, 100, 200),
      e: makeNode("e", [], [3, 9, 1], null, 200, 200),
      f: makeNode("f", ["h", "i"], null, true, 400, 200),
      g: makeNode("g", ["j"], null, true, 500, 200),
      // Deeper leaves
      h: makeNode("h", [], [5, 2], false, 350, 280),
      i: makeNode("i", [], [7], false, 450, 280),
      j: makeNode("j", [], [2, 8], false, 550, 280),
    },
  },

  // ========== NÂNG CAO 4: Phức tạp - MIN root, 3 tầng ==========
  {
    id: 3,
    name: "Nâng cao 4: 3 tầng (MIN root)",
    maxPlayerRoot: false,
    difficulty: "Nâng cao",
    description:
      "ROOT=MIN. Depth 3. C có 4 giá trị, E có 3 giá trị, H có 2 giá trị. Pruning bội.",
    root: "a",
    triangleShape: { max: "down", min: "up" },
    nodes: {
      a: makeNode("a", ["b", "c"], null, false, 300, 40),
      b: makeNode("b", ["d", "e"], null, true, 150, 120),
      c: makeNode("c", ["f", "g"], null, true, 450, 120),
      d: makeNode("d", ["h", "i"], null, false, 100, 200),
      e: makeNode("e", ["j"], null, false, 200, 200),
      f: makeNode("f", ["k"], null, false, 400, 200),
      g: makeNode("g", ["l", "m"], null, false, 500, 200),
      // Deep leaves with multi-values
      h: makeNode("h", [], [2, 5, 1], null, 50, 280),
      i: makeNode("i", [], [4], null, 150, 280),
      j: makeNode("j", [], [3, 7, 2, 6], null, 250, 280),
      k: makeNode("k", [], [8], null, 400, 280),
      l: makeNode("l", [], [5, 3], null, 450, 280),
      m: makeNode("m", [], [9], null, 550, 280),
    },
  },

  // ========== NÂNG CAO 5: Cây phức tạp 3 tầng ==========
  {
    id: 4,
    name: "Nâng cao 5: Cây phức tạp (3 tầng)",
    maxPlayerRoot: true,
    difficulty: "Nâng cao",
    description:
      "ROOT=MAX. Depth 3. Các nhánh B, C, D với nhiều terminal values. Pruning phức tạp.",
    root: "a",
    triangleShape: { max: "down", min: "up" },
    nodes: {
      // Level 0
      a: makeNode("a", ["b", "c", "d"], null, true, 300, 40),

      // Level 1
      b: makeNode("b", ["e", "f"], null, false, 100, 120),
      c: makeNode("c", ["g", "h", "i"], null, false, 300, 120),
      d: makeNode("d", ["j", "k", "l"], null, false, 500, 120),

      // Level 2
      e: makeNode("e", [], [2, 6], null, 50, 200),
      f: makeNode("f", [], [5, 6], null, 150, 200),
      g: makeNode("g", [], [7], null, 230, 200),
      h: makeNode("h", [], [8], null, 290, 200),
      i: makeNode("i", [], [3, 9, 1, 3], null, 365, 200),
      j: makeNode("j", [], [5, 2], null, 450, 200),
      k: makeNode("k", [], [4], null, 525, 200),
      l: makeNode("l", [], [7, 9, 4], null, 590, 200),
    },
  },
];
