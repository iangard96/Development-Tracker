// ui/src/SaveAsPdfButton.tsx
export default function SaveAsPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        padding: "6px 12px",
        borderRadius: 6,
        border: "1px solid #d1d5db",
        background: "#fff",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      Save as PDF
    </button>
  );
}
