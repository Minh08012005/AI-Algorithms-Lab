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
  // ========== NÂNG CAO 6: Cây sâu 4 tầng (MAX root) ==========
  {
    id: 5,
    name: "Nâng cao 6: Cây 4 tầng (Sâu)",
    maxPlayerRoot: true,
    difficulty: "Nâng cao",
    description: "ROOT=MAX. Cây sâu 4 tầng. Thử thách tính toán và pruning ở tầng sâu.",
    root: "a",
    triangleShape: { max: "down", min: "up" },
    nodes: {
      a: makeNode("a", ["b", "c"], null, true, 300, 40),
      b: makeNode("b", ["d", "e"], null, false, 150, 110),
      c: makeNode("c", ["f", "g"], null, false, 450, 110),
      d: makeNode("d", ["h", "i"], null, true, 80, 180),
      e: makeNode("e", ["j"], null, true, 220, 180),
      f: makeNode("f", ["k", "l"], null, true, 380, 180),
      g: makeNode("g", ["m"], null, true, 520, 180),
      h: makeNode("h", ["n"], null, false, 40, 250),
      i: makeNode("i", ["o"], null, false, 120, 250),
      j: makeNode("j", ["p", "q"], null, false, 220, 250),
      k: makeNode("k", ["r"], null, false, 350, 250),
      l: makeNode("l", ["s"], null, false, 420, 250),
      m: makeNode("m", ["t"], null, false, 520, 250),
      n: makeNode("n", [], [3, 1], null, 40, 320),
      o: makeNode("o", [], [4], null, 120, 320),
      p: makeNode("p", [], [2, 7], null, 190, 320),
      q: makeNode("q", [], [5], null, 250, 320),
      r: makeNode("r", [], [8, 2], null, 350, 320),
      s: makeNode("s", [], [6], null, 420, 320),
      t: makeNode("t", [], [9, 0], null, 520, 320),
    },
  },
  // ========== NÂNG CAO 7: Đa nhánh (4 con) ==========
  {
    id: 6,
    name: "Nâng cao 7: Đồ thị rộng (Branch=4)",
    maxPlayerRoot: false,
    difficulty: "Nâng cao",
    description: "ROOT=MIN. Nhánh rộng tại level 1. Kiểm tra khả năng quản lý nhiều nhánh.",
    root: "a",
    triangleShape: { max: "down", min: "up" },
    nodes: {
      a: makeNode("a", ["b", "c", "d", "e"], null, false, 300, 40),
      b: makeNode("b", ["f", "g"], null, true, 75, 120),
      c: makeNode("c", ["h"], null, true, 225, 120),
      d: makeNode("d", ["i", "j"], null, true, 375, 120),
      e: makeNode("e", ["k"], null, true, 525, 120),
      f: makeNode("f", [], [4, 2], null, 40, 200),
      g: makeNode("g", [], [5], null, 110, 200),
      h: makeNode("h", [], [3, 8, 1], null, 225, 200),
      i: makeNode("i", [], [7], null, 340, 200),
      j: makeNode("j", [], [6, 9], null, 410, 200),
      k: makeNode("k", [], [2], null, 525, 200),
    },
  },
  {
    id: 7,
    name: "Nâng cao 8: Bẫy Alpha-Beta",
    maxPlayerRoot: true,
    difficulty: "Nâng cao",
    description: "ROOT=MAX. Cấu trúc lừa mắt với các giá trị cực biên.",
    root: "S",
    triangleShape: { max: "down", min: "up" },
    nodes: {
      S: makeNode("S", ["A", "B"], null, true, 300, 40),
      A: makeNode("A", ["C", "D"], null, false, 150, 120),
      B: makeNode("B", ["E", "F"], null, false, 450, 120),
      C: makeNode("C", ["G", "H"], null, true, 100, 200),
      D: makeNode("D", ["I"], null, true, 200, 200),
      E: makeNode("E", ["J", "K"], null, true, 400, 200),
      F: makeNode("F", ["L"], null, true, 500, 200),
      G: makeNode("G", [], [10, 2], null, 70, 280),
      H: makeNode("H", [], [5], null, 130, 280),
      I: makeNode("I", [], [8, 1], null, 200, 280),
      J: makeNode("J", [], [3, 4], null, 370, 280),
      K: makeNode("K", [], [9], null, 430, 280),
      L: makeNode("L", [], [2, 6], null, 500, 280),
    },
  },
  {
    id: 8,
    name: "Nâng cao 9: Cây Rộng (Width=5)",
    maxPlayerRoot: false,
    difficulty: "Nâng cao",
    description: "ROOT=MIN. Nhánh cực rộng tại level 1. Kiểm tra pruning trên diện rộng.",
    root: "root",
    triangleShape: { max: "down", min: "up" },
    nodes: {
      root: makeNode("root", ["a", "b", "c", "d", "e"], null, false, 300, 40),
      a: makeNode("a", ["f"], null, true, 60, 120),
      b: makeNode("b", ["g"], null, true, 180, 120),
      c: makeNode("c", ["h"], null, true, 300, 120),
      d: makeNode("d", ["i"], null, true, 420, 120),
      e: makeNode("e", ["j"], null, true, 540, 120),
      f: makeNode("f", [], [1, 5], null, 60, 200),
      g: makeNode("g", [], [2, 8], null, 180, 200),
      h: makeNode("h", [], [3], null, 300, 200),
      i: makeNode("i", [], [4, 7], null, 420, 200),
      j: makeNode("j", [], [9], null, 540, 200),
    },
  },
  {
    id: 9,
    name: "Đề Thi Chuẩn: Alpha-Beta (Hình ảnh)",
    maxPlayerRoot: true,
    difficulty: "Nâng cao",
    description: "Cây 4 tầng đầy đủ từ đề thi chuẩn. Kiểm tra kỹ năng Alpha-Beta pruning.",
    root: "root",
    triangleShape: { max: "down", min: "up" },
    nodes: {
      root: makeNode("root", ["L1_1", "L1_2"], null, true, 300, 40),
      L1_1: makeNode("L1_1", ["L2_1", "L2_2"], null, false, 150, 110),
      L1_2: makeNode("L1_2", ["L2_3", "L2_4"], null, false, 450, 110),
      L2_1: makeNode("L2_1", ["L3_1", "L3_2"], null, true, 75, 180),
      L2_2: makeNode("L2_2", ["L3_3", "L3_4"], null, true, 225, 180),
      L2_3: makeNode("L2_3", ["L3_5", "L3_6"], null, true, 375, 180),
      L2_4: makeNode("L2_4", ["L3_7", "L3_8"], null, true, 525, 180),
      L3_1: makeNode("L3_1", [], [6, 11], false, 40, 250),
      L3_2: makeNode("L3_2", [], [4, 2], false, 110, 250),
      L3_3: makeNode("L3_3", [], [14], false, 180, 250),
      L3_4: makeNode("L3_4", [], [9, 4], false, 260, 250),
      L3_5: makeNode("L3_5", [], [3], false, 340, 250),
      L3_6: makeNode("L3_6", [], [7], false, 410, 250),
      L3_7: makeNode("L3_7", [], [9], false, 480, 250),
      L3_8: makeNode("L3_8", [], [12, 20], false, 560, 250),
    },
  },
];
