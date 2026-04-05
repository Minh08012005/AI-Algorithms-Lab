import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowRightLeft,
  AlertCircle,
  Check,
  Zap,
  BookOpen,
  PencilLine,
  RotateCcw,
} from "lucide-react";

// Nhập Data và Component
import { graphsData } from "../data/graphsData";
import Node from "../components/Node";

// ==========================================
// ⚙️ ENGINE: LOGIC TỰ ĐỘNG GIẢI BÀI TOÁN
// ==========================================
const getAlgorithmTrace = (graph, algo) => {
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

  // Standard DFS/BFS behavior (existing)
  const Q = [graph.start];
  let L = [graph.start];
  trace.push({ expand: "", adj: "", q: Q.join(","), l: L.join(",") });

  let success = false;
  while (L.length > 0 && !success) {
    // For DFS use stack semantics (pop from end). For BFS use queue (shift from front).
    let u = algo === "DFS" ? L.pop() : L.shift();
    // Ensure adjacency is consistently ordered alphabetically (case-insensitive)
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

    // Append new nodes to L. For DFS the last element is the stack top.
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

  // Reconstruct final path if goal reached
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
};

// helper to format list of {node,d} objects
const formatList = (arr) =>
  (arr || []).map((x) => `${x.node}(${x.d})`).join(",");

const STORAGE_KEY = "ai-lab-search-practice-v1";

const normPersist = (s) => (s || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();

/** Khôi phục chỉ khi còn khớp trace hiện tại (tránh bản cũ sau khi đổi đề/code). */
function validatePersistedSession(s, trace) {
  if (!s || s.v !== 1 || !Array.isArray(trace) || trace.length < 1) return false;
  if (!["DFS", "BFS", "DLS"].includes(s.algo)) return false;
  if (
    typeof s.graphIdx !== "number" ||
    s.graphIdx < 0 ||
    s.graphIdx >= graphsData.length
  )
    return false;
  if (!Array.isArray(s.history) || s.history.length === 0) return false;

  const completed = !!s.completed;
  const step = s.step;
  if (typeof step !== "number" || step < 1) return false;

  if (completed) {
    if (!trace[step]?.isGoal) return false;
    if (s.history.length !== step + 1) return false;
  } else {
    if (s.history.length !== step) return false;
    if (step >= trace.length) return false;
  }

  for (let i = 0; i < s.history.length; i++) {
    const tr = trace[i];
    const hi = s.history[i];
    if (!tr || !hi) return false;
    if (normPersist(hi.expand) !== normPersist(tr.expand)) return false;
    if (normPersist(hi.q) !== normPersist(tr.q)) return false;
    if (normPersist(hi.l) !== normPersist(tr.l)) return false;
    const goalRow = !!tr.isGoal;
    const adjHi = normPersist(hi.adj);
    const adjTr = normPersist(tr.adj);
    if (goalRow && i === s.history.length - 1) {
      const okTtkt = adjHi === normPersist("TTKT/DỪNG");
      if (!okTtkt && adjHi !== adjTr) return false;
    } else {
      if (adjHi !== adjTr) return false;
    }
  }
  return true;
}

function loadInitialPracticeState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    const g = graphsData[s.graphIdx];
    if (!g) return null;
    const { trace } = getAlgorithmTrace(g, s.algo);
    if (!validatePersistedSession(s, trace)) return null;
    return s;
  } catch {
    return null;
  }
}

const initialPracticeSession = loadInitialPracticeState();

// ==========================================
// 🖥️ COMPONENT CHÍNH CỦA MODULE
// ==========================================
export default function SearchModule() {
  const [algo, setAlgo] = useState(() => initialPracticeSession?.algo ?? "DFS");
  const [graphIdx, setGraphIdx] = useState(
    () => initialPracticeSession?.graphIdx ?? 0,
  );
  const [step, setStep] = useState(() => initialPracticeSession?.step ?? 1);
  const [score, setScore] = useState(() => initialPracticeSession?.score ?? 100);
  const [history, setHistory] = useState(
    () => initialPracticeSession?.history ?? [],
  );
  const [inputs, setInputs] = useState(
    () =>
      initialPracticeSession?.inputs ?? { expand: "", adj: "", q: "", l: "" },
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
  /** Khi bật: hiện toàn bộ trace đúng (tham khảo), không nhập / không trừ điểm */
  const [showSolution, setShowSolution] = useState(
    () => initialPracticeSession?.showSolution ?? false,
  );
  // Penalty configuration: wrong check vs hint
  const WRONG_PENALTY = 5;
  const HINT_PENALTY = 10;

  const graph = graphsData[graphIdx];
  const { trace, finalPath } = useMemo(
    () =>
      graph ? getAlgorithmTrace(graph, algo) : { trace: [], finalPath: [] },
    [graph, algo],
  );
  const svgWrapperRef = React.useRef(null);
  // Validate graph structure and node labels (letters or numbers only)
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

    const labelRe = /^[A-Za-z0-9]+$/;
    g.nodes.forEach((n) => {
      if (typeof n !== "string" || n.trim() === "") {
        errors.push(`Nút không hợp lệ: ${n}`);
      } else if (!labelRe.test(n)) {
        errors.push(`Nhãn nút phải là chữ cái hoặc số: ${n}`);
      }
      const pos = g.positions?.[n];
      if (!pos || !Array.isArray(pos) || pos.length < 2) {
        errors.push(`Không có vị trí (positions) cho nút: ${n}`);
      }
    });

    // Check edges refer to existing nodes
    const nodeSet = new Set(g.nodes);
    // Ensure start and goal exist
    if (!g.start || !nodeSet.has(g.start)) {
      errors.push(`Thiếu hoặc không hợp lệ thuộc tính start: ${g.start}`);
    }
    if (!g.goal || !nodeSet.has(g.goal)) {
      errors.push(`Thiếu hoặc không hợp lệ thuộc tính goal: ${g.goal}`);
    }
    Object.entries(g.edges || {}).forEach(([from, tos]) => {
      if (!nodeSet.has(from)) errors.push(`Edge nguồn không tồn tại: ${from}`);
      (tos || []).forEach((to) => {
        if (!nodeSet.has(to))
          errors.push(`Edge trỏ tới nút không tồn tại: ${from} -> ${to}`);
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
      /* quota / private mode */
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

  // Khởi tạo lịch sử ở lần chạy đầu tiên (useEffect để tránh side-effect trong render)
  useEffect(() => {
    if (history.length === 0 && trace.length > 0) {
      setHistory([trace[0]]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace]);

  // Keep lastCorrectIndex in sync when history grows (optional)
  useEffect(() => {
    if (lastCorrectIndex != null && lastCorrectIndex >= history.length) {
      setLastCorrectIndex(history.length - 1);
    }
  }, [history, lastCorrectIndex]);

  // Auto-fill `expand` field from trace for the current step so user doesn't need to type it
  useEffect(() => {
    if (!completed && trace && trace[step]) {
      // Only auto-fill the expand field for the initial step (start node)
      // and only if the user hasn't already typed something.
      if (step === 1) {
        setInputs((prev) => ({
          ...prev,
          expand:
            prev.expand && prev.expand.trim() !== ""
              ? prev.expand
              : trace[step].expand || "",
        }));
      } else {
        // clear expand for subsequent steps so user inputs it
        setInputs((prev) => ({ ...prev, expand: "" }));
      }
    }
  }, [step, trace, completed]);

  // Static rendering: we no longer auto-scroll or animate the graph — keep it as a static exam-style image.

  // Xử lý Reset khi đổi Thuật toán
  const handleAlgoChange = (newAlgo) => {
    if (newAlgo === algo) return;
    setAlgo(newAlgo);
    resetState(getAlgorithmTrace(graph, newAlgo));
  };

  // Xử lý Reset khi đổi Đề bài
  const handleGraphChange = (newIdx) => {
    if (newIdx === graphIdx) return;
    setGraphIdx(newIdx);
    resetState(getAlgorithmTrace(graphsData[newIdx], algo));
  };

  // Hàm Reset dùng chung (Thay thế cho useEffect bị lỗi đỏ của bạn)
  const resetState = (newTrace) => {
    // newTrace may be either an array (old behavior) or an object { trace, finalPath }
    const tr = Array.isArray(newTrace) ? newTrace : newTrace?.trace || [];
    setStep(1);
    setHistory(tr.length > 0 ? [tr[0]] : []);
    setInputs({ expand: "", adj: "", q: "", l: "" });
    setFeedback(null);
    setCompleted(false);
    setScore(100);
    setHintUsed(false);
    setLastCorrectIndex(null);
    setShowSolution(false);
  };

  /** Cùng đề + cùng thuật toán, bắt đầu lại từ bước đầu (xóa tiến độ đã lưu trên trình duyệt sau khi effect ghi lại). */
  const handleRestartSameProblem = () => {
    resetState(getAlgorithmTrace(graph, algo));
    setFeedback({
      type: "success",
      text: "Đã làm lại từ đầu với đề và thuật toán hiện tại.",
    });
  };

  const canRestartSameProblem =
    !showSolution &&
    validationErrors.length === 0 &&
    (completed || history.length > 1);

  const handleCheck = () => {
    const correct = trace[step];

    // If adjacency expected, require the user to fill it; also require Q and L be filled
    const adjRequired = (correct.adj || "").trim().length > 0;
    if (adjRequired && (!inputs.adj || inputs.adj.trim() === "")) {
      setFeedback({
        type: "error",
        text: "Vui lòng điền ô Trạng thái kề trước khi kiểm tra.",
      });
      return;
    }
    if (
      !inputs.q ||
      inputs.q.trim() === "" ||
      !inputs.l ||
      inputs.l.trim() === ""
    ) {
      setFeedback({
        type: "error",
        text: "Vui lòng điền đầy đủ ô Q và L trước khi kiểm tra.",
      });
      return;
    }

    const norm = (s) => (s || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();

    const normExpand = norm(inputs.expand);
    const normAdj = norm(inputs.adj);
    const normQ = norm(inputs.q);
    const normL = norm(inputs.l);
    const correctExpand = norm(correct.expand);
    const correctAdj = norm(correct.adj);
    const correctQ = norm(correct.q);
    const correctL = norm(correct.l);

    // Require adjacency input when there are neighbors; allow dash/empty when none
    const requireAdj = (correct.adj || "").trim().length > 0;

    // Enforce single convention: all fields must match exactly (case-insensitive, no punctuation)
    if (
      normExpand === correctExpand &&
      (!requireAdj || normAdj === correctAdj) &&
      normQ === correctQ &&
      normL === correctL
    ) {
      const newIndex = history.length;
      setHistory([
        ...history,
        { ...correct, adj: correct.isGoal ? "TTKT/DỪNG" : correct.adj },
      ]);
      setLastCorrectIndex(newIndex);

      if (correct.isGoal) {
        setCompleted(true);
        setFeedback({ type: "success", text: "Tuyệt vời! Bạn đã hoàn thành." });
      } else {
        setStep(step + 1);
        setInputs({ expand: "", adj: "", q: "", l: "" });
        setFeedback({
          type: "success",
          text: "Chính xác! Chuyển sang bước tiếp theo.",
        });
      }
    } else {
      setScore((s) => Math.max(0, s - WRONG_PENALTY));
      setFeedback({
        type: "error",
        text:
          "Sai rồi! Hãy kiểm tra lại nguyên tắc của " +
          (algo === "DFS" || algo === "DLS"
            ? "Stack"
            : "Queue (hàng đợi)"),
      });
    }
  };

  // Gợi ý: trừ điểm 1 lần, điền ô L hiện tại bằng giá trị đúng
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
            className={`p-3 rounded-xl text-white shadow-lg ${algo === "DFS" ? "bg-indigo-600 shadow-indigo-200" : "bg-emerald-600 shadow-emerald-200"}`}
          >
            <ArrowRightLeft size={24} />
          </div>

          {completed && finalPath && finalPath.length > 0 && (
            <div className="p-4 border-t bg-emerald-50/40">
              <h4 className="text-sm font-bold text-emerald-700 mb-2">
                Kết quả:
              </h4>
              <div className="text-sm font-mono text-emerald-800">
                Đường đi tìm được: {finalPath.join(" → ")}
              </div>
            </div>
          )}
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase leading-none mb-1">
              Thực hành Thuật toán Tìm kiếm
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {algo} Algorithm Mode
            </p>
          </div>
        </div>

        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => handleAlgoChange("DFS")}
            disabled={validationErrors.length > 0}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${algo === "DFS" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-200"} ${validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            DFS
          </button>
          <button
            onClick={() => handleAlgoChange("BFS")}
            disabled={validationErrors.length > 0}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${algo === "BFS" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:bg-slate-200"} ${validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            BFS
          </button>
          <button
            onClick={() => handleAlgoChange("DLS")}
            disabled={validationErrors.length > 0}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${algo === "DLS" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:bg-slate-200"} ${validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            DLS
          </button>
        </div>

        <select
          value={graphIdx}
          onChange={(e) => handleGraphChange(Number(e.target.value))}
          className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 ring-indigo-500"
        >
          {graphsData.map((g, i) => (
            <option key={i} value={i}>
              {g.name}
            </option>
          ))}
        </select>

        <div
          className="flex w-full sm:w-auto rounded-2xl border border-slate-200 bg-slate-100 p-1 gap-0.5"
          role="group"
          aria-label="Chế độ hiển thị"
        >
          <button
            type="button"
            onClick={() => {
              setShowSolution(false);
              setFeedback(null);
            }}
            disabled={validationErrors.length > 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${!showSolution ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"} ${validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <PencilLine size={16} />
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${showSolution ? "bg-amber-100 text-amber-900 shadow-sm ring-1 ring-amber-200" : "text-slate-500 hover:text-amber-800"} ${validationErrors.length > 0 || trace.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <BookOpen size={16} />
            Đáp án mẫu
          </button>
        </div>

        {canRestartSameProblem && (
          <button
            type="button"
            onClick={handleRestartSameProblem}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Làm lại từ đầu
          </button>
        )}
      </div>

      {/* Top score progress bar (ẩn khi chỉ xem đáp án) */}
      {!showSolution && (
        <div className="mb-6 space-y-1">
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${score}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Tiến độ luyện tập được lưu tự động trên trình duyệt (F5 hoặc mở lại
            trang vẫn tiếp tục được nếu cùng đề và thuật toán).
          </p>
        </div>
      )}

      {showSolution && trace.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <p className="font-bold mb-1">Chế độ đáp án mẫu</p>
          <p className="text-amber-900/90 leading-relaxed">
            Bảng bên phải là kết quả đúng theo {algo} và đề đang chọn. Dùng khi
            làm mãi không ra hoặc muốn đối chiếu từng bước. Chọn &quot;Luyện
            tập&quot; để nhập lại — tiến độ cũ vẫn giữ nếu bạn không bấm đổi đề
            hoặc đổi thuật toán/đồ thị (sẽ làm mới bài). Dùng &quot;Làm lại từ
            đầu&quot; để reset cùng một đề.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
            <div
              className={`absolute top-0 left-0 w-full h-1.5 ${algo === "DFS" ? "bg-indigo-500" : "bg-emerald-500"}`}
            ></div>
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
                <div
                  ref={svgWrapperRef}
                  style={{ maxHeight: 420, overflow: "auto" }}
                >
                  <svg viewBox="0 0 350 350" className="w-full h-auto">
                    <defs>
                      <marker
                        id="arr"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="8"
                        markerHeight="8"
                        orient="auto"
                      >
                        <path d="M0 0 L10 5 L0 10 Z" fill="#94a3b8" />
                      </marker>
                    </defs>
                    {/* helper: shorten line so arrow head isn't covered by node rect (rect half-width ~16) */}
                    {(() => {
                      const lines = [];
                      const nodeHalf = 18; // padding from node center to rectangle edge
                      Object.entries(graph.edges || {}).forEach(
                        ([from, tos]) => {
                          (tos || []).forEach((to) => {
                            const p1 = graph.positions?.[from];
                            const p2 = graph.positions?.[to];
                            if (!p1 || !p2) return;
                            const dx = p2[0] - p1[0];
                            const dy = p2[1] - p1[1];
                            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                            const ux = dx / dist;
                            const uy = dy / dist;
                            const startX = p1[0] + ux * nodeHalf * 0.6; // pull start a bit from center
                            const startY = p1[1] + uy * nodeHalf * 0.6;
                            const endX = p2[0] - ux * nodeHalf; // stop before target rect
                            const endY = p2[1] - uy * nodeHalf;
                            lines.push(
                              <line
                                key={`${from}-${to}`}
                                x1={startX}
                                y1={startY}
                                x2={endX}
                                y2={endY}
                                stroke="#94a3b8"
                                strokeWidth={1.5}
                                markerEnd="url(#arr)"
                                strokeLinecap="round"
                              />,
                            );
                          });
                        },
                      );
                      return <g>{lines}</g>;
                    })()}
                    {graph.nodes.map((n) => {
                      const pos = graph.positions?.[n];
                      if (!pos) return null;
                      return (
                        <Node
                          key={n}
                          id={`node-${n}`}
                          x={pos[0]}
                          y={pos[1]}
                          label={n}
                          // Pass empty state to keep nodes static (exam-style)
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
              {algo === "DFS"
                ? "Nguyên tắc Ngăn xếp (Stack): Lấy nút ở CUỐI danh sách L để mở rộng; thêm nút kề chưa có trong Q vào CUỐI L (đỉnh stack = phần tử bên phải trong chuỗi)."
                : "Nguyên tắc Hàng đợi (Queue): Lấy nút ở ĐẦU danh sách L; thêm nút kề chưa có trong Q vào CUỐI L."}
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
                  <th className="p-4 border-r border-slate-100">Danh sách Q</th>
                  <th className="p-4">
                    Danh sách L ({algo === "DFS" ? "Stack" : "Queue"})
                  </th>
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
                          {r.isGoal
                            ? "TTKT/DỪNG"
                            : r.adj
                              ? r.adj
                              : "—"}
                        </td>
                        <td className="p-4 text-slate-700 font-mono tracking-tighter border-r border-amber-100/60 text-xs">
                          {r.q}
                        </td>
                        <td
                          className={`p-4 font-mono font-black text-xs ${algo === "DFS" ? "text-indigo-700" : algo === "DLS" ? "text-purple-700" : "text-emerald-700"}`}
                        >
                          {r.l}
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
                        <td className="p-4 text-slate-500 font-mono tracking-tighter border-r border-slate-50">
                          {r.q}
                        </td>
                        <td
                          className={`p-4 font-mono font-black ${algo === "DFS" ? "text-indigo-600" : "text-emerald-600"}`}
                        >
                          {r.l}
                        </td>
                      </tr>
                    ))}

                {!showSolution && !completed && (
                  <tr
                    className={
                      algo === "DFS"
                        ? "bg-indigo-50/30"
                        : algo === "DLS"
                          ? "bg-purple-50/30"
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
                      {trace[step] &&
                      trace[step].adj &&
                      trace[step].adj.length > 0 ? (
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
                    <td className="p-2 border-r border-slate-100">
                      <input
                        value={inputs.q}
                        onChange={(e) =>
                          setInputs({ ...inputs, q: e.target.value })
                        }
                        disabled={validationErrors.length > 0}
                        className={`w-full p-2 border rounded-xl font-mono outline-none focus:ring-2 ring-indigo-500 shadow-sm ${validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="A,B..."
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={inputs.l}
                        onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                        onChange={(e) =>
                          setInputs({ ...inputs, l: e.target.value })
                        }
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
                  )}{" "}
                  {feedback.text}
                </div>
              )}
              {showSolution && finalPath && finalPath.length > 0 && (
                <div className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800">
                  Đường đi: {finalPath.join(" → ")}
                </div>
              )}
              {showSolution &&
                (!finalPath || finalPath.length === 0) &&
                trace.length > 1 && (
                  <div className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-700">
                    Thuật toán kết thúc mà không tới đích (ví dụ DLS vượt giới
                    hạn).
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
            {!showSolution && !completed && (
              <button
                type="button"
                onClick={handleCheck}
                disabled={validationErrors.length > 0}
                className={`px-8 py-3 rounded-2xl text-white font-black shadow-lg transition-transform active:scale-95 ${algo === "DFS" ? "bg-indigo-600 shadow-indigo-200" : algo === "DLS" ? "bg-purple-600 shadow-purple-200" : "bg-emerald-600 shadow-emerald-200"} ${validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
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
      </div>
    </div>
  );
}
