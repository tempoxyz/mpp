// Prints the public half of the Worker's keys, all derived from MPP_PRIVATE_KEY:
// the payee address and the issuer's Ed25519 public key (the JWKS the Worker serves).
//
// Reads MPP_PRIVATE_KEY (and an ISSUER_PRIVATE_KEY override) from the environment or .dev.vars.
import * as fs from "node:fs";

import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import * as Issuer from "./issuer.js";

const file = new URL("../.dev.vars", import.meta.url);
const vars = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
/** A variable from the environment, else from .dev.vars, as the Worker sees it locally. */
const read = (name: string) =>
  process.env[name] ??
  vars.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]?.trim();
const privateKey = read("MPP_PRIVATE_KEY");
if (!privateKey)
  throw new Error("Set MPP_PRIVATE_KEY (see README: cast wallet new).");

const { keyId, publicJwk } = await Issuer.key({
  ISSUER_PRIVATE_KEY: read("ISSUER_PRIVATE_KEY"),
  MPP_PRIVATE_KEY: privateKey,
});
console.log(
  `Payee address:     ${privateKeyToAccount(privateKey as Hex).address}`,
);
console.log(`Issuer key ID:     ${keyId}`);
console.log(`Issuer public key: ${publicJwk.x} (Ed25519, base64url)`);
