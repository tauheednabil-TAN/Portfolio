import React from "react";
import { SceneState } from "../types.js";

interface NabilAvatarProps {
  state: SceneState;
}

export default function NabilAvatar({ state }: NabilAvatarProps) {
  // Determine eye and brow offsets based on state to ensure interactive emotions
  let eyebrowYOffset = 0;
  let eyebrowAngle = 0;
  let eyeScaleY = 1.0;
  let eyePupilX = 0;
  let eyePupilY = 0;
  let sweatDrip = false;
  let celebrateConfetti = false;

  switch (state) {
    case "welcome":
      eyebrowYOffset = -3;
      eyebrowAngle = 4;
      celebrateConfetti = true;
      break;

    case "idle":
      break;

    case "listening":
      eyebrowYOffset = -1.5;
      eyebrowAngle = -2;
      eyeScaleY = 1.1;
      eyePupilY = 0.5;
      break;

    case "thinking":
      eyebrowYOffset = 1;
      eyebrowAngle = -10;
      eyePupilX = -1.5;
      eyePupilY = -2;
      break;

    case "talking":
      eyebrowYOffset = -2;
      eyebrowAngle = 2;
      break;

    case "coffee_invite":
      eyebrowYOffset = -2.5;
      eyebrowAngle = 3;
      break;

    case "celebrate":
      eyebrowYOffset = -4;
      eyebrowAngle = 8;
      eyeScaleY = 0.55;
      celebrateConfetti = true;
      break;

    case "confused":
      eyebrowYOffset = -2;
      eyebrowAngle = 12;
      eyeScaleY = 0.85;
      eyePupilX = 1.5;
      eyePupilY = 1;
      sweatDrip = true;
      break;
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 select-none bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/20 rounded-3xl overflow-hidden border border-white/10 group">
      {/* Background Matrix & Confetti */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      {celebrateConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-4 left-1/4 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
          <div className="absolute top-8 right-1/3 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
          <div className="absolute top-16 left-1/3 w-2 h-1 bg-blue-400 rotate-12 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="absolute top-24 right-1/4 w-1 h-3 bg-pink-500 -rotate-45 animate-bounce" style={{ animationDuration: "2.5s" }} />
        </div>
      )}

      {/* Main Vector Graphics Container */}
      <div className="relative w-44 h-44 md:w-52 md:h-52 z-10 filter drop-shadow-[0_12px_32px_rgba(0,0,0,0.65)]">
        
        {/* Ambient Glow Aura based on current emotion state */}
        <div className={`absolute -inset-1 rounded-full blur-xl opacity-30 transition-all duration-500 ${
          state === "thinking" ? "bg-purple-500 scale-105" :
          state === "listening" ? "bg-blue-500 scale-102" :
          state === "talking" ? "bg-amber-400 scale-105" :
          state === "celebrate" ? "bg-emerald-500 scale-110" :
          state === "confused" ? "bg-red-500" : "bg-amber-600"
        }`} />

        <svg
          viewBox="0 0 100 100"
          className="w-full h-full relative z-20"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Gradients and Filters definition */}
          <defs>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fed7aa" /> {/* Beautiful warm fair skin tone */}
              <stop offset="100%" stopColor="#fdba74" />
            </linearGradient>
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" /> {/* Midnight dark hair */}
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
            <linearGradient id="beardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#0f0f11" />
            </linearGradient>
            <linearGradient id="shelfGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#27160c" />
              <stop offset="100%" stopColor="#1e1008" />
            </linearGradient>
            <filter id="vectorBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.8" />
            </filter>
          </defs>

          {/* BACKGROUND LAYER: Stylized Virtual Coffee Shop */}
          {/* Soft back ambient wall glow */}
          <circle cx="50" cy="50" r="45" fill="#361f10" opacity="0.3" filter="url(#vectorBlur)" />
          
          {/* Hanging Edison Bulbs */}
          <g opacity="0.45">
            {/* Bulb Left */}
            <line x1="18" y1="0" x2="18" y2="18" stroke="#543118" strokeWidth="0.5" />
            <circle cx="18" cy="18" r="3" fill="#fca5a5" filter="url(#vectorBlur)" />
            <circle cx="18" cy="18" r="1.5" fill="#fef08a" />
            
            {/* Bulb Right */}
            <line x1="82" y1="0" x2="82" y2="24" stroke="#543118" strokeWidth="0.5" />
            <circle cx="82" cy="24" r="3" fill="#fca5a5" filter="url(#vectorBlur)" />
            <circle cx="82" cy="24" r="1.5" fill="#fef08a" />
          </g>

          {/* Wooden Shelf in background */}
          <path d="M 0 32 L 100 32 L 100 34 L 0 34 Z" fill="url(#shelfGrad)" opacity="0.5" />
          
          {/* Tiny coffee bag & mug decorations on the background shelf */}
          <g opacity="0.35">
            {/* Mug on shelf */}
            <rect x="10" y="27" width="4" height="5" rx="0.5" fill="#b06733" />
            <path d="M 14 28.5 C 15 28.5 15 30.5 14 30.5" fill="none" stroke="#b06733" strokeWidth="0.5" />
            
            {/* Coffee bags */}
            <rect x="70" y="25" width="3.5" height="7" rx="0.5" fill="#734322" />
            <rect x="74" y="26" width="3" height="6" rx="0.5" fill="#543118" />
          </g>

          {/* Green Ivy Plant hanging from top right corner */}
          <g opacity="0.3" fill="#134e4a">
            <circle cx="92" cy="4" r="3.5" />
            <circle cx="88" cy="8" r="2.5" />
            <circle cx="94" cy="12" r="2" />
            <circle cx="85" cy="4" r="3" />
          </g>

          {/* FOREGROUND LAYER: Nabil's Avatar */}

          {/* Neck */}
          <path
            d="M 43 70 L 43 82 L 57 82 L 57 70 Z"
            fill="url(#skinGrad)"
            stroke="#1c1917"
            strokeWidth="0.8"
          />

          {/* Crewneck Black T-Shirt */}
          <path
            d="M 24 88 C 24 88 32 80 50 80 C 68 80 76 88 76 88 L 78 100 L 22 100 Z"
            fill="#18181b"
            stroke="#09090b"
            strokeWidth="1"
          />
          {/* Collar Line */}
          <path d="M 41 80 Q 50 84 59 80" fill="none" stroke="#27272a" strokeWidth="1.2" strokeLinecap="round" />

          {/* Ears */}
          <circle cx="28" cy="51" r="4.2" fill="url(#skinGrad)" stroke="#1c1917" strokeWidth="0.8" />
          <circle cx="72" cy="51" r="4.2" fill="url(#skinGrad)" stroke="#1c1917" strokeWidth="0.8" />

          {/* Head Base (Skin) */}
          <path
            d="M 30 40 C 30 30 70 30 70 40 L 70 56 Q 70 71 50 71 Q 30 71 30 56 Z"
            fill="url(#skinGrad)"
            stroke="#1c1917"
            strokeWidth="1"
          />

          {/* Cheeks Blush */}
          <ellipse cx="34" cy="56" rx="3.5" ry="2" fill="#f87171" opacity="0.25" filter="url(#vectorBlur)" />
          <ellipse cx="66" cy="56" rx="3.5" ry="2" fill="#f87171" opacity="0.25" filter="url(#vectorBlur)" />

          {/* Clean-shaven face (Beard & Mustache cut as requested) */}

          {/* Nose */}
          <path d="M 49.5 50.5 Q 48.5 55.5 50.5 56" fill="none" stroke="#c2410c" strokeWidth="1.2" strokeLinecap="round" />

          {/* EYES (Big, deep, gorgeous anime-style) */}
          <g>
            {/* Left Eye Sclera */}
            <ellipse cx="38.5" cy="46" rx="6.2" ry="5.2" fill="#ffffff" stroke="#1c1917" strokeWidth="1.2" />
            {/* Left Iris (Brown) */}
            <ellipse cx={`${38.5 + eyePupilX}`} cy={`${46 + eyePupilY}`} rx="4.2" ry="3.8" fill="#78350f" />
            {/* Left Pupil (Black) */}
            <circle cx={`${38.5 + eyePupilX * 1.2}`} cy={`${46 + eyePupilY * 1.2}`} r="2.4" fill="#09090b" />
            {/* Left Eye Sparkle Glints (Make them live and emotional) */}
            <circle cx={`${37.2 + eyePupilX}`} cy={`${44.5 + eyePupilY}`} r="1.2" fill="#ffffff" />
            <circle cx={`${40.2 + eyePupilX}`} cy={`${47.5 + eyePupilY}`} r="0.5" fill="#ffffff" />

            {/* Right Eye Sclera */}
            <ellipse cx="61.5" cy="46" rx="6.2" ry="5.2" fill="#ffffff" stroke="#1c1917" strokeWidth="1.2" />
            {/* Right Iris (Brown) */}
            <ellipse cx={`${61.5 + eyePupilX}`} cy={`${46 + eyePupilY}`} rx="4.2" ry="3.8" fill="#78350f" />
            {/* Right Pupil (Black) */}
            <circle cx={`${61.5 + eyePupilX * 1.2}`} cy={`${46 + eyePupilY * 1.2}`} r="2.4" fill="#09090b" />
            {/* Right Eye Sparkle Glints */}
            <circle cx={`${60.2 + eyePupilX}`} cy={`${44.5 + eyePupilY}`} r="1.2" fill="#ffffff" />
            <circle cx={`${63.2 + eyePupilX}`} cy={`${47.5 + eyePupilY}`} r="0.5" fill="#ffffff" />

            {/* Top Eyelashes (Elegant thick outline) */}
            <path d="M 31 44.5 C 34 40.5 43.5 40.5 46.5 44.5" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
            <path d="M 53.5 44.5 C 56.5 40.5 66 40.5 69 44.5" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* DYNAMIC EYEBROWS */}
          <g style={{ transition: "all 0.25s ease" }}>
            {/* Left Eyebrow */}
            <path
              d={`M 31 ${38 + eyebrowYOffset} Q 38.5 ${34.5 + eyebrowYOffset} 46 ${37.5 + eyebrowYOffset}`}
              fill="none"
              stroke="#09090b"
              strokeWidth="2.4"
              strokeLinecap="round"
              style={{
                transform: `rotate(${eyebrowAngle}deg)`,
                transformOrigin: "38.5px 38px"
              }}
            />
            {/* Right Eyebrow */}
            <path
              d={`M 54 ${37.5 + eyebrowYOffset} Q 61.5 ${34.5 + eyebrowYOffset} 69 ${38 + eyebrowYOffset}`}
              fill="none"
              stroke="#09090b"
              strokeWidth="2.4"
              strokeLinecap="round"
              style={{
                transform: `rotate(${-eyebrowAngle}deg)`,
                transformOrigin: "61.5px 38px"
              }}
            />
          </g>

          {/* THICK BLACK GLASSES (Just like the uploaded images) */}
          <g>
            {/* Left Frame Lens Outline */}
            <rect x="29.5" y="38" width="18" height="15" rx="5" fill="none" stroke="#09090b" strokeWidth="3.2" />
            <path d="M 32.5 49 L 44.5 39.5" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.2" strokeLinecap="round" /> {/* Glare */}

            {/* Right Frame Lens Outline */}
            <rect x="52.5" y="38" width="18" height="15" rx="5" fill="none" stroke="#09090b" strokeWidth="3.2" />
            <path d="M 55.5 49 L 67.5 39.5" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.2" strokeLinecap="round" /> {/* Glare */}

            {/* Bridge */}
            <path d="M 47.5 44 L 52.5 44" stroke="#09090b" strokeWidth="3.2" strokeLinecap="round" />

            {/* Frame Sides (Temple arms entering ears) */}
            <path d="M 29.5 43.5 L 25.5 44.5" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 70.5 43.5 L 74.5 44.5" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* DYNAMIC MOUTH (Expresses exact state) */}
          <g>
            {(state === "welcome" || state === "celebrate" || state === "coffee_invite") ? (
              // Wide open cheerful laughing grin showing white teeth
              <g>
                <path d="M 40 61 Q 50 71 60 61 Z" fill="#451a03" stroke="#09090b" strokeWidth="1.5" />
                <path d="M 41.8 61.5 Q 50 64 58.2 61.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" /> {/* Teeth */}
                <path d="M 45 67.5 Q 50 64.5 55 67.5" fill="#fca5a5" /> {/* Tongue */}
              </g>
            ) : state === "thinking" ? (
              // Thoughtful flat line
              <path d="M 43 60.5 Q 50 60.5 57 60.5" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
            ) : state === "talking" ? (
              // Talking open circle with css bounce loop
              <ellipse cx="50" cy="61.5" rx="4.8" ry="3.5" fill="#451a03" stroke="#09090b" strokeWidth="1.5" className="animate-avatar-talk" style={{ transformOrigin: "50px 61.5px" }} />
            ) : state === "confused" ? (
              // Confused squiggly line
              <path d="M 42 62 Q 46 59 50 62 Q 54 65 58 61.5" fill="none" stroke="#09090b" strokeWidth="2.2" strokeLinecap="round" />
            ) : (
              // Warm friendly closed smirk / smile
              <path d="M 40.5 61 Q 50 67.5 59.5 61" fill="none" stroke="#09090b" strokeWidth="2.2" strokeLinecap="round" />
            )}
          </g>

          {/* CURLY VOLUMINOUS BLACK HAIR WITH TEXTURE (Matches drawing beautifully) */}
          <g>
            {/* Hair base silhouette */}
            <path
              d="M 31 34 C 23 25 31 10 50 10 C 69 10 77 25 69 34 C 67 36 65 37 63 37 C 50 37 50 36 37 37 C 35 37 33 36 31 34 Z"
              fill="url(#hairGrad)"
            />

            {/* Rich curly bubbles overlapping for modern volume */}
            <circle cx="31" cy="24" r="6.5" fill="url(#hairGrad)" />
            <circle cx="36" cy="17" r="7" fill="url(#hairGrad)" />
            <circle cx="44" cy="12" r="7.5" fill="url(#hairGrad)" />
            <circle cx="56" cy="12" r="7.5" fill="url(#hairGrad)" />
            <circle cx="64" cy="17" r="7" fill="url(#hairGrad)" />
            <circle cx="69" cy="24" r="6.5" fill="url(#hairGrad)" />

            <circle cx="31" cy="30" r="5" fill="url(#hairGrad)" />
            <circle cx="69" cy="30" r="5" fill="url(#hairGrad)" />

            {/* Front curly bangs on the forehead */}
            <path d="M 30.5 35 Q 36 39.5 41 33.5" fill="none" stroke="#09090b" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M 39.5 32.5 Q 45 37 50 31.5" fill="none" stroke="#09090b" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M 48.5 31.5 Q 54 37 59.5 32" fill="none" stroke="#09090b" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M 58 32.5 Q 63.5 39.5 69 34" fill="none" stroke="#09090b" strokeWidth="4.2" strokeLinecap="round" />

            {/* Individual curl strand curves and subtle grey highlights for volume */}
            <g opacity="0.32" stroke="#e4e4e7" strokeWidth="0.8" fill="none" strokeLinecap="round">
              {/* Highlights on top curls */}
              <path d="M 28 22 C 29 18 34 18 35 22" />
              <path d="M 34 15 C 37 12 41 12 43 15" />
              <path d="M 44 9 C 48 6 52 6 56 9" />
              <path d="M 57 15 C 59 12 63 12 66 15" />
              <path d="M 65 22 C 66 18 71 18 72 22" />

              {/* Highlights on bangs */}
              <path d="M 33 34 Q 37 36 39 33.5" />
              <path d="M 41.5 31 Q 45.5 33.5 47.5 31" />
              <path d="M 50.5 30.5 Q 54.5 33.5 56.5 30.5" />
              <path d="M 60 31.5 Q 64 34.5 66.5 32" />
            </g>
          </g>

          {/* Sweat Drop for Confused state */}
          {sweatDrip && (
            <path
              d="M 24 38 Q 22 41 24 45 Q 26 41 24 38"
              fill="#38bdf8"
              className="animate-bounce"
              style={{ animationDuration: "1.2s" }}
            />
          )}

          {/* DYNAMIC THINKING HAND (RESTS CUTE ON CHIN/CHEEK) */}
          {state === "thinking" && (
            <g className="animate-pulse" style={{ animationDuration: "2.5s" }}>
              {/* Arm and palm rising */}
              <path
                d="M 30 100 C 33 86 36 78 41 74 C 43 72.5 44 74 41 76.5 C 38 79 38 85 38 100 Z"
                fill="url(#skinGrad)"
                stroke="#09090b"
                strokeWidth="1.2"
              />
              {/* Index finger resting vertically on check/glasses */}
              <path
                d="M 41 74 C 41 74 42.8 63 43.8 63 C 44.8 63 44.8 70 41 75.5 Z"
                fill="url(#skinGrad)"
                stroke="#09090b"
                strokeWidth="1"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Title block with updated non-hardware status */}
      <div className="mt-4 text-center z-10 bg-black/40 px-3.5 py-1.5 rounded-xl border border-white/5 backdrop-blur-sm shadow-md">
        <h4 className="text-xs font-bold text-stone-200 font-display flex items-center justify-center gap-1.5">
          <span>Tauheed Ahmed Nabil</span>
          <span className="text-[10px] font-mono font-normal text-amber-500">{"(⌐■_■)"}</span>
        </h4>
        <p className="text-[9px] font-mono text-stone-400 mt-0.5 uppercase tracking-wider">
          Status: <span className="text-amber-500 font-bold">{state.replace("_", " ")}</span>
        </p>
      </div>
    </div>
  );
}
