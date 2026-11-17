import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  type SampleTier,
  serverUsage,
  usage,
} from "../workers/playground/src/identity/app/samples.js";

const directory = path.resolve("workers/playground/src/identity/app");
const tiers: SampleTier[] = ["anonymous", "email", "apiKey", "link"];
const samples = tiers.flatMap((tier) => [
  { name: `${tier}-client`, source: usage(tier) },
  { name: `${tier}-server`, source: serverUsage(tier) },
  {
    name: `${tier}-client-inputs`,
    source: usage(
      tier,
      "o'brien@example.com",
      "key'\\\"\n",
      "a 'quoted' topic\n",
    ),
  },
]);
const sources = new Map(
  samples.map(({ name, source }) => [
    path.join(directory, `${name}.ts`),
    source,
  ]),
);
const invalidCurrency = path.join(directory, "invalid-currency.ts");
const invalidRecipient = path.join(directory, "invalid-recipient.ts");
sources.set(
  invalidCurrency,
  serverUsage("anonymous").replace(
    "'0x20c0000000000000000000006a37DA5C996874BE'",
    "OUSD",
  ),
);
sources.set(
  invalidRecipient,
  serverUsage("anonymous").replace(
    "recipient: options.recipient,",
    "recipient: { address: options.recipient },",
  ),
);
const options: ts.CompilerOptions = {
  lib: ["lib.esnext.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  noEmit: true,
  skipLibCheck: true,
  strict: true,
  target: ts.ScriptTarget.ESNext,
  types: [],
};
const host = ts.createCompilerHost(options);
const readSourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (
  fileName,
  languageVersion,
  onError,
  shouldCreateNewSourceFile,
) => {
  const source = sources.get(fileName);
  return source === undefined
    ? readSourceFile(
        fileName,
        languageVersion,
        onError,
        shouldCreateNewSourceFile,
      )
    : ts.createSourceFile(fileName, source, languageVersion, true);
};
// Resolve imports from the Worker, so examples use its SDK version, not the site's.
const program = ts.createProgram([...sources.keys()], options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (name) => name,
  getCurrentDirectory: () => process.cwd(),
  getNewLine: () => "\n",
};

describe("identity playground displayed samples", () => {
  it.each([
    { file: invalidCurrency, code: 2304 },
    { file: invalidRecipient, code: 2322 },
  ])("rejects invalid sample $file", ({ file, code }) => {
    expect(
      diagnostics.some((d) => d.file?.fileName === file && d.code === code),
    ).toBe(true);
  });

  it("has no compiler configuration errors", () => {
    expect(
      ts.formatDiagnostics(
        diagnostics.filter((d) => !d.file),
        formatHost,
      ),
    ).toBe("");
  });

  it.each(samples)("compiles $name against the installed SDK", ({ name }) => {
    const file = path.join(directory, `${name}.ts`);
    expect(
      ts.formatDiagnostics(
        diagnostics.filter((d) => d.file?.fileName === file),
        formatHost,
      ),
    ).toBe("");
  });
});
