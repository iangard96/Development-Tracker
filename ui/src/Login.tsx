import React, { useState } from "react";
import { fetchCurrentUser, loginUser, type CurrentUser } from "./api";

type Props = {
  onLogin: (user: CurrentUser | null) => void;
  sessionMessage?: string | null;
  onResetAuth?: () => void;
};

export default function Login({ onLogin, sessionMessage, onResetAuth }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await loginUser({ username, email: username, password });
      const me = await fetchCurrentUser();
      onLogin(me);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 20% 20%, rgba(245,182,59,0.16), transparent 35%), radial-gradient(circle at 80% 10%, rgba(168,108,25,0.2), transparent 36%), radial-gradient(circle at 50% 90%, rgba(247,183,51,0.18), transparent 32%), linear-gradient(135deg, #0a090f, #1b140e)",
        color: "var(--text)",
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 360,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 18px 38px rgba(0,0,0,0.35)",
        }}
      >
        {sessionMessage ? (
          <div
            style={{
              border: "1px solid var(--border)",
              background: "rgba(253, 224, 71, 0.12)",
              color: "var(--text)",
              padding: "8px 10px",
              borderRadius: 10,
              marginBottom: 12,
              fontSize: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>{sessionMessage}</span>
            {onResetAuth && (
              <button
                type="button"
                onClick={onResetAuth}
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--text)",
                  padding: "6px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Reset session
              </button>
            )}
          </div>
        ) : null}
        <h2 style={{ margin: "0 0 12px 0", color: "var(--text)" }}>Sign in</h2>
        <p style={{ margin: "0 0 16px 0", color: "var(--muted)", fontSize: 13 }}>
          Enter your email or username to continue.
        </p>

        <label style={{ display: "block", marginBottom: 12, fontSize: 13, color: "var(--text)" }}>
          Email or username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: "100%",
            marginTop: 6,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--text)",
            boxSizing: "border-box",
          }}
        />
        </label>

        <label style={{ display: "block", marginBottom: 16, fontSize: 13, color: "var(--text)" }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
            marginTop: 6,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--text)",
            boxSizing: "border-box",
          }}
        />
      </label>

      {error && (
        <div style={{ color: "var(--danger)", marginBottom: 12, fontSize: 13 }}>
          {error}
        </div>
      )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid transparent",
            background: "linear-gradient(135deg, var(--accent-strong), #ffce5a)",
            color: "#120c06",
            fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
