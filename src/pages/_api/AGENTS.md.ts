import agents from "../../../public/AGENTS.md?raw";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300",
  "Content-Type": "text/markdown; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

export function GET() {
  return new Response(agents, { headers });
}

export function HEAD() {
  return new Response(null, { headers });
}
