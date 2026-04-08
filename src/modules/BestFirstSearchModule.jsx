import React from "react";
import HeuristicSearchModule from "./HeuristicSearchModule";

export default function BestFirstSearchModule() {
  return (
    <HeuristicSearchModule
      initialAlgo="BEST_FIRST"
      showAlgoSelector={false}
      title="Best First Search"
      subtitle="Trang thực hành riêng cho thuật toán Best First Search"
    />
  );
}