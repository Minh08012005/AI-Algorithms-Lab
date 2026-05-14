import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import DFSModule from "./modules/DFSModule";
import BFSModule from "./modules/BFSModule";
import BestFirstSearchModule from "./modules/BestFirstSearchModule";
import HillClimbingModule from "./modules/HillClimbingModule";
import AStarModule from "./modules/AStarModule";
import BranchAndBoundModule from "./modules/BranchAndBoundModule";
import MinimaxModule from "./modules/MinimaxModule";
import { Play } from "lucide-react";

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
      case "a-star":
        return <AStarModule />;
      case "branch-bound":
        return <BranchAndBoundModule />;
      case "minimax":
        return <MinimaxModule />;
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* GLOBAL HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setCurrentTab("home")}
        >
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg">
            <Play size={18} fill="currentColor" />
          </div>
          <h1 className="font-black text-xl tracking-tighter italic text-slate-900">AI.LAB</h1>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Hệ thống đang hoạt động
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Học viện AI - Lab thực hành</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentTab={currentTab} setTab={setCurrentTab} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
