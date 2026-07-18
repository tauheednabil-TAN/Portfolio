import React, { useState, useEffect, useRef } from "react";
import { SceneState } from "./types.js";
import CafeScene from "./components/CafeScene.tsx";
import ChatPanel from "./components/ChatPanel.tsx";
import Roadmap from "./components/Roadmap.tsx";
import BlogPosts from "./components/BlogPosts.tsx";
import BookingPanel from "./components/BookingPanel.tsx";
import SimpleView from "./components/SimpleView.tsx";
import AdminPortal from "./components/AdminPortal.tsx";
import BackgroundControlPanel from "./components/BackgroundControlPanel.tsx";
import { permanentAvatar } from "./components/avatar_data.ts";
import { 
  Coffee, 
  GraduationCap, 
  Code, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  Clock, 
  FileText, 
  Settings, 
  Sparkles, 
  Compass, 
  BookOpen, 
  ChevronRight, 
  Menu, 
  X, 
  ShieldCheck,
  UserCheck
} from "lucide-react";

export default function App() {
  const [bgImage, setBgImage] = useState<string>(() => {
    return localStorage.getItem("custom_bg_image") || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=2000&q=80";
  });
  const [bgBlur, setBgBlur] = useState<number>(() => {
    const saved = localStorage.getItem("custom_bg_blur");
    return saved ? parseFloat(saved) : 0;
  });
  const [bgOpacity, setBgOpacity] = useState<number>(() => {
    const saved = localStorage.getItem("custom_bg_opacity");
    return saved ? parseFloat(saved) : 0.4;
  });

  const [activePage, setActivePage] = useState<"hub" | "chat" | "roadmap" | "blog" | "booking" | "cv" | "admin">("hub");
  const [sceneState, setSceneState] = useState<SceneState>("welcome");
  const [speechBubbleText, setSpeechBubbleText] = useState<string>("Welcome to my virtual café! ☕ Drop an anchor, pull up a stool, and let's chat about my projects, skills, or book a quick calendar sync! (⌐■_■)");
  const [copenhagenTime, setCopenhagenTime] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile avatar URL state persistent in localStorage (and backed by permanent server-side codebase storage)
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return permanentAvatar || localStorage.getItem("custom_avatar_url") || "";
  });
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    const checkToken = () => {
      setIsAdminUser(!!sessionStorage.getItem("nabil_admin_token"));
    };
    checkToken();
    window.addEventListener("storage", checkToken);
    return () => window.removeEventListener("storage", checkToken);
  }, [activePage]);

  // Sync local cached avatar image to server code-base for permanent storage on first render
  useEffect(() => {
    const localCached = localStorage.getItem("custom_avatar_url");
    if (localCached && !permanentAvatar) {
      fetch("/api/save-permanent-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: localCached })
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log("✅ Successfully synchronized local avatar to server codebase permanently.");
        }
      })
      .catch((err) => console.error("Failed to sync avatar:", err));
    }
  }, []);

  const handleAvatarClick = () => {
    if (isAdminUser) {
      avatarInputRef.current?.click();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        localStorage.setItem("custom_avatar_url", base64);
        setAvatarUrl(base64);

        // Also upload to server to make it permanent in codebase
        fetch("/api/save-permanent-avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 })
        })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log("✅ Avatar successfully persisted permanently to the server codebase.");
          }
        })
        .catch((err) => console.error("Error saving permanent avatar:", err));
      };
      reader.readAsDataURL(file);
    }
  };

  // Copenhagen Clock ticking (CEST is UTC+2 / CET is UTC+1)
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Europe/Copenhagen",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      setCopenhagenTime(new Intl.DateTimeFormat("en-US", options).format(new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSceneUpdate = (state: SceneState, text: string) => {
    setSceneState(state);
    
    // Condense full chatbot responses into highly expressive 2-3 word comic-style captions
    let shortCaption = text;
    if (text.length > 25) {
      if (state === "welcome") {
        shortCaption = "Hi, I'm Nabil!";
      } else if (state === "listening") {
        shortCaption = "Listening closely...";
      } else if (state === "thinking") {
        shortCaption = "Hmm... interesting!";
      } else if (state === "coffee_invite") {
        shortCaption = "Let's have coffee!";
      } else if (state === "celebrate") {
        shortCaption = "Aha! Cheers! 🎉";
      } else if (state === "confused") {
        shortCaption = "Wait, what? 🤔";
      } else if (state === "idle") {
        shortCaption = "Let's chat!";
      } else if (state === "talking") {
        // Dynamic smart keyword matching for talking responses
        const lower = text.toLowerCase();
        if (lower.includes("sentinel") || lower.includes("security") || lower.includes("probing")) {
          shortCaption = "Shields up! 🛡️";
        } else if (lower.includes("loansage") || lower.includes("agent") || lower.includes("crewai")) {
          shortCaption = "Agentic flow! 🤖";
        } else if (lower.includes("calendar") || lower.includes("meeting") || lower.includes("schedule") || lower.includes("book")) {
          shortCaption = "Let's align! 📅";
        } else if (lower.includes("skills") || lower.includes("code") || lower.includes("python") || lower.includes("languages")) {
          shortCaption = "Code crafted! 💻";
        } else if (lower.includes("coffee") || lower.includes("cafe")) {
          shortCaption = "Let's have coffee!";
        } else if (lower.includes("experience") || lower.includes("history") || lower.includes("utest") || lower.includes("work")) {
          shortCaption = "My career path!";
        } else if (lower.includes("achievement") || lower.includes("cyber") || lower.includes("award")) {
          shortCaption = "Cyber champion! 🏆";
        } else {
          // Stable fallback hash to vary general responses
          const choices = [
            "Great question!",
            "Excellent point!",
            "Hmm... interesting!",
            "Let's explore!",
            "That's awesome!",
            "Let's chat!"
          ];
          let hash = 0;
          for (let i = 0; i < text.length; i++) {
            hash = text.charCodeAt(i) + ((hash << 5) - hash);
          }
          const index = Math.abs(hash) % choices.length;
          shortCaption = choices[index];
        }
      }
    }
    setSpeechBubbleText(shortCaption);
  };

  const selectPage = (page: typeof activePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    
    // Set friendly welcoming statements when changing pages
    if (page === "hub") {
      handleSceneUpdate("welcome", "Welcome back to the main Hub! Grab a seat and pick what you'd like to check out next. ✨");
    } else if (page === "chat") {
      handleSceneUpdate("welcome", "I am absolutely thrilled to chat! Ask me any questions about my work, code samples, or experiences. ☕");
    } else if (page === "roadmap") {
      handleSceneUpdate("thinking", "Here is my academic journey and career milestone timeline. I'm pursuing my BSc at Niels Brock in Copenhagen! 🎓");
    } else if (page === "blog") {
      handleSceneUpdate("idle", "Welcome to my development notebook! Here I share technical guides, security reviews, and dev updates. 📝");
    } else if (page === "booking") {
      handleSceneUpdate("coffee_invite", "Let's align our calendars! Choose a slot and my system will automatically dispatch a calendar invitation and meeting link. 📅");
    } else if (page === "cv") {
      handleSceneUpdate("celebrate", "Here is my traditional professional CV résumé. Perfect for a quick download or quick recruiter review! 📄");
    } else if (page === "admin") {
      handleSceneUpdate("confused", "Secure command deck. Please supply the administrative passcode to access deployment pipelines. 🔐");
    }
  };

  return (
    <div className="min-h-screen flex text-stone-100 font-sans selection:bg-amber-500/30 selection:text-white relative overflow-x-hidden">
      
      {/* Full-bleed Fixed Background Image with Dark & Warm Glass Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-20 transition-all duration-500 transform scale-100"
        style={{
          backgroundImage: `url('${bgImage}')`,
          filter: `blur(${bgBlur}px)`,
        }}
      />
      <div 
        className="fixed inset-0 bg-black -z-10 transition-all duration-300" 
        style={{
          opacity: bgOpacity,
        }}
      />

      {/* 1. PERSISTENT LEFT SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex flex-col w-80 bg-zinc-950/70 backdrop-blur-xl border-r border-white/10 p-6 flex-shrink-0 justify-between sticky top-0 h-screen z-30">
        <div className="space-y-8">
          {/* Brand Header */}
          <div 
            onClick={() => selectPage("hub")}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center animate-pulse shadow-inner shadow-amber-500/10 group-hover:border-amber-500 transition-colors">
              <ShieldCheck className="w-5.5 h-5.5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-base font-extrabold font-display tracking-tight text-stone-50 group-hover:text-amber-400 transition-colors">
                Meet Tauheed
              </h1>
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                AI & SEC PRO
              </span>
            </div>
          </div>

          {/* Copenhagen Local Time Ticker */}
          <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
            <div className="flex items-center gap-2 text-stone-400">
              <Clock className="w-4 h-4 text-amber-500/80 animate-pulse" />
              <span className="text-[11px] font-mono tracking-wide uppercase">Copenhagen Clock</span>
            </div>
            <p className="text-xl font-bold font-mono text-amber-400 mt-1 tracking-wider">
              {copenhagenTime || "12:00:00"}
            </p>
            <span className="text-[9px] text-stone-500 font-mono block mt-0.5">Europe/Copenhagen (CEST/CET)</span>
          </div>

          {/* Primary Navigation Menu */}
          <nav className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold tracking-widest text-stone-500 uppercase block pl-3 pb-1">
              Explore Portfolio
            </span>
            {[
              { id: "hub", label: "Portfolio Hub", icon: UserCheck, desc: "Overview & credentials" },
              { id: "chat", label: "Conversational AI", icon: MessageSquare, desc: "Interactive chat assistant" },
              { id: "roadmap", label: "Milestone Roadmap", icon: Compass, desc: "BSc studies & achievements" },
              { id: "blog", label: "Tech & Security Blog", icon: BookOpen, desc: "Research logs & tutorials" },
              { id: "booking", label: "Meet with Tauheed", icon: Calendar, desc: "Auto-synced scheduler" }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => selectPage(item.id as any)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                    isActive 
                      ? "bg-amber-600/20 border border-amber-500/30 text-amber-300 shadow-lg shadow-amber-500/5" 
                      : "border border-transparent text-stone-300 hover:bg-white/5 hover:text-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? "text-amber-400" : "text-stone-400 group-hover:text-amber-400"} transition-colors`} />
                    <div>
                      <p className="text-xs font-bold font-display">{item.label}</p>
                      <p className="text-[10px] text-stone-500 font-medium group-hover:text-stone-400 transition-colors">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "text-amber-400 opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"} transition-all`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="pt-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => selectPage("cv")}
            className={`w-full px-3.5 py-2.5 rounded-xl text-left flex items-center gap-2.5 border transition-all cursor-pointer ${
              activePage === "cv"
                ? "bg-amber-600/20 border-amber-500/30 text-amber-300"
                : "bg-transparent border-transparent text-stone-400 hover:text-stone-100 hover:bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold font-display">Recruiter Quick-CV</span>
          </button>
          
          <button
            onClick={() => selectPage("admin")}
            className={`w-full px-3.5 py-2.5 rounded-xl text-left flex items-center gap-2.5 border transition-all cursor-pointer ${
              activePage === "admin"
                ? "bg-amber-600/20 border-amber-500/30 text-amber-300"
                : "bg-transparent border-transparent text-stone-400 hover:text-stone-100 hover:bg-white/5"
            }`}
          >
            <Settings className="w-4 h-4 text-stone-500" />
            <span className="text-xs font-bold font-display">Admin command desk</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & NAVIGATION MENU */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-b border-white/10 px-4 py-3.5 flex items-center justify-between shadow-xl">
        <div 
          onClick={() => selectPage("hub")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xs font-black font-display tracking-tight text-stone-100">Meet Tauheed</h1>
            <p className="text-[9px] text-amber-500 font-mono font-bold uppercase tracking-wider">AI & SEC PRO</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono bg-black/40 border border-white/5 px-2.5 py-1 rounded-lg text-amber-400 font-bold">
            {copenhagenTime ? copenhagenTime.substring(0, 5) : "12:00"}
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 bg-zinc-900/80 border border-white/10 rounded-xl flex items-center justify-center text-stone-200 hover:text-stone-50 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop/Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-[#0c0a09]/97 backdrop-blur-lg flex flex-col pt-24 px-6 pb-8 justify-between animate-fade-in">
          <div className="space-y-6">
            <span className="text-[10px] font-mono font-bold tracking-widest text-stone-500 uppercase block pl-2">
              Menu Navigation
            </span>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: "hub", label: "🏡 Portfolio Hub", desc: "Overview & credentials" },
                { id: "chat", label: "💬 Conversational AI", desc: "Interactive chat assistant" },
                { id: "roadmap", label: "🛣️ Milestone Roadmap", desc: "BSc studies & achievements" },
                { id: "blog", label: "📝 Tech & Security Blog", desc: "Research logs & tutorials" },
                { id: "booking", label: "📅 Meet with Tauheed", desc: "Auto-synced scheduler" },
                { id: "cv", label: "📄 Recruiter Quick-CV", desc: "Print-ready resume sheet" },
                { id: "admin", label: "⚙️ Admin Control Desk", desc: "Server diagnostics" }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectPage(item.id as any)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col ${
                    activePage === item.id 
                      ? "bg-amber-600/10 border-amber-500/30 text-amber-300" 
                      : "bg-zinc-900/30 border-white/5 text-stone-300"
                  }`}
                >
                  <span className="text-xs font-bold font-display">{item.label}</span>
                  <span className="text-[10px] text-stone-500 mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center pt-6 border-t border-white/5 text-[10px] text-stone-500 font-mono">
            <span>Copenhagen, Denmark 🇩🇰</span>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTAINER (Spacious, beautifully bounded grid) */}
      <main className="flex-1 w-full min-h-screen flex flex-col pt-20 lg:pt-0">
        
        {/* Dynamic workspace header with active chapter feedback and tab links on top */}
        <header className="hidden lg:flex w-full bg-zinc-950/20 border-b border-white/10 px-8 py-5 items-center justify-between z-10">
          <div>
            <span className="text-[10px] font-mono text-amber-500/80 uppercase tracking-widest font-bold">Portfolio Deck</span>
            <h2 className="text-sm font-extrabold font-display text-stone-50 mt-0.5 flex items-center gap-2">
              {activePage === "hub" && "🏡 Portfolio Hub"}
              {activePage === "chat" && "💬 Conversational AI Assistant"}
              {activePage === "roadmap" && "🛣️ Study & Career Milestone Roadmap"}
              {activePage === "blog" && "📝 Technical & Cybersecurity Blog"}
              {activePage === "booking" && "📅 Meet with Tauheed"}
              {activePage === "cv" && "📄 Recruiter CV Résumé"}
              {activePage === "admin" && "⚙️ Secure Operations Terminal"}
            </h2>
          </div>

          {/* Persistent Section Tabs on Top Right ("in every section will have everything") */}
          <div className="flex gap-1 bg-black/40 border border-white/10 p-1 rounded-xl text-xs font-sans">
            {[
              { id: "hub", label: "🏡 Hub" },
              { id: "chat", label: "💬 Chat" },
              { id: "roadmap", label: "🛣️ Roadmap" },
              { id: "blog", label: "📝 Blog" },
              { id: "booking", label: "📅 Sync Session" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => selectPage(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activePage === tab.id
                    ? "bg-amber-600/35 text-amber-300 border border-amber-500/20"
                    : "text-stone-400 hover:bg-white/5 hover:text-stone-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* Workspace Inner Viewport */}
        <div className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto animate-fade-in">
          
          {/* A. VIRTUAL CAFÉ HUB PAGE */}
          {activePage === "hub" && (
            <div className="space-y-10">
              
              {/* Elegant welcoming Hero block with Tauheed's profile summary (Full-width) */}
              <div className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/15 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center shadow-[0_12px_40px_rgba(0,0,0,0.35)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
                <div 
                  className={`w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center flex-shrink-0 relative shadow-inner overflow-hidden ${
                    isAdminUser 
                      ? "cursor-pointer hover:scale-105 active:scale-95 transition-all group" 
                      : ""
                  }`}
                  onClick={isAdminUser ? handleAvatarClick : undefined}
                  title={isAdminUser ? "Click to upload your custom avatar photo 📸" : "Tauheed Ahmed Nabil"}
                >
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {avatarUrl ? (
                    <img 
                      id="tauheed-avatar-img"
                      src={avatarUrl} 
                      alt="Tauheed Ahmed Nabil" 
                      className="w-full h-full object-cover rounded-full" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <svg 
                      id="tauheed-avatar-img"
                      viewBox="0 0 100 100" 
                      className="w-full h-full object-cover rounded-full transition-transform duration-300 ease-out bg-gradient-to-br from-amber-950 via-zinc-900 to-amber-900/40"
                    >
                      {/* Skin */}
                      <circle cx="50" cy="52" r="22" fill="#fed7aa" stroke="#1e293b" strokeWidth="1.5" />
                      {/* Cheeks Blush */}
                      <circle cx="38" cy="56" r="3" fill="#f87171" opacity="0.3" />
                      <circle cx="62" cy="56" r="3" fill="#f87171" opacity="0.3" />
                      {/* Eyes */}
                      <circle cx="41" cy="48" r="2" fill="#1e293b" />
                      <circle cx="59" cy="48" r="2" fill="#1e293b" />
                      {/* Glasses */}
                      <rect x="33" y="42" width="16" height="12" rx="3" fill="none" stroke="#09090b" strokeWidth="2" />
                      <rect x="51" y="42" width="16" height="12" rx="3" fill="none" stroke="#09090b" strokeWidth="2" />
                      <line x1="49" y1="46" x2="51" y2="46" stroke="#09090b" strokeWidth="2" />
                      {/* Smile */}
                      <path d="M 45 58 Q 50 63 55 58" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
                      {/* Curly Hair */}
                      <path d="M 32 38 C 26 30 32 16 50 16 C 68 16 74 30 68 38 C 65 40 60 38 50 38 C 40 38 35 40 32 38 Z" fill="#09090b" />
                      <circle cx="34" cy="28" r="6" fill="#09090b" />
                      <circle cx="42" cy="22" r="7" fill="#09090b" />
                      <circle cx="50" cy="20" r="7" fill="#09090b" />
                      <circle cx="58" cy="22" r="7" fill="#09090b" />
                      <circle cx="66" cy="28" r="6" fill="#09090b" />
                    </svg>
                  )}
                  {/* Camera overlay indicator on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-1.293-1.293A1 1 0 0012.414 3H7.586a1 1 0 00-.707.293L5.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 z-10">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-black font-display tracking-tight text-stone-50">
                    Welcome to the Workspace of Tauheed Ahmed Nabil
                  </h2>
                  <p className="text-xs md:text-sm text-stone-300 leading-relaxed max-w-2xl font-medium">
                    "I am a Copenhagen-based Computer Science student at Niels Brock, specializing in agentic AI development, web vulnerability scanning, and cybersecurity systems. Explore my research milestones, blogs, or chat with my custom-tuned AI avatar below!"
                  </p>
                  <div className="flex flex-wrap gap-2.5 pt-1.5">
                    <span className="text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-lg">
                      📍 Copenhagen, Denmark
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-lg">
                      🎓 BSc (Hons) Computer Science
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg">
                      🟢 Available for Projects
                    </span>
                  </div>
                </div>
              </div>

              {/* Organized Bento Grid Menu of Exploration Options */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold font-mono text-stone-400 uppercase tracking-widest flex items-center gap-2 pl-1">
                  <Sparkles className="w-4 h-4 text-amber-500" /> What would you like to see today? Select an Option:
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Option 1: AI Chatroom */}
                  <div 
                    onClick={() => selectPage("chat")}
                    className="text-left bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-2xl border border-white/10 hover:border-amber-500/30 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:scale-[1.015] transition-all duration-300 group cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors">
                        <MessageSquare className="w-5.5 h-5.5" />
                      </div>
                      <span className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Active Agent
                      </span>
                    </div>
                    <h4 className="text-base font-bold font-display text-stone-50 mt-5 group-hover:text-amber-400 transition-colors">
                      Interactive AI Assistant Chat
                    </h4>
                    <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                      Converse directly with Tauheed's interactive 2D avatar. Ask technical questions about custom LLM systems, vulnerability scanning probers, reverse engineering, or cybersecurity.
                    </p>
                    <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs font-bold font-mono text-amber-400 group-hover:text-amber-300">
                      <span>Launch Conversational Chat</span>
                      <span>→</span>
                    </div>
                  </div>

                  {/* Option 2: Study Roadmap */}
                  <div 
                    onClick={() => selectPage("roadmap")}
                    className="text-left bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-2xl border border-white/10 hover:border-amber-500/30 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:scale-[1.015] transition-all duration-300 group cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors">
                        <Compass className="w-5.5 h-5.5" />
                      </div>
                      <span className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Timeline Map
                      </span>
                    </div>
                    <h4 className="text-base font-bold font-display text-stone-50 mt-5 group-hover:text-amber-400 transition-colors">
                      Academic & Study Roadmap
                    </h4>
                    <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                      Step into an interactive career and education timeline, analyzing courses at Niels Brock Copenhagen, cybersecurity milestones, and future multi-agent project blueprints.
                    </p>
                    <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs font-bold font-mono text-amber-400 group-hover:text-amber-300">
                      <span>View Active Course Milestones</span>
                      <span>→</span>
                    </div>
                  </div>

                  {/* Option 3: Tech Blog */}
                  <div 
                    onClick={() => selectPage("blog")}
                    className="text-left bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-2xl border border-white/10 hover:border-amber-500/30 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:scale-[1.015] transition-all duration-300 group cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors">
                        <BookOpen className="w-5.5 h-5.5" />
                      </div>
                      <span className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Notebook
                      </span>
                    </div>
                    <h4 className="text-base font-bold font-display text-stone-50 mt-5 group-hover:text-amber-400 transition-colors">
                      Daily Thoughts & Tech Notebook
                    </h4>
                    <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                      Read architectural logs, tech briefs, vulnerability writeups, and automation tutorials focusing on Next.js, FastAPI, CrewAI, and secure developer deployment.
                    </p>
                    <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs font-bold font-mono text-amber-400 group-hover:text-amber-300">
                      <span>Browse Dev Notebooks</span>
                      <span>→</span>
                    </div>
                  </div>

                  {/* Option 4: Calendly Sync */}
                  <div 
                    onClick={() => selectPage("booking")}
                    className="text-left bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-2xl border border-white/10 hover:border-amber-500/30 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:scale-[1.015] transition-all duration-300 group cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors">
                        <Calendar className="w-5.5 h-5.5" />
                      </div>
                      <span className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Calendar Sync
                      </span>
                    </div>
                    <h4 className="text-base font-bold font-display text-stone-50 mt-5 group-hover:text-amber-400 transition-colors">
                      Meet with Tauheed
                    </h4>
                    <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                      Compare global timezones seamlessly, review live calendar availability, and lock in an automated Google Calendar invitation and direct sync meeting with Tauheed.
                    </p>
                    <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs font-bold font-mono text-amber-400 group-hover:text-amber-300">
                      <span>Schedule Calendar Sync</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </div>





            </div>
          )}

          {/* B. AI CONVERSATIONAL CHATROOM VIEW */}
          {activePage === "chat" && (
            <div className="space-y-6">
              {/* Back to Hub ribbon to guarantee flawless orientation */}
              <div className="flex items-center justify-between bg-zinc-950/40 p-3 px-4 rounded-2xl border border-white/5">
                <span className="text-[11px] text-stone-400 flex items-center gap-1.5 font-mono">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" /> Converse directly with Nabil's responsive 2D avatar.
                </span>
                <button
                  onClick={() => selectPage("hub")}
                  className="text-[11px] font-mono font-bold text-amber-500 hover:text-amber-400 cursor-pointer"
                >
                  Return to Hub
                </button>
              </div>

              {/* Split Screen Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 xl:col-span-6">
                  <CafeScene state={sceneState} bubbleText={speechBubbleText} bgImage={bgImage} />
                </div>
                <div className="lg:col-span-5 xl:col-span-6">
                  <ChatPanel onStateChange={handleSceneUpdate} onNavigate={selectPage} />
                </div>
              </div>
            </div>
          )}

          {/* C. STUDY MILESTONES ROADMAP TIMELINE VIEW */}
          {activePage === "roadmap" && (
            <div className="space-y-6">
              {/* Info ribbon */}
              <div className="flex items-center justify-between bg-zinc-950/40 p-3 px-4 rounded-2xl border border-white/5">
                <span className="text-[11px] text-stone-400 flex items-center gap-1.5 font-mono">
                  <Compass className="w-3.5 h-3.5 text-amber-500" /> Milestone timelines tracking academic courses and future developer releases.
                </span>
                <button
                  onClick={() => selectPage("hub")}
                  className="text-[11px] font-mono font-bold text-amber-500 hover:text-amber-400 cursor-pointer"
                >
                  Return to Hub
                </button>
              </div>

              <div className="w-full">
                <Roadmap />
              </div>
            </div>
          )}

          {/* D. TECH ESSAY DEVELOPMENT NOTEBOOK BLOG VIEW */}
          {activePage === "blog" && (
            <div className="space-y-6">
              {/* Info ribbon */}
              <div className="flex items-center justify-between bg-zinc-950/40 p-3 px-4 rounded-2xl border border-white/5">
                <span className="text-[11px] text-stone-400 flex items-center gap-1.5 font-mono">
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" /> Reading technical blog posts, security analysis, and guides.
                </span>
                <button
                  onClick={() => selectPage("hub")}
                  className="text-[11px] font-mono font-bold text-amber-500 hover:text-amber-400 cursor-pointer"
                >
                  Return to Hub
                </button>
              </div>

              <BlogPosts />
            </div>
          )}

          {/* E. INSTANT GOOGLE CALENDAR SYNC CALENDLY VIEW */}
          {activePage === "booking" && (
            <div className="space-y-6">
              {/* Info ribbon */}
              <div className="flex items-center justify-between bg-zinc-950/40 p-3 px-4 rounded-2xl border border-white/5">
                <span className="text-[11px] text-stone-400 flex items-center gap-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> Seamless timezone translation & automated meeting invitation dispatch.
                </span>
                <button
                  onClick={() => selectPage("hub")}
                  className="text-[11px] font-mono font-bold text-amber-500 hover:text-amber-400 cursor-pointer"
                >
                  Return to Hub
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 hidden lg:block sticky top-36">
                  <CafeScene state={sceneState} bubbleText={speechBubbleText} bgImage={bgImage} />
                </div>
                <div className="lg:col-span-12 lg:col-span-8">
                  <BookingPanel onStateChange={handleSceneUpdate} />
                </div>
              </div>
            </div>
          )}

          {/* F. FAST SCANNING RECRUITER CV PORTFOLIO VIEW */}
          {activePage === "cv" && (
            <div className="space-y-6">
              {/* Prompt direct action scheduler */}
              <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-xl">
                <p className="text-xs md:text-sm text-stone-200 font-medium flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>Looking to hire Nabil? Secure a quick meeting immediately right onto his schedule.</span>
                </p>
                <button
                  onClick={() => selectPage("booking")}
                  className="px-4 py-2 bg-amber-600 text-stone-50 font-bold rounded-xl hover:bg-amber-700 hover:scale-[1.02] active:scale-100 transition-all cursor-pointer text-xs"
                >
                  Schedule Coffee Chat ☕
                </button>
              </div>

              <SimpleView />
            </div>
          )}

          {/* G. PASSWORD-PROTECTED COMMAND PORTAL ADMIN VIEW */}
          {activePage === "admin" && (
            <AdminPortal />
          )}

        </div>
      </main>

      {/* Dynamic Background Customizer / Aesthetic Controls */}
      <div className="fixed bottom-6 left-6 z-30">
        <BackgroundControlPanel 
          bgImage={bgImage} 
          setBgImage={setBgImage}
          bgBlur={bgBlur}
          setBgBlur={setBgBlur}
          bgOpacity={bgOpacity}
          setBgOpacity={setBgOpacity}
        />
      </div>

      {/* Persistent Floating Quick-CV action button for Recruiters on bottom-right */}
      {activePage !== "cv" && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => selectPage("cv")}
            className="px-4.5 py-3 bg-amber-600 text-stone-50 font-extrabold rounded-full shadow-2xl border border-amber-500/30 flex items-center gap-2 hover:bg-amber-700 hover:scale-[1.03] transition-all cursor-pointer font-display text-xs shadow-amber-500/10"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            Recruiter CV Sheet 📄
          </button>
        </div>
      )}
    </div>
  );
}
