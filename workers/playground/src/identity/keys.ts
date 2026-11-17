// Every key the Worker needs comes from one secret, MPP_PRIVATE_KEY (the payee
// account, from `cast wallet new`). The challenge secret and the issuer's Ed25519 key
// are derived from it with domain-separated hashes, so a deployment sets one secret
// and nothing else can drift out of sync with it.
import { concat, type Hex, keccak256, toBytes, toHex } from "viem";

/** Derives 32 bytes from the payee key for one purpose, named by `label`. */
export function derive(privateKey: string, label: string): Uint8Array {
  return toBytes(
    keccak256(
      concat([privateKey as Hex, toHex(`mpp-identity-fortune/${label}`)]),
    ),
  );
}

/** The HMAC secret that binds challenge IDs. */
export function secretKey(privateKey: string): string {
  return toHex(derive(privateKey, "mpp-secret-key"));
}

/** PKCS#8 header of an Ed25519 private key; the 32-byte seed follows it. */
const pkcs8 = toBytes("0x302e020100300506032b657004220420");

/** The issuer's Ed25519 private key as a JWK, derived from the payee key. */
export async function issuerJwk(privateKey: string): Promise<JsonWebKey> {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    new Uint8Array(concat([pkcs8, derive(privateKey, "issuer-ed25519")])),
    { name: "Ed25519" },
    true,
    ["sign"],
  );
  return crypto.subtle.exportKey("jwk", key) as Promise<JsonWebKey>;
}
