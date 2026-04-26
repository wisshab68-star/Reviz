"use client";

export function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => { void navigator.clipboard.writeText(text); }}
      style={{ flexShrink: 0, background: "rgba(47,91,255,0.2)", border: "1px solid rgba(47,91,255,0.4)", color: "#7B9FFF", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
    >
      Copier
    </button>
  );
}
