// ui/src/ProjectContacts.tsx
import { useEffect, useState } from "react";
import { useProject } from "./ProjectContext";
import {
  fetchProjectContacts,
  createProjectContact,
  updateProjectContact,
} from "./api";
import type { ProjectContact } from "./types";

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

let tempId = -1;
const blankRow = (): ContactRow => ({
  id: tempId--, // temporary client id; replaced when created
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
  const { projectId, project } = useProject();
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expandedCell, setExpandedCell] = useState<{ id: number; field: keyof ContactRow } | null>(null);

  // load contacts for current project
  useEffect(() => {
    if (!projectId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setErr(null);
    fetchProjectContacts(projectId)
      .then((data: ProjectContact[]) => {
        const mapped = data.map((c) => ({
          id: c.id,
          organization: c.organization ?? "",
          type: c.type ?? "",
          responsibility: c.responsibility ?? "",
          name: c.name ?? "",
          title: c.title ?? "",
          email: c.email ?? "",
          phone1: c.phone1 ?? "",
          phone2: c.phone2 ?? "",
        }));
        setRows(mapped);
      })
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [projectId]);

  async function persistRow(row: ContactRow) {
    if (!projectId) return;
    try {
      if (row.id > 0) {
        await updateProjectContact(row.id, {
          organization: row.organization || null,
          type: row.type || null,
          responsibility: row.responsibility || null,
          name: row.name || null,
          title: row.title || null,
          email: row.email || null,
          phone1: row.phone1 || null,
          phone2: row.phone2 || null,
        });
      } else {
        const created = await createProjectContact({
          project: projectId,
          organization: row.organization || null,
          type: row.type || null,
          responsibility: row.responsibility || null,
          name: row.name || null,
          title: row.title || null,
          email: row.email || null,
          phone1: row.phone1 || null,
          phone2: row.phone2 || null,
        });
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, id: created.id } : r)),
        );
      }
    } catch (e) {
      console.warn("Failed to persist contact row", e);
    }
  }

  function updateCell(id: number, field: keyof ContactRow, value: string) {
    setRows((prev) => {
      const nextRows = prev.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      );
      const target = nextRows.find((r) => r.id === id);
      if (target) {
        persistRow(target);
      }
      return nextRows;
    });
  }

  function addRow() {
    setRows((prev) => [...prev, blankRow()]);
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (id > 0) {
      // Best-effort delete on server
      fetch(
        `${
          import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8010"
        }/api/project-contacts/${id}/`,
        { method: "DELETE" },
      ).catch((e) => console.warn("Failed to delete contact", e));
    }
  }

  if (!projectId) {
    return (
      <div className="page-root" style={{ color: "#6b7280", fontSize: 14 }}>
        Select a project from the Project Summary to manage its contacts.
      </div>
    );
  }

  if (loading) {
    return <div className="page-root">Loading contacts…</div>;
  }

  if (err) {
    return <div className="page-root">Error loading contacts: {err}</div>;
  }

  const projectName = project?.project_name || "Project";
  const renderCell = (
    row: ContactRow,
    field: keyof ContactRow,
    opts: { placeholder?: string; type?: string } = {},
  ) => {
    const value = row[field] ?? "";
    const expanded =
      expandedCell && expandedCell.id === row.id && expandedCell.field === field;
    if (expanded) {
      return (
        <textarea
          value={value}
          onChange={(e) => updateCell(row.id, field, e.target.value)}
          onBlur={() => setExpandedCell(null)}
          autoFocus
          rows={4}
          style={{ ...input, ...expandedInput }}
        />
      );
    }
    return (
      <input
        type={opts.type ?? "text"}
        value={value}
        placeholder={opts.placeholder}
        title={value}
        onMouseEnter={(e) => {
          e.currentTarget.title = e.currentTarget.value;
        }}
        onChange={(e) => updateCell(row.id, field, e.target.value)}
        onDoubleClick={() => setExpandedCell({ id: row.id, field })}
        style={input}
      />
    );
  };

  return (
    <div className="page-root">
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 32px" }}>
        {projectName}
      </h1>
      <h2 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 16px" }}>
        Project Contacts
      </h2>
      <p style={{ marginBottom: 16, color: "#6b7280", fontSize: 13 }}>
        {project ? `For ${project.project_name}` : null} — Track key
        organizations and people involved with this project.
      </p>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          overflowX: "auto",
          background: "#ffffff",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
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
                  {renderCell(row, "organization")}
                </td>

                <td style={td}>
                  {renderCell(row, "type", {
                    placeholder: "Owner, Utility, EPC...",
                  })}
                </td>

                <td style={td}>
                  {renderCell(row, "responsibility", {
                    placeholder: "Interconnection, Permitting, etc.",
                  })}
                </td>

                <td style={td}>
                  {renderCell(row, "name")}
                </td>

                <td style={td}>
                  {renderCell(row, "title")}
                </td>

                <td style={td}>
                  {renderCell(row, "email", { type: "email" })}
                </td>

                <td style={td}>
                  {renderCell(row, "phone1")}
                </td>

                <td style={td}>
                  {renderCell(row, "phone2")}
                </td>

                <td style={{ ...td, textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    style={{
                      border: "1px solid #fecaca",
                      borderRadius: 5,
                      padding: "5px 10px",
                      fontSize: 12,
                      background: "#fee2e2",
                      color: "#7f1d1d",
                      cursor: "pointer",
                      opacity: 1,
                      transition: "all 0.15s ease",
                    }}
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
          borderRadius: 5,
          border: "1px solid #d1d5db",
          padding: "6px 12px",
          fontSize: 13,
          fontWeight: 500,
          background: "#ffffff",
          color: "#374151",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        + Add Contact
      </button>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 600,
  fontSize: 12,
  color: "#6b7280",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  background: "#f3f4f6",
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "middle",
  fontSize: 13,
  color: "#1f2937",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: 5,
  border: "1px solid #e5e7eb",
  fontSize: 13,
  boxSizing: "border-box",
  background: "white",
  color: "#1f2937",
};
const expandedInput: React.CSSProperties = {
  minHeight: 64,
  paddingTop: 8,
  paddingBottom: 8,
  resize: "vertical",
  whiteSpace: "pre-wrap",
  lineHeight: 1.4,
};
