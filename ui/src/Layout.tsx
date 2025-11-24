// ui/src/Layout.tsx
import React, { useState } from "react";
import NavBar from "./NavBar";

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <button
          className="collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <span className={`caret ${collapsed ? "right" : "left"}`}>▸</span>
        </button>

        <NavBar collapsed={collapsed} />
      </aside>

      <main className="content">
        {children}
      </main>
    </div>
  );
}
