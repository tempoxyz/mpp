import skill from "../../../../../../public/.well-known/agent-skills/mppx/SKILL.md?raw";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300",
  "Content-Type": "text/markdown; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

export function GET() {
  return new Response(skill, { headers });
}

export function HEAD() {
  return new Response(null, { headers });
}
