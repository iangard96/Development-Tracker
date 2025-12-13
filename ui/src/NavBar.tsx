// ui/src/NavBar.tsx
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useProject } from "./ProjectContext";
import { fetchProjects } from "./api";
import type { Project } from "./types";

const linkStyle: React.CSSProperties = {
  display: "block",
  padding: "8px 12px",
  marginBottom: 6,
  borderRadius: 8,
  textDecoration: "none",
};

export default function NavBar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const { project, projectId, selectProject } = useProject();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch((err) => console.warn("Failed to load projects for nav", err));
  }, []);

  const titleText = project?.project_name || "Project";
  const navItems = [
    { to: "/project_summary", label: "Project Portfolio", title: "Project Portfolio", icon: "S" },
    { to: "/dashboard", label: "Project Dashboard", title: "Project Dashboard", icon: "D" },
    { to: "/development", label: "Development Activities", title: "Development Activities", icon: "A" },
    { to: "/requirements", label: "Requirements", title: "Requirements", icon: "R" },
    { to: "/project_contacts", label: "Project Contacts", title: "Project Contacts", icon: "C" },
  ];

  return (
    <nav className="nav">
      <div className="nav-title-container" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="nav-collapse-btn"
          style={{
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            cursor: "pointer",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            fontSize: 14,
            color: "#4b5563",
            borderRadius: 4,
            minWidth: 32,
            justifyContent: "center",
          }}
          title={collapsed ? "Expand nav" : "Collapse nav"}
        >
          {collapsed ? ">" : "<"}
        </button>
        <div className="nav-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {collapsed ? "" : titleText}
          {!collapsed && (
            <select
              value={projectId ?? ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!Number.isNaN(val) && val > 0) {
                  selectProject(val);
                }
              }}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 12,
                maxWidth: 180,
              }}
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {navItems.map((item) => (
        <div className="nav-section" style={{ marginBottom: 10 }} key={item.to}>
          <NavLink
            to={item.to}
            className={({ isActive }) => {
              const activeClass = isActive ? " active" : "";
              const collapsedClass = collapsed ? " collapsed" : "";
              return `nav-link${activeClass}${collapsedClass}`;
            }}
            style={({ isActive }) => ({
              ...linkStyle,
              color: isActive ? "#1d4ed8" : "#111827",
              display: "flex",
              alignItems: "center",
              gap: 10,
              justifyContent: collapsed ? "center" : "flex-start",
            })}
            title={item.title}
            aria-label={item.title}
          >
            {collapsed ? (
              <span
                aria-hidden="true"
                style={{
                  fontSize: 16,
                  color: "#b0b4bb",
                  opacity: 0.65,
                  lineHeight: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </span>
            ) : (
              <span className="nav-label">{item.label}</span>
            )}
          </NavLink>
        </div>
      ))}
    </nav>
  );
}
