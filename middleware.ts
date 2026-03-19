export default function middleware(request: Request) {
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
  if (!deploymentId) return;

  const cookie = request.headers.get("cookie") ?? "";
  if (cookie.includes("__vdpl=")) return;

  return new Response(null, {
    status: 200,
    headers: {
      "x-middleware-next": "1",
      "set-cookie": `__vdpl=${deploymentId}; Path=/; HttpOnly; SameSite=Strict`,
    },
  });
}
