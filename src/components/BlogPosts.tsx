import React, { useState, useEffect } from "react";
import { BlogPost } from "../types.js";
import { BookOpen, Calendar, Tag, ChevronRight, X, Heart } from "lucide-react";

export default function BlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Compile all unique tags
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags || [])));

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.body_md.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] font-sans text-stone-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-stone-50 flex items-center gap-2">
            <span>📝</span> Daily Thoughts & Café Posts
          </h2>
          <p className="text-xs md:text-sm text-stone-400 mt-1">
            Nabil's blog posts sharing technical insights on multi-agent AI systems, automation scripts, and cybersecurity.
          </p>
        </div>

        {/* Search bar */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search posts..."
          className="px-3.5 py-2 bg-zinc-900/60 border border-white/10 rounded-xl focus:border-amber-500/50 focus:outline-none text-xs md:text-sm text-stone-100 placeholder-stone-500"
        />
      </div>

      {/* Tag selector filter list */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6 pb-4 border-b border-white/5">
          <span className="text-[11px] font-bold font-mono text-amber-500 uppercase flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Filter by:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-all ${
              !selectedTag
                ? "bg-amber-600/30 text-amber-300 border border-amber-500/30"
                : "bg-zinc-900/40 text-stone-300 border border-white/10 hover:bg-zinc-800"
            }`}
          >
            All Posts
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-all ${
                selectedTag === tag
                  ? "bg-amber-600/30 text-amber-300 border border-amber-500/30"
                  : "bg-zinc-900/40 text-stone-300 border border-white/10 hover:bg-zinc-800"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-stone-400">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
          <span>Flipping notebook pages...</span>
        </div>
      ) : filteredPosts.length > 0 ? (
        /* Chalkboard or Paper Note styling grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="group relative bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-2xl hover:border-amber-500/35 hover:bg-white/[0.04] hover:scale-[1.015] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-2.5">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500/70" />
                    {formatDate(post.created_at)}
                  </span>
                  <span className="font-bold text-amber-400">TAN Café</span>
                </div>

                <h3 className="text-base md:text-lg font-bold font-display text-stone-50 group-hover:text-amber-400 transition-colors duration-300">
                  {post.title}
                </h3>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 my-3">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-medium font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Substring content preview */}
                <p className="text-xs text-stone-300 leading-relaxed line-clamp-3">
                  {post.body_md.replace(/[#*`\-[\]]/g, "")}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-500 flex items-center gap-1 font-mono">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/25" />
                  Coffee Brewed
                </span>
                <button
                  onClick={() => setSelectedPost(post)}
                  className="text-xs font-bold font-display text-amber-400 hover:text-amber-300 flex items-center gap-1 group-hover:translate-x-1 transition-all cursor-pointer hover:underline"
                >
                  Read full thought <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-xs text-stone-500 border border-dashed border-white/10 rounded-2xl">
          No thoughts found matching that criteria. Let Nabil compose some more! ☕
        </div>
      )}

      {/* Full post detail Modal reading drawer */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl bg-zinc-950/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-[0_24px_50px_rgba(0,0,0,0.5)] animate-comic-pop max-h-[90vh] overflow-y-auto text-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
                <Calendar className="w-4 h-4 text-amber-500" />
                {formatDate(selectedPost.created_at)}
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-full hover:bg-white/5 text-stone-400 hover:text-stone-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            <h1 className="text-xl md:text-2xl font-bold font-display text-stone-50 mb-3 leading-tight">
              {selectedPost.title}
            </h1>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {selectedPost.tags.map((tag) => (
                <span key={tag} className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Markdown Styled Body */}
            <div className="prose prose-invert prose-sm font-sans text-stone-300 leading-relaxed space-y-4 text-xs md:text-sm">
              {selectedPost.body_md.split("\n\n").map((para, i) => {
                if (para.startsWith("###")) {
                  return (
                    <h3 key={i} className="text-base md:text-lg font-bold font-display text-stone-100 pt-2 border-b border-white/10 pb-1">
                      {para.replace("###", "").trim()}
                    </h3>
                  );
                }
                if (para.startsWith("####")) {
                  return (
                    <h4 key={i} className="text-sm md:text-base font-bold font-display text-stone-100 pt-1">
                      {para.replace("####", "").trim()}
                    </h4>
                  );
                }
                if (para.startsWith("```")) {
                  const codeLines = para.replace(/```[a-z]*/, "").replace(/```$/, "").trim();
                  return (
                    <pre key={i} className="bg-zinc-950 text-stone-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto shadow-inner border border-white/5 leading-normal">
                      <code>{codeLines}</code>
                    </pre>
                  );
                }
                if (para.startsWith("-") || para.startsWith("*") || /^\d+\./.test(para)) {
                  // Standard bullet parsing
                  const items = para.split("\n");
                  return (
                    <ul key={i} className="list-disc list-inside pl-2 space-y-1.5 text-stone-300">
                      {items.map((item, idx) => (
                        <li key={idx}>
                          {item.replace(/^[-*\d.]\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={i} className="whitespace-pre-line text-stone-300 leading-relaxed">
                    {para.replace(/\*\*(.*?)\*\*/g, "$1")}
                  </p>
                );
              })}
            </div>

            {/* Footer Sign-off */}
            <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-stone-400 font-mono">
              <span>Seeded from Copenhagen, DK ☕</span>
              <button
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-stone-50 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Notebook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
