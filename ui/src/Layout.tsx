// ui/src/Layout.tsx
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Layout.css";

type LayoutProps = {
  children?: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 900 : false
  );
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 900 : true
  );

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      setSidebarOpen(!mobile); // open on desktop, closed on mobile
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function toggleSidebar() {
    setSidebarOpen((v) => !v);
  }

  // Close drawer after navigating on mobile
  function handleNavClick() {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside
        className={
          "app-sidebar" +
          (isMobile ? " app-sidebar-mobile" : "") +
          (sidebarOpen ? " app-sidebar-open" : " app-sidebar-closed")
        }
      >
        <div className="app-sidebar-inner">
          <div className="app-sidebar-header">
            {!isMobile && (
              <button
                className="app-sidebar-collapse-btn"
                onClick={toggleSidebar}
                aria-label="Toggle navigation"
              >
                {sidebarOpen ? "←" : "→"}
              </button>
            )}
            <span className="app-sidebar-title">Project</span>
          </div>

          <nav className="app-sidebar-nav">
            {/* 1. Project Summary */}
            <NavLink
              to="/project_summary"
              onClick={handleNavClick}
              className={({ isActive }) =>
                "app-nav-link" + (isActive ? " app-nav-link-active" : "")
              }
            >
              Project Summary
            </NavLink>

            {/* 2. Project Dashboard */}
            <NavLink
              to="/dashboard"
              onClick={handleNavClick}
              className={({ isActive }) =>
                "app-nav-link" + (isActive ? " app-nav-link-active" : "")
              }
            >
              Project Dashboard
            </NavLink>

            {/* 3. Development Activities */}
            <NavLink
              to="/development"
              onClick={handleNavClick}
              className={({ isActive }) =>
                "app-nav-link" + (isActive ? " app-nav-link-active" : "")
              }
            >
              Development Activities
            </NavLink>

            {/* 4. Project Contacts */}
            <NavLink
              to="/project_contacts"
              onClick={handleNavClick}
              className={({ isActive }) =>
                "app-nav-link" + (isActive ? " app-nav-link-active" : "")
              }
            >
              Project Contacts
            </NavLink>
          </nav>
        </div>
      </aside>

      {/* Main area */}
      <div className="app-main">
        <header className="app-main-header">
          {isMobile && (
            <button
              className="app-main-menu-btn"
              onClick={toggleSidebar}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
          )}
          <h1 className="app-main-header-title">Development Tracker</h1>
        </header>

        <main className="app-main-content">{children}</main>
      </div>
    </div>
  );
}
