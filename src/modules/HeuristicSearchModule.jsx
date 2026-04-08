import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  PencilLine,
  RotateCcw,
  Zap,
} from "lucide-react";

import Node from "../components/Node";
import { heuristicGraphsData } from "../data/heuristicGraphsData";
import { getAlgorithmTrace } from "./heuristicEngine";
import {
  STORAGE_KEY,
  loadInitialHeuristicPracticeState,
} from "./heuristicSessionStorage";

const WRONG_PENALTY = 5;
const HINT_PENALTY = 10;

const makeEmptyInputs = () => ({ expand: "", adj: "", l: "" });

const normalize = (s) => (s || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
const tokenizeAdjacency = (s) =>
  ((s || "").toUpperCase().match(/[A-Z0-9]+/g) || []).filter(
    (token) => token !== "TTKT" && token !== "DUNG",
  );
const isSameAdjacency = (userAdj, correctAdj) => {
  const userSet = new Set(tokenizeAdjacency(userAdj));
  const correctSet = new Set(tokenizeAdjacency(correctAdj));
  if (userSet.size !== correctSet.size) return false;
  for (const node of correctSet) {
    if (!userSet.has(node)) return false;
  }
  return true;
};

const getAlgorithmLabel = (algo) =>
  algo === "HILL_CLIMBING" ? "Leo đồi" : "Best First Search";

export default function HeuristicSearchModule({
  initialAlgo = "BEST_FIRST",
  title,
  subtitle,
}) {
  const algo = initialAlgo;
  const initialPracticeSession = useMemo(
    () => loadInitialHeuristicPracticeState(algo),
    [algo],
  );

  const [graphIdx, setGraphIdx] = useState(
    () => initialPracticeSession?.graphIdx ?? 0,
  );
  const [step, setStep] = useState(() => initialPracticeSession?.step ?? 1);
  const [score, setScore] = useState(() => initialPracticeSession?.score ?? 100);
  const [history, setHistory] = useState(
    () => initialPracticeSession?.history ?? [],
  );
  const [inputs, setInputs] = useState(
    () => initialPracticeSession?.inputs ?? makeEmptyInputs(),
  );
  const [feedback, setFeedback] = useState(null);
  const [completed, setCompleted] = useState(
    () => initialPracticeSession?.completed ?? false,
  );
  const [hintUsed, setHintUsed] = useState(
    () => initialPracticeSession?.hintUsed ?? false,
  );
  const [lastCorrectIndex, setLastCorrectIndex] = useState(
    () => initialPracticeSession?.lastCorrectIndex ?? null,
  );
  const [showSolution, setShowSolution] = useState(
    () => initialPracticeSession?.showSolution ?? false,
  );

  const graph = heuristicGraphsData[graphIdx];
  const svgWrapperRef = useRef(null);
  const arrowMarkerId = `heuristic-arr-${algo}-${graphIdx}`;
  const pageTitle = title || getAlgorithmLabel(algo);
  const pageSubtitle =
    subtitle ||
    (algo === "HILL_CLIMBING"
      ? "Bài làm luyện tập theo thứ tự h(n) nhỏ nhất"
      : "Bài làm luyện tập theo lựa chọn h(n) tốt nhất");

  const { trace, finalPath } = useMemo(
    () =>
      graph ? getAlgorithmTrace(graph, algo) : { trace: [], finalPath: [] },
    [graph, algo],
  );

  const validateGraph = (g) => {
    const errors = [];
    if (!g) {
      errors.push("Đồ thị không tồn tại.");
      return errors;
    }

    if (!Array.isArray(g.nodes) || g.nodes.length === 0) {
      errors.push("Danh sách nút (nodes) bị thiếu hoặc rỗng.");
      return errors;
    }

    const nodeSet = new Set(g.nodes);
    g.nodes.forEach((n) => {
      if (!g.positions?.[n] || !Array.isArray(g.positions[n])) {
        errors.push(`Không có vị trí (positions) cho nút: ${n}`);
      }
      if (g.heuristic?.[n] === undefined || g.heuristic?.[n] === null) {
        errors.push(`Thiếu heuristic cho nút: ${n}`);
      }
    });

    if (!g.start || !nodeSet.has(g.start)) {
      errors.push(`Thiếu hoặc không hợp lệ thuộc tính start: ${g.start}`);
    }
    if (!g.goal || !nodeSet.has(g.goal)) {
      errors.push(`Thiếu hoặc không hợp lệ thuộc tính goal: ${g.goal}`);
    }

    Object.entries(g.edges || {}).forEach(([from, tos]) => {
      if (!nodeSet.has(from)) errors.push(`Edge nguồn không tồn tại: ${from}`);
      (tos || []).forEach((to) => {
        if (!nodeSet.has(to)) {
          errors.push(`Edge trỏ tới nút không tồn tại: ${from} -> ${to}`);
        }
      });
    });

    return Array.from(new Set(errors));
  };

  const validationErrors = useMemo(() => validateGraph(graph), [graph]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (validationErrors.length > 0) return;
    if (history.length === 0) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          v: 1,
          algo,
          graphIdx,
          step,
          history,
          score,
          completed,
          hintUsed,
          lastCorrectIndex,
          inputs,
          showSolution,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [
    algo,
    graphIdx,
    step,
    history,
    score,
    completed,
    hintUsed,
    lastCorrectIndex,
    inputs,
    showSolution,
    validationErrors.length,
  ]);

  useEffect(() => {
    if (history.length === 0 && trace.length > 0) {
      setHistory([trace[0]]);
    }
  }, [trace, history.length]);

  useEffect(() => {
    if (lastCorrectIndex != null && lastCorrectIndex >= history.length) {
      setLastCorrectIndex(history.length - 1);
    }
  }, [history, lastCorrectIndex]);

  useEffect(() => {
    if (!completed && trace && trace[step]) {
      if (step === 1) {
        setInputs((prev) => ({
          ...prev,
          expand:
            prev.expand && prev.expand.trim() !== ""
              ? prev.expand
              : trace[step].expand || "",
        }));
      } else {
        setInputs((prev) => ({ ...prev, expand: "" }));
      }
    }
  }, [step, trace, completed]);

  const resetState = (newTrace) => {
    const tr = Array.isArray(newTrace) ? newTrace : newTrace?.trace || [];
    setStep(1);
    setHistory(tr.length > 0 ? [tr[0]] : []);
    setInputs(makeEmptyInputs());
    setFeedback(null);
    setCompleted(false);
    setScore(100);
    setHintUsed(false);
    setLastCorrectIndex(null);
    setShowSolution(false);
  };

  const handleGraphChange = (newIdx) => {
    if (newIdx === graphIdx) return;
    setGraphIdx(newIdx);
    resetState(getAlgorithmTrace(heuristicGraphsData[newIdx], algo));
  };

  const handleRestartSameProblem = () => {
    resetState(getAlgorithmTrace(graph, algo));
    setFeedback({
      type: "success",
      text: "Đã làm lại từ đầu với đề và thuật toán hiện tại.",
    });
  };

  const canRestartSameProblem =
    !showSolution && validationErrors.length === 0 && (completed || history.length > 1);

  const handleCheck = () => {
    const correct = trace[step];
    if (!correct) return;

    const adjRequired = (correct.adj || "").trim().length > 0;
    if (adjRequired && (!inputs.adj || inputs.adj.trim() === "")) {
      setFeedback({
        type: "error",
        text: "Vui lòng điền ô Trạng thái kề trước khi kiểm tra.",
      });
      return;
    }

    if (!inputs.l || inputs.l.trim() === "") {
      setFeedback({
        type: "error",
        text: "Vui lòng điền ô Danh sách L trước khi kiểm tra.",
      });
      return;
    }

    const normExpand = normalize(inputs.expand);
    const normL = normalize(inputs.l);

    const correctExpand = normalize(correct.expand);
    const correctL = normalize(correct.l);

    if (
      normExpand === correctExpand &&
      (!adjRequired || isSameAdjacency(inputs.adj, correct.adj)) &&
      normL === correctL
    ) {
      const newIndex = history.length;
      setHistory([
        ...history,
        {
          ...correct,
          adj: correct.isGoal ? "TTKT/DỪNG" : correct.adj,
        },
      ]);
      setLastCorrectIndex(newIndex);

      if (correct.isGoal) {
        setCompleted(true);
        setFeedback({ type: "success", text: "Tuyệt vời! Bạn đã hoàn thành." });
      } else {
        setStep(step + 1);
        setInputs(makeEmptyInputs());
        setFeedback({
          type: "success",
          text: "Chính xác! Chuyển sang bước tiếp theo.",
        });
      }
    } else {
      setScore((s) => Math.max(0, s - WRONG_PENALTY));
      setFeedback({
        type: "error",
        text: `Sai rồi! Hãy kiểm tra lại nguyên tắc của ${getAlgorithmLabel(algo)}.`,
      });
    }
  };

  const handleHint = () => {
    if (completed) return;
    if (hintUsed) {
      setFeedback({ type: "error", text: "Bạn đã sử dụng gợi ý rồi." });
      return;
    }

    const correct = trace[step];
    if (!correct) return;

    setScore((s) => Math.max(0, s - HINT_PENALTY));
    setInputs((prev) => ({ ...prev, l: correct.l }));
    setHintUsed(true);
    setFeedback({
      type: "success",
      text: `Gợi ý đã hiển thị (ô L được điền). -${HINT_PENALTY}%`,
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl text-white shadow-lg ${algo === "BEST_FIRST" ? "bg-orange-600 shadow-orange-200" : "bg-emerald-600 shadow-emerald-200"}`}
          >
            <Zap size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase leading-none mb-1">
              {pageTitle}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {pageSubtitle}
            </p>
          </div>
        </div>

        <select
          value={graphIdx}
          onChange={(e) => handleGraphChange(Number(e.target.value))}
          className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 ring-indigo-500"
        >
          {heuristicGraphsData.map((g, i) => (
            <option key={i} value={i}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {!showSolution && (
        <div className="mb-6 space-y-1">
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Tiến độ luyện tập được lưu tự động trên trình duyệt.
          </p>
        </div>
      )}

      {showSolution && trace.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <p className="font-bold mb-1">Chế độ đáp án mẫu</p>
          <p className="text-amber-900/90 leading-relaxed">
            Bảng bên phải là kết quả đúng theo {pageTitle} và đề đang chọn. Chọn
            &quot;Luyện tập&quot; để nhập lại — tiến độ cũ vẫn giữ nếu bạn không đổi
            đề. Dùng &quot;Làm lại từ đầu&quot; để reset cùng một đề.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
            <div
              className={`absolute top-0 left-0 w-full h-1.5 ${algo === "BEST_FIRST" ? "bg-orange-500" : "bg-emerald-500"}`}
            />
            <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center">
              <span>Đồ thị mô phỏng</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full font-black">
                ĐIỂM: {score}%
              </span>
            </h3>
            <p className="text-sm text-slate-500 mb-3">
              {graph && graph.start && graph.goal
                ? `Bài toán: Tìm đường đi từ đỉnh ${graph.start} đến đỉnh ${graph.goal}`
                : "Bài toán: (Thiếu start/goal)"}
            </p>
            <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100 shadow-inner">
              {!graph || !graph.nodes || !graph.positions ? (
                <div className="p-6 text-sm text-slate-500">
                  Đồ thị không có dữ liệu hiển thị.
                </div>
              ) : (
                <div ref={svgWrapperRef} style={{ maxHeight: 420, overflow: "auto" }}>
                  <svg viewBox="0 0 350 350" className="w-full h-auto">
                    <defs>
                      <marker
                        id={arrowMarkerId}
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
                    {(() => {
                      const lines = [];
                      const nodeHalf = 24;
                      Object.entries(graph.edges || {}).forEach(([from, tos]) => {
                        (tos || []).forEach((to) => {
                          const p1 = graph.positions?.[from];
                          const p2 = graph.positions?.[to];
                          if (!p1 || !p2) return;
                          const dx = p2[0] - p1[0];
                          const dy = p2[1] - p1[1];
                          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                          const ux = dx / dist;
                          const uy = dy / dist;
                          const startX = p1[0] + ux * nodeHalf * 0.6;
                          const startY = p1[1] + uy * nodeHalf * 0.6;
                          const endX = p2[0] - ux * nodeHalf;
                          const endY = p2[1] - uy * nodeHalf;
                          lines.push(
                            <line
                              key={`${from}-${to}`}
                              x1={startX}
                              y1={startY}
                              x2={endX}
                              y2={endY}
                              stroke="#94a3b8"
                              strokeWidth={1.35}
                              markerEnd={`url(#${arrowMarkerId})`}
                              strokeLinecap="round"
                            />,
                          );
                        });
                      });
                      return <g>{lines}</g>;
                    })()}
                    {graph.nodes.map((n) => {
                      const pos = graph.positions?.[n];
                      if (!pos) return null;
                      const nodeLabel = `${n}(${graph.heuristic?.[n]})`;
                      return (
                        <Node
                          key={n}
                          id={`node-${n}`}
                          x={pos[0]}
                          y={pos[1]}
                          label={nodeLabel}
                          state={{}}
                        />
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-3xl text-white shadow-xl">
            <h4 className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
              <Zap size={14} className="text-yellow-400" /> Nhắc bài
            </h4>
            <p className="text-sm leading-relaxed text-slate-300 italic">
              {algo === "BEST_FIRST"
                ? "Best First Search: luôn chọn nút có h(n) nhỏ nhất từ danh sách mở rộng."
                : "Leo đồi: luôn chọn láng giềng có h(n) nhỏ nhất ở bước hiện tại, nên có thể kẹt ở cực trị địa phương."}
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
                  <th className="p-4 w-20 text-center border-r border-slate-100">
                    TT
                  </th>
                  <th className="p-4 border-r border-slate-100">
                    Trạng thái kề
                  </th>
                  <th className="p-4">Danh sách L</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {showSolution
                  ? trace.map((r, i) => (
                      <tr
                        key={`sol-${i}`}
                        className="border-b border-amber-100/80 bg-amber-50/30 hover:bg-amber-50/50"
                      >
                        <td className="p-4 text-center font-black text-slate-900 border-r border-amber-100/60">
                          {r.expand || "—"}
                        </td>
                        <td className="p-4 text-slate-600 border-r border-amber-100/60 font-mono text-xs">
                          {r.isGoal ? "TTKT/DỪNG" : r.adj ? r.adj : "—"}
                        </td>
                        <td className="p-4 font-mono font-black text-xs text-emerald-700">
                          {r.l || "—"}
                        </td>
                      </tr>
                    ))
                  : history.map((r, i) => (
                      <tr
                        key={i}
                        className={`border-b border-slate-50 transition-colors hover:bg-slate-50/50 ${i === lastCorrectIndex ? "bg-green-50/60" : ""}`}
                      >
                        <td className="p-4 text-center font-black text-slate-900 border-r border-slate-50">
                          {r.expand}
                        </td>
                        <td className="p-4 text-slate-500 border-r border-slate-50 italic">
                          {r.adj || "—"}
                        </td>
                        <td className="p-4 font-mono font-black text-emerald-600">
                          {r.l}
                        </td>
                      </tr>
                    ))}

                {!showSolution && !completed && (
                  <tr
                    className={
                      algo === "BEST_FIRST"
                        ? "bg-orange-50/30"
                        : "bg-emerald-50/30"
                    }
                  >
                    <td className="p-2 border-r border-slate-100">
                      <input
                        value={inputs.expand}
                        onChange={(e) =>
                          setInputs({ ...inputs, expand: e.target.value })
                        }
                        disabled={validationErrors.length > 0}
                        className={`w-full p-2 border rounded-xl text-center font-black outline-none focus:ring-2 ring-indigo-500 shadow-sm bg-white ${validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="A"
                      />
                    </td>
                    <td className="p-2 text-center text-slate-400 italic text-xs border-r border-slate-100">
                      {trace[step] && trace[step].adj && trace[step].adj.length > 0 ? (
                        <input
                          value={inputs.adj}
                          onChange={(e) =>
                            setInputs({ ...inputs, adj: e.target.value })
                          }
                          disabled={validationErrors.length > 0}
                          className={`w-full p-2 border rounded-xl font-mono outline-none focus:ring-2 ring-indigo-500 shadow-sm ${validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="B,C..."
                        />
                      ) : (
                        <div className="text-xs italic text-slate-400">—</div>
                      )}
                    </td>
                    <td className="p-2">
                      <input
                        value={inputs.l}
                        onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                        onChange={(e) => setInputs({ ...inputs, l: e.target.value })}
                        disabled={validationErrors.length > 0}
                        className={`w-full p-2 border rounded-xl font-mono outline-none focus:ring-2 ring-indigo-500 shadow-sm ${validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="Nhập L..."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t flex flex-wrap gap-3 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              {feedback && (
                <div
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-left-2 ${feedback.type === "error" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
                >
                  {feedback.type === "error" ? (
                    <AlertCircle size={14} />
                  ) : (
                    <Check size={14} />
                  )}
                  {feedback.text}
                </div>
              )}
              {showSolution && finalPath && finalPath.length > 0 && (
                <div className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800">
                  Đường đi: {finalPath.join(" → ")}
                </div>
              )}
              {showSolution && (!finalPath || finalPath.length === 0) && trace.length > 1 && (
                <div className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-700">
                  Thuật toán kết thúc mà không tới đích.
                </div>
              )}
              {!showSolution && !completed && !hintUsed && (
                <button
                  type="button"
                  onClick={handleHint}
                  disabled={validationErrors.length > 0}
                  className={`px-3 py-2 rounded-xl text-xs font-bold bg-yellow-100 text-yellow-800 shadow-sm ${validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  GỢI Ý (-10%)
                </button>
              )}
              {!showSolution && !completed && hintUsed && (
                <button
                  type="button"
                  disabled
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-yellow-200 text-yellow-400 shadow-sm"
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
                className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wide border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 ${validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
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
                    text: "Đang xem đáp án mẫu — tắt để tự làm lại.",
                  });
                }}
                disabled={validationErrors.length > 0 || trace.length === 0}
                className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wide border shadow-sm ${validationErrors.length > 0 || trace.length === 0 ? "opacity-50 cursor-not-allowed" : "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"}`}
              >
                <BookOpen size={16} className="inline-block mr-2" />
                Đáp án mẫu
              </button>
              {!showSolution && !completed && (
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={validationErrors.length > 0}
                  className={`px-8 py-3 rounded-2xl text-white font-black shadow-lg transition-transform active:scale-95 ${algo === "BEST_FIRST" ? "bg-orange-600 shadow-orange-200" : "bg-emerald-600 shadow-emerald-200"} ${validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  KIỂM TRA (ENTER)
                </button>
              )}
              {!showSolution && completed && (
                <button
                  type="button"
                  onClick={handleRestartSameProblem}
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
                onClick={handleRestartSameProblem}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <RotateCcw size={16} />
                Làm lại từ đầu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
