import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import DFSModule from "./modules/DFSModule";
import BFSModule from "./modules/BFSModule";
import BestFirstSearchModule from "./modules/BestFirstSearchModule";
import HillClimbingModule from "./modules/HillClimbingModule";

export default function App() {
  const [currentTab, setCurrentTab] = useState("home");

  const renderContent = () => {
    switch (currentTab) {
      case "dfs":
        return <DFSModule />;
      case "bfs":
        return <BFSModule />;
      case "best-first":
        return <BestFirstSearchModule />;
      case "hill-climbing":
        return <HillClimbingModule />;
      default:
        return (
          <div className="max-w-4xl mx-auto py-16 text-center animate-in zoom-in-95 duration-700">
            <h1 className="text-6xl font-black text-slate-900 mb-6 tracking-tighter">
              AI LAB <span className="text-indigo-600">WORKSPACE</span>
            </h1>
            <p className="text-slate-500 text-xl mb-12 font-medium">
              Hệ thống thực hành thuật toán Trí tuệ nhân tạo.
            </p>
            <button
              onClick={() => setCurrentTab("dfs")}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
            >
              Bắt đầu thực hành
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <Sidebar currentTab={currentTab} setTab={setCurrentTab} />
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}
