import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MessageSquare, RefreshCw, AlertCircle, Paperclip, FileText } from "lucide-react";
import { SceneState } from "../types.js";

interface ChatPanelProps {
  onStateChange: (state: SceneState, text: string) => void;
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

export default function ChatPanel({ onStateChange }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "nabil",
      text: "Hello! Welcome to my professional workspace. I'm Tauheed Ahmed Nabil! 🛡️ Ask me anything about my AI multi-agent pipelines, cybersecurity scanners (like Sentinel), or reverse engineering projects, or schedule a meeting right here! (⌐■_■)",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      console.error(error);
      const errorMessage: Message = {
        sender: "nabil",
        text: "Oops! My local server had a temporary spill! 😅 Let's try that again. Or feel free to check out my study roadmap or book a meeting!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
      onStateChange("confused", errorMessage.text);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf") && file.type !== "application/pdf") {
      alert("Please upload a valid PDF document. (⌐■_■)");
      return;
    }

    // Trigger local character analysis with the PDF file name
    handleSend(`Analyze my PDF resume: ${file.name}`, file.name);
    
    // Reset file input value so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        {QUICK_SUGGESTIONS.map((s, idx) => (
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
        {/* Hidden File Input for PDF */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handlePdfUpload}
          accept=".pdf"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="px-3 bg-zinc-900 hover:bg-zinc-850 text-stone-300 hover:text-amber-400 border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
          title="Submit PDF resume/document (⌐■_■)"
        >
          <Paperclip className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-display">PDF</span>
        </button>

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
