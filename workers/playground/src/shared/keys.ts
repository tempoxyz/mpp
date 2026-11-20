// Every key the Worker needs comes from one secret, MPP_PRIVATE_KEY (the payee account). Each
// playground derives its own challenge secret from it with a domain-separated hash.
import { concat, type Hex, keccak256, toHex } from "viem";

/** The HMAC secret that binds challenge IDs for one playground. */
export function secretKey(privateKey: string, playground: string): string {
  return keccak256(
    concat([
      privateKey as Hex,
      toHex(`mpp-${playground}-playground/mpp-secret-key`),
    ]),
  );
}
