import React, { useState, useEffect } from "react";
import { BlogPost } from "../types.js";
import { 
  BookOpen, 
  Calendar, 
  Tag, 
  ChevronRight, 
  X, 
  Heart, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Send, 
  Award, 
  ExternalLink, 
  Paperclip,
  Bookmark,
  Sparkles,
  Smile,
  Volume2,
  VolumeX,
  Play
} from "lucide-react";

export default function BlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Interaction States
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, { id: string; author: string; text: string; created_at: string }[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState("");
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Record<string, boolean>>({});

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
        
        // Seed some funny/smart default comments for demo purposes so it looks exactly like LinkedIn!
        const defaultComments: Record<string, any[]> = {};
        data.forEach((p: BlogPost) => {
          defaultComments[p.id] = [
            {
              id: `comment-1-${p.id}`,
              author: "Elena Rostova (AI Researcher)",
              text: "Incredible post, Nabil! The agentic paradigms you discussed are game-changing. Sharing with my team! 🚀",
              created_at: new Date(new Date(p.created_at).getTime() + 1800000).toISOString()
            },
            {
              id: `comment-2-${p.id}`,
              author: "Marcus Vance (DevOps Lead)",
              text: "Top-tier design. Did you use the latest Gemini models for text chunking? Really seamless integration with the café theme.",
              created_at: new Date(new Date(p.created_at).getTime() + 3600000).toISOString()
            }
          ];
        });
        setComments(defaultComments);
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

  const getTimeAgo = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const handleLike = async (postId: string) => {
    if (likedPosts[postId]) {
      triggerToast("You already liked this post!");
      return;
    }

    // Optimistic UI update
    setLikedPosts(prev => ({ ...prev, [postId]: true }));
    setPosts(prevPosts => 
      prevPosts.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p)
    );

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) {
        throw new Error("Failed to register like");
      }
    } catch (err) {
      console.error(err);
      // Rollback on failure
      setLikedPosts(prev => ({ ...prev, [postId]: false }));
      setPosts(prevPosts => 
        prevPosts.map(p => p.id === postId ? { ...p, likes: Math.max(0, (p.likes || 1) - 1) } : p)
      );
    }
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const newComment = {
      id: `comment-${Date.now()}`,
      author: "Guest Explorer ☕",
      text,
      created_at: new Date().toISOString()
    };

    setComments(prev => ({
      ...prev,
      [postId]: [newComment, ...(prev[postId] || [])]
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    triggerToast("Comment added to feed!");
  };

  const handleShare = (post: BlogPost) => {
    const shareUrl = `${window.location.origin}/#thought-${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    triggerToast("LinkedIn post link copied to clipboard! 📋");
  };

  const toggleBookmark = (postId: string) => {
    setBookmarkedPosts(prev => {
      const isBookmarked = !prev[postId];
      triggerToast(isBookmarked ? "Saved to your bookmarks! 🔖" : "Removed from bookmarks");
      return { ...prev, [postId]: isBookmarked };
    });
  };

  return (
    <div className="bg-zinc-950/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-[0_24px_50px_rgba(0,0,0,0.4)] font-sans text-stone-100 max-w-4xl mx-auto relative">
      
      {/* Dynamic Action Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-600 border border-amber-400 text-stone-950 font-black px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs md:text-sm animate-comic-pop">
          <span>✨</span> {toastMessage}
        </div>
      )}

      {/* Header section with professional bio details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💼</span>
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              LinkedIn Feed & Thoughts
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black font-display text-stone-50 tracking-tight">
            Tauheed Ahmed Nabil's Updates
          </h2>
          <p className="text-xs md:text-sm text-stone-400 mt-1 max-w-2xl leading-relaxed">
            Real-time insights and professional project logs. Browse and stream photos, small videos, and code walkthroughs from Denmark.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full md:w-60 pl-3.5 pr-8 py-2 bg-zinc-900/60 border border-white/10 rounded-xl focus:border-amber-500/50 focus:outline-none text-xs md:text-sm text-stone-100 placeholder-stone-500"
          />
          <span className="absolute right-3 top-2.5 text-stone-500 text-xs pointer-events-none">🔍</span>
        </div>
      </div>

      {/* Tag selector filter list */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-8 pb-4 border-b border-white/5">
          <span className="text-[11px] font-bold font-mono text-amber-500 uppercase flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Filter by:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full cursor-pointer transition-all ${
              !selectedTag
                ? "bg-amber-600 text-stone-950 font-bold"
                : "bg-zinc-900/40 text-stone-300 border border-white/10 hover:bg-zinc-800"
            }`}
          >
            All Posts
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full cursor-pointer transition-all ${
                selectedTag === tag
                  ? "bg-amber-600 text-stone-950 font-bold"
                  : "bg-zinc-900/40 text-stone-300 border border-white/10 hover:bg-zinc-800"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="font-mono text-xs text-amber-500 uppercase tracking-widest">Compiling Feed Layout...</span>
        </div>
      ) : filteredPosts.length > 0 ? (
        
        /* Centered single column LinkedIn-style feed */
        <div className="space-y-8 max-w-2xl mx-auto">
          {filteredPosts.map((post) => {
            const hasLiked = likedPosts[post.id];
            const isBookmarked = bookmarkedPosts[post.id];
            const showComments = expandedComments[post.id];
            const postComments = comments[post.id] || [];

            return (
              <div
                key={post.id}
                id={`thought-${post.id}`}
                className="bg-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl hover:border-white/15 transition-all duration-300"
              >
                {/* LinkedIn-style Header */}
                <div className="p-5 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Professional Profile Picture */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border border-amber-500/30 overflow-hidden bg-zinc-800 flex items-center justify-center font-bold font-display text-amber-400 text-base shadow-md">
                        TAN
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-amber-500 text-stone-950 rounded-full p-0.5 border border-zinc-900" title="Founder Verification">
                        <Award className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Profile Information */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-stone-50 font-display">Tauheed Ahmed Nabil</h4>
                        <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.2 rounded-full font-bold">Founder</span>
                      </div>
                      <p className="text-[10.5px] text-stone-400 leading-tight mt-0.5 line-clamp-1">
                        Founder & AI Systems Architect | Expert in Multi-Agent AI Swarms & Cybersecurity
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-stone-500 font-mono mt-1">
                        <span>🕒 {getTimeAgo(post.created_at)}</span>
                        <span>•</span>
                        <span>Copenhagen, DK 🇩🇰</span>
                        <span>•</span>
                        <span>🌎 Public</span>
                      </div>
                    </div>
                  </div>

                  {/* Top-Right bookmark flag icon */}
                  <button
                    onClick={() => toggleBookmark(post.id)}
                    className="p-1.5 rounded-full hover:bg-white/5 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
                    title={isBookmarked ? "Remove Bookmark" : "Save Post"}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
                  </button>
                </div>

                {/* Post content area */}
                <div className="px-5 pb-4">
                  {/* Title / Headline */}
                  {post.title && (
                    <h3 className="text-base md:text-lg font-black font-display text-stone-100 hover:text-amber-400 transition-colors leading-snug mb-2.5">
                      {post.title}
                    </h3>
                  )}

                  {/* Body Text */}
                  <p className="text-xs md:text-[13px] text-stone-300 leading-relaxed whitespace-pre-line font-sans break-words">
                    {post.body_md.replace(/[#*`\-]/g, "")}
                  </p>

                  {/* Tags list */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-bold font-mono text-amber-300 hover:underline cursor-pointer">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shared media block (Photos or Videos) - Rendered full-width or elegantly aligned */}
                {(post.image_url || post.video_url) && (
                  <div className="border-t border-b border-white/5 bg-zinc-950/40 relative overflow-hidden flex items-center justify-center max-h-[380px]">
                    
                    {/* Render Photo attachment */}
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt={post.title || "Shared post image"}
                        className="w-full object-contain max-h-[380px] hover:scale-[1.005] transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    {/* Render Video attachment */}
                    {post.video_url && (
                      <div className="w-full relative bg-black flex justify-center">
                        <video
                          src={post.video_url}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full max-h-[380px] object-contain rounded-none border-none shadow-inner"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Social Counters bar */}
                <div className="px-5 py-2.5 flex items-center justify-between text-[11px] text-stone-400 border-t border-white/5 font-mono">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                    <span className="font-bold text-stone-300">{(post.likes || 0)}</span> likes
                  </span>
                  <div className="flex gap-2.5">
                    <span>{postComments.length} comments</span>
                    <span>•</span>
                    <span>Shares & Saves</span>
                  </div>
                </div>

                {/* Interactive Action Bar buttons */}
                <div className="px-5 py-1.5 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                  
                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white/5 ${
                      hasLiked ? "text-amber-400 scale-[1.04]" : "text-stone-300"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${hasLiked ? "fill-amber-500 text-amber-500 animate-pulse" : "text-stone-400"}`} />
                    <span>{hasLiked ? "Liked" : "Like"}</span>
                  </button>

                  {/* Comment Toggle Button */}
                  <button
                    onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !showComments }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold text-stone-300 hover:text-stone-100 hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      showComments ? "bg-white/5 text-amber-400" : ""
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-stone-400" />
                    <span>Comment</span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShare(post)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-stone-300 hover:text-stone-100 hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-stone-400" />
                    <span>Share</span>
                  </button>

                  {/* Detail Reader Modal */}
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-stone-300 hover:text-stone-100 hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                    <span>View More</span>
                  </button>
                </div>

                {/* Inline Comment system layout */}
                {showComments && (
                  <div className="p-4 border-t border-white/5 bg-zinc-950/20 space-y-4 animate-fade-in">
                    
                    {/* Add new comment text input */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-[10px] font-bold text-stone-100">
                        GE
                      </div>
                      <div className="flex-1 relative flex items-center">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ""}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddComment(post.id);
                          }}
                          placeholder="Add a thought comment..."
                          className="w-full pl-3 pr-10 py-1.5 bg-zinc-900 border border-white/10 rounded-xl focus:border-amber-500/40 focus:outline-none text-[11px] md:text-xs text-stone-100"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="absolute right-2 text-amber-500 hover:text-amber-400 text-xs font-bold p-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Listed comments */}
                    {postComments.length > 0 ? (
                      <div className="space-y-3 pt-1">
                        {postComments.map((comment) => (
                          <div key={comment.id} className="flex gap-2.5 items-start text-xs text-stone-300">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-[10px] text-amber-400 shrink-0">
                              {comment.author.charAt(0)}
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-3 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-stone-100 text-[11px] font-display">{comment.author}</span>
                                <span className="text-[9px] text-stone-500 font-mono">{getTimeAgo(comment.created_at)}</span>
                              </div>
                              <p className="text-[11px] text-stone-300 mt-1 leading-normal">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-[10px] text-stone-500 py-1 font-mono">
                        Be the first to leave a comment on Nabil's desk! 📝
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-xs text-stone-500 border border-dashed border-white/10 rounded-2xl">
          No posts match the criteria. Connect with Nabil to request a new update! ☕
        </div>
      )}

      {/* Full post detail Modal overlay */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl animate-comic-pop max-h-[90vh] overflow-y-auto text-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>{formatDate(selectedPost.created_at)}</span>
                <span>•</span>
                <span>🕒 {getTimeAgo(selectedPost.created_at)}</span>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-full hover:bg-white/5 text-stone-400 hover:text-stone-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Bar in Modal */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-full border border-amber-500/20 overflow-hidden bg-zinc-800 flex items-center justify-center font-bold text-amber-400 text-sm">
                TAN
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-50 font-display">Tauheed Ahmed Nabil</h4>
                <p className="text-[10px] text-stone-400">Founder & AI Architect | Denmark</p>
              </div>
            </div>

            {/* Post Title */}
            {selectedPost.title && (
              <h1 className="text-xl md:text-2xl font-bold font-display text-stone-50 mb-3.5 leading-tight">
                {selectedPost.title}
              </h1>
            )}

            {/* Tags */}
            {selectedPost.tags && selectedPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {selectedPost.tags.map((tag) => (
                  <span key={tag} className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Inline Media in Modal */}
            {(selectedPost.image_url || selectedPost.video_url) && (
              <div className="mb-5 border border-white/10 rounded-2xl overflow-hidden bg-zinc-900/30 flex items-center justify-center">
                {selectedPost.image_url && (
                  <img
                    src={selectedPost.image_url}
                    alt={selectedPost.title}
                    className="w-full object-contain max-h-[300px]"
                    referrerPolicy="no-referrer"
                  />
                )}
                {selectedPost.video_url && (
                  <video
                    src={selectedPost.video_url}
                    controls
                    className="w-full max-h-[300px] object-contain"
                  />
                )}
              </div>
            )}

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
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-stone-950 font-black rounded-xl transition-colors cursor-pointer"
              >
                Close Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
