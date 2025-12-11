// ui/src/Layout.tsx
import { Outlet, NavLink, useParams, Navigate } from "react-router-dom";
import { useState } from "react";
import { ProjectProvider, useProject } from "./ProjectContext";
import "./Layout.css";

function LayoutInner() {
  const [navCollapsed, setNavCollapsed] = useState(false);
  const { project, isLoading, error } = useProject();

  if (isLoading) return <div className="page-root">Loading project…</div>;
  if (error) return <div className="page-root">Error: {error}</div>;
  if (!project) return <div className="page-root">Project not found.</div>;

  return (
    <div
      className="page-root"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      {/* Project name at the top of every page in this project */}
      <header
        style={{
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: 8,
          marginBottom: 8,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>
          {project.project_name}
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280" }}>
          {project.legal_name}
        </p>
      </header>

      {/* Tabs for this project */}
      <nav
        style={{
          display: "flex",
          gap: 16,
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: 8,
          marginBottom: 8,
          alignItems: "center",
        }}
      >
        {/* Collapse toggle button - visible on smaller screens */}
        <button
          onClick={() => setNavCollapsed(!navCollapsed)}
          className="nav-collapse-btn"
          title={navCollapsed ? "Expand nav" : "Collapse nav"}
        >
          {navCollapsed ? "◀" : "▶"}
        </button>

        {/* Tab links container */}
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            width: navCollapsed ? "auto" : "100%",
            flexWrap: navCollapsed ? "nowrap" : "wrap",
          }}
        >
          {/* Full tab names - hidden when collapsed */}
          {!navCollapsed && (
            <>
              <NavLink
                to="dashboard"
                style={({ isActive }) => ({
                  fontSize: 14,
                  textDecoration: isActive ? "underline" : "none",
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="activities"
                style={({ isActive }) => ({
                  fontSize: 14,
                  textDecoration: isActive ? "underline" : "none",
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                Development Activities
              </NavLink>
              <NavLink
                to="requirements"
                style={({ isActive }) => ({
                  fontSize: 14,
                  textDecoration: isActive ? "underline" : "none",
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                Requirements
              </NavLink>
              <NavLink
                to="contacts"
                style={({ isActive }) => ({
                  fontSize: 14,
                  textDecoration: isActive ? "underline" : "none",
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                Project Contacts
              </NavLink>
            </>
          )}

          {/* Collapsed nav - show dots for each tab */}
          {navCollapsed && (
            <>
              <NavLink
                to="dashboard"
                style={({ isActive }) => ({
                  display: "flex",
                  gap: 2,
                  textDecoration: "none",
                  opacity: isActive ? 1 : 0.5,
                  fontSize: 10,
                })}
                title="Dashboard"
              >
                ...
              </NavLink>
              <NavLink
                to="activities"
                style={({ isActive }) => ({
                  display: "flex",
                  gap: 2,
                  textDecoration: "none",
                  opacity: isActive ? 1 : 0.5,
                  fontSize: 10,
                })}
                title="Development Activities"
              >
                ...
              </NavLink>
              <NavLink
                to="requirements"
                style={({ isActive }) => ({
                  display: "flex",
                  gap: 2,
                  textDecoration: "none",
                  opacity: isActive ? 1 : 0.5,
                  fontSize: 10,
                })}
                title="Requirements"
              >
                ...
              </NavLink>
              <NavLink
                to="contacts"
                style={({ isActive }) => ({
                  display: "flex",
                  gap: 2,
                  textDecoration: "none",
                  opacity: isActive ? 1 : 0.5,
                  fontSize: 10,
                })}
                title="Project Contacts"
              >
                ...
              </NavLink>
            </>
          )}
        </div>
      </nav>

      <main style={{ marginTop: 8 }}>
        <Outlet />
      </main>
    </div>
  );
}

export default function Layout() {
  const params = useParams();
  const rawId = params.projectId;
  const projectId = rawId ? Number(rawId) : NaN;

  // If there is no valid :projectId in the URL, go back to /
  if (!rawId || Number.isNaN(projectId) || projectId <= 0) {
    return <Navigate to="/" replace />;
  }

  return (
    <ProjectProvider projectId={projectId}>
      <LayoutInner />
    </ProjectProvider>
  );
}
