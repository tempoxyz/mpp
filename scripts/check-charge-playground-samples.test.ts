import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as Charge from "../workers/playground/src/charge/app/samples.js";
import * as Discovery from "../workers/playground/src/discovery/app/samples.js";
import * as Zones from "../workers/playground/src/zones/app/samples.js";

// The charge, discovery and zones playgrounds' code panes, compiled against the Worker's SDK.
const directory = path.resolve("workers/playground/src/shared");
const samples = [
  { name: "charge-client", source: Charge.client },
  { name: "charge-server", source: Charge.server },
  { name: "discovery-client", source: Discovery.client },
  { name: "discovery-server", source: Discovery.server },
  { name: "zones-client", source: Zones.client },
  { name: "zones-server", source: Zones.server },
];
const sources = new Map(
  samples.map(({ name, source }) => [
    path.join(directory, `${name}.ts`),
    source,
  ]),
);
const invalid = path.join(directory, "invalid-charge.ts");
sources.set(
  invalid,
  Charge.server.replace("result.withReceipt(", "result.withReciept("),
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

describe("charge, discovery and zones playground displayed samples", () => {
  it("rejects an invalid sample", () => {
    expect(
      diagnostics.some((d) => d.file?.fileName === invalid && d.code === 2551),
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
