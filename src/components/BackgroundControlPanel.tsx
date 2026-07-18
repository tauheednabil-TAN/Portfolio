import React, { useState, useRef } from "react";
import { Sliders, RotateCcw, Upload } from "lucide-react";

interface BackgroundControlPanelProps {
  bgImage: string;
  setBgImage: (url: string) => void;
  bgBlur: number;
  setBgBlur: (blur: number) => void;
  bgOpacity: number;
  setBgOpacity: (opacity: number) => void;
}

const PRESETS = [
  { name: "Cozy Café", url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80" },
  { name: "Cosmic Aura", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" },
  { name: "Tokyo Neon", url: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=1200&q=80" },
  { name: "Minimal Velvet", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80" }
];

export default function BackgroundControlPanel({
  bgImage,
  setBgImage,
  bgBlur,
  setBgBlur,
  bgOpacity,
  setBgOpacity
}: BackgroundControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setBgImage(base64);
        localStorage.setItem("custom_bg_image", base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const selectPreset = (url: string) => {
    setBgImage(url);
    localStorage.setItem("custom_bg_image", url);
  };

  const handleBlurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setBgBlur(val);
    localStorage.setItem("custom_bg_blur", val.toString());
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setBgOpacity(val);
    localStorage.setItem("custom_bg_opacity", val.toString());
  };

  const resetAll = () => {
    const defaultImg = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80";
    setBgImage(defaultImg);
    setBgBlur(0);
    setBgOpacity(0.4);
    localStorage.setItem("custom_bg_image", defaultImg);
    localStorage.setItem("custom_bg_blur", "0");
    localStorage.setItem("custom_bg_opacity", "0.4");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-zinc-950/80 hover:bg-zinc-900 border border-white/10 rounded-full shadow-2xl flex items-center gap-2 text-stone-200 hover:text-amber-400 transition-all cursor-pointer font-display text-xs"
        title="macOS Aesthetic Control (⌐■_■)"
      >
        <Sliders className="w-4 h-4 text-amber-500 animate-pulse" />
        <span className="hidden md:inline font-bold">Liquid Canvas</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-16 left-0 w-72 p-5 rounded-2xl liquid-glass border border-white/20 shadow-2xl z-50 text-stone-200 animate-comic-pop">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3.5">
            <span className="font-bold text-xs font-display flex items-center gap-2 text-amber-400">
              <Sliders className="w-4 h-4" /> Aesthetic Panel
            </span>
            <button
              onClick={resetAll}
              className="p-1 hover:bg-white/5 rounded text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
              title="Reset Settings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 text-xs font-sans">
            {/* 1. BACKGROUND PRESETS */}
            <div className="space-y-2">
              <span className="text-[10px] text-stone-400 font-mono font-bold uppercase tracking-wide">Atmosphere Presets</span>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => selectPreset(p.url)}
                    className={`p-1.5 text-[10px] font-medium border rounded-lg transition-all truncate text-left cursor-pointer ${
                      bgImage === p.url
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                        : "bg-black/35 border-white/5 hover:bg-black/50 text-stone-300"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. CUSTOM UPLOAD */}
            <div className="space-y-2">
              <span className="text-[10px] text-stone-400 font-mono font-bold uppercase tracking-wide">Use My Uploaded Image</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-[11px] font-display shadow-md shadow-amber-900/10"
              >
                <Upload className="w-3.5 h-3.5" /> Select Background Image
              </button>
            </div>

            {/* 3. BLUR CONTROL */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono">
                <span>Blur Level</span>
                <span className="text-amber-400 font-bold">{bgBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={bgBlur}
                onChange={handleBlurChange}
                className="w-full accent-amber-500 cursor-pointer h-1.5 rounded-lg bg-black/40"
              />
            </div>

            {/* 4. OPACITY CONTROL */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono">
                <span>Dark Cover Tint</span>
                <span className="text-amber-400 font-bold">{Math.round(bgOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={bgOpacity}
                onChange={handleOpacityChange}
                className="w-full accent-amber-500 cursor-pointer h-1.5 rounded-lg bg-black/40"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
