import React, { useState, useEffect } from "react";
import { BlogPost, RoadmapNode, Booking, KnowledgeChunk, Settings } from "../types.js";
import { Lock, Eye, EyeOff, Save, Trash2, Calendar, BookOpen, Layers, Database, Settings as SettingsIcon, LogOut, Plus, Check, X, Shield } from "lucide-react";

export default function AdminPortal() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("nabil_admin_token"));
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<"bookings" | "posts" | "roadmap" | "knowledge" | "settings">("bookings");

  // Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Form States
  const [postForm, setPostForm] = useState({ id: "", title: "", body_md: "", tags: "", published: true });
  const [nodeForm, setNodeForm] = useState({ id: "", parent_id: "", title: "", description: "", status: "done" as any, sort_order: 1, icon: "GraduationCap", date_label: "" });
  const [chunkForm, setChunkForm] = useState({ content: "", source: "", category: "about" as any });

  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState("");

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
        setPostForm({ id: "", title: "", body_md: "", tags: "", published: true });
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
    setActionStatus("Adding context...");
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
        setActionStatus("Knowledge chunk added! 📚");
        setChunkForm({ content: "", source: "", category: "about" });
        loadAdminData();
      }
    } catch (err) {
      setActionStatus("Failed to add chunk");
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
                    {postForm.id ? "Edit Notebook" : "Write New Notebook"}
                  </h3>

                  <div>
                    <label className="block text-[11px] font-bold text-cafe-700 mb-1 font-mono uppercase">Title</label>
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
                      onClick={() => setPostForm({ id: "", title: "", body_md: "", tags: "", published: true })}
                      className="w-full py-1 text-[11px] text-cafe-500 font-bold hover:underline"
                    >
                      Cancel Editing
                    </button>
                  )}
                </form>

                {/* List column */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold font-mono text-cafe-900 uppercase">Existing Thoughts ({posts.length})</h3>
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div key={post.id} className="border border-cafe-200 bg-white p-4 rounded-xl flex items-center justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-cafe-950 font-display">{post.title}</h4>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {post.tags.map((t) => (
                              <span key={t} className="text-[9px] font-mono bg-cafe-100 text-cafe-600 px-1.5 py-0.2 rounded">
                                #{t}
                              </span>
                            ))}
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded text-white font-bold ml-2 ${post.published ? "bg-green-500" : "bg-zinc-400"}`}>
                              {post.published ? "Published" : "Draft"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPostForm({
                              id: post.id,
                              title: post.title,
                              body_md: post.body_md,
                              tags: post.tags.join(", "),
                              published: post.published
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
                {/* Form column */}
                <form onSubmit={handleAddChunk} className="lg:col-span-1 space-y-4 bg-cafe-50/50 border border-cafe-200 p-4 rounded-xl">
                  <h3 className="text-xs font-bold font-mono text-cafe-900 uppercase border-b border-cafe-200 pb-1.5">Add Context Block</h3>

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
                      rows={6}
                      value={chunkForm.content}
                      onChange={(e) => setChunkForm({ ...chunkForm, content: e.target.value })}
                      placeholder="Paste detailed biography, skills details or FAQ answers..."
                      className="w-full px-3 py-1.5 border border-cafe-300 rounded-lg text-xs font-sans resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-cafe-700 text-white font-bold rounded-lg hover:bg-cafe-800 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add to Brain
                  </button>
                </form>

                {/* List column */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold font-mono text-cafe-900 uppercase">Chatbot Knowledge Base Chunks ({chunks.length})</h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto border border-cafe-100 p-2 rounded-xl bg-white">
                    {chunks.map((chunk) => (
                      <div key={chunk.id} className="border border-cafe-150 p-3.5 rounded-lg text-xs flex justify-between items-start gap-4 hover:bg-cafe-50/40">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-mono bg-cafe-700 text-white px-2 py-0.2 rounded font-bold uppercase">{chunk.category}</span>
                            <span className="text-[10px] font-mono font-bold text-cafe-600">Source: {chunk.source}</span>
                          </div>
                          <p className="text-zinc-700 leading-relaxed mt-1.5">{chunk.content}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteChunk(chunk.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
          </div>
        )}
      </div>
    </div>
  );
}
