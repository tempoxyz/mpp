// Tempo ID sign-in for the playground: OAuth's authorization code flow with PKCE, in a popup.
// Tempo ID returns the popup to the playground itself, which hands the code to its opener; the
// opener redeems it at Tempo ID's token endpoint, which allows any origin.

/** The page's Tempo ID settings, from /api/config. */
export type Config = { clientId: string; issuer: string; redirectUri: string };

/** A signed-in user: the tokens the haiku API reads. */
export type Session = {
  accessToken: string;
  /** The user's email, from the ID token, when they shared it. */
  email?: string | undefined;
  expiresAt: number;
  idToken?: string | undefined;
};

const storageKey = "playground.tempoId";
const messageType = "tempo-id:code";
// mpp.dev sends Cross-Origin-Opener-Policy: same-origin, so the popup loses window.opener once it
// visits id.tempo.xyz, and the page sees it as closed. The two pages share an origin, so the
// popup hands the code back on a BroadcastChannel instead.
const channelName = "playground.tempoId";

/** The stored session, unless it expired. */
export function load(): Session | undefined {
  // The page is prerendered, where there is no storage.
  if (typeof sessionStorage === "undefined") return undefined;
  const stored = sessionStorage.getItem(storageKey);
  if (!stored) return undefined;
  const session = JSON.parse(stored) as Session;
  if (Date.now() > session.expiresAt - 60_000) {
    sessionStorage.removeItem(storageKey);
    return undefined;
  }
  return session;
}

/** Forgets the session. */
export function signOut() {
  sessionStorage.removeItem(storageKey);
}

/**
 * In the popup Tempo ID returned to: hands the code to the opener and closes. Returns whether
 * this page was such a return, so the app renders nothing else.
 */
export function handleReturn(): boolean {
  const params = new URLSearchParams(location.search);
  const state = params.get("state");
  if (!state?.startsWith("tempo-id.")) return false;
  const channel = new BroadcastChannel(channelName);
  channel.postMessage({
    code: params.get("code"),
    error: params.get("error_description") ?? params.get("error"),
    state,
    type: messageType,
  });
  channel.close();
  window.close();
  // A browser that keeps the window open shows where to go next.
  document.body.textContent = "Signed in. You can close this window.";
  return true;
}

/** Signs in with Tempo ID in a popup. Call it from a click, so the popup isn't blocked. */
export async function signIn(config: Config): Promise<Session> {
  // Open the popup before any await, while the click still counts as a user gesture.
  const popup = window.open(
    "about:blank",
    "tempo-id",
    "popup,width=480,height=720",
  );
  if (!popup) throw new Error("Allow popups to sign in with Tempo ID.");
  const verifier = random(32);
  const state = `tempo-id.${random(16)}`;
  const challenge = base64url(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
    ),
  );
  const url = new URL("/oauth2/authorize", config.issuer);
  url.search = new URLSearchParams({
    client_id: config.clientId,
    code_challenge: challenge,
    code_challenge_method: "S256",
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email",
    state,
  }).toString();
  popup.location.href = url.toString();

  const code = await new Promise<string>((resolve, reject) => {
    // popup.closed reads true as soon as the popup leaves mpp.dev, so wait on a timer instead.
    const channel = new BroadcastChannel(channelName);
    const timeout = setTimeout(() => {
      done();
      reject(new Error("Tempo ID sign-in timed out. Try again."));
    }, 5 * 60_000);
    function done() {
      clearTimeout(timeout);
      channel.close();
    }
    function listen(event: MessageEvent) {
      const data = event.data as {
        code?: string | null;
        error?: string | null;
        state?: string;
        type?: string;
      };
      if (data?.type !== messageType) return;
      if (data.state !== state) return;
      done();
      if (data.code) resolve(data.code);
      else reject(new Error(data.error ?? "Tempo ID sign-in failed."));
    }
    channel.onmessage = listen;
  });

  const response = await fetch(new URL("/oauth2/token", config.issuer), {
    body: new URLSearchParams({
      client_id: config.clientId,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    }),
    method: "POST",
  });
  const tokens = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    error_description?: string;
    expires_in?: number;
    id_token?: string;
  };
  if (!response.ok || !tokens.access_token)
    throw new Error(
      tokens.error_description ??
        `Tempo ID refused the sign-in (${response.status}).`,
    );
  const session: Session = {
    accessToken: tokens.access_token,
    email: tokens.id_token ? claims(tokens.id_token).email : undefined,
    expiresAt: Date.now() + (tokens.expires_in ?? 300) * 1000,
    idToken: tokens.id_token,
  };
  sessionStorage.setItem(storageKey, JSON.stringify(session));
  return session;
}

/** The claims of a JWT, unverified: the page only reads its own ID token's email. */
function claims(jwt: string): { email?: string } {
  const payload = jwt.split(".")[1] ?? "";
  try {
    return JSON.parse(
      atob(payload.replaceAll("-", "+").replaceAll("_", "/")),
    ) as { email?: string };
  } catch {
    return {};
  }
}

function random(bytes: number) {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}
