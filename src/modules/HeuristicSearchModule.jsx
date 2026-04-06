import React, { useState, useMemo } from "react";
import { heuristicGraphsData } from "../data/heuristicGraphsData";
import { getAlgorithmTrace } from "./heuristicEngine";

export default function HeuristicSearchModule() {
  const [algo, setAlgo] = useState("BEST_FIRST");
  const [graphIdx, setGraphIdx] = useState(0);

  const graph = heuristicGraphsData[graphIdx];
  const { trace, finalPath } = useMemo(
    () =>
      graph ? getAlgorithmTrace(graph, algo) : { trace: [], finalPath: [] },
    [graph, algo],
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-4">
        <h2 className="text-xl font-bold">Tìm kiếm theo h(n)</h2>
        <div className="flex gap-2 mt-3">
          <select
            value={algo}
            onChange={(e) => setAlgo(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="BEST_FIRST">Best-First</option>
            <option value="HILL_CLIMBING">Leo đồi</option>
          </select>
          <select
            value={graphIdx}
            onChange={(e) => setGraphIdx(Number(e.target.value))}
            className="px-3 py-2 border rounded"
          >
            {heuristicGraphsData.map((g, i) => (
              <option key={i} value={i}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section>
        <table className="w-full table-auto border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Expand</th>
              <th className="border px-2 py-1">Adj</th>
              <th className="border px-2 py-1">L1/Q</th>
              <th className="border px-2 py-1">L</th>
            </tr>
          </thead>
          <tbody>
            {trace.map((r, i) => (
              <tr key={i} className="odd:bg-white even:bg-gray-50">
                <td className="border px-2 py-1">{r.expand || "-"}</td>
                <td className="border px-2 py-1">
                  {r.isGoal ? "TTKT/DỪNG" : r.adj || "-"}
                </td>
                <td className="border px-2 py-1">{r.q || r.l1 || "-"}</td>
                <td className="border px-2 py-1">{r.l || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {finalPath && finalPath.length > 0 && (
          <div className="mt-3 text-sm">Đường đi: {finalPath.join(" → ")}</div>
        )}
      </section>
    </div>
  );
}
