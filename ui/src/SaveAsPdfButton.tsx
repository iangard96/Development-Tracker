// ui/src/SaveAsPdfButton.tsx
export default function SaveAsPdfButton({ style }: { style?: React.CSSProperties }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        padding: "6px 12px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "var(--card)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
        ...style,
      }}
    >
      Save as PDF
    </button>
  );
}
