import type { VercelRequest, VercelResponse } from "@vercel/node";
import FormData from "form-data";
import Mailgun from "mailgun.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      name,
      homepage,
      docs,
      icon,
      github,
      email,
      telegram,
      terms,
      firstParty,
    } = req.body ?? {};

    if (!name || !homepage || !docs || !icon || !github || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!terms) {
      return res.status(400).json({ error: "Terms must be accepted" });
    }

    const submission = {
      name,
      homepage,
      docs,
      icon,
      github,
      email,
      telegram: telegram || null,
      firstParty: !!firstParty,
      submittedAt: new Date().toISOString(),
    };

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    await Promise.all([
      storeBlob(slug, submission),
      sendNotification(slug, submission),
    ]);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("submit-service error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function storeBlob(slug: string, submission: Record<string, unknown>) {
  try {
    const { put } = await import("@vercel/blob");
    const key = `service-submissions/${Date.now()}-${slug}.json`;
    await put(key, JSON.stringify(submission, null, 2), {
      access: "public",
      contentType: "application/json",
    });
  } catch {
    console.log(
      "Service submission (blob unavailable):",
      JSON.stringify(submission),
    );
  }
}

async function sendNotification(
  slug: string,
  submission: Record<string, unknown>,
) {
  const apiKey = process.env.MAILGUN_API_KEY;
  if (!apiKey) {
    console.log("Service submission (mailgun unavailable):", slug);
    return;
  }

  const mg = new Mailgun(FormData).client({ username: "api", key: apiKey });
  await mg.messages.create("tempo.xyz", {
    from: "MPP <mpp@tempo.xyz>",
    to: ["achal@tempo.xyz"],
    subject: `New service submission: ${submission.name}`,
    text: [
      `Name: ${submission.name}`,
      `Homepage: ${submission.homepage}`,
      `Docs: ${submission.docs}`,
      `Icon: ${submission.icon}`,
      `GitHub: ${submission.github}`,
      `Email: ${submission.email}`,
      `Telegram: ${submission.telegram ?? "—"}`,
      `First-party: ${submission.firstParty}`,
      `Submitted: ${submission.submittedAt}`,
    ].join("\n"),
  });
}
