import React, { useState, useEffect } from "react";
import { BlogPost, RoadmapNode, Booking, KnowledgeChunk, Settings, ParsedCV } from "../types.js";
import { Lock, Eye, EyeOff, Save, Trash2, Calendar, BookOpen, Layers, Database, Settings as SettingsIcon, LogOut, Plus, Check, X, Shield, Upload, Pencil, FileText, Loader } from "lucide-react";

export default function AdminPortal() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("nabil_admin_token"));
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<"bookings" | "posts" | "roadmap" | "knowledge" | "settings" | "resume">("bookings");

  // LaTeX Resume States
  const [latexResume, setLatexResume] = useState("");
  const [parsedCV, setParsedCV] = useState<ParsedCV | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);

  // Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Form States
  const [postForm, setPostForm] = useState({ id: "", title: "", body_md: "", tags: "", published: true, image_url: "", video_url: "" });
  const [nodeForm, setNodeForm] = useState({ id: "", parent_id: "", title: "", description: "", status: "done" as any, sort_order: 1, icon: "GraduationCap", date_label: "" });
  const [chunkForm, setChunkForm] = useState({ id: "", content: "", source: "", category: "about" as any });

  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState("");

  // Media Upload States for LinkedIn-style posts
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState("");

  // Intelligent Document RAG Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (file: File) => {
    if (!file) return;

    const validExtensions = [".pdf", ".docx", ".txt", ".md"];
    const fileNameLower = file.name.toLowerCase();
    const isValidExt = validExtensions.some(ext => fileNameLower.endsWith(ext));

    if (!isValidExt) {
      setUploadError("Invalid file type. Please upload a PDF, DOCX, TXT, or MD file.");
      setUploadSuccess("");
      return;
    }

    setUploadError("");
    setUploadSuccess("");
    setIsUploading(true);
    setActionStatus(`Reading ${file.name}...`);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64WithMime = e.target?.result as string;
        if (!base64WithMime) {
          throw new Error("Failed to read file.");
        }

        const base64Data = base64WithMime.split(",")[1];
        let mimeType = file.type;
        if (!mimeType) {
          if (fileNameLower.endsWith(".docx")) {
            mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          } else if (fileNameLower.endsWith(".pdf")) {
            mimeType = "application/pdf";
          } else {
            mimeType = "text/plain";
          }
        }

        setActionStatus(`Parsing ${file.name} with Gemini...`);

        const res = await fetch("/api/admin/parse-document", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            base64Data,
            mimeType,
            fileName: file.name
          })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setUploadSuccess(data.message);
          setActionStatus("Document parsed successfully!");
          loadAdminData();
        } else {
          setUploadError(data.error || "Failed to process the document.");
          setActionStatus("Parsing failed.");
        }
      } catch (err: any) {
        console.error(err);
        setUploadError(err.message || "Error reading file.");
        setActionStatus("Parsing failed.");
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError("Error reading file.");
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleMediaUpload = async (file: File) => {
    if (!file) return;
    setIsMediaUploading(true);
    setMediaUploadError("");
    setActionStatus(`Uploading ${file.name}...`);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64WithMime = e.target?.result as string;
        if (!base64WithMime) {
          throw new Error("Failed to read media file.");
        }
        const base64Data = base64WithMime.split(",")[1];
        const res = await fetch("/api/admin/upload-media", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            base64Data,
            mimeType: file.type,
            fileName: file.name
          })
        });

        const data = await res.json();
        if (res.ok && data.url) {
          setActionStatus("Media file uploaded successfully! 📁");
          if (file.type.startsWith("video/")) {
            setPostForm(prev => ({ ...prev, video_url: data.url, image_url: "" }));
          } else {
            setPostForm(prev => ({ ...prev, image_url: data.url, video_url: "" }));
          }
        } else {
          setMediaUploadError(data.error || "Failed to upload media file.");
          setActionStatus("Upload failed.");
        }
      } catch (err: any) {
        setMediaUploadError(err.message || "Error uploading file.");
        setActionStatus("Upload failed.");
      } finally {
        setIsMediaUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    // Check if the server already has an active, valid session cookie on mount
    const verifyServerSession = async () => {
      try {
        const res = await fetch("/api/auth/check");
        if (res.ok) {
          const data = await res.json();
          if (data.isAdmin && data.token) {
            setToken(data.token);
            localStorage.setItem("nabil_admin_token", data.token);
          } else {
            // Server session is invalid/expired; clear local token
            setToken(null);
            localStorage.removeItem("nabil_admin_token");
          }
        }
      } catch (err) {
        console.error("Failed to verify server session:", err);
      }
    };

    verifyServerSession();
  }, []);

  useEffect(() => {
    if (token) {
      loadAdminData();
    }
  }, [token]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch bookings
      const bRes = await fetch("/api/bookings", { headers });
      if (bRes.ok) setBookings(await bRes.json());

      // Fetch posts (include drafts)
      const pRes = await fetch("/api/posts", { headers });
      if (pRes.ok) setPosts(await pRes.json());

      // Fetch roadmap nodes
      const rRes = await fetch("/api/roadmap", { headers });
      if (rRes.ok) setNodes(await rRes.json());

      // Fetch knowledge chunks
      const kRes = await fetch("/api/knowledge", { headers });
      if (kRes.ok) setChunks(await kRes.json());

      // Fetch settings
      const sRes = await fetch("/api/settings");
      if (sRes.ok) setSettings(await sRes.json());

      // Fetch LaTeX Resume and Parsed CV
      const lRes = await fetch("/api/admin/latex", { headers });
      if (lRes.ok) {
        const lData = await lRes.json();
        setLatexResume(lData.latex_resume || "");
        setParsedCV(lData.parsed_cv || null);
      }
    } catch (err) {
      console.error(err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("nabil_admin_token", data.token);
        setToken(data.token);
        setPassword("");
      } else {
        const errData = await res.json();
        setLoginError(errData.error || "Login failed");
      }
    } catch (err) {
      setLoginError("Could not connect to authentication server.");
    }
  };

  const handleLogout = () => {
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem("nabil_admin_token");
    setToken(null);
  };

  // Booking Actions
  const handleBookingAction = async (id: string, status: "confirmed" | "declined") => {
    setActionStatus("Updating...");
    try {
      const res = await fetch(`/api/admin/bookings/${id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setActionStatus("Status updated! ☕");
        loadAdminData();
      }
    } catch (err) {
      setActionStatus("Action failed");
    }
  };

  // Blog Post Actions
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionStatus("Saving post...");
    try {
      const tagsArray = postForm.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const payload = {
        ...postForm,
        tags: tagsArray,
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setActionStatus("Post saved successfully! 📝");
        setPostForm({ id: "", title: "", body_md: "", tags: "", published: true, image_url: "", video_url: "" });
        loadAdminData();
      }
    } catch (err) {
      setActionStatus("Failed to save post");
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this thought notebook?")) return;
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Roadmap Actions
  const handleSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionStatus("Saving roadmap node...");
    try {
      const payload = {
        ...nodeForm,
        parent_id: nodeForm.parent_id === "none" ? null : nodeForm.parent_id,
        sort_order: Number(nodeForm.sort_order),
      };

      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setActionStatus("Milestone saved! 🛤️");
        setNodeForm({ id: "", parent_id: "", title: "", description: "", status: "done", sort_order: 1, icon: "GraduationCap", date_label: "" });
        loadAdminData();
      }
    } catch (err) {
      setActionStatus("Failed to save node");
    }
  };

  const handleDeleteNode = async (id: string) => {
    if (!confirm("Warning: Deleting a roadmap milestone will recursively remove all its sub-goals! Proceed?")) return;
    try {
      const res = await fetch(`/api/roadmap/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Knowledge RAG Actions
  const handleAddChunk = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionStatus(chunkForm.id ? "Updating context..." : "Adding context...");
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(chunkForm),
      });

      if (res.ok) {
        setActionStatus(chunkForm.id ? "Knowledge chunk updated! 📚" : "Knowledge chunk added! 📚");
        setChunkForm({ id: "", content: "", source: "", category: "about" });
        loadAdminData();
      }
    } catch (err) {
      setActionStatus("Failed to save chunk");
    }
  };

  const handleDeleteChunk = async (id: string) => {
    if (!confirm("Are you sure you want to remove this context block?")) return;
    try {
      const res = await fetch(`/api/knowledge/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Settings Actions
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setActionStatus("Saving settings...");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setActionStatus("Café configurations updated! ☕");
        loadAdminData();
      }
    } catch (err) {
      setActionStatus("Failed to save settings");
    }
  };

  // Render Login screen if not authenticated
  if (!token) {
    return (
      <div className="max-w-md mx-auto bg-white/[0.03] backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] flex flex-col justify-center items-center mt-12 font-sans text-stone-100">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold font-display text-stone-50">Nabil's Command Center</h2>
        <p className="text-xs text-stone-400 mt-1 mb-6 text-center">
          Enter your admin password to manage booking requests, blog posts, RAG, and roadmap layers.
        </p>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-3 text-stone-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password (default: nabil123)"
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl focus:border-amber-500/50 focus:outline-none text-xs md:text-sm text-stone-100"
            />
          </div>

          {loginError && (
            <p className="text-xs text-red-400 font-medium font-mono text-center">
              ⚠️ {loginError}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black rounded-xl transition-all cursor-pointer font-display text-sm"
          >
            Authenticate Portal
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/15 rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.35)] font-sans text-stone-100">
      {/* Header bar */}
      <div className="bg-white/[0.02] backdrop-blur-md text-white px-6 py-4 flex items-center justify-between border-b border-white/10 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <h1 className="text-lg md:text-xl font-bold font-display">Command Center</h1>
        </div>

        <div className="flex items-center gap-3">
          {actionStatus && (
            <span className="text-xs text-amber-300 font-mono font-medium animate-pulse">
              {actionStatus}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-800 hover:bg-red-900 text-xs font-bold font-display text-white border border-red-950 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-black/20 border-b border-white/10 flex overflow-x-auto scrollbar-none font-mono text-xs">
        {[
          { key: "bookings", label: "☕ Bookings", icon: Calendar },
          { key: "posts", label: "📝 Blog Posts", icon: BookOpen },
          { key: "roadmap", label: "🛤️ Roadmap", icon: Layers },
          { key: "knowledge", label: "📚 RAG Brain", icon: Database },
          { key: "resume", label: "📄 Latest Resume", icon: FileText },
          { key: "settings", label: "⚙️ Settings", icon: SettingsIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                setActionStatus("");
              }}
              className={`px-4 py-3 font-bold border-r border-white/10 transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? "bg-white/[0.04] text-amber-400 border-b-2 border-b-amber-500"
                  : "text-stone-400 hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab Workspace */}
      <div className="p-6 bg-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-stone-400">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span>Syncing database...</span>
          </div>
        ) : (
          <div>
            {/* BOOKINGS TAB */}
            {activeTab === "bookings" && (
              <div className="space-y-6 animate-comic-pop">
                <div className="border-b border-cafe-200 pb-3">
                  <h2 className="text-base md:text-lg font-bold font-display text-cafe-900">Virtual Coffee Requests</h2>
                  <p className="text-xs text-cafe-600 mt-0.5">Approve and track virtual coffee and in-person bookings from recruiters or partners.</p>
                </div>

                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`border-2 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm ${
                          booking.status === "pending"
                            ? "bg-amber-50/50 border-amber-300"
                            : booking.status === "confirmed"
                            ? "bg-green-50/40 border-green-200"
                            : "bg-zinc-50 border-zinc-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold font-display text-cafe-950">{booking.visitor_name}</span>
                            <span className="text-[10px] font-mono text-zinc-500">({booking.visitor_email})</span>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                              booking.status === "pending"
                                ? "bg-amber-400 text-amber-950"
                                : booking.status === "confirmed"
                                ? "bg-green-500 text-white"
                                : "bg-zinc-300 text-zinc-600"
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-cafe-700">
                            🕒 {new Date(booking.start_ts).toLocaleString()} ({booking.mode})
                          </p>
                          {booking.note && (
                            <p className="text-xs text-zinc-600 mt-2 bg-white border border-zinc-100 p-2 rounded italic">
                              "{booking.note}"
                            </p>
                          )}
                        </div>

                        {booking.status === "pending" && (
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              onClick={() => handleBookingAction(booking.id, "confirmed")}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold border border-green-800 rounded-lg px-2.5 py-1.5 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleBookingAction(booking.id, "declined")}
                              className="bg-red-800 hover:bg-red-900 text-white font-bold border border-red-950 rounded-lg px-2.5 py-1.5 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-cafe-400 border-2 border-dashed border-cafe-200 rounded-xl">
                    No bookings logged yet. Your calendar is clear! ☕
                  </div>
                )}
              </div>
            )}

            {/* BLOG POSTS TAB */}
            {activeTab === "posts" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-comic-pop">
                {/* Form column */}
                <form onSubmit={handleSavePost} className="lg:col-span-1 space-y-4 bg-cafe-50/50 border border-cafe-200 p-4 rounded-xl">
                  <h3 className="text-xs font-bold font-mono text-cafe-900 uppercase border-b border-cafe-200 pb-1.5">
                    {postForm.id ? "Edit LinkedIn-Style Post" : "Write LinkedIn-Style Post"}
                  </h3>

                  <div>
                    <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Title / Heading</label>
                    <input
                      type="text"
                      required
                      value={postForm.title}
                      onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                      placeholder="e.g. Building Multi-Agent Crew"
                      className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={postForm.tags}
                      onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                      placeholder="AI Agents, Python, CrewAI"
                      className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Body (Markdown support)</label>
                    <textarea
                      required
                      rows={8}
                      value={postForm.body_md}
                      onChange={(e) => setPostForm({ ...postForm, body_md: e.target.value })}
                      placeholder="### Header\nUse standard markdown formatting here..."
                      className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-mono resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Media Attachment (Photo or Video)</label>
                    
                    {/* Upload Drag/Drop & Select Area */}
                    <div className="border border-dashed border-cafe-300 rounded-lg p-3 bg-white/50 text-center relative hover:bg-cafe-100/40 transition-colors">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleMediaUpload(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isMediaUploading}
                      />
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <Upload className="w-4 h-4 text-cafe-500" />
                        <p className="text-[10px] text-cafe-600 font-medium">
                          {isMediaUploading ? "Uploading file..." : "Click to attach photo or video"}
                        </p>
                        <p className="text-[9px] text-zinc-400">Supports PNG, JPG, MP4, WebM (max 50MB)</p>
                      </div>
                    </div>

                    {mediaUploadError && (
                      <p className="text-[10px] text-red-500 mt-1 font-mono">{mediaUploadError}</p>
                    )}

                    {/* Previews and file controls */}
                    {(postForm.image_url || postForm.video_url) && (
                      <div className="mt-2.5 border border-cafe-200 rounded-lg p-2 bg-white flex flex-col space-y-1.5 relative">
                        <span className="text-[9px] font-mono font-bold text-cafe-700 uppercase">Attached Media Preview:</span>
                        
                        {postForm.image_url && (
                          <img
                            src={postForm.image_url}
                            alt="Upload preview"
                            className="max-h-24 w-full object-cover rounded border border-zinc-100"
                            referrerPolicy="no-referrer"
                          />
                        )}

                        {postForm.video_url && (
                          <video
                            src={postForm.video_url}
                            controls
                            className="max-h-24 w-full rounded border border-zinc-100"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => setPostForm(prev => ({ ...prev, image_url: "", video_url: "" }))}
                          className="text-[9px] font-bold text-red-600 hover:underline flex items-center justify-center gap-0.5 mt-1 cursor-pointer self-end"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Attachment
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="published"
                      checked={postForm.published}
                      onChange={(e) => setPostForm({ ...postForm, published: e.target.checked })}
                    />
                    <label htmlFor="published" className="text-xs font-medium text-cafe-800">Publish Immediately</label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-cafe-700 text-white font-bold rounded-lg hover:bg-cafe-800 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Post
                  </button>
                  {postForm.id && (
                    <button
                      type="button"
                      onClick={() => setPostForm({ id: "", title: "", body_md: "", tags: "", published: true, image_url: "", video_url: "" })}
                      className="w-full py-1 text-[11px] text-cafe-500 font-bold hover:underline"
                    >
                      Cancel Editing
                    </button>
                  )}
                </form>

                {/* List column */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold font-mono text-cafe-900 uppercase">Existing Posts ({posts.length})</h3>
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div key={post.id} className="border border-cafe-200 bg-white p-4 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-cafe-950 font-display truncate">{post.title}</h4>
                          <div className="flex gap-1 flex-wrap mt-1 items-center">
                            {post.tags.map((t) => (
                              <span key={t} className="text-[9px] font-mono bg-cafe-100 text-cafe-600 px-1.5 py-0.2 rounded">
                                #{t}
                              </span>
                            ))}
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded text-white font-bold ml-2 ${post.published ? "bg-green-500" : "bg-zinc-400"}`}>
                              {post.published ? "Published" : "Draft"}
                            </span>
                            {(post.image_url || post.video_url) && (
                              <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold ml-1.5 flex items-center gap-0.5">
                                📎 {post.video_url ? "Video" : "Photo"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPostForm({
                              id: post.id,
                              title: post.title,
                              body_md: post.body_md,
                              tags: post.tags.join(", "),
                              published: post.published,
                              image_url: post.image_url || "",
                              video_url: post.video_url || ""
                            })}
                            className="p-1 bg-zinc-100 border border-zinc-200 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-800 rounded cursor-pointer"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:text-red-800 rounded cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ROADMAP TAB */}
            {activeTab === "roadmap" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-comic-pop">
                {/* Form column */}
                <form onSubmit={handleSaveNode} className="lg:col-span-1 space-y-4 bg-cafe-50/50 border border-cafe-200 p-4 rounded-xl">
                  <h3 className="text-xs font-bold font-mono text-cafe-900 uppercase border-b border-cafe-200 pb-1.5">
                    {nodeForm.id ? "Edit Milestone" : "Add Journey Milestone"}
                  </h3>

                  <div>
                    <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Parent Milestone (Optional)</label>
                    <select
                      value={nodeForm.parent_id || "none"}
                      onChange={(e) => setNodeForm({ ...nodeForm, parent_id: e.target.value })}
                      className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-sans"
                    >
                      <option value="none">None (Root Level Chapter)</option>
                      {nodes.filter((n) => !n.parent_id).map((n) => (
                        <option key={n.id} value={n.id}>{n.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Title</label>
                    <input
                      type="text"
                      required
                      value={nodeForm.title}
                      onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })}
                      placeholder="e.g. CyberBridge Academy"
                      className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Date Label</label>
                    <input
                      type="text"
                      required
                      value={nodeForm.date_label}
                      onChange={(e) => setNodeForm({ ...nodeForm, date_label: e.target.value })}
                      placeholder="e.g. August 2026"
                      className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Description</label>
                    <textarea
                      required
                      rows={3}
                      value={nodeForm.description}
                      onChange={(e) => setNodeForm({ ...nodeForm, description: e.target.value })}
                      placeholder="Brief details about what was accomplished or planned..."
                      className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-sans resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Status</label>
                      <select
                        value={nodeForm.status}
                        onChange={(e) => setNodeForm({ ...nodeForm, status: e.target.value as any })}
                        className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-sans"
                      >
                        <option value="done">✅ Done</option>
                        <option value="in_progress">🔄 In Progress</option>
                        <option value="planned">🔒 Planned</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Sort Order</label>
                      <input
                        type="number"
                        required
                        value={nodeForm.sort_order}
                        onChange={(e) => setNodeForm({ ...nodeForm, sort_order: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Visual Icon</label>
                    <select
                      value={nodeForm.icon}
                      onChange={(e) => setNodeForm({ ...nodeForm, icon: e.target.value })}
                      className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-sans"
                    >
                      <option value="GraduationCap">GraduationCap 🎓</option>
                      <option value="Briefcase">Briefcase 💼</option>
                      <option value="MapPin">MapPin 📍</option>
                      <option value="Sparkles">Sparkles ✨</option>
                      <option value="BookOpen">BookOpen 📖</option>
                      <option value="Layers">Layers 🗂️</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-cafe-700 text-white font-bold rounded-lg hover:bg-cafe-800 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Node
                  </button>
                  {nodeForm.id && (
                    <button
                      type="button"
                      onClick={() => setNodeForm({ id: "", parent_id: "", title: "", description: "", status: "done", sort_order: 1, icon: "GraduationCap", date_label: "" })}
                      className="w-full py-1 text-[11px] text-cafe-500 font-bold hover:underline"
                    >
                      Cancel Editing
                    </button>
                  )}
                </form>

                {/* Tree column */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold font-mono text-cafe-900 uppercase">Tree Architecture ({nodes.length} nodes)</h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto border border-cafe-100 p-2 rounded-xl bg-white">
                    {/* Filter root level nodes */}
                    {nodes.filter((n) => !n.parent_id).sort((a,b) => a.sort_order - b.sort_order).map((root) => {
                      const children = nodes.filter((n) => n.parent_id === root.id).sort((a,b) => a.sort_order - b.sort_order);
                      return (
                        <div key={root.id} className="border-2 border-cafe-200 rounded-xl p-3 bg-cafe-50/30">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-cafe-900 flex items-center gap-1">
                              📁 <strong className="font-display">{root.title}</strong>
                              <span className="text-[10px] font-mono text-zinc-400">({root.date_label}, order: {root.sort_order})</span>
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setNodeForm({
                                  id: root.id,
                                  parent_id: "none",
                                  title: root.title,
                                  description: root.description,
                                  status: root.status,
                                  sort_order: root.sort_order,
                                  icon: root.icon,
                                  date_label: root.date_label
                                })}
                                className="px-1 text-xs hover:bg-zinc-200 rounded cursor-pointer"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteNode(root.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Children listing */}
                          {children.length > 0 && (
                            <div className="mt-2.5 pl-6 border-l-2 border-dashed border-cafe-200 space-y-2">
                              {children.map((child) => (
                                <div key={child.id} className="text-xs text-zinc-700 flex items-center justify-between border-b border-zinc-100 pb-1">
                                  <span>↳ {child.title} <span className="text-[9px] text-zinc-400">({child.status})</span></span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setNodeForm({
                                        id: child.id,
                                        parent_id: root.id,
                                        title: child.title,
                                        description: child.description,
                                        status: child.status,
                                        sort_order: child.sort_order,
                                        icon: child.icon,
                                        date_label: child.date_label
                                      })}
                                      className="px-1 text-[10px] hover:bg-zinc-200 rounded cursor-pointer"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteNode(child.id)}
                                      className="p-0.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* RAG BRAIN TAB */}
            {activeTab === "knowledge" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-comic-pop">
                {/* Form and Uploader column */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Instant RAG Document Parser Card */}
                  <div className="bg-cafe-50/50 border border-cafe-200 p-4 rounded-xl space-y-4 shadow-sm">
                    <div className="border-b border-cafe-200 pb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold font-mono text-cafe-900 uppercase flex items-center gap-1.5">
                        <span>Instant RAG Upload 📄</span>
                      </h3>
                      <span className="text-[9px] font-bold font-mono bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md border border-amber-500/20 uppercase">
                        AI Powered
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-cafe-700 leading-normal font-sans">
                      Upload a detailed <strong>PDF</strong>, <strong>Word file (.docx)</strong>, <strong>Text file (.txt)</strong>, or <strong>Markdown file (.md)</strong> containing resume data, project sheets, or customized instructions. Gemini will parse, format, and save the data as searchable context instantly.
                    </p>

                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        dragActive
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-cafe-300 hover:border-cafe-400 bg-white/40"
                      }`}
                    >
                      <input
                        type="file"
                        id="rag-file-input"
                        className="hidden"
                        accept=".pdf,.docx,.txt,.md"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange(e.target.files[0]);
                          }
                        }}
                        disabled={isUploading}
                      />
                      
                      <label htmlFor="rag-file-input" className="cursor-pointer flex flex-col items-center w-full">
                        {uploadSuccess ? (
                          <div className="flex flex-col items-center animate-comic-pop text-emerald-600 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30 w-full">
                            <Check className="w-10 h-10 mb-2 stroke-[3] text-emerald-600 bg-white rounded-full p-1.5 shadow-sm" />
                            <span className="text-xs font-extrabold font-sans">
                              Upload Completed! 🎉
                            </span>
                            <span className="text-[10px] text-emerald-700 mt-1 font-sans font-semibold max-w-xs break-words">
                              {uploadSuccess}
                            </span>
                            <span className="text-[9px] text-emerald-600 mt-2 underline font-sans font-bold">
                              Click or drop another file to add more
                            </span>
                          </div>
                        ) : (
                          <>
                            <Upload className={`w-8 h-8 mb-2 ${isUploading ? "text-amber-500 animate-bounce" : "text-cafe-600"}`} />
                            <span className="text-xs font-bold text-cafe-900 font-sans">
                              {isUploading ? "Processing Document..." : "Drag & Drop file here"}
                            </span>
                            <span className="text-[10px] text-cafe-600 mt-1 font-mono">
                              Supports PDF, DOCX, TXT, or MD
                            </span>
                          </>
                        )}
                      </label>
                    </div>

                    {isUploading && (
                      <div className="text-center py-2 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                        <span className="text-[10px] font-mono text-amber-600 animate-pulse font-bold">
                          Gemini extracting & segmenting text...
                        </span>
                      </div>
                    )}

                    {uploadError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg text-[10px] font-mono leading-relaxed">
                        ⚠️ {uploadError}
                      </div>
                    )}

                    {uploadSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-700 p-2.5 rounded-lg text-[10px] font-sans leading-relaxed font-semibold">
                        🎉 {uploadSuccess}
                      </div>
                    )}
                  </div>

                  {/* Manual entry block */}
                  <form onSubmit={handleAddChunk} className="space-y-4 bg-cafe-50/50 border border-cafe-200 p-4 rounded-xl shadow-sm">
                    <div className="border-b border-cafe-200 pb-1.5 flex items-center justify-between">
                      <h3 className="text-xs font-bold font-mono text-cafe-900 uppercase">
                        {chunkForm.id ? "Edit Context Block ✏️" : "Add Context Block Manually"}
                      </h3>
                      {chunkForm.id && (
                        <span className="text-[9px] font-bold font-mono bg-amber-500/15 text-amber-700 px-2 py-0.5 rounded border border-amber-500/25 animate-pulse">
                          EDITING MODE
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Category</label>
                      <select
                        value={chunkForm.category}
                        onChange={(e) => setChunkForm({ ...chunkForm, category: e.target.value as any })}
                        className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-sans"
                      >
                        <option value="about">About Nabil 🧑</option>
                        <option value="education">Education 🎓</option>
                        <option value="skills">Skills 💻</option>
                        <option value="projects">Projects 🛠️</option>
                        <option value="experience">Experience 💼</option>
                        <option value="faq">FAQ / Certifications 📖</option>
                        <option value="other">Other ☕</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Source Label</label>
                      <input
                        type="text"
                        required
                        value={chunkForm.source}
                        onChange={(e) => setChunkForm({ ...chunkForm, source: e.target.value })}
                        placeholder="e.g. CV Certifications Section"
                        className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Content Text Block</label>
                      <textarea
                        required
                        rows={5}
                        value={chunkForm.content}
                        onChange={(e) => setChunkForm({ ...chunkForm, content: e.target.value })}
                        placeholder="Paste detailed biography, skills details or FAQ answers..."
                        className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-sans resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <button
                        type="submit"
                        className="w-full py-2 bg-cafe-700 text-white font-bold rounded-lg hover:bg-cafe-800 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {chunkForm.id ? (
                          <>
                            <Save className="w-4 h-4" /> Save Changes
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" /> Add to Brain
                          </>
                        )}
                      </button>

                      {chunkForm.id && (
                        <button
                          type="button"
                          onClick={() => setChunkForm({ id: "", content: "", source: "", category: "about" })}
                          className="w-full py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer text-center"
                        >
                          Cancel Editing
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List column */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold font-mono text-cafe-900 uppercase">Chatbot Knowledge Base Chunks ({chunks.length})</h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto border border-cafe-100 p-2 rounded-xl bg-white">
                    {chunks.map((chunk) => (
                      <div key={chunk.id} className={`border p-3.5 rounded-lg text-xs flex justify-between items-start gap-4 hover:bg-cafe-50/40 transition-all ${chunkForm.id === chunk.id ? "border-amber-400 bg-amber-500/[0.04]" : "border-cafe-150"}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-mono bg-cafe-700 text-white px-2 py-0.2 rounded font-bold uppercase">{chunk.category}</span>
                            <span className="text-[10px] font-mono font-bold text-cafe-600">Source: {chunk.source}</span>
                          </div>
                          <p className="text-zinc-700 leading-relaxed mt-1.5">{chunk.content}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setChunkForm({ id: chunk.id, content: chunk.content, source: chunk.source, category: chunk.category })}
                            title="Edit this chunk"
                            className="p-1 text-cafe-700 hover:bg-cafe-100 rounded cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteChunk(chunk.id)}
                            title="Delete this chunk"
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && settings && (
              <form onSubmit={handleSaveSettings} className="max-w-xl mx-auto space-y-4 bg-cafe-50/50 border border-cafe-200 p-6 rounded-xl animate-comic-pop">
                <div className="border-b border-cafe-200 pb-2 mb-4">
                  <h3 className="text-sm font-bold font-display text-cafe-900">Availability & Config settings</h3>
                  <p className="text-xs text-cafe-600">Configure business hours and calendar timezone details.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Working Hours Start</label>
                    <input
                      type="text"
                      required
                      value={settings.availabilityHoursStart}
                      onChange={(e) => setSettings({ ...settings, availabilityHoursStart: e.target.value })}
                      placeholder="10:00"
                      className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Working Hours End</label>
                    <input
                      type="text"
                      required
                      value={settings.availabilityHoursEnd}
                      onChange={(e) => setSettings({ ...settings, availabilityHoursEnd: e.target.value })}
                      placeholder="18:00"
                      className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Timezone Location</label>
                  <input
                    type="text"
                    required
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Nabil's Personal Email</label>
                  <input
                    type="email"
                    required
                    value={settings.myEmail}
                    onChange={(e) => setSettings({ ...settings, myEmail: e.target.value })}
                    className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">In-Person Meet location text</label>
                  <input
                    type="text"
                    required
                    value={settings.inPersonLocation}
                    onChange={(e) => setSettings({ ...settings, inPersonLocation: e.target.value })}
                    className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-cafe-700 text-white font-bold border-2 border-cafe-800 rounded-xl hover:bg-cafe-800 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Settings
                </button>
              </form>
            )}

            {/* RESUME TAB */}
            {activeTab === "resume" && (
              <div className="space-y-6 animate-comic-pop">
                <div className="border-b border-white/10 pb-3">
                  <h2 className="text-base md:text-lg font-bold font-display text-amber-400">Latest Resume (LaTeX Format)</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Paste or edit your professional LaTeX formatted CV resume code below. Gemini will parse it using structured schema constraints to automatically update the print-ready CV sheet view.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: LaTeX Editor */}
                  <div className="space-y-4">
                    <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-300 font-mono flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-amber-500" /> LaTeX Source Code
                        </label>
                        <span className="text-[10px] font-mono text-stone-500">Auto-updates Portfolio CV</span>
                      </div>
                      
                      <textarea
                        rows={18}
                        value={latexResume}
                        onChange={(e) => setLatexResume(e.target.value)}
                        placeholder="% Paste your professional LaTeX document here..."
                        className="w-full font-mono text-xs p-4 bg-zinc-950/80 border border-white/10 rounded-xl focus:border-amber-500/50 focus:outline-none text-stone-100 placeholder-stone-600 leading-relaxed resize-y min-h-[350px]"
                      />

                      <div className="flex items-center justify-between gap-4 pt-1.5 font-mono text-xs">
                        <button
                          type="button"
                          disabled={isParsingResume}
                          onClick={async () => {
                            if (!latexResume.trim()) {
                              setActionStatus("Please enter LaTeX resume code.");
                              return;
                            }
                            setIsParsingResume(true);
                            setActionStatus("Parsing LaTeX with Gemini...");
                            try {
                              const res = await fetch("/api/admin/latex", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify({ latex_resume: latexResume })
                              });

                              if (res.ok) {
                                const data = await res.json();
                                setParsedCV(data.parsed_cv);
                                setActionStatus("LaTeX resume parsed successfully! 🎉");
                                loadAdminData();
                              } else {
                                const err = await res.json();
                                setActionStatus(`Failed: ${err.error || "Unknown error"}`);
                              }
                            } catch (e) {
                              setActionStatus("Network error parsing LaTeX resume.");
                            } finally {
                              setIsParsingResume(false);
                            }
                          }}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 text-stone-950 font-black rounded-xl transition-all cursor-pointer font-display text-xs flex items-center gap-1.5"
                        >
                          {isParsingResume ? (
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>Parse & Sync LaTeX Resume</span>
                        </button>

                        {actionStatus && (
                          <span className="text-[11px] text-amber-500 text-right animate-pulse max-w-[200px] truncate">
                            {actionStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live parsed data preview */}
                  <div className="space-y-4">
                    <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-bold text-stone-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-500" /> Extracted Structured Preview
                      </h3>

                      {parsedCV ? (
                        <div className="space-y-4.5 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin text-xs text-stone-300">
                          <div className="border-b border-white/5 pb-3">
                            <div className="font-bold text-stone-50 text-sm">{parsedCV.name}</div>
                            <div className="text-amber-500 font-medium text-[11px]">{parsedCV.title}</div>
                            <div className="text-stone-400 text-[10px] font-mono mt-1 flex flex-wrap gap-2">
                              <span>📍 {parsedCV.location}</span>
                              <span>✉️ {parsedCV.email}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="font-bold text-stone-200 uppercase font-mono text-[9px] tracking-wider text-amber-500/85">Professional Summary</div>
                            <p className="text-stone-300 text-[11px] leading-relaxed">{parsedCV.summary}</p>
                          </div>

                          <div className="space-y-1">
                            <div className="font-bold text-stone-200 uppercase font-mono text-[9px] tracking-wider text-amber-500/85">Technical Skills</div>
                            <div className="space-y-1.5 pl-2 text-[11px] text-stone-300">
                              <div><strong className="text-stone-400 font-mono">AI & Automation:</strong> {parsedCV.skills.ai_automation}</div>
                              <div><strong className="text-stone-400 font-mono">Programming Languages:</strong> {parsedCV.skills.programming_languages}</div>
                              <div><strong className="text-stone-400 font-mono">Security & QA:</strong> {parsedCV.skills.security_qa}</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="font-bold text-stone-200 uppercase font-mono text-[9px] tracking-wider text-amber-500/85">Parsed Projects ({parsedCV.projects?.length || 0})</div>
                            <div className="space-y-2 pl-2">
                              {parsedCV.projects?.map((proj, i) => (
                                <div key={i} className="border-l-2 border-amber-500/30 pl-2">
                                  <div className="font-bold text-stone-200">{proj.title} <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded ml-1">{proj.status}</span></div>
                                  <div className="text-[11px] text-stone-300 mt-0.5 leading-relaxed">{proj.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="font-bold text-stone-200 uppercase font-mono text-[9px] tracking-wider text-amber-500/85">Parsed Work History ({parsedCV.experience?.length || 0})</div>
                            <div className="space-y-2 pl-2">
                              {parsedCV.experience?.map((exp, i) => (
                                <div key={i} className="border-l-2 border-blue-500/30 pl-2">
                                  <div className="font-bold text-stone-200">{exp.title}</div>
                                  <div className="text-[10px] text-stone-400">{exp.company} | <span className="font-mono text-amber-500">{exp.date}</span></div>
                                  <div className="text-[11px] text-stone-300 mt-0.5 leading-relaxed">{exp.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="font-bold text-stone-200 uppercase font-mono text-[9px] tracking-wider text-amber-500/85">Education & Achievements</div>
                            <div className="space-y-2 pl-2">
                              {parsedCV.education?.map((edu, i) => (
                                <div key={i} className="text-[11px] text-stone-300">
                                  <strong>{edu.degree}</strong> - <span className="text-stone-400">{edu.school}</span> ({edu.date})
                                </div>
                              ))}
                              {parsedCV.achievements?.map((ach, i) => (
                                <div key={i} className="text-[11px] text-stone-300 flex items-start gap-1">
                                  <span>🏆</span>
                                  <span>{ach}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-stone-500 border border-dashed border-white/5 rounded-xl">
                          <FileText className="w-8 h-8 text-stone-600 mb-2" />
                          <span className="text-xs">No LaTeX parsed resume found.</span>
                          <span className="text-[10px] text-stone-600 mt-1">Paste LaTeX on the left and parse to update.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
