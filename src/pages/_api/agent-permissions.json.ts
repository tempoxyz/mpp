import permissions from "../../../public/agent-permissions.json?raw";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

export function GET() {
  return new Response(permissions, { headers });
}

export function HEAD() {
  return new Response(null, { headers });
}
