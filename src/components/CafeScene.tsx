import React, { useState, useEffect } from "react";
import { SceneState } from "../types.js";
import { Coffee, HelpCircle, Sparkles, Loader } from "lucide-react";

interface CafeSceneProps {
  state: SceneState;
  bubbleText?: string;
  isGenerating?: boolean;
  bgImage?: string;
}

export default function CafeScene({ state, bubbleText, isGenerating, bgImage }: CafeSceneProps) {
  const [steamTicks, setSteamTicks] = useState<number[]>([]);

  // Simple steam animation timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSteamTicks((prev) => {
        const next = [...prev, Math.random()];
        if (next.length > 4) next.shift();
        return next;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[340px] md:h-[480px] rounded-3xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] border border-white/15 flex items-end justify-center select-none bg-zinc-950/40 backdrop-blur-md">
      {/* High-fidelity glowing cyber workspace / network grid with a gorgeous depth-of-field blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105 filter blur-[3px]"
        style={{
          backgroundImage: `url('${bgImage || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80"}')`,
        }}
      />
      
      {/* Cinematic dark ambient vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090706] via-zinc-950/60 to-black/20" />
      
      {/* Warm golden light source glow from top-right and top-left */}
      <div className="absolute top-0 left-[20%] w-72 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-[20%] w-80 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Interactive, Highly Detailed Vector Character of Nabil */}
      <div className="relative w-full h-full flex items-end justify-center z-10">
        <svg
          viewBox="0 0 400 480"
          className="w-auto h-[95%] max-h-[440px] drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all duration-500"
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffeedd" />
              <stop offset="100%" stopColor="#f7cca8" />
            </linearGradient>
            <linearGradient id="beardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2c2c2c" />
              <stop offset="100%" stopColor="#121212" />
            </linearGradient>
            <linearGradient id="glassesShine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
              <stop offset="35%" stopColor="rgba(255, 255, 255, 0.08)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
            <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1f1f1f" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </linearGradient>
            <linearGradient id="cupGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#eaeaea" />
            </linearGradient>
            <linearGradient id="coffeeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5c3a21" />
              <stop offset="100%" stopColor="#2e1a0c" />
            </linearGradient>
          </defs>

          {/* BACKGROUND SPARKLES (Celebration state) */}
          {state === "celebrate" && (
            <g className="animate-pulse">
              <circle cx="80" cy="120" r="4" fill="#fbbf24" className="animate-ping" style={{ animationDuration: "1.5s" }} />
              <circle cx="320" cy="150" r="3" fill="#34d399" className="animate-ping" style={{ animationDuration: "2s" }} />
              <circle cx="100" cy="240" r="5" fill="#60a5fa" className="animate-ping" style={{ animationDuration: "1.8s" }} />
              <circle cx="300" cy="280" r="4" fill="#f472b6" className="animate-ping" style={{ animationDuration: "2.2s" }} />
            </g>
          )}

          {/* BREATHING CHARACTER CONTAINER */}
          <g className="origin-bottom animate-breathing">
            {/* 1. Neck & Shoulders (Torso) */}
            <g id="torso">
              {/* Shoulders */}
              <path
                d="M 100,480 C 100,400 130,370 200,370 C 270,370 300,400 300,480 Z"
                fill="url(#shirtGrad)"
                stroke="#121212"
                strokeWidth="2"
              />
              {/* Neck collar cutout */}
              <path
                d="M 160,370 C 160,395 240,395 240,370 Z"
                fill="url(#skinGrad)"
                stroke="#121212"
                strokeWidth="2"
              />
              {/* Crew neck rim */}
              <path
                d="M 158,370 C 158,399 242,399 242,370"
                fill="none"
                stroke="#2a2a2a"
                strokeWidth="4"
              />
            </g>

            {/* 2. Head structure (Ear, Face, Beard, Glasses, Hair) */}
            <g id="head" className="origin-[200px_300px] transition-transform duration-500">
              {/* Neck connector */}
              <rect x="180" y="310" width="40" height="70" fill="url(#skinGrad)" stroke="#121212" strokeWidth="2" />
              
              {/* Ears */}
              <circle cx="120" cy="270" r="14" fill="url(#skinGrad)" stroke="#121212" strokeWidth="2" />
              <circle cx="280" cy="270" r="14" fill="url(#skinGrad)" stroke="#121212" strokeWidth="2" />
              {/* Inner ear lines */}
              <path d="M 118,266 C 114,268 116,274 122,272" fill="none" stroke="#d49e7a" strokeWidth="2" />
              <path d="M 282,266 C 286,268 284,274 278,272" fill="none" stroke="#d49e7a" strokeWidth="2" />

              {/* Beard Base (Under face) */}
              <path
                d="M 124,250 C 124,360 276,360 276,250 C 276,210 124,210 124,250 Z"
                fill="url(#beardGrad)"
                stroke="#121212"
                strokeWidth="2.5"
              />

              {/* Face Shape */}
              <path
                d="M 130,240 C 130,335 270,335 270,240 C 270,185 130,185 130,240 Z"
                fill="url(#skinGrad)"
                stroke="#121212"
                strokeWidth="2"
              />

              {/* Cheek Blush */}
              <ellipse cx="155" cy="275" rx="12" ry="6" fill="#f87171" opacity="0.25" />
              <ellipse cx="245" cy="275" rx="12" ry="6" fill="#f87171" opacity="0.25" />

              {/* Mustache */}
              <path
                d="M 170,292 C 182,284 195,290 200,293 C 205,290 218,284 230,292 C 235,295 210,304 200,298 C 190,304 165,295 170,292 Z"
                fill="#161616"
              />

              {/* MOUTH CONFIGURATIONS */}
              {/* 1. Welcoming / Joyful smile */}
              {(state === "welcome" || state === "talking" || state === "celebrate") && (
                <path
                  d="M 182,302 C 182,318 218,318 218,302 Z"
                  fill="#991b1b"
                  stroke="#121212"
                  strokeWidth="2"
                />
              )}
              {/* Teeth and tongue for open smile */}
              {(state === "welcome" || state === "talking" || state === "celebrate") && (
                <g>
                  {/* Teeth */}
                  <path d="M 184,303 C 190,307 210,307 216,303" fill="none" stroke="#ffffff" strokeWidth="2.5" />
                  {/* Tongue */}
                  <path d="M 190,314 C 195,308 205,308 210,314 Z" fill="#f87171" />
                </g>
              )}

              {/* 2. Thinking / Confused mouth */}
              {(state === "thinking" || state === "confused") && (
                <path
                  d="M 188,306 Q 200,302 212,306"
                  fill="none"
                  stroke="#121212"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              )}

              {/* 3. Normal / Friendly closed-mouth smile */}
              {(state === "idle" || state === "listening") && (
                <path
                  d="M 185,304 Q 200,312 215,304"
                  fill="none"
                  stroke="#121212"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}

              {/* EYES */}
              {state === "celebrate" ? (
                // Squinting happy eyes
                <g>
                  <path d="M 148,252 Q 160,242 172,252" fill="none" stroke="#121212" strokeWidth="4.5" strokeLinecap="round" />
                  <path d="M 228,252 Q 240,242 252,252" fill="none" stroke="#121212" strokeWidth="4.5" strokeLinecap="round" />
                </g>
              ) : (
                // Beautiful brown anime eyes
                <g>
                  {/* Left Eye */}
                  <ellipse cx="160" cy="250" rx="14" ry="16" fill="#121212" />
                  <ellipse cx="160" cy="250" rx="11" ry="13" fill="#6f4e37" /> {/* Iris */}
                  <circle cx="160" cy="250" r="7" fill="#121212" /> {/* Pupil */}
                  <circle cx="156" cy="245" r="4.5" fill="#ffffff" /> {/* Main Highlight */}
                  <circle cx="165" cy="254" r="2" fill="#ffffff" /> {/* Secondary Highlight */}

                  {/* Right Eye */}
                  <ellipse cx="240" cy="250" rx="14" ry="16" fill="#121212" />
                  <ellipse cx="240" cy="250" rx="11" ry="13" fill="#6f4e37" />
                  <circle cx="240" cy="250" r="7" fill="#121212" />
                  <circle cx="236" cy="245" r="4.5" fill="#ffffff" />
                  <circle cx="245" cy="254" r="2" fill="#ffffff" />
                </g>
              )}

              {/* Anime nose */}
              <path d="M 200,264 L 197,274 L 200,275" fill="none" stroke="#121212" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Thick Black Rectangular Glasses */}
              <g id="glasses" className="drop-shadow-md">
                {/* Left Frame */}
                <rect x="134" y="230" width="52" height="40" rx="8" ry="8" fill="none" stroke="#1c1c1c" strokeWidth="5.5" />
                <rect x="134" y="230" width="52" height="40" rx="8" ry="8" fill="url(#glassesShine)" />
                
                {/* Bridge */}
                <path d="M 186,246 Q 200,241 214,246" fill="none" stroke="#1c1c1c" strokeWidth="6" strokeLinecap="round" />
                
                {/* Right Frame */}
                <rect x="214" y="230" width="52" height="40" rx="8" ry="8" fill="none" stroke="#1c1c1c" strokeWidth="5.5" />
                <rect x="214" y="230" width="52" height="40" rx="8" ry="8" fill="url(#glassesShine)" />

                {/* Left / Right Temples extending back to ears */}
                <path d="M 134,246 L 120,246" fill="none" stroke="#1c1c1c" strokeWidth="4.5" />
                <path d="M 266,246 L 280,246" fill="none" stroke="#1c1c1c" strokeWidth="4.5" />
              </g>

              {/* Eyebrows */}
              <path d="M 138,222 C 146,215 162,217 174,222" fill="none" stroke="#121212" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 226,222 C 238,217 254,215 262,222" fill="none" stroke="#121212" strokeWidth="3.5" strokeLinecap="round" />

              {/* Lush Curly Hair (Detailed Layered Circles and Paths) */}
              <g id="hair" fill="url(#beardGrad)">
                {/* Back hair layers */}
                <circle cx="130" cy="190" r="28" />
                <circle cx="160" cy="170" r="32" />
                <circle cx="200" cy="160" r="34" />
                <circle cx="240" cy="170" r="32" />
                <circle cx="270" cy="190" r="28" />
                
                {/* Sideburns */}
                <path d="M 122,230 Q 120,265 128,260 Z" />
                <path d="M 278,230 Q 280,265 272,260 Z" />

                {/* Voluminous Front curls */}
                <circle cx="140" cy="160" r="24" />
                <circle cx="170" cy="146" r="28" />
                <circle cx="205" cy="140" r="30" />
                <circle cx="235" cy="146" r="28" />
                <circle cx="260" cy="160" r="24" />

                {/* Small curly details on forehead */}
                <path d="M 136,192 Q 146,198 152,184" fill="none" stroke="#121212" strokeWidth="2.5" />
                <path d="M 264,192 Q 254,198 248,184" fill="none" stroke="#121212" strokeWidth="2.5" />
                <path d="M 190,172 Q 200,180 210,172" fill="none" stroke="#121212" strokeWidth="2.5" />
              </g>
            </g>

            {/* HANDS / PROPS OVERLAY BASED ON STATE */}

            {/* A. WELCOME STATE: WAVING HAND */}
            {state === "welcome" && (
              <g id="waving-arm" className="origin-[310px_460px] animate-waving z-20">
                {/* Arm */}
                <path
                  d="M 280,480 C 290,430 310,380 325,360 L 350,385 C 330,415 310,450 300,480 Z"
                  fill="url(#shirtGrad)"
                  stroke="#121212"
                  strokeWidth="2"
                />
                {/* Waving Hand */}
                <g transform="translate(315, 310)">
                  <circle cx="20" cy="25" r="16" fill="url(#skinGrad)" stroke="#121212" strokeWidth="2" />
                  {/* Fingers */}
                  <rect x="6" y="0" width="6" height="18" rx="3" fill="url(#skinGrad)" stroke="#121212" strokeWidth="1.5" />
                  <rect x="13" y="-4" width="6.5" height="22" rx="3" fill="url(#skinGrad)" stroke="#121212" strokeWidth="1.5" />
                  <rect x="21" y="-2" width="6.5" height="21" rx="3" fill="url(#skinGrad)" stroke="#121212" strokeWidth="1.5" />
                  <rect x="29" y="4" width="6" height="16" rx="3" fill="url(#skinGrad)" stroke="#121212" strokeWidth="1.5" />
                  {/* Thumb */}
                  <path d="M 8,25 Q -6,18 4,12 Z" fill="url(#skinGrad)" stroke="#121212" strokeWidth="1.5" />
                </g>
              </g>
            )}

            {/* B. COFFEE_INVITE STATE: HOLDING STEAMING COFFEE */}
            {state === "coffee_invite" && (
              <g id="coffee-cup-arm" className="origin-[100px_480px] animate-cup-hold z-20">
                {/* Arm / Sleeve */}
                <path
                  d="M 120,480 C 110,430 90,380 80,360 L 55,385 C 70,415 90,450 100,480 Z"
                  fill="url(#shirtGrad)"
                  stroke="#121212"
                  strokeWidth="2"
                />
                {/* Hand */}
                <g transform="translate(50, 310)">
                  <circle cx="20" cy="25" r="14" fill="url(#skinGrad)" stroke="#121212" strokeWidth="2" />
                  
                  {/* Coffee Mug */}
                  <g transform="translate(10, 0)">
                    {/* Handle */}
                    <path d="M 28,15 C 42,15 42,35 28,35" fill="none" stroke="url(#cupGrad)" strokeWidth="6.5" strokeLinecap="round" />
                    <path d="M 28,15 C 42,15 42,35 28,35" fill="none" stroke="#121212" strokeWidth="1.5" strokeLinecap="round" />
                    
                    {/* Mug Body */}
                    <rect x="-10" y="8" width="40" height="36" rx="4" fill="url(#cupGrad)" stroke="#121212" strokeWidth="2" />
                    
                    {/* Liquid top */}
                    <ellipse cx="10" cy="10" rx="18" ry="4" fill="url(#coffeeGrad)" stroke="#121212" strokeWidth="1.5" />
                    
                    {/* Dynamic Steam Particles */}
                    <g opacity="0.75" className="translate-y-[-6px]">
                      {steamTicks.map((rand, i) => (
                        <path
                          key={i}
                          d={`M ${-2 + rand * 24},0 Q ${-6 + rand * 30},[-15 - i*10] ${-2 + rand * 24},[-30 - i*12]`}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className="animate-steam"
                          style={{
                            animationDelay: `${i * 0.25}s`,
                          }}
                        />
                      ))}
                    </g>
                  </g>
                </g>
              </g>
            )}

            {/* C. THINKING STATE: HAND ON CHIN */}
            {(state === "thinking" || state === "confused") && (
              <g id="thinking-hand" className="origin-[200px_480px] animate-think-hand z-20">
                {/* Arm raising */}
                <path
                  d="M 140,480 Q 150,420 180,360 L 205,385 Q 180,430 160,480 Z"
                  fill="url(#shirtGrad)"
                  stroke="#121212"
                  strokeWidth="2"
                />
                {/* Hand resting on Chin */}
                <g transform="translate(170, 310)">
                  <circle cx="20" cy="25" r="13" fill="url(#skinGrad)" stroke="#121212" strokeWidth="2" />
                  {/* Pensive fingers tucked */}
                  <rect x="8" y="14" width="7" height="15" rx="3.5" fill="url(#skinGrad)" stroke="#121212" strokeWidth="1.5" />
                  <rect x="16" y="11" width="7.5" height="17" rx="3.5" fill="url(#skinGrad)" stroke="#121212" strokeWidth="1.5" />
                  <rect x="25" y="14" width="7" height="15" rx="3.5" fill="url(#skinGrad)" stroke="#121212" strokeWidth="1.5" />
                </g>
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* Embedded High-End CSS Animations */}
      <style>{`
        @keyframes breathing {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(-4px) scaleY(1.01); }
        }
        @keyframes waving {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(18deg); }
        }
        @keyframes steam-rise {
          0% { transform: translateY(0) scaleX(1); opacity: 0; }
          15% { opacity: 0.8; }
          100% { transform: translateY(-30px) scaleX(1.4); opacity: 0; }
        }
        @keyframes cup-idle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(-1deg); }
        }
        @keyframes pensive-twitch {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-breathing {
          animation: breathing 4s ease-in-out infinite;
        }
        .animate-waving {
          animation: waving 1.2s ease-in-out infinite;
        }
        .animate-steam {
          animation: steam-rise 2.2s ease-out infinite;
        }
        .animate-cup-hold {
          animation: cup-idle 3.5s ease-in-out infinite;
        }
        .animate-think-hand {
          animation: pensive-twitch 4s ease-in-out infinite;
        }
      `}</style>

      {/* Dynamic Speech Bubble styled in high-end Liquid Glass */}
      {bubbleText && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-[92%] max-w-md bg-zinc-950/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl animate-comic-pop z-30">
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
