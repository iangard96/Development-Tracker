import React, { useEffect, useRef, useState } from "react";
import { fetchCurrentUser, logoutUser, type CurrentUser } from "./api";

type Props = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

function initialsFromUser(user: CurrentUser | null): string {
  const email = user?.email || "";
  if (email) return email.trim().slice(0, 1).toUpperCase();
  const username = user?.username || "";
  return username.trim().slice(0, 1).toUpperCase() || "U";
}

export default function AccountMenu({ theme, onToggleTheme }: Props) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch((err) => console.warn("Failed to load current user", err));
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      window.addEventListener("mousedown", onClickOutside);
    }
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const handleLogout = async () => {
    await logoutUser();
    window.location.reload();
  };

  const avatar = initialsFromUser(user);
  const themeLabel = theme === "dark" ? "Light mode" : "Amber dark";

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: "linear-gradient(135deg, var(--accent-strong), var(--accent))",
          color: "#120c06",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
        }}
        aria-label="Account menu"
      >
        {avatar}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            right: 0,
            minWidth: 240,
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.16)",
            borderRadius: 12,
            padding: 12,
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent-strong), var(--accent))",
                color: "#120c06",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {avatar}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>
                {user?.email || "Signed in"}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                {user?.company?.name || "No company"}
              </div>
            </div>
          </div>

          <button
            type="button"
            style={{
              width: "100%",
              border: "none",
              background: "none",
              textAlign: "left",
              padding: "8px 6px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text)",
              cursor: "pointer",
              borderRadius: 8,
            }}
          >
            <span>Account settings</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            style={{
              width: "100%",
              border: "1px solid var(--border)",
              background: "var(--button-bg)",
              textAlign: "left",
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              color: "var(--text)",
              cursor: "pointer",
              borderRadius: 10,
              marginTop: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>{themeLabel}</span>
            </div>
            <div
              style={{
                width: 38,
                height: 20,
                borderRadius: 999,
                background: theme === "dark" ? "var(--accent)" : "var(--border)",
                position: "relative",
                transition: "background 0.2s ease",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: theme === "dark" ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "var(--card)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  transition: "left 0.2s ease",
                }}
              />
            </div>
          </button>

          <div
            style={{
              height: 1,
              background: "var(--border)",
              margin: "10px 0",
            }}
          />

          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: "100%",
              border: "none",
              background: "none",
              textAlign: "left",
              padding: "8px 6px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text)",
              cursor: "pointer",
              borderRadius: 8,
            }}
          >
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
