// The pages' shared files, when mpp.dev runs without a build of the playgrounds (local dev):
// a build copies them to public/ (scripts/copy-playground.ts), which Vercel serves first.
import { proxy } from "../../../../playground-proxy.ts";

export const GET = proxy;
export const HEAD = proxy;
