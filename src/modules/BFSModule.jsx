import React from "react";
import SearchModule from "./SearchModule";

export default function BFSModule() {
  return (
    <SearchModule
      initialAlgo="BFS"
      showAlgoSelector={false}
      title="Breadth First Search (BFS)"
    />
  );
}