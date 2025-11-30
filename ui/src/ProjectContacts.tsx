// ui/src/ProjectContacts.tsx
import { useState } from "react";

type ContactRow = {
  id: number;
  organization: string;
  type: string;
  responsibility: string;
  name: string;
  title: string;
  email: string;
  phone1: string;
  phone2: string;
};

const blankRow = (id: number): ContactRow => ({
  id,
  organization: "",
  type: "",
  responsibility: "",
  name: "",
  title: "",
  email: "",
  phone1: "",
  phone2: "",
});

export default function ProjectContacts() {
  const [rows, setRows] = useState<ContactRow[]>([blankRow(1)]);

  function updateCell(id: number, field: keyof ContactRow, value: string) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }

  function addRow() {
    setRows((prev) => [...prev, blankRow(prev.length ? prev[prev.length - 1].id + 1 : 1)]);
  }

  function removeRow(id: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  return (
    <div className="page-root">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        Project Contacts
      </h1>
      <p style={{ marginBottom: 16, color: "#4b5563" }}>
        Track key organizations and people involved with this project.
      </p>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          overflowX: "auto",
          background: "#ffffff",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
            minWidth: 900,
          }}
        >
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Organization</th>
              <th style={th}>Type</th>
              <th style={th}>Responsibility</th>
              <th style={th}>Name</th>
              <th style={th}>Title</th>
              <th style={th}>Email</th>
              <th style={th}>Phone 1</th>
              <th style={th}>Phone 2</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <td style={td}>{idx + 1}</td>

                <td style={td}>
                  <input
                    value={row.organization}
                    onChange={(e) =>
                      updateCell(row.id, "organization", e.target.value)
                    }
                    style={input}
                  />
                </td>

                <td style={td}>
                  <input
                    value={row.type}
                    onChange={(e) => updateCell(row.id, "type", e.target.value)}
                    placeholder="Owner, Utility, EPC..."
                    style={input}
                  />
                </td>

                <td style={td}>
                  <input
                    value={row.responsibility}
                    onChange={(e) =>
                      updateCell(row.id, "responsibility", e.target.value)
                    }
                    placeholder="Interconnection, Permitting, etc."
                    style={input}
                  />
                </td>

                <td style={td}>
                  <input
                    value={row.name}
                    onChange={(e) => updateCell(row.id, "name", e.target.value)}
                    style={input}
                  />
                </td>

                <td style={td}>
                  <input
                    value={row.title}
                    onChange={(e) =>
                      updateCell(row.id, "title", e.target.value)
                    }
                    style={input}
                  />
                </td>

                <td style={td}>
                  <input
                    type="email"
                    value={row.email}
                    onChange={(e) =>
                      updateCell(row.id, "email", e.target.value)
                    }
                    style={input}
                  />
                </td>

                <td style={td}>
                  <input
                    value={row.phone1}
                    onChange={(e) =>
                      updateCell(row.id, "phone1", e.target.value)
                    }
                    style={input}
                  />
                </td>

                <td style={td}>
                  <input
                    value={row.phone2}
                    onChange={(e) =>
                      updateCell(row.id, "phone2", e.target.value)
                    }
                    style={input}
                  />
                </td>

                <td style={{ ...td, textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    style={{
                      border: "none",
                      borderRadius: 9999,
                      padding: "4px 8px",
                      fontSize: 12,
                      background: "#fee2e2",
                      color: "#b91c1c",
                      cursor: rows.length > 1 ? "pointer" : "default",
                      opacity: rows.length > 1 ? 1 : 0.4,
                    }}
                    disabled={rows.length <= 1}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        style={{
          marginTop: 16,
          borderRadius: 9999,
          border: "1px solid #d1d5db",
          padding: "8px 14px",
          fontSize: 14,
          background: "#ffffff",
          cursor: "pointer",
        }}
      >
        + Add Contact
      </button>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  fontWeight: 600,
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "6px 10px",
  verticalAlign: "middle",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "4px 6px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 13,
  boxSizing: "border-box",
};
