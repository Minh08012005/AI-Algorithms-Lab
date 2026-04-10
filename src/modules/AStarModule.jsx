import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  PencilLine,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import Node from "../components/Node";
import { astarGraphsData } from "../data/astarGraphsData";
import { getAStarTrace } from "./astarEngine";

const markerId = "astar-arrow";
const STORAGE_KEY = "ai-lab-astar-practice-v1";
const WRONG_PENALTY = 5;
const HINT_PENALTY = 10;

const makeEmptyInputs = () => ({
  expand: "",
  rowCount: "",
  rows: [],
  l: "",
  goalText: "",
});

const normalize = (s) => (s || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
const parseRowCount = (value) => {
  const n = Number.parseInt((value || "").trim(), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 30);
};

export default function AStarModule() {
  const initialSession = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== 1) return null;
      return parsed;
    } catch {
      return null;
    }
  }, []);

  const [graphIdx, setGraphIdx] = useState(() => initialSession?.graphIdx ?? 0);
  const [selectedLevel, setSelectedLevel] = useState(
    () => astarGraphsData[initialSession?.graphIdx ?? 0]?.level ?? 1,
  );
  const [step, setStep] = useState(() => initialSession?.step ?? 0);
  const [score, setScore] = useState(() => initialSession?.score ?? 100);
  const [history, setHistory] = useState(() => initialSession?.history ?? []);
  const [feedback, setFeedback] = useState(null);
  const [completed, setCompleted] = useState(() => initialSession?.completed ?? false);
  const [hintUsed, setHintUsed] = useState(() => initialSession?.hintUsed ?? false);
  const [lastCorrectIndex, setLastCorrectIndex] = useState(
    () => initialSession?.lastCorrectIndex ?? null,
  );
  const [showSolution, setShowSolution] = useState(() => initialSession?.showSolution ?? false);
  const [inputs, setInputs] = useState(() => initialSession?.inputs ?? makeEmptyInputs());

  const levelOptions = useMemo(() => {
    const levels = Array.from(new Set(astarGraphsData.map((g) => g.level))).sort(
      (a, b) => a - b,
    );
    return levels;
  }, []);

  const visibleGraphEntries = useMemo(
    () => astarGraphsData.map((g, idx) => ({ g, idx })).filter(({ g }) => g.level === selectedLevel),
    [selectedLevel],
  );

  const graph = astarGraphsData[graphIdx];
  const { rows, finalPath, finalCost } = useMemo(() => getAStarTrace(graph), [graph]);
  const currentRow = rows[step];

  const validationErrors = useMemo(() => {
    const errors = [];
    if (!graph) {
      errors.push("Đồ thị không tồn tại.");
      return errors;
    }
    if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
      errors.push("Thiếu danh sách nút.");
      return errors;
    }

    const nodeSet = new Set(graph.nodes);
    graph.nodes.forEach((n) => {
      if (!graph.positions?.[n]) errors.push(`Thiếu vị trí cho nút ${n}.`);
      if (graph.heuristic?.[n] === undefined || graph.heuristic?.[n] === null) {
        errors.push(`Thiếu heuristic cho nút ${n}.`);
      }
    });

    Object.entries(graph.edges || {}).forEach(([from, tos]) => {
      if (!nodeSet.has(from)) errors.push(`Cạnh nguồn không hợp lệ: ${from}`);
      (tos || []).forEach((edge) => {
        if (!nodeSet.has(edge.to)) errors.push(`Cạnh đích không hợp lệ: ${from} -> ${edge.to}`);
        if (typeof edge.cost !== "number") {
          errors.push(`Trọng số không hợp lệ ở cạnh: ${from} -> ${edge.to}`);
        }
      });
    });

    return Array.from(new Set(errors));
  }, [graph]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (validationErrors.length > 0) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          v: 1,
          graphIdx,
          step,
          score,
          history,
          completed,
          hintUsed,
          lastCorrectIndex,
          showSolution,
          inputs,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [
    graphIdx,
    step,
    score,
    history,
    completed,
    hintUsed,
    lastCorrectIndex,
    showSolution,
    inputs,
    validationErrors.length,
  ]);

  useEffect(() => {
    if (step > rows.length) setStep(rows.length);
  }, [rows.length, step]);

  const resetPractice = () => {
    setStep(0);
    setScore(100);
    setHistory([]);
    setInputs(makeEmptyInputs());
    setFeedback(null);
    setCompleted(false);
    setHintUsed(false);
    setLastCorrectIndex(null);
    setShowSolution(false);
  };

  const handleGraphChange = (nextIdx) => {
    if (nextIdx === graphIdx) return;
    setGraphIdx(nextIdx);
    setStep(0);
    setScore(100);
    setHistory([]);
    setInputs(makeEmptyInputs());
    setFeedback(null);
    setCompleted(false);
    setHintUsed(false);
    setLastCorrectIndex(null);
    setShowSolution(false);
  };

  const handleLevelChange = (nextLevel) => {
    if (nextLevel === selectedLevel) return;
    setSelectedLevel(nextLevel);

    const firstMatchIdx = astarGraphsData.findIndex((g) => g.level === nextLevel);
    if (firstMatchIdx < 0) return;
    handleGraphChange(firstMatchIdx);
  };

  useEffect(() => {
    if (!graph || graph.level === selectedLevel) return;
    const firstMatchIdx = astarGraphsData.findIndex((g) => g.level === selectedLevel);
    if (firstMatchIdx < 0) return;
    handleGraphChange(firstMatchIdx);
  }, [selectedLevel, graph]);

  const handleHint = () => {
    if (completed || hintUsed || !currentRow || currentRow.isGoal) return;
    setScore((s) => Math.max(0, s - HINT_PENALTY));
    setHintUsed(true);
    setInputs((prev) => ({ ...prev, l: currentRow.listL || "" }));
    setFeedback({ type: "success", text: `Gợi ý đã điền ô L. -${HINT_PENALTY}%` });
  };

  const handleCheck = () => {
    if (validationErrors.length > 0) return;
    if (!currentRow || completed) return;

    if (normalize(inputs.expand) !== normalize(currentRow.expand)) {
      setScore((s) => Math.max(0, s - WRONG_PENALTY));
      setFeedback({ type: "error", text: "Sai trạng thái TT, kiểm tra lại." });
      return;
    }

    if (currentRow.isGoal) {
      if (normalize(inputs.goalText) !== normalize(currentRow.goalText)) {
        setScore((s) => Math.max(0, s - WRONG_PENALTY));
        setFeedback({
          type: "error",
          text: "Dòng kết thúc chưa đúng. Nhập đúng nội dung TTKT/dừng.",
        });
        return;
      }

      const newIndex = history.length;
      setHistory([...history, currentRow]);
      setLastCorrectIndex(newIndex);
      setStep(step + 1);
      setInputs(makeEmptyInputs());
      setCompleted(true);
      setFeedback({ type: "success", text: "Tuyệt vời! Bạn đã hoàn thành." });
      return;
    }

    if (!Array.isArray(inputs.rows) || inputs.rows.length === 0) {
      setFeedback({
        type: "error",
        text: "Nhập n để tạo số dòng trước khi kiểm tra.",
      });
      return;
    }

    if (inputs.rows.length !== currentRow.details.length) {
      setScore((s) => Math.max(0, s - WRONG_PENALTY));
      setFeedback({
        type: "error",
        text: "Số dòng chưa khớp số đỉnh kề thực tế.",
      });
      return;
    }

    const expected = {
      ttk: currentRow.details.map((x) => x.node).join(","),
      k: currentRow.details.map((x) => x.k).join(","),
      h: currentRow.details.map((x) => x.h).join(","),
      g: currentRow.details.map((x) => x.g).join(","),
      f: currentRow.details.map((x) => x.f).join(","),
      l: currentRow.listL,
    };

    const actual = {
      ttk: inputs.rows.map((x) => x.ttk || "").join(","),
      k: inputs.rows.map((x) => x.k || "").join(","),
      h: inputs.rows.map((x) => x.h || "").join(","),
      g: inputs.rows.map((x) => x.g || "").join(","),
      f: inputs.rows.map((x) => x.f || "").join(","),
      l: inputs.l,
    };

    const allOk =
      normalize(actual.ttk) === normalize(expected.ttk) &&
      normalize(actual.k) === normalize(expected.k) &&
      normalize(actual.h) === normalize(expected.h) &&
      normalize(actual.g) === normalize(expected.g) &&
      normalize(actual.f) === normalize(expected.f) &&
      normalize(actual.l) === normalize(expected.l);

    if (!allOk) {
      setScore((s) => Math.max(0, s - WRONG_PENALTY));
      setFeedback({
        type: "error",
        text: "Sai một hoặc nhiều cột (TTK/k/h/g/f/L). Kiểm tra lại.",
      });
      return;
    }

    const newIndex = history.length;
    setHistory([...history, currentRow]);
    setLastCorrectIndex(newIndex);
    setStep(step + 1);
    setInputs(makeEmptyInputs());
    setFeedback({ type: "success", text: "Chính xác! Chuyển sang bước tiếp theo." });
  };

  const canRestartSameProblem =
    !showSolution && validationErrors.length === 0 && (completed || history.length > 0);

  const drawEdge = (from, to) => {
    const p1 = graph.positions[from];
    const p2 = graph.positions[to];
    if (!p1 || !p2) return null;

    const nodeHalf = 24;
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;

    const startX = p1[0] + ux * nodeHalf * 0.6;
    const startY = p1[1] + uy * nodeHalf * 0.6;
    const endX = p2[0] - ux * nodeHalf;
    const endY = p2[1] - uy * nodeHalf;

    const mx = (startX + endX) / 2;
    const my = (startY + endY) / 2;

    return { startX, startY, endX, endY, mx, my };
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl text-white shadow-lg bg-cyan-600 shadow-cyan-200">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase leading-none mb-1">
              A* Search
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Trang thực hành riêng cho thuật toán A*
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedLevel}
            onChange={(e) => handleLevelChange(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 ring-cyan-500"
          >
            {levelOptions.map((level) => (
              <option key={level} value={level}>
                {`Muc ${level}`}
              </option>
            ))}
          </select>

          <select
            value={graphIdx}
            onChange={(e) => handleGraphChange(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 ring-cyan-500"
          >
            {visibleGraphEntries.map(({ g, idx }) => (
              <option key={g.id ?? idx} value={idx}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!showSolution && (
        <div className="mb-6 space-y-1">
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="bg-cyan-500 h-3 rounded-full transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Tiến độ luyện tập được lưu tự động.</p>
        </div>
      )}

      {showSolution && rows.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <p className="font-bold mb-1">Chế độ đáp án mẫu</p>
          <p className="text-amber-900/90 leading-relaxed">
            Bảng bên phải là kết quả đúng theo A* và đề đang chọn. Chọn "Luyện tập"
            để nhập lại, hoặc "Làm lại từ đầu" để reset cùng đề.
          </p>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {validationErrors[0]}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-cyan-500" />
            <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center">
              <span>Đồ thị mô phỏng</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full font-black">
                ĐIỂM: {score}%
              </span>
            </h3>
            <p className="text-sm text-slate-500 mb-3">
              Bài toán: Tìm đường đi từ đỉnh {graph.start} đến đỉnh {graph.goal}
            </p>

            <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100 shadow-inner">
              <svg viewBox="0 0 460 300" className="w-full h-auto">
                <defs>
                  <marker
                    id={markerId}
                    viewBox="0 0 10 10"
                    refX="7.5"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    markerUnits="strokeWidth"
                    orient="auto-start-reverse"
                  >
                    <path d="M0 0 L10 5 L0 10 Z" fill="#94a3b8" />
                  </marker>
                </defs>

                {Object.entries(graph.edges).flatMap(([from, tos]) =>
                  tos.map((edge, idx) => {
                    const geo = drawEdge(from, edge.to);
                    if (!geo) return null;
                    return (
                      <g key={`${from}-${edge.to}-${idx}`}>
                        <line
                          x1={geo.startX}
                          y1={geo.startY}
                          x2={geo.endX}
                          y2={geo.endY}
                          stroke="#94a3b8"
                          strokeWidth={1.35}
                          markerEnd={`url(#${markerId})`}
                          strokeLinecap="round"
                        />
                        <rect
                          x={geo.mx - 10}
                          y={geo.my - 10}
                          width={20}
                          height={14}
                          rx={3}
                          fill="#ffffff"
                          stroke="#e2e8f0"
                        />
                        <text
                          x={geo.mx}
                          y={geo.my}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#334155"
                          fontSize={9}
                          fontWeight={700}
                        >
                          {edge.cost}
                        </text>
                      </g>
                    );
                  }),
                )}

                {graph.nodes.map((n) => {
                  const pos = graph.positions[n];
                  if (!pos) return null;
                  return (
                    <Node
                      key={n}
                      x={pos[0]}
                      y={pos[1]}
                      label={`${n}(${graph.heuristic[n]})`}
                      state={{}}
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-3xl text-white shadow-xl">
            <h4 className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
              <BookOpen size={14} className="text-cyan-300" /> Nhắc bài
            </h4>
            <p className="text-sm leading-relaxed text-slate-300 italic">
              A*: chọn trạng thái có f(n)=g(n)+h(n) nhỏ nhất từ danh sách mở rộng,
              rồi cập nhật lại g/f để sắp L tăng dần theo f.
            </p>
          </div>
        </div>

        <div
          className={`lg:col-span-8 bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col ${showSolution ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-200"}`}
        >
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <th className="p-4 border-r border-slate-100">TT</th>
                  <th className="p-4 border-r border-slate-100">TTK</th>
                  <th className="p-4 border-r border-slate-100">k(u,v)</th>
                  <th className="p-4 border-r border-slate-100">h(v)</th>
                  <th className="p-4 border-r border-slate-100">g(v)</th>
                  <th className="p-4 border-r border-slate-100">f(v)</th>
                  <th className="p-4">Danh sách L</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {(showSolution ? rows : history).map((row, rowIdx) => {
                  if (row.isGoal) {
                    return (
                      <tr
                        key={`goal-${rowIdx}`}
                        className={`border-b border-slate-100 ${
                          rowIdx === lastCorrectIndex ? "bg-green-50/60" : "bg-emerald-50/40"
                        }`}
                      >
                        <td className="p-4 border-r border-slate-100 font-black text-slate-900">
                          {row.expand}
                        </td>
                        <td className="p-4 text-emerald-800 font-bold" colSpan={6}>
                          {row.goalText}
                        </td>
                      </tr>
                    );
                  }

                  return row.details.map((d, dIdx) => (
                    <tr
                      key={`${rowIdx}-${dIdx}`}
                      className={`border-b border-slate-100 ${
                        rowIdx === lastCorrectIndex ? "bg-green-50/60" : ""
                      }`}
                    >
                      {dIdx === 0 && (
                        <td
                          rowSpan={row.details.length}
                          className="p-4 border-r border-slate-100 align-top font-black text-slate-900"
                        >
                          {row.expand}
                        </td>
                      )}
                      <td className="p-4 border-r border-slate-100 font-black">{d.node}</td>
                      <td className="p-4 border-r border-slate-100">{d.k}</td>
                      <td className="p-4 border-r border-slate-100">{d.h}</td>
                      <td className="p-4 border-r border-slate-100">{d.g}</td>
                      <td className="p-4 border-r border-slate-100 font-black">{d.f}</td>
                      {dIdx === 0 && (
                        <td
                          rowSpan={row.details.length}
                          className="p-4 align-top font-mono text-[12px] font-black text-cyan-700"
                        >
                          {row.listL || "-"}
                        </td>
                      )}
                    </tr>
                  ));
                })}

                {!showSolution && !completed && currentRow && (
                  <>
                    {currentRow.isGoal ? (
                      <tr className="border-b border-cyan-100 bg-cyan-50/40">
                        <td className="p-2 border-r border-cyan-100">
                          <input
                            value={inputs.expand}
                            onChange={(e) => setInputs((p) => ({ ...p, expand: e.target.value }))}
                            disabled={validationErrors.length > 0}
                            className={`w-full p-2 border rounded-xl text-center font-black outline-none focus:ring-2 ring-cyan-500 shadow-sm ${
                              validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            placeholder="TT"
                          />
                        </td>
                        <td className="p-2" colSpan={6}>
                          <input
                            value={inputs.goalText}
                            onChange={(e) =>
                              setInputs((p) => ({ ...p, goalText: e.target.value }))
                            }
                            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                            disabled={validationErrors.length > 0}
                            className={`w-full p-2 border rounded-xl outline-none focus:ring-2 ring-cyan-500 shadow-sm ${
                              validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            placeholder="TTKT/dừng, đường đi..., độ dài..."
                          />
                        </td>
                      </tr>
                    ) : (
                      <>
                        <tr className="border-b border-cyan-100 bg-cyan-50/20">
                          <td className="p-2 border-r border-cyan-100">
                            <input
                              value={inputs.expand}
                              onChange={(e) => setInputs((p) => ({ ...p, expand: e.target.value }))}
                              disabled={validationErrors.length > 0}
                              className={`w-full p-2 border rounded-xl text-center font-black outline-none focus:ring-2 ring-cyan-500 shadow-sm ${
                                validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              placeholder="TT"
                            />
                          </td>
                          <td className="p-2" colSpan={6}>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={inputs.rowCount || ""}
                              onChange={(e) => {
                                const rowCount = e.target.value;
                                const n = parseRowCount(rowCount);
                                setInputs((prev) => {
                                  const oldRows = prev.rows || [];
                                  const rows = Array.from({ length: n }, (_, idx) => ({
                                    ttk: oldRows[idx]?.ttk || "",
                                    k: oldRows[idx]?.k || "",
                                    h: oldRows[idx]?.h || "",
                                    g: oldRows[idx]?.g || "",
                                    f: oldRows[idx]?.f || "",
                                  }));
                                  return { ...prev, rowCount, rows };
                                });
                              }}
                              disabled={validationErrors.length > 0}
                              className={`w-full p-2 border rounded-xl outline-none focus:ring-2 ring-cyan-500 shadow-sm ${
                                validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              placeholder="Nhập n để tạo n dòng"
                            />
                          </td>
                        </tr>

                        {(inputs.rows || []).length > 0 ? (
                          (inputs.rows || []).map((_, detailIdx) => (
                            <tr key={`input-${detailIdx}`} className="border-b border-cyan-100 bg-cyan-50/40">
                              {detailIdx === 0 && (
                                <td rowSpan={inputs.rows.length} className="p-2 border-r border-cyan-100 align-top text-center text-xs text-slate-500 font-bold">
                                  n dong
                                </td>
                              )}
                              <td className="p-2 border-r border-cyan-100">
                                <input
                                  value={inputs.rows?.[detailIdx]?.ttk || ""}
                                  onChange={(e) =>
                                    setInputs((p) => {
                                      const rows = [...(p.rows || [])];
                                      rows[detailIdx] = { ...(rows[detailIdx] || {}), ttk: e.target.value };
                                      return { ...p, rows };
                                    })
                                  }
                                  disabled={validationErrors.length > 0}
                                  className={`w-full p-2 border rounded-xl outline-none focus:ring-2 ring-cyan-500 shadow-sm ${
                                    validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                  placeholder="TTK"
                                />
                              </td>
                              <td className="p-2 border-r border-cyan-100">
                                <input
                                  value={inputs.rows?.[detailIdx]?.k || ""}
                                  onChange={(e) =>
                                    setInputs((p) => {
                                      const rows = [...(p.rows || [])];
                                      rows[detailIdx] = { ...(rows[detailIdx] || {}), k: e.target.value };
                                      return { ...p, rows };
                                    })
                                  }
                                  disabled={validationErrors.length > 0}
                                  className={`w-full p-2 border rounded-xl outline-none focus:ring-2 ring-cyan-500 shadow-sm ${
                                    validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                  placeholder="k"
                                />
                              </td>
                              <td className="p-2 border-r border-cyan-100">
                                <input
                                  value={inputs.rows?.[detailIdx]?.h || ""}
                                  onChange={(e) =>
                                    setInputs((p) => {
                                      const rows = [...(p.rows || [])];
                                      rows[detailIdx] = { ...(rows[detailIdx] || {}), h: e.target.value };
                                      return { ...p, rows };
                                    })
                                  }
                                  disabled={validationErrors.length > 0}
                                  className={`w-full p-2 border rounded-xl outline-none focus:ring-2 ring-cyan-500 shadow-sm ${
                                    validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                  placeholder="h"
                                />
                              </td>
                              <td className="p-2 border-r border-cyan-100">
                                <input
                                  value={inputs.rows?.[detailIdx]?.g || ""}
                                  onChange={(e) =>
                                    setInputs((p) => {
                                      const rows = [...(p.rows || [])];
                                      rows[detailIdx] = { ...(rows[detailIdx] || {}), g: e.target.value };
                                      return { ...p, rows };
                                    })
                                  }
                                  disabled={validationErrors.length > 0}
                                  className={`w-full p-2 border rounded-xl outline-none focus:ring-2 ring-cyan-500 shadow-sm ${
                                    validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                  placeholder="g"
                                />
                              </td>
                              <td className="p-2 border-r border-cyan-100">
                                <input
                                  value={inputs.rows?.[detailIdx]?.f || ""}
                                  onChange={(e) =>
                                    setInputs((p) => {
                                      const rows = [...(p.rows || [])];
                                      rows[detailIdx] = { ...(rows[detailIdx] || {}), f: e.target.value };
                                      return { ...p, rows };
                                    })
                                  }
                                  disabled={validationErrors.length > 0}
                                  className={`w-full p-2 border rounded-xl outline-none focus:ring-2 ring-cyan-500 shadow-sm ${
                                    validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                  placeholder="f"
                                />
                              </td>
                              {detailIdx === 0 && (
                                <td rowSpan={inputs.rows.length} className="p-2 align-top">
                                  <input
                                    value={inputs.l}
                                    onChange={(e) => setInputs((p) => ({ ...p, l: e.target.value }))}
                                    onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                                    disabled={validationErrors.length > 0}
                                    className={`w-full p-2 border rounded-xl font-mono outline-none focus:ring-2 ring-cyan-500 shadow-sm ${
                                      validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                    placeholder="Danh sách L"
                                  />
                                </td>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr className="border-b border-cyan-100 bg-cyan-50/30">
                            <td className="p-2 text-center text-slate-400 italic text-xs" colSpan={7}>
                              Nhập n để tạo số dòng cần điền.
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t flex flex-wrap gap-3 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              {feedback && (
                <div
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    feedback.type === "error"
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {feedback.type === "error" ? <AlertCircle size={14} /> : <Check size={14} />}
                  {feedback.text}
                </div>
              )}

              {!showSolution && !completed && !hintUsed && currentRow && !currentRow.isGoal && (
                <button
                  type="button"
                  onClick={handleHint}
                  disabled={validationErrors.length > 0}
                  className={`px-3 py-2 rounded-xl text-xs font-bold bg-yellow-100 text-yellow-800 shadow-sm ${
                    validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  GỢI Ý (-10%)
                </button>
              )}

              {!showSolution && !completed && hintUsed && (
                <button
                  type="button"
                  disabled
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-yellow-200 text-yellow-500 shadow-sm"
                >
                  GỢI Ý Đã dùng
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSolution(false);
                  setFeedback(null);
                }}
                disabled={validationErrors.length > 0}
                className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wide border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 ${
                  validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <PencilLine size={16} className="inline-block mr-2" />
                Luyện tập
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSolution(true);
                  setFeedback({
                    type: "success",
                    text: "Đang xem đáp án mẫu, tắt để tự làm lại.",
                  });
                }}
                disabled={validationErrors.length > 0 || rows.length === 0}
                className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wide border shadow-sm ${
                  validationErrors.length > 0 || rows.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                }`}
              >
                <BookOpen size={16} className="inline-block mr-2" />
                Đáp án mẫu
              </button>

              {!showSolution && !completed && (
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={validationErrors.length > 0}
                  className={`px-8 py-3 rounded-2xl text-white font-black shadow-lg transition-transform active:scale-95 bg-cyan-600 shadow-cyan-200 ${
                    validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  KIỂM TRA (ENTER)
                </button>
              )}

              {!showSolution && completed && (
                <button
                  type="button"
                  onClick={resetPractice}
                  disabled={validationErrors.length > 0}
                  className="flex items-center gap-2 px-8 py-3 rounded-2xl font-black shadow-lg transition-transform active:scale-95 bg-slate-800 text-white shadow-slate-300 hover:bg-slate-900"
                >
                  <RotateCcw size={18} />
                  LÀM LẠI TỪ ĐẦU
                </button>
              )}
            </div>
          </div>

          {canRestartSameProblem && (
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={resetPractice}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <RotateCcw size={16} />
                Làm lại từ đầu
              </button>
            </div>
          )}

          {(showSolution || completed) && finalPath.length > 0 && (
            <div className="px-4 pb-4">
              <div className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-100 text-cyan-900">
                Đường đi: {finalPath.join(" -> ")} | Chi phí: {finalCost}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
