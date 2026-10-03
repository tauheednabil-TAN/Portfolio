import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// The admin portal is NOT part of the public site. It only loads at /adm00,
// and its code is split into a separate file that normal visitors never download.
const AdminPage = lazy(() => import("./AdminPage.tsx"));
const isAdminRoute =
  window.location.pathname.replace(/\/+$/, "").toLowerCase() === "/adm00";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isAdminRoute ? (
      <Suspense fallback={<div className="min-h-screen bg-[#0c0a09]" />}>
        <AdminPage />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
