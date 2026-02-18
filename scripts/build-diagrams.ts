import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const DIAGRAMS_DIR = path.resolve(import.meta.dirname, "../diagrams");
const OUTPUT_DIR = path.resolve(import.meta.dirname, "../public/diagrams");

// Minimal mermaid config - we'll override styles in post-processing
const mermaidConfig = {
  theme: "base",
  themeVariables: {
    primaryColor: "#ffffff",
    primaryTextColor: "#000000",
    primaryBorderColor: "#000000",
    lineColor: "#000000",
    noteBkgColor: "#ffffff",
    noteBorderColor: "#000000",
  },
};

// Minimal embedded styles - main styling is in styles.css
const customStyles = `
/* Base reset - actual colors come from styles.css */
svg { background: transparent !important; }
`;

function postProcessSvg(svgContent: string): string {
  let processed = svgContent;

  // Find and remove the existing <style> block
  processed = processed.replace(/<style>[\s\S]*?<\/style>/g, "");

  // Insert our custom styles right after the opening <svg> tag
  const svgOpenMatch = processed.match(/<svg[^>]*>/);
  if (svgOpenMatch) {
    const insertPoint = svgOpenMatch.index! + svgOpenMatch[0].length;
    processed =
      processed.slice(0, insertPoint) +
      `<style>${customStyles}</style>` +
      processed.slice(insertPoint);
  }

  // Make SVG responsive (only in the root svg tag)
  processed = processed.replace(
    /<svg([^>]*)\s+width="[^"]*"/,
    '<svg$1 width="100%"',
  );

  // Remove all inline fill/stroke attributes first
  processed = processed.replace(
    /(<(?:rect|line|text|path|tspan)[^>]*)\s+fill="[^"]*"/g,
    "$1",
  );
  processed = processed.replace(
    /(<(?:rect|line|text|path|tspan)[^>]*)\s+stroke="[^"]*"/g,
    "$1",
  );
  processed = processed.replace(
    /<line([^>]*)\s+stroke-width="[^"]*"/g,
    "<line$1",
  );

  // Remove inline style attributes BUT preserve text-anchor for centering
  processed = processed.replace(/\s+style="([^"]*)"/g, (_match, styles) => {
    // Keep text-anchor if present
    const textAnchor = styles.match(/text-anchor:\s*([^;]+)/);
    if (textAnchor) {
      return ` style="text-anchor: ${textAnchor[1].trim()};"`;
    }
    return "";
  });

  // Muted color palette for clean documentation look
  const colors = {
    boxFill: "#ffffff",
    boxStroke: "#d4d4d4",
    noteFill: "#ffffff",
    noteStroke: "#e5e5e5",
    text: "#525252",
    textMuted: "#737373",
    line: "#a3a3a3",
    lifeline: "#e5e5e5",
  };

  // Actor rect boxes: very subtle
  processed = processed.replace(
    /<rect([^>]*class="actor[^"]*")/g,
    `<rect fill="${colors.boxFill}" stroke="${colors.boxStroke}" stroke-width="1"$1`,
  );

  // Note rect boxes: same subtle style
  processed = processed.replace(
    /<rect([^>]*class="note")/g,
    `<rect fill="${colors.noteFill}" stroke="${colors.noteStroke}" stroke-width="1"$1`,
  );

  // Actor text: normal weight
  processed = processed.replace(
    /<text([^>]*class="actor[^"]*")/g,
    `<text fill="${colors.text}" font-weight="400"$1`,
  );

  // Note text: normal weight, slightly muted
  processed = processed.replace(
    /<text([^>]*class="noteText")/g,
    `<text fill="${colors.textMuted}"$1`,
  );

  // Message text: normal weight
  processed = processed.replace(
    /<text([^>]*class="messageText")/g,
    `<text fill="${colors.text}"$1`,
  );

  // Actor lifeline: very light
  processed = processed.replace(
    /<line([^>]*class="actor-line[^"]*")/g,
    `<line stroke="${colors.lifeline}" stroke-width="1" stroke-dasharray="4,4"$1`,
  );

  // Message lines (solid arrows): neutral gray
  processed = processed.replace(
    /<line([^>]*class="messageLine0")/g,
    `<line stroke="${colors.line}" stroke-width="1.5" fill="none"$1`,
  );

  // Message lines (dashed arrows): same gray, just dashed
  processed = processed.replace(
    /<line([^>]*class="messageLine1")/g,
    `<line stroke="${colors.line}" stroke-width="1.5" fill="none" stroke-dasharray="6,3"$1`,
  );

  // Update arrowhead to match
  processed = processed.replace(
    /<marker([^>]*id="arrowhead"[^>]*)>([\s\S]*?)<path([^>]*)d=/g,
    `<marker$1>$2<path fill="${colors.line}" stroke="${colors.line}" d=`,
  );

  return processed;
}

async function buildDiagrams() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (!fs.existsSync(DIAGRAMS_DIR)) {
    console.log("No diagrams/ directory found, skipping.");
    return;
  }

  // Find all .mmd files
  const files = fs.readdirSync(DIAGRAMS_DIR).filter((f) => f.endsWith(".mmd"));

  if (files.length === 0) {
    console.log("No .mmd files found in diagrams/");
    return;
  }

  console.log(`Found ${files.length} diagram(s) to build...`);

  for (const file of files) {
    const basename = path.basename(file, ".mmd");
    const inputPath = path.join(DIAGRAMS_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, `${basename}.svg`);

    // Write temp config file
    const configPath = path.join(OUTPUT_DIR, ".mermaid-config.json");
    fs.writeFileSync(configPath, JSON.stringify(mermaidConfig, null, 2));

    console.log(`  Generating ${basename}.svg...`);

    try {
      execSync(
        `npx mmdc -i "${inputPath}" -o "${outputPath}" -c "${configPath}" -b transparent`,
        {
          cwd: path.resolve(import.meta.dirname, ".."),
          stdio: "pipe",
        },
      );

      // Post-process the SVG
      console.log(`  Post-processing ${basename}.svg...`);
      const svgContent = fs.readFileSync(outputPath, "utf-8");
      const processedSvg = postProcessSvg(svgContent);
      fs.writeFileSync(outputPath, processedSvg);
    } catch (error) {
      console.error(`  Error building ${file}:`, error);
      process.exit(1);
    }

    // Clean up temp config
    fs.unlinkSync(configPath);
  }

  console.log("Diagrams built successfully!");
}

buildDiagrams();
