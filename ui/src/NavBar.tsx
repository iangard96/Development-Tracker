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
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch((err) => console.warn("Failed to load projects for nav", err));
  }, [project]);

  const titleText = project?.project_name || "Project";
  const navItems = [
    { to: "/project_summary", label: "Project Portfolio", title: "Project Portfolio", icon: "S" },
    { to: "/dashboard", label: "Project Dashboard", title: "Project Dashboard", icon: "D" },
    { to: "/development", label: "Development Activities", title: "Development Activities", icon: "A" },
    { to: "/permitting", label: "Permitting", title: "Permitting", icon: "P" },
    { to: "/requirements", label: "Requirements", title: "Requirements", icon: "R" },
    { to: "/economics", label: "Economics", title: "Economics", icon: "E" },
    { to: "/lease", label: "Lease Info", title: "Lease Info", icon: "L" },
    { to: "/project_contacts", label: "Project Contacts", title: "Project Contacts", icon: "C" },
  ];

  return (
    <nav className="nav">
      <div className="nav-title-container" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="nav-collapse-btn"
          style={{
            background: "var(--button-bg)",
            border: "1px solid var(--button-border)",
            cursor: "pointer",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            fontSize: 14,
            color: "var(--muted)",
            borderRadius: 4,
            minWidth: 32,
            justifyContent: "center",
          }}
          title={collapsed ? "Expand nav" : "Collapse nav"}
        >
          {collapsed ? ">" : "<"}
        </button>
        <div className="nav-title" style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
          {collapsed ? "" : titleText}
          {!collapsed && (
            <>
              <button
                type="button"
                onClick={() => setShowPicker((v) => !v)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: "2px 6px",
                  fontSize: 14,
                  lineHeight: 1,
                  color: "var(--muted)",
                }}
                aria-label="Change project"
              >
                ▾
              </button>
              {showPicker && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: 6,
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
                    padding: 8,
                    zIndex: 10,
                    minWidth: 180,
                  }}
                >
                  <div style={{ padding: "4px 6px", fontSize: 12, color: "var(--muted)" }}>Switch project</div>
                  <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          selectProject(p.id);
                          setShowPicker(false);
                        }}
                        style={{
                          textAlign: "left",
                          padding: "6px 8px",
                          borderRadius: 6,
                          border: "1px solid var(--border)",
                          background: p.id === projectId ? "rgba(251, 191, 36, 0.18)" : "var(--card)",
                          color: "var(--text)",
                          cursor: "pointer",
                        }}
                      >
                        {p.project_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
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
              color: isActive ? "var(--accent)" : "var(--text)",
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
                  color: "var(--icon-muted)",
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
