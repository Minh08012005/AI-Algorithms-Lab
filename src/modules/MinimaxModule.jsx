import React, { useState, useMemo, useEffect } from "react";
import {
  AlertCircle,
  Check,
  Lightbulb,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  BookOpen,
} from "lucide-react";

import { minimaxGraphsData } from "../data/minimaxGraphsData";
import {
  getMinimaxTrace,
  formatInfinity,
  compareInputWithExpected,
} from "./minimaxEngine";
import {
  loadInitialPracticeState,
  savePracticeState,
  STORAGE_KEY,
} from "./minimaxSessionStorage";

// ==========================================
// 🖥️ MINIMAX MODULE COMPONENT
// ==========================================
export default function MinimaxModule({
  initialGraphIdx = 0,
  title = "Thực hành Minimax với Alpha-Beta Pruning",
}) {
  // Penalties
  const WRONG_PENALTY = 5;
  const HINT_PENALTY = 10;

  // ===== STATE =====
  const initialPracticeSession = useMemo(() => loadInitialPracticeState(), []);
  const [graphIdx, setGraphIdx] = useState(
    () => initialPracticeSession?.graphIdx ?? initialGraphIdx,
  );
  const [step, setStep] = useState(() => initialPracticeSession?.step ?? 0);
  const [score, setScore] = useState(
    () => initialPracticeSession?.score ?? 100,
  );
  const [history, setHistory] = useState(
    () => initialPracticeSession?.history ?? [],
  );
  const [completed, setCompleted] = useState(
    () => initialPracticeSession?.completed ?? false,
  );
  const [hintUsed, setHintUsed] = useState(
    () => initialPracticeSession?.hintUsed ?? false,
  );
  const [inputs, setInputs] = useState(
    () =>
      initialPracticeSession?.inputs ?? {
        v: "",
        alpha: "",
        beta: "",
      },
  );
  const [feedback, setFeedback] = useState(null);
  const [showSolution, setShowSolution] = useState(
    () => initialPracticeSession?.showSolution ?? false,
  );
  const [showHint, setShowHint] = useState(false);

  // ===== COMPUTED DATA =====
  const gameTree = minimaxGraphsData[graphIdx];
  const { trace } = useMemo(
    () =>
      gameTree
        ? getMinimaxTrace(gameTree, { maxPlayerRoot: gameTree.maxPlayerRoot })
        : { trace: [] },
    [gameTree],
  );

  const isComplete = completed || step >= trace.length;
  const currentTraceStep = step < trace.length ? trace[step] : null;
  const currentNodeId = currentTraceStep?.nodeId;

  // ===== COMPUTE STATE AT CURRENT STEP =====
  /**
   * Track which nodes have been COMPLETED by user (submitted correctly)
   * Only nodes in history are marked as evaluated
   * This ensures values only show AFTER user submits correct answer
   */
  const {
    evaluatedNodes = new Set(),
    prunedNodesAtStep = new Set(),
    prunedTerminalValues = new Set(),
    nodeAlphaBetaAtStep = {},
  } = useMemo(() => {
    const evaluated = new Set();
    const pruned = new Set();
    const prunedTerminals = new Set(); // Track pruned terminal values: "nodeId-idx"
    const alphaBetaMap = {};

    // Only mark nodes as evaluated if user submitted answer correctly (they're in history)
    history.forEach((historyStep) => {
      const nodeId = historyStep.nodeId;
      evaluated.add(nodeId);
      alphaBetaMap[nodeId] = {
        alpha:
          historyStep.alphaAfter !== undefined ? historyStep.alphaAfter : null,
        beta:
          historyStep.betaAfter !== undefined ? historyStep.betaAfter : null,
        v: historyStep.value !== undefined ? historyStep.value : null,
      };

      // Track pruned nodes (but NOT leaf nodes with pruned terminal values)
      if (historyStep.pruned === true && !historyStep.isTerminalValue) {
        pruned.add(nodeId);
      }

      // If this is a pruned terminal value step, mark all remaining values as pruned
      if (
        historyStep.pruned === true &&
        historyStep.isTerminalValue &&
        historyStep.isLeaf
      ) {
        const currentIdx = historyStep.terminalValueIdx;
        const totalCount = historyStep.terminalValueCount || 0;
        // Mark all values AFTER this index as pruned
        for (let i = currentIdx + 1; i < totalCount; i++) {
          const key = `${nodeId}-${i}`;
          prunedTerminals.add(key);
        }
      }

      // Track pruned terminal values from history
      if (
        historyStep.isTerminalValue &&
        historyStep.isPrunedTerminalValue === true
      ) {
        const key = `${nodeId}-${historyStep.terminalValueIdx}`;
        prunedTerminals.add(key);
      }
    });

    return {
      evaluatedNodes: evaluated,
      prunedNodesAtStep: pruned,
      prunedTerminalValues: prunedTerminals,
      nodeAlphaBetaAtStep: alphaBetaMap,
    };
  }, [history]);

  // Validation Errors
  const validateGameTree = (g) => {
    const errors = [];
    if (!g) {
      errors.push("Đồ thị game không tồn tại.");
      return errors;
    }
    if (!g.nodes || Object.keys(g.nodes).length === 0) {
      errors.push("Không có nodes trong game tree.");
      return errors;
    }
    const rootNodeId = g.root || "a";
    if (!g.nodes[rootNodeId]) {
      errors.push(`Game tree phải có node '${rootNodeId}'.`);
    }
    return errors;
  };

  const validationErrors = useMemo(
    () => validateGameTree(gameTree),
    [gameTree],
  );

  // ===== HELPER: Determine if current step is submitted =====
  const isCurrentStepSubmitted = useMemo(() => {
    if (!currentTraceStep) return false;
    return history.some((h) => h.step === currentTraceStep.step);
  }, [history, currentTraceStep]);

  // ===== EFFECTS =====
  // Reset form inputs when step changes
  useEffect(() => {
    setInputs({ v: "", alpha: "", beta: "" });
    setFeedback(null);
    setShowHint(false);
  }, [step]);

  // Persist to localStorage
  useEffect(() => {
    if (validationErrors.length > 0) return;
    if (history.length === 0) return;

    try {
      savePracticeState({
        v: 1,
        graphIdx,
        step,
        score,
        history,
        completed,
        hintUsed,
        inputs,
        showSolution,
      });
    } catch {
      /* Quota or private mode */
    }
  }, [
    graphIdx,
    step,
    score,
    history,
    completed,
    hintUsed,
    inputs,
    showSolution,
    validationErrors.length,
  ]);

  // ===== HANDLERS =====

  const handleInputChange = (field, value) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheck = () => {
    if (!currentTraceStep) return;

    const expectedState = currentTraceStep.expectedState;
    const expectedV = expectedState.v;
    const expectedAlpha = expectedState.alpha;
    const expectedBeta = expectedState.beta;

    // Validate using normalized string comparison
    const vMatch = compareInputWithExpected(inputs.v, expectedV);
    const alphaMatch = compareInputWithExpected(inputs.alpha, expectedAlpha);
    const betaMatch = compareInputWithExpected(inputs.beta, expectedBeta);

    if (vMatch && alphaMatch && betaMatch) {
      // Correct!
      setFeedback({
        type: "success",
        message: `✓ Chính xác! v=${expectedV}, α=${formatInfinity(expectedAlpha)}, β=${formatInfinity(expectedBeta)}`,
      });
      setHistory([...history, currentTraceStep]);
      setShowHint(false);

      // Move to next step
      if (step < trace.length - 1) {
        setStep(step + 1);
      } else {
        setCompleted(true);
      }
    } else {
      // Incorrect
      setFeedback({
        type: "error",
        message: `Sai! Expected: v=${expectedV}, α=${formatInfinity(expectedAlpha)}, β=${formatInfinity(expectedBeta)}`,
      });
      setScore((prev) => Math.max(0, prev - WRONG_PENALTY));
      setShowHint(false);
    }
  };

  const handleHint = () => {
    if (!currentTraceStep) return;

    setShowHint(true);
    const hints = [];
    const expectedState = currentTraceStep.expectedState;

    if (expectedState.v !== null && expectedState.v !== undefined) {
      hints.push(`v (Kỳ vọng): ${formatInfinity(expectedState.v)}`);
    }
    hints.push(`α (Kỳ vọng): ${formatInfinity(expectedState.alpha)}`);
    hints.push(`β (Kỳ vọng): ${formatInfinity(expectedState.beta)}`);

    setFeedback({
      type: "hint",
      message: hints.join(" | "),
    });
    setScore(Math.max(0, score - HINT_PENALTY));
    setHintUsed(true);
  };

  const handleShowSolution = () => {
    setShowSolution(!showSolution);
  };

  const handleReset = () => {
    setStep(0);
    setScore(100);
    setHistory([]);
    setCompleted(false);
    setHintUsed(false);
    setInputs({ v: "", alpha: "", beta: "" });
    setFeedback(null);
    setShowSolution(false);
    setShowHint(false);
  };

  const handleChangeGraph = (newIdx) => {
    setGraphIdx(newIdx);
    handleReset();
  };

  const handlePrevStep = () => {
    if (step > 0) {
      setStep(step - 1);
      setInputs({ v: "", alpha: "", beta: "" });
      setFeedback(null);
      setShowHint(false);
    }
  };

  const handleNextStep = () => {
    if (step < trace.length - 1) {
      setStep(step + 1);
      setInputs({ v: "", alpha: "", beta: "" });
      setFeedback(null);
      setShowHint(false);
    }
  };

  // ===== RENDER =====

  if (validationErrors.length > 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-red-800">Validation Error</h3>
            {validationErrors.map((err, i) => (
              <p key={i} className="text-sm text-red-700">
                • {err}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{title}</h1>
          <p className="text-sm text-gray-600">
            Điền các giá trị v, α, β cho mỗi bước.{" "}
            <span className="font-bold text-blue-600">Điểm: {score}/100</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Graph Selector */}
            <div className="bg-white rounded-lg shadow p-3">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Chọn Bộ Đề:
              </label>
              <select
                value={graphIdx}
                onChange={(e) => handleChangeGraph(parseInt(e.target.value))}
                disabled={history.length > 1}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                {minimaxGraphsData.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                {gameTree?.description}
              </p>
            </div>

            {/* Tree Visualization */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-bold text-gray-800 mb-3">
                Cây Game (Game Tree)
              </h2>

              {/* Instruction: Leaf nodes display */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-3 text-xs text-blue-900">
                <strong>💡 Gợi ý:</strong> Giá trị nút lá (Terminal Node) được
                hiển thị từ bước 0, bạn chỉ cần nhập α, β dựa trên giá trị này.
                Nút lá được hoàn thành sẽ có dấu ✓.
              </div>

              <TreeVisualization
                nodes={gameTree?.nodes}
                currentNodeId={currentNodeId}
                evaluatedNodes={evaluatedNodes}
                nodeAlphaBetaAtStep={nodeAlphaBetaAtStep}
                prunedNodesAtStep={prunedNodesAtStep}
                prunedTerminalValues={prunedTerminalValues}
              />
            </div>

            {/* Trace Table */}
            {!showSolution && currentTraceStep && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3">
                  Thông Tin Nút Hiện Tại
                </h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 text-xs">ID Nút:</span>
                      <span className="ml-2 font-mono font-bold text-base">
                        {currentNodeId}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-xs">Loại:</span>
                      <span className="ml-2 font-bold text-base">
                        {currentTraceStep.isMax ? "MAX" : "MIN"}
                      </span>
                    </div>

                    {/* Status badge: Initial or Expected */}
                    <div className="col-span-2">
                      {!isCurrentStepSubmitted ? (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                          <span className="text-blue-700 text-xs font-bold">
                            📋 Giá trị ban đầu (Initial State)
                          </span>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded p-2">
                          <span className="text-amber-700 text-xs font-bold">
                            ✓ Giá trị kỳ vọng (Expected State)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* LEAF NODE INDICATOR */}
                    {currentTraceStep.isLeaf && (
                      <div className="col-span-2 bg-green-50 border border-green-200 rounded p-2">
                        <span className="text-green-700 text-xs font-bold">
                          📍 Nút Lá (Terminal Node)
                        </span>
                      </div>
                    )}

                    {/* Show initial v and alpha/beta */}
                    {!isCurrentStepSubmitted &&
                      !currentTraceStep.isLeaf &&
                      currentTraceStep.initialState?.v !== null && (
                        <div>
                          <span className="text-gray-600 text-xs">
                            v (Ban Đầu):
                          </span>
                          <span className="ml-2 font-mono font-bold text-base text-blue-600">
                            {currentTraceStep.initialState.v ===
                            Number.NEGATIVE_INFINITY
                              ? "-∞"
                              : currentTraceStep.initialState.v ===
                                  Number.POSITIVE_INFINITY
                                ? "+∞"
                                : currentTraceStep.initialState.v}
                          </span>
                        </div>
                      )}

                    {/* Show expected v if submitted */}
                    {isCurrentStepSubmitted &&
                      currentTraceStep.expectedState?.v !== null && (
                        <div>
                          <span className="text-gray-600 text-xs">
                            v (Kỳ Vọng):
                          </span>
                          <span className="ml-2 font-mono font-bold text-base text-amber-600">
                            {currentTraceStep.expectedState.v ===
                            Number.NEGATIVE_INFINITY
                              ? "-∞"
                              : currentTraceStep.expectedState.v ===
                                  Number.POSITIVE_INFINITY
                                ? "+∞"
                                : currentTraceStep.expectedState.v}
                          </span>
                        </div>
                      )}

                    {/* Show leaf v always */}
                    {currentTraceStep.isLeaf && (
                      <div>
                        <span className="text-gray-600 text-xs">
                          v (Giá Trị):
                        </span>
                        <span className="ml-2 font-mono font-bold text-base text-green-600">
                          {currentTraceStep?.value}
                        </span>
                      </div>
                    )}

                    {/* Alpha and Beta */}
                    <div>
                      <span className="text-gray-600 text-xs">
                        α ({isCurrentStepSubmitted ? "Kỳ Vọng" : "Ban Đầu"}):
                      </span>
                      <span className="ml-2 font-mono text-base">
                        {formatInfinity(
                          isCurrentStepSubmitted
                            ? (currentTraceStep.expectedState?.alpha ??
                                currentTraceStep.alphaAfter)
                            : (currentTraceStep.initialState?.alpha ??
                                currentTraceStep.alphaAtStartOfStep),
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-xs">
                        β ({isCurrentStepSubmitted ? "Kỳ Vọng" : "Ban Đầu"}):
                      </span>
                      <span className="ml-2 font-mono text-base">
                        {formatInfinity(
                          isCurrentStepSubmitted
                            ? (currentTraceStep.expectedState?.beta ??
                                currentTraceStep.betaAfter)
                            : (currentTraceStep.initialState?.beta ??
                                currentTraceStep.betaAtStartOfStep),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Input Panel */}
            {!showSolution && currentTraceStep && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3">
                  Nhập Câu Trả Lời
                </h2>
                <div className="space-y-3">
                  <InputField
                    label="Giá Trị (v)"
                    value={inputs.v}
                    onChange={(val) => handleInputChange("v", val)}
                    placeholder="e.g., 5"
                    isInfinityField={true}
                  />
                  <InputField
                    label="Alpha (α) Sau Cập Nhật"
                    value={inputs.alpha}
                    onChange={(val) => handleInputChange("alpha", val)}
                    placeholder="-∞ hoặc số"
                    isInfinityField={true}
                  />
                  <InputField
                    label="Beta (β) Sau Cập Nhật"
                    value={inputs.beta}
                    onChange={(val) => handleInputChange("beta", val)}
                    placeholder="+∞ hoặc số"
                    isInfinityField={true}
                  />

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={handleCheck}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 justify-center text-sm font-bold"
                    >
                      <Check size={16} />
                      Kiểm Tra
                    </button>
                    <button
                      onClick={handleHint}
                      className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center gap-1 justify-center text-sm font-bold"
                    >
                      <Lightbulb size={16} />
                      Gợi Ý
                    </button>
                  </div>

                  <button
                    onClick={handleShowSolution}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 justify-center text-sm font-bold"
                  >
                    <BookOpen size={16} />
                    Hiển Thị Lời Giải
                  </button>
                </div>
              </div>
            )}

            {/* Solution Panel */}
            {showSolution && currentTraceStep && (
              <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
                <h2 className="text-lg font-bold text-green-800 mb-3">
                  Lời Giải
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-green-700 font-semibold">
                      Giá Trị (v):
                    </span>
                    <span className="font-mono font-bold text-green-900">
                      {currentTraceStep.value}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-green-700 font-semibold">
                      Alpha (α):
                    </span>
                    <span className="font-mono font-bold text-green-900">
                      {formatInfinity(currentTraceStep.alphaAfter)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-green-700 font-semibold">
                      Beta (β):
                    </span>
                    <span className="font-mono font-bold text-green-900">
                      {formatInfinity(currentTraceStep.betaAfter)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleShowSolution}
                  className="w-full mt-3 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-bold"
                >
                  Ẩn Lời Giải
                </button>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div
                className={`rounded p-2 text-xs ${
                  feedback.type === "success"
                    ? "bg-green-100 text-green-800"
                    : feedback.type === "error"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {feedback.message}
              </div>
            )}

            {/* HintBar - Expected Values from Trace */}
            {showHint && currentTraceStep && !showSolution && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-amber-900">
                  Giá Trị (v): {currentTraceStep.value} | α (Kỳ vọng):{" "}
                  {formatInfinity(currentTraceStep.alphaAfter)} | β (Kỳ vọng):{" "}
                  {formatInfinity(currentTraceStep.betaAfter)}
                </div>
              </div>
            )}

            {/* Navigation & Controls */}
            <div className="bg-white rounded-lg shadow p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600 font-semibold">
                <span>
                  Bước {step + 1} / {trace.length}
                </span>
                {isComplete && (
                  <span className="text-green-600">✓ Hoàn Thành</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePrevStep}
                  disabled={step === 0}
                  className="flex-1 px-2 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center gap-1 text-xs font-bold"
                >
                  <ChevronLeft size={14} />
                  Trước
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={step >= trace.length - 1}
                  className="flex-1 px-2 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center gap-1 text-xs font-bold"
                >
                  Tiếp
                  <ChevronRight size={14} />
                </button>
              </div>

              <button
                onClick={handleReset}
                className="w-full px-2 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center justify-center gap-2 text-xs font-bold"
              >
                <RotateCcw size={14} />
                Đặt Lại
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== HELPER COMPONENTS =====

function InputField({
  label,
  value,
  onChange,
  placeholder,
  isInfinityField = false,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex gap-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {isInfinityField && (
          <button
            onClick={() => onChange("-∞")}
            className="px-2 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-bold text-gray-700"
            title="Insert -∞"
          >
            -∞
          </button>
        )}
        {isInfinityField && (
          <button
            onClick={() => onChange("+∞")}
            className="px-2 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-bold text-gray-700"
            title="Insert +∞"
          >
            +∞
          </button>
        )}
      </div>
    </div>
  );
}

function TreeVisualization({
  nodes,
  currentNodeId,
  evaluatedNodes = new Set(),
  nodeAlphaBetaAtStep = {},
  prunedNodesAtStep = new Set(),
  prunedTerminalValues = new Set(),
}) {
  if (!nodes || typeof nodes !== "object" || Object.keys(nodes).length === 0) {
    return <p className="text-gray-500">No nodes to display</p>;
  }

  const maxY =
    Math.max(...Object.values(nodes).map((n) => n.positions?.y || 0)) + 150;
  const maxX =
    Math.max(...Object.values(nodes).map((n) => n.positions?.x || 0)) + 120;

  return (
    <svg
      width="100%"
      height={Math.max(400, maxY)}
      viewBox={`0 0 ${maxX} ${maxY}`}
      className="border border-gray-300 rounded-lg bg-white"
    >
      <defs>
        <style>{`
          .node-circle { cursor: pointer; transition: all 0.3s; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.15)); }
          .node-circle:hover { filter: drop-shadow(0 3px 6px rgba(0,0,0,0.2)); }
          .node-label { font-size: 12px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; }
          .node-value-text { font-size: 12px; text-anchor: middle; font-weight: 600; }
          .edge { stroke: #333; stroke-width: 1.5; opacity: 0.7; }
          .edge-pruned { stroke: #999; stroke-width: 1.5; opacity: 0.3; stroke-dasharray: 5,5; }
          .node-pruned { opacity: 0.4; }
          .alphabeta-info { font-size: 10px; font-weight: 600; text-anchor: middle; }
        `}</style>
      </defs>

      {/* Draw edges */}
      {Object.entries(nodes).flatMap(([nodeId, node]) => {
        const children = Array.isArray(node.children) ? node.children : [];
        return children.map((childId) => {
          const childNode = nodes[childId];
          if (!node.positions || !childNode || !childNode.positions)
            return null;
          const { x: x1, y: y1 } = node.positions;
          const { x: x2, y: y2 } = childNode.positions;
          // HIDE FUTURE INFO: Only mark as pruned if it was pruned at current step or earlier
          const isPruned = prunedNodesAtStep.has(childId);
          return (
            <line
              key={`edge-${nodeId}-${childId}`}
              x1={x1}
              y1={y1 + 20}
              x2={x2}
              y2={y2 - 20}
              className={isPruned ? "edge-pruned" : "edge"}
            />
          );
        });
      })}

      {/* Draw edges to terminal values */}
      {Object.entries(nodes).flatMap(([nodeId, node]) => {
        const terminalValues = node.terminalValues || [];
        if (terminalValues.length === 0) return [];

        const { x: parentX, y: parentY } = node.positions;
        const terminalY = parentY + 70;
        const spacing = 30;
        const startX = parentX - ((terminalValues.length - 1) * spacing) / 2;

        return terminalValues.map((_, idx) => {
          const childX = startX + idx * spacing;
          // Check if THIS specific terminal value was pruned
          const terminalKey = `${nodeId}-${idx}`;
          const isPruned = prunedTerminalValues.has(terminalKey);
          return (
            <line
              key={`edge-${nodeId}-terminal-${idx}`}
              x1={parentX}
              y1={parentY + 20}
              x2={childX}
              y2={terminalY - 15}
              className={isPruned ? "edge-pruned" : "edge"}
            />
          );
        });
      })}

      {/* Draw nodes as circles */}
      {Object.entries(nodes).map(([nodeId, node]) => {
        if (!node.positions) return null;
        const { x, y } = node.positions;
        const isCurrent = nodeId === currentNodeId;
        // A node is a leaf if it has terminalValues
        const isLeaf =
          node.terminalValues &&
          Array.isArray(node.terminalValues) &&
          node.terminalValues.length > 0;
        // HIDE FUTURE INFO: Only show pruned if evaluated at current step
        const isPruned =
          evaluatedNodes.has(nodeId) && prunedNodesAtStep.has(nodeId);
        // HIDE FUTURE INFO: Only show as evaluated if it was processed by current step
        const isEvaluated = evaluatedNodes.has(nodeId);

        // Use node.isMax from game tree data
        const isMax =
          node.isMax !== undefined && node.isMax !== null ? node.isMax : true;

        // Circle radius
        const radius = 18;

        // Colors based on node type and evaluation status
        let fillColor = isMax ? "#60a5fa" : "#f87171"; // Blue for MAX, Red for MIN
        let strokeColor = isCurrent ? "#1f2937" : "#6b7280";
        let strokeWidth = isCurrent ? 2.5 : 1.5;

        // Highlight current node
        if (isCurrent) {
          fillColor = isMax ? "#3b82f6" : "#ef4444"; // Darker for current
          strokeColor = "#000";
          strokeWidth = 3;
        }

        // Dim pruned nodes
        if (isPruned) {
          fillColor = "#d1d5db";
          strokeColor = "#9ca3af";
        }

        // HIDE FUTURE INFO: Only get alpha/beta if node was evaluated
        const alphaBeta = isEvaluated ? nodeAlphaBetaAtStep[nodeId] : null;

        return (
          <g
            key={nodeId}
            className={isPruned ? "node-pruned" : ""}
            opacity={isPruned ? 0.4 : 1}
          >
            {/* Circle node */}
            <circle
              cx={x}
              cy={y}
              r={radius}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              className="node-circle"
            />

            {/* Node ID label - Change to value when fully evaluated */}
            <text x={x} y={y} className="node-label" fill="white" fontSize="12">
              {(() => {
                // If NOT evaluated, show node ID
                if (!isEvaluated) return nodeId;

                // If evaluated, prefer value from trace (alphaBeta.v)
                if (
                  alphaBeta &&
                  alphaBeta.v !== null &&
                  alphaBeta.v !== undefined
                ) {
                  return alphaBeta.v;
                }

                // Fallback to node.value for leaf nodes
                if (node.value !== null && node.value !== undefined) {
                  return node.value;
                }

                // Last resort: still show node ID
                return nodeId;
              })()}
            </text>

            {/* EVALUATED LEAF - Show full alpha/beta info when leaf is current/evaluated */}
            {isEvaluated && isLeaf && alphaBeta && (
              <>
                {/* Show value for evaluated leaf */}
                <text
                  x={x}
                  y={y + radius + 18}
                  textAnchor="middle"
                  className="node-value-text"
                  fill="#059669"
                  fontSize="14"
                  fontWeight="700"
                >
                  v={alphaBeta.v}
                </text>
                {/* Alpha and Beta values */}
                <text
                  x={x}
                  y={y + radius + 32}
                  className="alphabeta-info"
                  fill="#0369a1"
                  fontSize="9"
                  fontWeight="600"
                >
                  α={formatInfinity(alphaBeta.alpha)}
                </text>
                <text
                  x={x}
                  y={y + radius + 42}
                  className="alphabeta-info"
                  fill="#c41e3a"
                  fontSize="9"
                  fontWeight="600"
                >
                  β={formatInfinity(alphaBeta.beta)}
                </text>
              </>
            )}

            {/* INTERNAL NODE VALUE - Show computed value for non-leaf nodes */}
            {isEvaluated && !isLeaf && (
              <>
                {/* Computed value */}
                <text
                  x={x}
                  y={y + radius + 18}
                  textAnchor="middle"
                  className="node-value-text"
                  fill="#7c3aed"
                  fontSize="12"
                  fontWeight="700"
                >
                  v={alphaBeta?.v ?? node.value}
                </text>
                {/* Alpha-Beta values for internal nodes */}
                {alphaBeta && (
                  <>
                    <text
                      x={x}
                      y={y + radius + 32}
                      className="alphabeta-info"
                      fill="#0369a1"
                      fontSize="9"
                      fontWeight="600"
                    >
                      α={formatInfinity(alphaBeta.alpha)}
                    </text>
                    <text
                      x={x}
                      y={y + radius + 42}
                      className="alphabeta-info"
                      fill="#c41e3a"
                      fontSize="9"
                      fontWeight="600"
                    >
                      β={formatInfinity(alphaBeta.beta)}
                    </text>
                  </>
                )}
              </>
            )}

            {/* Pruned indicator - REMOVED, use dashed lines instead */}

            {/* COMPLETION CHECKMARK - Show when leaf node is evaluated AND not the current node */}
            {isEvaluated && isLeaf && !isCurrent && (
              <text
                x={x + radius - 2}
                y={y - radius + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="16"
                fontWeight="bold"
                fill="#059669"
                style={{
                  textShadow: "0 0 2px rgba(0,0,0,0.3)",
                  filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.2))",
                }}
              >
                ✓
              </text>
            )}

            {/* Current node indicator */}
            {isCurrent && (
              <circle
                cx={x}
                cy={y}
                r={radius + 3}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                opacity="0.8"
              />
            )}
          </g>
        );
      })}

      {/* Draw Terminal Values Layer */}
      {Object.entries(nodes).flatMap(([nodeId, node]) => {
        const terminalValues = node.terminalValues || [];
        if (terminalValues.length === 0) return [];
        if (!node.positions) return [];

        const { x: parentX, y: parentY } = node.positions;
        const terminalY = parentY + 70;
        const spacing = 30;
        const startX = parentX - ((terminalValues.length - 1) * spacing) / 2;

        return terminalValues.map((terminalValue, idx) => {
          const x = startX + idx * spacing;
          const isPruned = prunedTerminalValues.has(`${nodeId}-${idx}`);

          return (
            <g key={`terminal-${nodeId}-${idx}`} opacity={isPruned ? 0.5 : 1}>
              {/* Terminal value text */}
              <rect
                x={x - 15}
                y={terminalY}
                width={30}
                height={20}
                rx={3}
                fill="#e0e7ff"
                stroke="#6366f1"
                strokeWidth="1.5"
              />
              <text
                x={x}
                y={terminalY + 13}
                textAnchor="middle"
                className="node-value-text"
                fill="#4f46e5"
                fontSize="13"
                fontWeight="700"
              >
                {terminalValue}
              </text>

              {/* Pruned indicator - Red X */}
              {isPruned && (
                <>
                  {/* Red background circle for X */}
                  <circle
                    cx={x}
                    cy={terminalY + 10}
                    r={18}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    opacity="0.8"
                    style={{ pointerEvents: "none" }}
                  />
                  {/* Red X mark */}
                  <line
                    x1={x - 10}
                    y1={terminalY}
                    x2={x + 10}
                    y2={terminalY + 20}
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={x + 10}
                    y1={terminalY}
                    x2={x - 10}
                    y2={terminalY + 20}
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </>
              )}
            </g>
          );
        });
      })}

      {/* Legend */}
      <g transform="translate(10, 20)">
        <text x="0" y="0" fontSize="11" fontWeight="bold" fill="#333">
          Chú thích:
        </text>
        {/* MAX circle */}
        <circle
          cx="40"
          cy="12"
          r="8"
          fill="#60a5fa"
          stroke="#333"
          strokeWidth="1"
        />
        <text x="55" y="16" fontSize="11" fill="#333" fontWeight="bold">
          MAX
        </text>
        {/* MIN circle */}
        <circle
          cx="110"
          cy="12"
          r="8"
          fill="#f87171"
          stroke="#333"
          strokeWidth="1"
        />
        <text x="125" y="16" fontSize="11" fill="#333" fontWeight="bold">
          MIN
        </text>
        {/* Current circle */}
        <circle
          cx="170"
          cy="12"
          r="8"
          fill="#3b82f6"
          stroke="#000"
          strokeWidth="2"
        />
        <text x="185" y="16" fontSize="11" fill="#333" fontWeight="bold">
          Current
        </text>

        {/* Second row: Leaf indicator */}
        <text x="0" y="28" fontSize="10" fill="#666">
          • Giá trị lá (leaf):
        </text>
        <text x="95" y="28" fontSize="10" fontWeight="bold" fill="#7c3aed">
          v=
        </text>
        <text x="110" y="28" fontSize="10" fontWeight="bold" fill="#7c3aed">
          N
        </text>
        <text x="135" y="28" fontSize="10" fill="#666">
          (ghi từ bước 0)
        </text>

        {/* Third row: Completion indicator */}
        <text x="0" y="41" fontSize="10" fill="#666">
          • Hoàn thành:
        </text>
        <text x="65" y="41" fontSize="11" fontWeight="bold" fill="#059669">
          ✓
        </text>
        <text x="80" y="41" fontSize="10" fill="#666">
          (lá được đánh giá)
        </text>

        {/* Fourth row: Pruned indicator */}
        <text x="0" y="54" fontSize="10" fill="#666">
          • Cắt xén:
        </text>
        <text
          x="50"
          y="54"
          fontSize="11"
          fontWeight="bold"
          fill="rgba(255,0,0,0.6)"
        >
          ✕
        </text>
        <text x="65" y="54" fontSize="10" fill="#666">
          (nhánh loại bỏ)
        </text>
      </g>
    </svg>
  );
}
