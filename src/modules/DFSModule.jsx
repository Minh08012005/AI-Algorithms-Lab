import React from "react";
import SearchModule from "./SearchModule";

export default function DFSModule() {
  return (
    <SearchModule
      initialAlgo="DFS"
      showAlgoSelector={false}
      title="Depth First Search (DFS)"
    />
  );
}