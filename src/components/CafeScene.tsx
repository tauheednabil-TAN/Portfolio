import React from "react";
import { SceneState } from "../types.js";
import { Loader } from "lucide-react";
import NabilAvatar from "./NabilAvatar.tsx";

interface CafeSceneProps {
  state: SceneState;
  bubbleText?: string;
  isGenerating?: boolean;
  bgImage?: string;
}

export default function CafeScene({ state, bubbleText, isGenerating }: CafeSceneProps) {
  return (
    <div className="relative w-full h-[340px] md:h-[480px] rounded-3xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] border border-white/15 flex flex-col items-center justify-center select-none bg-zinc-950">
      {/* Live customized avatar representing Tauheed Ahmed Nabil */}
      <NabilAvatar state={state} />
      
      {/* Cinematic dark ambient vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none rounded-3xl" />

      {/* Dynamic Speech Bubble styled in high-end Liquid Glass */}
      {bubbleText && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-[92%] max-w-md bg-zinc-950/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl z-30">
          <div className="relative text-xs md:text-sm font-medium leading-relaxed font-sans text-stone-100">
            {isGenerating ? (
              <div className="flex items-center gap-2 text-stone-400">
                <Loader className="w-4 h-4 animate-spin text-amber-500" />
                <span className="font-mono text-xs text-stone-300">Formulating response...</span>
              </div>
            ) : (
              bubbleText
            )}
            {/* Bubble Tail */}
            <div className="absolute bottom-[-18px] left-1/2 transform -translate-x-1/2 w-4 h-4 bg-zinc-950 border-r border-b border-white/10 rotate-45 shadow-[4px_4px_10px_rgba(0,0,0,0.2)]" />
          </div>
        </div>
      )}
    </div>
  );
}
