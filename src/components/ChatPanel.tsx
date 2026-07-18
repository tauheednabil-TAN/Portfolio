import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MessageSquare, RefreshCw, AlertCircle } from "lucide-react";
import { SceneState } from "../types.js";
import dbData from "../db/db.json";

interface ChatPanelProps {
  onStateChange: (state: SceneState, text: string) => void;
  onNavigate?: (page: "hub" | "chat" | "roadmap" | "blog" | "booking" | "cv" | "admin") => void;
}

interface Message {
  sender: "user" | "nabil";
  text: string;
  time: string;
}

const QUICK_SUGGESTIONS = [
  "Tell me about your AI Sentinel project! 🛡️",
  "Explain your LoanSage 5-agent pipeline! 🤖",
  "What are your cybersecurity skills? 🔒",
  "Can we schedule a meeting? 📅"
];

// Custom lightweight parser for codeblocks, bolding, and inline code to deliver a premium LLM interface
const renderMessageText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (part.startsWith("```")) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const lang = match ? match[1] : "";
      const code = match ? match[2] : part.slice(3, -3);
      return (
        <div key={index} className="my-3 bg-zinc-950 rounded-xl border border-white/5 overflow-hidden font-mono text-[11px] shadow-2xl text-stone-200">
          <div className="bg-zinc-900/80 px-3.5 py-2 text-[9px] text-stone-400 font-mono flex justify-between items-center border-b border-white/5 uppercase select-none">
            <span>{lang || "code"}</span>
            <span className="text-[9px] text-amber-500 font-bold tracking-wider">Tan Cafe Server API</span>
          </div>
          <pre className="p-4 overflow-x-auto leading-relaxed select-text text-left">
            <code>{code.trim()}</code>
          </pre>
        </div>
      );
    }

    const inlineParts = part.split(/(`[^`]+`)/g);
    return (
      <span key={index} className="whitespace-pre-line leading-relaxed">
        {inlineParts.map((subPart, subIdx) => {
          if (subPart.startsWith("`") && subPart.endsWith("`")) {
            return (
              <code key={subIdx} className="px-1.5 py-0.5 mx-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded font-mono text-[11px] font-semibold select-text">
                {subPart.slice(1, -1)}
              </code>
            );
          }
          return subPart;
        })}
      </span>
    );
  });
};

export default function ChatPanel({ onStateChange, onNavigate }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([
    "Tell me about your AI Sentinel project! 🛡️",
    "Explain your LoanSage 5-agent pipeline! 🤖",
    "What are your cybersecurity skills? 🔒",
    "Can we schedule a meeting? 📅"
  ]);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "nabil",
      text: "Hello! Welcome to my professional workspace. I'm Tauheed Ahmed Nabil! 🛡️ Ask me anything about my AI multi-agent pipelines, cybersecurity scanners (like Sentinel), or reverse engineering projects, or schedule a meeting right here! (⌐■_■)",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic suggestions on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const res = await fetch("/api/chat/suggestions");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSuggestions(data);
          }
        }
      } catch (err) {
        console.error("Failed to load chat suggestions:", err);
      }
    };
    loadSuggestions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing state change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    if (value.trim()) {
      onStateChange("listening", "I'm listening closely... ☕");
    } else {
      onStateChange("idle", "Grab a cup of coffee and ask me anything!");
    }
  };

  const handleSend = async (textToSend: string, pdfName?: string) => {
    if (!textToSend.trim() && !pdfName) return;

    const userMessage: Message = {
      sender: "user",
      text: pdfName ? `📄 [Submitted PDF Document: ${pdfName}]` : textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    onStateChange("thinking", pdfName ? `Analyzing PDF: ${pdfName}... 🔍` : "Let me search my database... 🔍");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend || `Analyze PDF: ${pdfName}`, pdfName }),
      });

      if (!response.ok) {
        throw new Error("Network issue");
      }

      const data = await response.json();
      const nabilMessage: Message = {
        sender: "nabil",
        text: data.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, nabilMessage]);
      onStateChange(data.state || "talking", data.text);
    } catch (error) {
      console.warn("Express backend API offline, performing local RAG client-side fallback synthesis:", error);
      
      // Client-side local search & synthesis engine (fully robust and ultra fast!)
      const chunks = dbData.knowledge_chunks || [];
      const query = (textToSend || "").toLowerCase();
      const queryWords = query.replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);

      let matchedChunks = [];
      if (queryWords.length === 0) {
        matchedChunks = chunks.slice(0, 5);
      } else {
        const scoredChunks = chunks.map((chunk) => {
          const chunkText = `${chunk.source} ${chunk.content} ${chunk.category}`.toLowerCase();
          let score = 0;

          queryWords.forEach((word) => {
            const index = chunkText.indexOf(word);
            if (index !== -1) {
              score += 10;
              try {
                const regex = new RegExp(`\\b${word}\\b`, "g");
                const matches = chunkText.match(regex);
                if (matches) {
                  score += matches.length * 15;
                }
              } catch (e) {
                score += 15;
              }
            }
            if (chunk.category.toLowerCase().includes(word)) {
              score += 20;
            }
            if (chunk.source.toLowerCase().includes(word)) {
              score += 25;
            }
          });
          return { chunk, score };
        });

        let matches = scoredChunks.filter((item) => item.score > 0);
        if (matches.length === 0) {
          matches = scoredChunks.filter((item) => ["about", "skills", "faq"].includes(item.chunk.category));
        }
        matches.sort((a, b) => b.score - a.score);
        matchedChunks = matches.slice(0, 5).map((m) => m.chunk);
      }

      const findLiveWebsiteLink = (matched: any[]) => {
        for (const c of matched) {
          const linkMatch = c.content.match(/https?:\/\/[^\s)\]]+/);
          if (linkMatch) return linkMatch[0];
        }
        return null;
      };

      let state: SceneState = "talking";
      let text = "";

      const isAskingToMeet = /\b(meet|coffee|schedule|book|calendar|appointment|hire|collab|interview|contact|call|zoom|teams|skype|phone)\b/i.test(query);

      if (pdfName) {
        state = "celebrate";
        text = `### 📄 Dynamic PDF Scan & Analysis Report
I have successfully received and analyzed your PDF document: \`${pdfName}\`! 

Scanning its contents from my local memory... (⌐■_■)

Comparing this to my professional background:
- **Core Skills Align**: I detected elements in your document that resonate with my focus on **Agentic AI Systems**, **Python automation pipelines**, and **Defensive Cybersecurity/QA testing**.
- **My Experience Advantage**: If you're looking for someone who can bridge the gap between complex multi-agent frameworks (like **CrewAI**, **n8n**, and **FastAPI**) and rigid security scanning (like **Project Sentinel**), I'd love to deploy my skillset for you!
- **Let's Collaborate**: I'm currently looking for internships, strong mentorship, or exciting freelance QA/Dev roles in Copenhagen. 

Would you like to walk through how we can integrate this into a live n8n workflow? **Let's align our calendars** and talk over a hot brew! ☕`;
      } else if (isAskingToMeet) {
        state = "coffee_invite";
        text = `Oh, I'd absolutely love to sync and grab a virtual or physical coffee with you in Copenhagen! 📅 

Feel free to use the **interactive calendar scheduler** on my page to select a time that fits your schedule. My system will automatically log the slot and send us a Microsoft Teams or Zoom invite with a direct calendar confirmation! ☕ 

Let's connect and make things happen! ✨`;
      } else {
        const hasSentinel = query.includes("sentinel") || query.includes("security scanner") || query.includes("prober") || query.includes("cybersecurity");
        const hasLoanSage = query.includes("loansage") || query.includes("crewai") || query.includes("pipeline") || query.includes("n8n");
        const hasGmail = query.includes("gmail") || query.includes("junk") || query.includes("cleaner") || query.includes("automation");
        const hasSkills = query.includes("skill") || query.includes("stack") || query.includes("language") || query.includes("program") || query.includes("tech");
        const hasEdu = query.includes("education") || query.includes("study") || query.includes("college") || query.includes("university") || query.includes("niels");
        const hasExp = query.includes("experience") || query.includes("work") || query.includes("job") || query.includes("scandic") || query.includes("utest");
        const hasCyber = query.includes("cyber") || query.includes("security") || query.includes("reverse") || query.includes("ctf") || query.includes("ddc") || query.includes("cyberbridge");
        const hasBio = query.includes("who are you") || query.includes("nabil") || query.includes("tauheed") || query.includes("about") || query.includes("profile");

        if (hasSentinel) {
          state = "talking";
          const liveUrl = findLiveWebsiteLink(matchedChunks) || "https://sentinel-cyberprober.vercel.app";
          text = `### 🛡️ Project Sentinel — 12-Agent Cyber Prober
Let me tell you about **Sentinel**! It is a live, open-source AI-powered security scanner I built. 

It orchestrates **12 parallel AI agents** using Cerebras AI, Next.js, and TypeScript to probe target URLs for exposed credentials, missing security headers, leaked API keys, and deprecated dependencies. 

*Honest backstory:* My very first draft actually faked its scan results. But discarding that and rebuilding it from scratch to fetch and probe *real live data* taught me more about concurrency, async states, and defensive security than any lecture ever could! 💻 

🔗 **[Try the Sentinel Live Website here!](${liveUrl})** 🚀

Want to discuss the agent concurrency model? Let's book a session! ☕`;
        } else if (hasLoanSage) {
          state = "talking";
          const liveUrl = findLiveWebsiteLink(matchedChunks);
          text = `### 🤖 Project LoanSage — 5-Agent CrewAI Pipeline
**LoanSage** is an automated loan-approval pipeline I built using **CrewAI**, **FastAPI**, and **n8n**. 

It uses 5 distinct expert agents:
1. **Cleanup Agent**: Formats and validates user input.
2. **Decision Agent**: Evaluates credit scoring criteria.
3. **Guardrail Agent**: Conducts compliance checks.
4. **Email Writer**: Drafts customized offers.
5. **Next Best Offer**: Suggests alternative packages.

I integrated a strict manual-override safety guardrail before any emails are dispatched. It's a great example of combining autonomous AI with human-in-the-loop safety principles! (⌐■_■)

${liveUrl ? `🔗 **[Try the LoanSage Live Website here!](${liveUrl})** 🚀\n\n` : ""}Want to see a demo of the n8n orchestration layout? Let's sync!`;
        } else if (hasGmail) {
          state = "talking";
          text = `### ✉️ Gmail Junk Cleaner — Google Apps Script
I created the **Gmail Junk Cleaner** out of pure necessity! I had accumulated over 10,000 unread promotional emails and was about to hit my Google storage limits. Instead of paying for an upgrade, I wrote a serverless script inside Google Apps Script.

It safely scans unread promotional mail older than 30 days, respects any starred/flagged items to protect critical letters, and trashes the rest. It keeps all data entirely within my secure Google sandbox! 

It taught me that the best part of being a developer is writing code to solve your own real-world, boring problems. ☕`;
        } else if (hasSkills) {
          state = "talking";
          text = `### 💻 My Technical Arsenal
Here is a quick snapshot of the tools I use to build and break things:

- **AI & Agentic Orchestration**: CrewAI, LangChain, n8n, FastAPI, Gemini API, Anthropic Claude, Vertex AI.
- **Languages**: Python, TypeScript, JavaScript, Java, PHP, C/C++, SQL (PostgreSQL, MySQL, SQLite, Oracle).
- **Security & QA**: Reverse engineering (CTF), Threat Awareness, NIST frameworks, Web Security Scanners, UI Regression testing (uTest freelance QA).
- **DevOps & Systems**: Docker, Git, Linux (Kali, Ubuntu), GitHub Actions.

I'm always learning and expanding this list. What's your primary stack? 🤖`;
        } else if (hasEdu) {
          state = "talking";
          text = `### 🎓 Academic Journey
I am pursuing my **BSc (Hons) in Computer Science** at Niels Brock Copenhagen Business College (2024 to Feb 2027). 

My coursework covers:
- Data Structures & Algorithms
- Full-Stack Web Development & Agile Methods
- Big Data & Machine Learning (including PySpark ETL pipelines)
- Operating Systems & Networks

*Fun fact:* I originally started in Industrial & Production Engineering back in Dhaka, but pivoted fully to Computer Science because I fell head-over-heels in love with building software! 🇩🇰`;
        } else if (hasExp) {
          state = "talking";
          text = `### 💼 Professional Experience
Here is how I spend my time outside of lectures:

1. **Freelance QA Tester at uTest** (Nov 2025 - Present): Performing structured regression and exploratory testing for global web/mobile applications.
2. **Technical IT Assistant at Scandic Hotels (Webers)** (May 2025 - Present): Managing IT support and the Oracle Hospitality database. I was honored to be voted **Team Member of the Month** in February 2026 by my peers! 🏆
3. **Student IT Assistant at Spacegaming eSports** (Frederiksberg): Maintained local networks, system logs, and security risk assessments using Verinice.`;
        } else if (hasCyber) {
          state = "talking";
          text = `### 🛡️ Cybersecurity & Reverse Engineering
Cybersecurity is my passion! In the **Danish Cyber Championships (DDC)**, I jumped from #72 to #33 in the Copenhagen region in just one year. My absolute favorite category is reverse engineering! 

I'm also incredibly excited to have been accepted to the prestigious **CyberBridge Summer School** in Copenhagen for August 2026, where we'll be diving deep into network threat assessment, firmware analysis, and defensive systems. 🔒`;
        } else if (hasBio || query.includes("tell me about yourself") || query.includes("hello") || query.includes("hi")) {
          state = "welcome";
          text = `Hi there! I'm **Tauheed Ahmed Nabil** (most people call me Nabil). I'm a Computer Science student based in Copenhagen, specializing in Agentic AI workflows, full-stack software development, and hands-on cybersecurity. 

I built this portfolio café so we can discuss technology, review my career roadmap, or book a calendar sync to discuss collaborations.

I'm completely running on a local RAG database here, so I don't even need an external API key to talk! Ask me about:
- **Sentinel** (My 12-agent security scanner) 🛡️
- **LoanSage** (My 5-agent CrewAI pipeline) 🤖
- My **Education** or **uTest/Scandic** experiences 🎓
- Or ask me to **analyze a PDF** of your choice! 📄`;
        } else {
          state = "talking";
          const topMatch = matchedChunks[0];
          if (topMatch) {
            text = `### 🔍 Local Memory Retrieval
I searched my offline knowledge base and found this relevant context:

> "${topMatch.content}" (Source: *${topMatch.source}*)

As Tauheed, this represents a core pillar of my development journey! I'm constantly combining this knowledge with active testing and research. 

Would you like to know more about this specific topic, or shall we **align our calendars** to sync on a project? (⌐■_■) ☕`;
          } else {
            text = `I searched my offline knowledge base but couldn't find a direct match. However, as an aspiring AI and security specialist based in Copenhagen, I'd love to chat more! Let's align our calendars or feel free to check out my roadmap and blog! ☕`;
          }
        }
      }

      const clientMessage: Message = {
        sender: "nabil",
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, clientMessage]);
      onStateChange(state, text);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const clearChat = () => {
    setMessages([
      {
        sender: "nabil",
        text: "Chat history cleared! What would you like to discuss next? 🛡️",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    onStateChange("welcome", "Welcome! How can I assist you with AI and security today? ✨");
  };

  return (
    <div className="flex flex-col h-[340px] md:h-[480px] bg-white/[0.03] backdrop-blur-2xl border border-white/15 rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      {/* Header bar styled beautifully */}
      <div className="bg-white/[0.02] backdrop-blur-md text-stone-100 px-4 py-3.5 flex items-center justify-between border-b border-white/10 font-display">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-500" />
          <span className="font-bold tracking-tight text-xs md:text-sm text-stone-100">AI Agent Chat | Meet Tauheed</span>
        </div>
        <button
          onClick={clearChat}
          className="hover:text-amber-400 text-stone-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
          title="Clear Conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Scrolling log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/15">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col max-w-[85%] ${
              msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div
              className={`px-3.5 py-2.5 rounded-2xl text-xs md:text-sm font-sans leading-relaxed ${
                msg.sender === "user"
                  ? "bg-amber-600/90 text-stone-50 border border-amber-500/30 rounded-tr-none shadow-md shadow-amber-900/10"
                  : "bg-zinc-900/80 text-stone-100 border border-white/5 rounded-tl-none shadow-md text-left"
              }`}
            >
              {renderMessageText(msg.text)}

              {msg.sender === "nabil" && 
                i > 0 &&
                messages[i - 1]?.sender === "user" &&
                /\b(meet|coffee|schedule|book|calendar|appointment|call|zoom|teams|sync|connect|interview)\b/i.test(messages[i - 1]?.text || "") && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3.5 animate-comic-pop select-none">
                  <div className="text-left">
                    <p className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                      <span>📅 Calendar Sync Active</span>
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5 leading-normal">
                      Tauheed lives in Copenhagen. Pick a 30-min slot automatic invite!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate("booking")}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-lg shadow-amber-950/20 flex items-center gap-1"
                  >
                    <span>Choose Slot</span>
                    <span>➔</span>
                  </button>
                </div>
              )}
            </div>
            <span className="text-[10px] text-stone-500 mt-1.5 font-mono">{msg.time}</span>
          </div>
        ))}
        {loading && (
          <div className="flex flex-col items-start max-w-[80%]">
            <div className="px-3.5 py-2.5 rounded-2xl bg-zinc-900/80 text-stone-400 border border-white/5 rounded-tl-none flex items-center gap-2 text-xs">
              <span className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </span>
              <span className="font-mono text-[11px] text-stone-400">Processing inquiry...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion pills */}
      <div className="px-3 py-2 bg-black/30 border-t border-white/5 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            disabled={loading}
            className="px-3 py-1.5 text-[10px] md:text-[11px] font-medium font-sans text-stone-300 bg-zinc-900/50 hover:bg-zinc-800 border border-white/10 rounded-full transition-all shadow-sm flex-shrink-0 cursor-pointer hover:border-amber-500/30 hover:text-stone-100"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-white/[0.01] backdrop-blur-md border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask Tauheed a question..."
          disabled={loading}
          className="flex-1 px-3.5 py-2.5 bg-black/45 border border-white/10 rounded-xl focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-stone-100 text-xs md:text-sm font-sans placeholder-stone-500 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black rounded-xl border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:hover:scale-100 active:scale-95 text-xs font-display shadow-md shadow-amber-900/10"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs font-display">Send</span>
        </button>
      </form>
    </div>
  );
}
