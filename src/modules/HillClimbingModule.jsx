import React from "react";
import HeuristicSearchModule from "./HeuristicSearchModule";

export default function HillClimbingModule() {
  return (
    <HeuristicSearchModule
      initialAlgo="HILL_CLIMBING"
      showAlgoSelector={false}
      title="Leo đồi"
      subtitle="Trang thực hành riêng cho thuật toán leo đồi"
    />
  );
}