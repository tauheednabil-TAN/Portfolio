import { useEffect } from "react";
import AdminPortal from "./components/AdminPortal.tsx";

const DEFAULT_BG =
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=2000&q=80";

function readBg(): string {
  try {
    return localStorage.getItem("custom_bg_image") || DEFAULT_BG;
  } catch {
    return DEFAULT_BG;
  }
}

export default function AdminPage() {
  useEffect(() => {
    document.title = "Sign in";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <div className="min-h-screen text-stone-100 font-sans relative px-4 py-10 md:px-8">
      <div
        className="fixed inset-0 bg-cover bg-center -z-20"
        style={{ backgroundImage: `url('${readBg()}')` }}
      />
      <div className="fixed inset-0 bg-black -z-10" style={{ opacity: 0.6 }} />
      <div className="max-w-6xl w-full mx-auto">
        <AdminPortal />
      </div>
    </div>
  );
}
