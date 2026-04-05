import React from "react";

/**
 * Component Node: Vẽ một đỉnh của đồ thị trên không gian SVG
 * @param {number} x, y: Tọa độ của đỉnh
 * @param {string} label: Tên đỉnh (A, B, C...)
 * @param {object} state: Trạng thái hiện tại (đang xét, trong biên, hoặc đã duyệt)
 */
const Node = ({ x, y, label, state, id }) => {
  // Use explicit SVG attributes as fallback so nodes remain visible
  let fillColor = "#ffffff";
  let strokeColor = "#94a3b8";
  let strokeW = 1.5;
  let textColor = "#334155"; // slate-700
  let extraClass = "transition-all duration-500";

  if (state.expanding === label) {
    fillColor = "#fde68a"; // yellow-300
    strokeColor = "#b45309"; // yellow-600
    strokeW = 4;
    textColor = "#78350f"; // yellow-900
    extraClass += " scale-125 font-extrabold";
  } else if ((state.frontier || []).includes(label)) {
    fillColor = "#dbeafe"; // blue-100
    strokeColor = "#0891b2"; // blue-500/adjust
    strokeW = 2;
    textColor = "#075985"; // blue-800
    extraClass += " animate-pulse font-bold";
  } else if ((state.explored || []).includes(label)) {
    fillColor = "#f1f5f9"; // slate-200
    strokeColor = "#cbd5e1"; // slate-400
    strokeW = 1.5;
    textColor = "#64748b"; // slate-500
  }

  return (
    <g id={id} transform={`translate(${x}, ${y})`} className={extraClass}>
      {/* Vẽ hình khối cho Node (use explicit SVG attrs for reliability) */}
      <rect
        x={-16}
        y={-12}
        width={32}
        height={24}
        rx={4}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeW}
      />
      {/* Vẽ chữ nhãn của Node */}
      <text
        x={0}
        y={4}
        textAnchor="middle"
        fill={textColor}
        fontSize={10}
        style={{ userSelect: "none" }}
      >
        {label}
      </text>
    </g>
  );
};

export default Node;
