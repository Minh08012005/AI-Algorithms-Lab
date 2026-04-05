import React from "react";
import {
  Home,
  Layers,
  Zap,
  Play,
  Share2,
  Target,
  BrainCircuit,
} from "lucide-react";

const Sidebar = ({ currentTab, setTab }) => {
  return (
    <nav className="w-full md:w-72 bg-white border-r border-slate-200 p-8 flex flex-col gap-8 shrink-0 shadow-sm">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setTab("home")}
      >
        <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-xl">
          <Play size={20} />
        </div>
        <h1 className="font-black text-2xl tracking-tighter italic">AI.LAB</h1>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">
          Tìm kiếm
        </p>
        <button
          onClick={() => setTab("search")}
          className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${currentTab === "search" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <Layers size={18} /> DFS & BFS
        </button>
        <button
          onClick={() => setTab("astar")}
          className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${currentTab === "astar" ? "bg-orange-600 text-white shadow-lg shadow-orange-200" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <Target size={18} /> Tìm kiếm A*
        </button>
      </div>

      <div className="mt-auto bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <p className="text-[10px] font-bold opacity-40 uppercase mb-1 tracking-widest">
          Workspace
        </p>
        <p className="font-black text-lg mb-4 italic">v2.1 Stable</p>
        <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-[10px] flex items-center justify-center gap-2">
          <Share2 size={12} /> GITHUB PAGES
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
