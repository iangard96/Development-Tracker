// ui/src/main.tsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProjectProvider } from "./ProjectContext";
import AccountMenu from "./AccountMenu";
import Login from "./Login";
import NavBar from "./NavBar";
import Dashboard from "./Dashboard";
import ProjectSummary from "./ProjectSummary";
import DevActivities from "./DevActivities";
import ProjectContacts from "./ProjectContacts";
import Requirements from "./Requirements";
import Lease from "./Lease";
import Economics from "./Economics";
import Permitting from "./Permitting";
import { fetchCurrentUser, logoutUser, type CurrentUser } from "./api";
import "./index.css";
import "./Layout.css";

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("dt_theme");
    return stored === "dark" ? "dark" : "light";
  });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    // Check on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("dt_theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    const hadStoredToken = !!localStorage.getItem("dt_access_token");

    fetchCurrentUser()
      .then((u) => {
        if (cancelled) return;
        setCurrentUser(u);
        if (!u && hadStoredToken) {
          setSessionMessage("Your session expired or the token was rejected. Please sign in again.");
        } else {
          setSessionMessage(null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("Failed to fetch current user:", err);
        if (hadStoredToken) {
          setSessionMessage("Could not validate your session. Please sign in again.");
        }
        setCurrentUser(null);
      })
      .finally(() => {
        if (cancelled) return;
        setAuthChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleResetAuth = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn("Logout failed (tokens still cleared locally)", e);
    } finally {
      setCurrentUser(null);
      setSessionMessage("Session cleared. Please sign in.");
      setAuthChecked(true);
    }
  };

  if (!authChecked) {
    return <div className="page-root">Checking session...</div>;
  }

  if (!currentUser) {
    return (
      <Login
        onLogin={(u) => setCurrentUser(u)}
        sessionMessage={sessionMessage}
        onResetAuth={handleResetAuth}
      />
    );
  }

  return (
    <div className="app-shell">
      <div className={`app-sidebar ${collapsed ? "app-sidebar-collapsed" : "app-sidebar-open"}`}>
        <div className="app-sidebar-inner">
          <NavBar collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>
      </div>
      <div className="app-main">
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px" }}>
          <AccountMenu
            theme={theme}
            onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          />
        </div>
        <Routes>
          {/* Home -> Project Summary */}
          <Route path="/" element={<Navigate to="/project_summary" replace />} />
          
          {/* Project Summary - no project context wrapper needed, uses context from provider */}
          <Route path="/project_summary" element={<ProjectSummary />} />
          
          {/* All project-scoped pages with context */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/development" element={<DevActivities />} />
          <Route path="/permitting" element={<Permitting />} />
          <Route path="/requirements" element={<Requirements />} />
          <Route path="/lease" element={<Lease />} />
          <Route path="/economics" element={<Economics />} />
          <Route path="/project_contacts" element={<ProjectContacts />} />
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/project_summary" replace />} />
        </Routes>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProjectProvider>
        <AppShell />
      </ProjectProvider>
    </BrowserRouter>
  </React.StrictMode>
);
