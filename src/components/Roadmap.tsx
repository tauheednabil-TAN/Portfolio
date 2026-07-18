import React, { useState, useEffect } from "react";
import { RoadmapNode } from "../types.js";
import { CheckCircle, AlertCircle, Lock, ChevronRight, Briefcase, GraduationCap, MapPin, Sparkles, BookOpen, Layers } from "lucide-react";
import dbData from "../db/db.json";

interface RoadmapProps {
  onNodeClick?: (node: RoadmapNode) => void;
}

export default function Roadmap({ onNodeClick }: RoadmapProps) {
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [selectedParent, setSelectedParent] = useState<RoadmapNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/roadmap");
      if (response.ok) {
        const data: RoadmapNode[] = await response.json();
        setNodes(data);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (error) {
      console.warn("Error loading roadmap, using static fallback:", error);
      setNodes(dbData.roadmap_nodes || []);
    } finally {
      setLoading(false);
    }
  };

  // Extract root level nodes (those with no parent_id)
  const rootNodes = nodes
    .filter((n) => !n.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Extract children for any parent
  const getChildrenOf = (parentId: string) => {
    return nodes
      .filter((n) => n.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "GraduationCap": return <GraduationCap className="w-5 h-5" />;
      case "MapPin": return <MapPin className="w-5 h-5" />;
      case "Briefcase": return <Briefcase className="w-5 h-5" />;
      case "Sparkles": return <Sparkles className="w-5 h-5" />;
      case "BookOpen": return <BookOpen className="w-5 h-5" />;
      default: return <Layers className="w-5 h-5" />;
    }
  };

  const getStatusStyle = (status: "done" | "in_progress" | "planned") => {
    switch (status) {
      case "done":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
          text: "Completed",
        };
      case "in_progress":
        return {
          bg: "bg-amber-500/15 border-amber-500/40 text-amber-400 animate-pulse",
          badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse",
          text: "In Progress",
        };
      case "planned":
        return {
          bg: "bg-zinc-800/40 border-zinc-700/40 text-stone-500",
          badge: "bg-zinc-800 text-stone-400 border border-zinc-700/30",
          text: "Planned",
        };
    }
  };

  return (
    <div className="relative w-full p-6 bg-white/[0.03] backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] font-sans">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold font-display text-stone-50 flex items-center gap-2">
          <span>🛤️</span> Gamified Journey Roadmap
        </h2>
        <p className="text-xs md:text-sm text-stone-400 mt-1">
          Nabil's evolutionary roadmap from engineering study to modern Agentic AI systems. Click any chapter to inspect sub-goals!
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-stone-400">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
          <span>Setting up paths...</span>
        </div>
      ) : (
        <div className="relative flex flex-col md:flex-row gap-6">
          {/* Main vertical journey map */}
          <div className="flex-1 relative pl-4 md:pl-8 py-2">
            {/* Winding Connection Line */}
            <div className="absolute left-9 md:left-13 top-0 bottom-0 w-1 border-l border-dashed border-amber-900/30" />

            <div className="space-y-8">
              {rootNodes.map((node, index) => {
                const style = getStatusStyle(node.status);
                const children = getChildrenOf(node.id);
                const isSelected = selectedParent?.id === node.id;

                return (
                  <div key={node.id} className="relative flex items-start gap-4 md:gap-6 group">
                    {/* Winding chapter step indicator */}
                    <div
                      onClick={() => setSelectedParent(node)}
                      className={`relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center cursor-pointer transition-all ${style.bg} hover:scale-110 active:scale-95 shadow-md`}
                    >
                      {getIconComponent(node.icon)}
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 hover:bg-white/[0.04] transition-all duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                        <span className="text-[10px] md:text-xs font-mono font-bold text-amber-500">
                          {node.date_label}
                        </span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${style.badge}`}>
                          {style.text}
                        </span>
                      </div>

                      <h3
                        onClick={() => setSelectedParent(node)}
                        className="text-sm md:text-base font-bold font-display text-stone-50 hover:text-amber-400 cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        {node.title}
                        {children.length > 0 && <ChevronRight className="w-4 h-4 text-stone-400" />}
                      </h3>

                      <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                        {node.description}
                      </p>

                      {/* Display quick counter of children if any */}
                      {children.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-3">
                          <button
                            onClick={() => setSelectedParent(node)}
                            className="text-[10px] font-bold font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            <span>🔍 Inspect Sub-Goals ({children.length})</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expanded Nested drill-down sidebar */}
          <div className="w-full md:w-80 border-t border-white/10 md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-6">
            {selectedParent ? (
              <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/12 rounded-2xl p-4 sticky top-4 animate-comic-pop shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 block uppercase font-bold tracking-wider">Expanded Chapter</span>
                    <h4 className="text-xs md:text-sm font-bold font-display text-stone-100">{selectedParent.title}</h4>
                  </div>
                  <button
                    onClick={() => setSelectedParent(null)}
                    className="text-xs font-bold text-stone-400 hover:text-stone-200 cursor-pointer p-1 hover:bg-white/5 rounded"
                  >
                    Close
                  </button>
                </div>

                {/* Sub-goals Timeline */}
                {getChildrenOf(selectedParent.id).length > 0 ? (
                  <div className="relative pl-3 space-y-5">
                    {/* Winding small line */}
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 border-l border-dashed border-amber-900/30" />

                    {getChildrenOf(selectedParent.id).map((subNode) => {
                      const subStyle = getStatusStyle(subNode.status);
                      const nestedChildren = getChildrenOf(subNode.id);

                      return (
                        <div key={subNode.id} className="relative flex items-start gap-3 pl-3">
                          {/* Inner Milestone indicator */}
                          <div className={`absolute left-[-1.5px] top-1.5 w-2 h-2 rounded-full border ${
                            subNode.status === "done" ? "bg-emerald-400 border-emerald-500" : subNode.status === "in_progress" ? "bg-amber-400 border-amber-500 animate-ping" : "bg-zinc-600 border-zinc-700"
                          }`} />

                          <div className="flex-1 bg-black/45 border border-white/10 rounded-xl p-3 shadow-md">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[9px] font-mono text-stone-400">{subNode.date_label}</span>
                              <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                subNode.status === "done" ? "bg-emerald-500/10 text-emerald-300" : subNode.status === "in_progress" ? "bg-amber-500/10 text-amber-300" : "bg-zinc-800 text-stone-400"
                              }`}>
                                {subNode.status}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold font-display text-stone-100">{subNode.title}</h5>
                            <p className="text-[11px] text-stone-300 mt-1 leading-relaxed">{subNode.description}</p>

                            {/* Multi-level child nesting recursion (up to 3 levels) */}
                            {nestedChildren.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1 pl-2">
                                <span className="text-[8px] font-mono text-stone-400 block uppercase tracking-wider">Steps Inside:</span>
                                {nestedChildren.map((step) => (
                                  <div key={step.id} className="flex items-center gap-1.5 text-[10px] text-stone-300">
                                    <span className={step.status === "done" ? "text-emerald-400" : step.status === "in_progress" ? "text-amber-400 animate-pulse" : "text-stone-600"}>
                                      ●
                                    </span>
                                    <span className="font-medium">{step.title}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-stone-400">
                    No sub-goals added for this milestone yet. ☕
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-2xl p-6 text-center text-xs text-stone-400 flex flex-col items-center justify-center h-48 sticky top-4">
                <span className="text-lg">🛤️</span>
                <span className="mt-2 leading-relaxed">Click any chapter circle on the left to display its nested sub-goals!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
