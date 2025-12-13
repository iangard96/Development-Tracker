// ui/src/main.tsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProjectProvider } from "./ProjectContext";
import NavBar from "./NavBar";
import Dashboard from "./Dashboard";
import ProjectSummary from "./ProjectSummary";
import DevActivities from "./DevActivities";
import ProjectContacts from "./ProjectContacts";
import Requirements from "./Requirements";
import Lease from "./Lease";
import "./index.css";
import "./Layout.css";

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);

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

  return (
    <div className="app-shell">
      <div className={`app-sidebar ${collapsed ? "app-sidebar-collapsed" : "app-sidebar-open"}`}>
        <div className="app-sidebar-inner">
          <NavBar collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>
      </div>
      <div className="app-main">
        <Routes>
          {/* Home -> Project Summary */}
          <Route path="/" element={<Navigate to="/project_summary" replace />} />
          
          {/* Project Summary - no project context wrapper needed, uses context from provider */}
          <Route path="/project_summary" element={<ProjectSummary />} />
          
          {/* All project-scoped pages with context */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/development" element={<DevActivities />} />
          <Route path="/requirements" element={<Requirements />} />
          <Route path="/lease" element={<Lease />} />
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
