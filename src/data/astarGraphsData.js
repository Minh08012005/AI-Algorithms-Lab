export const astarGraphsData = [
  {
    id: 0,
    name: "Đề A*: A -> B (theo slide)",
    nodes: ["A", "C", "D", "E", "F", "H", "K", "I", "B"],
    // Directed weighted edges k(u,v)
    edges: {
      A: [
        { to: "C", cost: 9 },
        { to: "D", cost: 7 },
        { to: "E", cost: 13 },
        { to: "F", cost: 20 },
      ],
      C: [{ to: "H", cost: 6 }],
      D: [
        { to: "H", cost: 8 },
        { to: "E", cost: 4 },
      ],
      E: [
        { to: "K", cost: 4 },
        { to: "I", cost: 3 },
      ],
      F: [{ to: "I", cost: 6 }],
      H: [{ to: "K", cost: 5 }],
      K: [{ to: "B", cost: 6 }],
      I: [
        { to: "K", cost: 9 },
        { to: "B", cost: 5 },
      ],
      B: [],
    },
    heuristic: {
      A: 20,
      B: 0,
      C: 15,
      D: 6,
      E: 8,
      F: 7,
      H: 10,
      I: 4,
      K: 2,
    },
    start: "A",
    goal: "B",
    positions: {
      A: [220, 24],
      C: [120, 95],
      D: [220, 95],
      E: [320, 95],
      F: [400, 25],
      H: [120, 180],
      K: [240, 180],
      I: [360, 180],
      B: [260, 260],
    },
  },
];
