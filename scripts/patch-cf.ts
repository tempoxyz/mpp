// Patches the build output for Cloudflare Workers compatibility.
// TODO: upstream compat patches to vocs

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const ssrAssetsDir = path.resolve(process.cwd(), "dist/server/ssr/assets");
const serverAssetsDir = path.resolve(process.cwd(), "dist/server/assets");
const serverDir = path.resolve(process.cwd(), "dist/server");

if (!fs.existsSync(ssrAssetsDir)) {
	console.log("⚠ SSR assets directory not found, skipping patches");
	process.exit(0);
}

// Create a minimal vocs.config.js that just exports the config object directly
// (vocs/config exports defineConfig which is just an identity function)
const vocsConfigSrc = (() => {
	const tsx = path.resolve(process.cwd(), "vocs.config.tsx");
	if (fs.existsSync(tsx)) return tsx;
	return path.resolve(process.cwd(), "vocs.config.ts");
})();
const vocsConfigDest = path.join(serverDir, "vocs.config.js");
if (fs.existsSync(vocsConfigSrc)) {
	let configContent = fs.readFileSync(vocsConfigSrc, "utf-8");

	// Inline sidebar if imported
	const sidebarImportMatch = configContent.match(
		/import\s*\{\s*sidebar\s*\}\s*from\s*["']\.\/sidebar["'];?/,
	);
	if (sidebarImportMatch) {
		const sidebarSrc = path.resolve(process.cwd(), "sidebar.ts");
		if (fs.existsSync(sidebarSrc)) {
			const sidebarContent = fs.readFileSync(sidebarSrc, "utf-8");
			// Extract the sidebar object (remove imports and type annotations)
			const sidebarStripped = sidebarContent
				.replace(/import\s+type\s*\{[^}]+\}\s*from\s*["'][^"']+["'];?/g, "")
				.replace(/\s*as\s+const\s+satisfies\s+Config\['sidebar'\]/, "");
			// Remove the import and prepend the inlined sidebar
			configContent = configContent
				.replace(sidebarImportMatch[0], "")
				.replace(
					/export\s+default/,
					`${sidebarStripped}\nexport default`,
				);
			console.log("✓ Inlined sidebar into vocs.config.js");
		}
	}

	// Extract just the config object by replacing imports and defineConfig call
	// McpSource.github({ name, repo }) → { type: "github", name, repo }
	const strippedConfig = configContent
		.replace(/import\s*\{[^}]+\}\s*from\s*["']vocs\/config["'];?/g, "")
		.replace(
			/McpSource\.github\(\s*\{[\s\S]*?name:\s*["']([^"']+)["'][\s\S]*?repo:\s*["']([^"']+)["'][\s\S]*?\}\s*\)/g,
			'{ type: "github", name: "$1", repo: "$2" }',
		)
		.replace(/defineConfig\(/g, "(")
		.replace(/export\s+default/, "export default");

	fs.writeFileSync(vocsConfigDest, strippedConfig);
	console.log("✓ Created minimal vocs.config.js for CF Workers");
}

// Patch SSR assets
const ssrResults = patchSsrAssets(ssrAssetsDir);
for (const result of ssrResults)
	if (result.patched) console.log(`✓ Patched ${result.file}`);

// Patch server assets
if (fs.existsSync(serverAssetsDir)) {
	const serverResults = patchServerAssets(serverAssetsDir);
	for (const result of serverResults)
		if (result.patched) console.log(`✓ Patched ${result.file} (server assets)`);
}

function patchFile(
	filePath: string,
	patches: readonly { search: string | RegExp; replace: string }[],
): boolean {
	let content = fs.readFileSync(filePath, "utf-8");
	let patched = false;

	for (const { search, replace } of patches)
		if (
			typeof search === "string"
				? content.includes(search)
				: search.test(content)
		) {
			content = content.replace(search, replace);
			patched = true;
		}

	if (patched) fs.writeFileSync(filePath, content);

	return patched;
}

function patchSsrAssets(ssrAssetsDir: string) {
	const results: { file: string; patched: boolean }[] = [];
	const files = fs.readdirSync(ssrAssetsDir).filter((f) => f.endsWith(".js"));

	for (const file of files) {
		const filePath = path.join(ssrAssetsDir, file);
		const patched = patchFile(filePath, [
			{
				search: /Function\("return this"\)\(\)/g,
				replace: "globalThis",
			},
			{
				// biome-ignore lint/suspicious/noTemplateCurlyInString: _
				search: "return new Function(`return ${value.slice(9)}`)();",
				replace: `// Skip function deserialization in CF Workers (new Function blocked)
    if (typeof globalThis.caches !== "undefined") return value;
    return new Function(\`return \${value.slice(9)}\`)();`,
			},
		]);

		if (patched) results.push({ file, patched: true });
	}

	return results;
}

function patchServerAssets(serverAssetsDir: string) {
	const results: { file: string; patched: boolean }[] = [];
	const files = fs
		.readdirSync(serverAssetsDir)
		.filter((f) => f.endsWith(".js"));

	for (const file of files) {
		const filePath = path.join(serverAssetsDir, file);
		let content = fs.readFileSync(filePath, "utf-8");
		let patched = false;

		// Patch Ajv's new Function() for schema compilation
		if (
			content.includes(
				// biome-ignore lint/suspicious/noTemplateCurlyInString: _
				"const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);",
			)
		) {
			content = content.replace(
				// biome-ignore lint/suspicious/noTemplateCurlyInString: _
				"const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);",
				`let makeValidate;
      try {
        makeValidate = new Function(\`\${names_1.default.self}\`, \`\${names_1.default.scope}\`, sourceCode);
      } catch (evalErr) {
        // CF Workers blocks new Function() - use passthrough validator
        if (evalErr.name === 'EvalError') {
          makeValidate = () => (data) => { return true; };
        } else {
          throw evalErr;
        }
      }`,
			);
			patched = true;
		}

		// Patch config resolution for CF Workers
		if (
			content.includes(
				'if (server && process.env["NODE_ENV"] === "production")',
			)
		) {
			content = content.replace(
				'if (server && process.env["NODE_ENV"] === "production")',
				'if (server && (process.env["NODE_ENV"] === "production" || typeof globalThis.caches !== "undefined"))',
			);
			patched = true;
		}

		// Patch cacheDir resolution
		if (
			content.includes(
				'cacheDir: cacheDir ?? path.resolve(rootDir, ".vocs/cache"),',
			)
		) {
			content = content.replace(
				'cacheDir: cacheDir ?? path.resolve(rootDir, ".vocs/cache"),',
				'cacheDir: cacheDir ?? path.resolve(rootDir || "/", ".vocs/cache"),',
			);
			patched = true;
		}

		// Patch path.join in infer function
		if (content.includes("const cwd = path.join(rootDir, srcDir, pagesDir);")) {
			content = content.replace(
				"const cwd = path.join(rootDir, srcDir, pagesDir);",
				'const cwd = path.join(rootDir || "/", srcDir || "src", pagesDir || "pages");',
			);
			patched = true;
		}

		// Patch path.resolve with import.meta.dirname
		if (
			content.includes('path.resolve(import.meta.dirname, "../vocs.config.js")')
		) {
			content = content.replace(
				'path.resolve(import.meta.dirname, "../vocs.config.js")',
				'path.resolve(import.meta.dirname || "/", "../vocs.config.js")',
			);
			patched = true;
		}

		// Patch MCP file to use static config import
		if (
			content.includes('import { r as resolve$1 } from "./og.d-') &&
			content.includes("const config = await resolve$1({ server: true });")
		) {
			const ogMatch = content.match(
				/import \{ r as resolve\$1 \} from "\.\/og\.d-([^"]+)\.js";/,
			);
			const ogHash = ogMatch ? ogMatch[1] : "UNKNOWN";

			content = content.replace(
				/import \{ r as resolve\$1 \} from "\.\/og\.d-[^"]+";/,
				`$&
import vocsConfig from "../vocs.config.js";
import { d as define } from "./og.d-${ogHash}.js";`,
			);

			content = content.replace(
				/const config = await resolve\$1\(\{ server: true \}\);/g,
				`const config = typeof globalThis.caches !== "undefined"
      ? define({ ...vocsConfig, rootDir: "/" })  // CF Workers - use static import
      : await resolve$1({ server: true });`,
			);
			patched = true;
		}

		// Return informative response for GET in CF Workers (SSE hangs)
		if (content.includes("async function GET() {")) {
			content = content.replace(
				"async function GET() {",
				`async function GET() {
  // CF Workers: SSE-based MCP transport causes hangs (Workers can't keep connections open indefinitely)
  // Use the Streamable HTTP transport via POST instead
  if (typeof globalThis.caches !== "undefined") {
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message: "SSE transport not available in Workers. Use POST with Streamable HTTP transport."
      },
      id: null
    }), {
      status: 501,
      headers: { "Content-Type": "application/json" }
    });
  }`,
			);
			patched = true;
		}

		// Fix the _write call in createResponse to be awaited
		if (content.includes("this._write(`event: endpoint")) {
			content = content.replace(
				`this._write(\`event: endpoint
data: \${endpointUrl}

\`);
    return new Response(readable,`,
				`// Await the initial write to ensure it completes
    await this._write(\`event: endpoint
data: \${endpointUrl}

\`);
    return new Response(readable,`,
			);
			content = content.replace(
				"createResponse() {",
				"async createResponse() {",
			);
			content = content.replace(
				"return transport.createResponse();",
				"return await transport.createResponse();",
			);
			patched = true;
		}

		// Patch MCP createServer to skip filesystem-based tools
		// Note: vocs uses minpath.resolve, not path.resolve
		const pagesDirPatterns = [
			"const pagesDir = path.resolve(config.rootDir, config.srcDir, config.pagesDir);",
			"const pagesDir = minpath.resolve(config.rootDir, config.srcDir, config.pagesDir);",
		];
		for (const pattern of pagesDirPatterns) {
			if (content.includes(pattern)) {
				content = content.replace(
					pattern,
					`// Skip filesystem-based tools in CF Workers (fs.glob/readFile don't work)
  if (typeof globalThis.caches === "undefined") {
    ${pattern}`,
				);
				patched = true;
				break;
			}
		}

		// Close the if block before the sources registration
		if (
			content.includes(
				"const sources = (config.mcp?.sources ?? []).map((s, i) => ({",
			)
		) {
			content = content.replace(
				"const sources = (config.mcp?.sources ?? []).map((s, i) => ({",
				`} // end skip filesystem tools in CF Workers
  const sources = (config.mcp?.sources ?? []).map((s, i) => ({`,
			);
			patched = true;
		}

		// Patch OG image WASM to use pre-compiled module import
		if (
			content.includes("const wasmUrl = new URL(wasm, url.origin);") &&
			content.includes(
				"const module = await fetch(wasmUrl).then((r) => r.arrayBuffer());",
			)
		) {
			content = content.replace(
				`const wasmUrl = new URL(wasm, url.origin);
      const module = await fetch(wasmUrl).then((r) => r.arrayBuffer());`,
				`// CF Workers: use pre-compiled WASM module import (WebAssembly.instantiate blocked)
      let module;
      if (typeof globalThis.caches !== "undefined" && typeof takumiWasmModule !== "undefined") {
        // Use statically imported WASM module for Workers
        module = takumiWasmModule;
      } else {
        const wasmUrl = new URL(wasm, url.origin);
        module = await fetch(wasmUrl).then((r) => r.arrayBuffer());
      }`,
			);
			patched = true;
		}

		// Patch CodeToHtml to avoid Shiki WASM on Workers
		if (content.includes("async function CodeToHtml(props) {")) {
			content = content.replace(
				"async function CodeToHtml(props) {",
				`async function CodeToHtml(props) {
  // CF Workers: avoid Shiki WASM (WebAssembly.instantiate blocked)
  if (typeof globalThis.caches !== "undefined") {
    const { code: code2 } = props;
    return jsxRuntime_reactServerExports.jsx("pre", {
      className: "shiki",
      children: jsxRuntime_reactServerExports.jsx("code", { children: code2 })
    });
  }`,
			);
			patched = true;
		}

		// Patch OG image handler's resolve() call
		const isOgFile = content.includes('const wasm = "/assets/takumi_wasm_bg-');
		if (
			content.includes('import { r as resolve } from "./og.d-') &&
			content.includes("const config = await resolve({ server: true });")
		) {
			const ogMatch = content.match(
				/import \{ r as resolve \} from "\.\/og\.d-([^"]+)\.js";/,
			);
			const ogHash = ogMatch ? ogMatch[1] : "UNKNOWN";

			if (isOgFile) {
				const wasmMatch = content.match(
					/const wasm = "\/assets\/takumi_wasm_bg-([^"]+)\.wasm";/,
				);
				const wasmHash = wasmMatch ? wasmMatch[1] : "UNKNOWN";
				content = content.replace(
					/import \{ r as resolve \} from "\.\/og\.d-[^"]+";/,
					`$&
import vocsConfig from "../vocs.config.js";
import { d as define } from "./og.d-${ogHash}.js";
import takumiWasmModule from "./takumi_wasm_bg-${wasmHash}.wasm";`,
				);
			} else {
				content = content.replace(
					/import \{ r as resolve \} from "\.\/og\.d-[^"]+";/,
					`$&
import vocsConfig from "../vocs.config.js";
import { d as define } from "./og.d-${ogHash}.js";`,
				);
			}

			content = content.replace(
				"const config = await resolve({ server: true });",
				`const config = typeof globalThis.caches !== "undefined"
        ? define({ ...vocsConfig, rootDir: "/" })  // CF Workers - use static import
        : await resolve({ server: true });`,
			);
			patched = true;
		}

		// Patch OG image handler to fetch TTF font
		if (content.includes('fonts: [{ name: "Inter", data: font }]')) {
			content = content.replace(
				'fonts: [{ name: "Inter", data: font }]',
				`fonts: await (async () => {
          // CF Workers WASM: WOFF2 not supported, fetch variable TTF font
          if (typeof globalThis.caches !== "undefined") {
            try {
              // Inter Variable TTF - supports weights 100-900
              const fontData = await globalThis.__WAKU_SERVER_ENV__?.ASSETS?.fetch(
                new Request(new URL("/assets/Inter.ttf", url.origin))
              ).then(r => r.arrayBuffer());
              if (fontData) return [{ name: "Inter", data: new Uint8Array(fontData) }];
            } catch (e) {
              console.error("Failed to fetch variable TTF font:", e);
            }
            return [{ name: "Inter", data: font }]; // fallback to embedded WOFF2
          }
          return [{ name: "Inter", data: font }];
        })()`,
			);
			patched = true;
		}

		// Patch the assetUrl construction for AI agent requests
		if (
			content.includes(
				// biome-ignore lint/suspicious/noTemplateCurlyInString: _
				"const assetUrl = new URL(`/assets/md${url.pathname}`, url.origin);",
			)
		) {
			content = content.replace(
				// biome-ignore lint/suspicious/noTemplateCurlyInString: _
				"const assetUrl = new URL(`/assets/md${url.pathname}`, url.origin);",
				`// Append .md extension for AI agent requests without .md suffix
    const mdPath = url.pathname.endsWith(".md") ? url.pathname : url.pathname + ".md";
    const assetUrl = new URL(\`/assets/md\${mdPath}\`, url.origin);`,
			);
			patched = true;
		}

		// Patch middleware's globalThis.fetch() for .md files
		if (
			content.includes("const response = await globalThis.fetch(assetUrl);")
		) {
			content = content.replace(
				"const response = await globalThis.fetch(assetUrl);",
				`// CF Workers: use ASSETS binding instead of self-fetch
    let response;
    if (typeof globalThis.caches !== "undefined" && globalThis.__WAKU_SERVER_ENV__?.ASSETS) {
      // Use ASSETS binding to fetch static files directly
      const assetPath = assetUrl.pathname;
      response = await globalThis.__WAKU_SERVER_ENV__.ASSETS.fetch(new Request(assetUrl));
    } else {
      response = await globalThis.fetch(assetUrl);
    }`,
			);
			patched = true;
		}

		if (patched) {
			fs.writeFileSync(filePath, content);
			results.push({ file, patched: true });
		}
	}

	return results;
}
