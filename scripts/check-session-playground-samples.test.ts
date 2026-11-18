import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  clientBlocks,
  serverBlocks,
  source,
} from "../workers/playground/src/session/app/samples.js";

const directory = path.resolve("workers/playground/src/session/app");
const samples = [
  { name: "session-client", source: source(clientBlocks()) },
  { name: "session-client-deposit", source: source(clientBlocks("0.5")) },
  { name: "session-server", source: source(serverBlocks()) },
];
const sources = new Map(
  samples.map(({ name, source }) => [
    path.join(directory, `${name}.ts`),
    source,
  ]),
);
const invalid = path.join(directory, "invalid-session.ts");
sources.set(
  invalid,
  source(clientBlocks()).replace("session.close()", "session.settle()"),
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

describe("session playground displayed samples", () => {
  it("rejects an invalid sample", () => {
    expect(
      diagnostics.some((d) => d.file?.fileName === invalid && d.code === 2339),
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
