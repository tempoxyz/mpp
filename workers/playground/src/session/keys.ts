// Every key the Worker needs comes from one secret, MPP_PRIVATE_KEY (the payee account, from
// `cast wallet new`). The challenge secret is derived from it with a domain-separated hash, so a
// deployment sets one secret and nothing else can drift out of sync with it.
import { concat, type Hex, keccak256, toHex } from "viem";

/** The HMAC secret that binds challenge IDs. */
export function secretKey(privateKey: string): string {
  return keccak256(
    concat([privateKey as Hex, toHex("mpp-session-playground/mpp-secret-key")]),
  );
}
