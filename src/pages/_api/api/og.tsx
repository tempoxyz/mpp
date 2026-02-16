import { Handler } from "vocs/server";

export default function handler(request: Request) {
  return Handler.og(({ title, description }) => (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        backgroundColor: "#0a0a0a",
        padding: "60px 80px 120px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            fontSize: title.length < 15 ? 80 : 64,
            fontWeight: 700,
            color: "white",
          }}
        >
          {title}
        </div>

        {description && (
          <div
            style={{
              fontSize: "24px",
              color: "#a1a1aa",
            }}
          >
            {description.length > 120
              ? `${description.slice(0, 120)}...`
              : description}
          </div>
        )}
      </div>
    </div>
  )).fetch(request);
}
