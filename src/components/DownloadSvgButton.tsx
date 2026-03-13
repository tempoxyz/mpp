"use client";

export function DownloadSvgButton({ files }: { files: string[] }) {
  return (
    <button
      type="button"
      onClick={() => {
        files.forEach((f, i) => {
          setTimeout(() => {
            const a = document.createElement("a");
            a.href = f;
            a.download = f.split("/").pop() ?? f;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }, i * 200);
        });
      }}
      style={{
        fontSize: "12px",
        color: "var(--vocs-text-color-muted)",
        whiteSpace: "nowrap",
        marginLeft: "1rem",
        border: "1px solid var(--vocs-border-color-primary)",
        borderRadius: "8px",
        padding: "0.5rem 1rem",
        backgroundColor: "var(--vocs-background-color-primary)",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
      }}
    >
      Download SVG
    </button>
  );
}
