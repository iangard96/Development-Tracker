// ui/src/NavBar.tsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";

const linkStyle: React.CSSProperties = {
  display: "block",
  padding: "8px 12px",
  marginBottom: 6,
  borderRadius: 8,
  textDecoration: "none",
};

export default function NavBar({ collapsed = false }: { collapsed?: boolean }) {
  const { pathname } = useLocation();

  return (
    <nav className="nav">
      <div className="nav-title">{collapsed ? "" : "Project"}</div>

      {/* Development section */}
      <div className="nav-section" style={{ marginBottom: 10 }}>
        <NavLink
          to="/development"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          style={({ isActive }) => ({
            ...linkStyle,
            color: isActive ? "#1d4ed8" : "#111827",
            background: isActive ? "#e0e7ff" : "transparent",
            display: "flex",
            alignItems: "center",
            gap: 10,
          })}
        >
          <span className="nav-label">Development Activities</span>
        </NavLink>
      </div>

      {/* Dashboard section */}
      <div className="nav-section" style={{ marginBottom: 10 }}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          style={({ isActive }) => ({
            ...linkStyle,
            color: isActive ? "#1d4ed8" : "#111827",
            background: isActive ? "#e0e7ff" : "transparent",
            display: "flex",
            alignItems: "center",
            gap: 10,
          })}
        >
          <span className="nav-label">Project Dashboard</span>
        </NavLink>
      </div>
      <div className="nav-section" style={{ marginBottom: 10 }}>
        <NavLink
          to="/project_summary"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          style={({ isActive }) => ({
            ...linkStyle,
            color: isActive ? "#1d4ed8" : "#111827",
            background: isActive ? "#e0e7ff" : "transparent",
            display: "flex",
            alignItems: "center",
            gap: 10,
          })}
        >
          <span className="nav-label">Project Summary</span>
        </NavLink>
      </div>
    </nav>
  );
}
