import { readFileSync } from "node:fs";
import sharp from "sharp";

const iconSvg = readFileSync("public/mpp-icon.svg");
const iconDarkSvg = readFileSync("public/mpp-icon-dark.svg");

// Brand accent color
const BRAND_BLUE = "#0166FF";

// Create a blue background with white logo for favicons
async function createFaviconWithBackground(size: number, outputPath: string) {
	const padding = Math.round(size * 0.1);
	const logoSize = size - padding * 2;

	const background = sharp({
		create: {
			width: size,
			height: size,
			channels: 4,
			background: BRAND_BLUE,
		},
	});

	const logo = await sharp(iconSvg).resize(logoSize, logoSize).toBuffer();

	await background
		.composite([{ input: logo, left: padding, top: padding }])
		.png()
		.toFile(outputPath);
}

// Generate favicon PNGs
await Promise.all([
	// 16x16 favicon (blue background with white logo)
	createFaviconWithBackground(16, "public/favicon-16x16.png"),

	// 32x32 favicon (blue background with white logo)
	createFaviconWithBackground(32, "public/favicon-32x32.png"),

	// Light mode icon (white logo for dark backgrounds)
	sharp(iconSvg)
		.resize(64, 64)
		.png()
		.toFile("public/icon-dark.png"),

	// Dark mode icon (dark logo for light backgrounds)
	sharp(iconDarkSvg)
		.resize(64, 64)
		.png()
		.toFile("public/icon-light.png"),
]);

console.log("Generated favicons:");
console.log("  - public/favicon-16x16.png");
console.log("  - public/favicon-32x32.png");
console.log("  - public/icon-dark.png");
console.log("  - public/icon-light.png");
