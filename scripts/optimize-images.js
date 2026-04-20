// Одноразовый скрипт оптимизации изображений для сайта.
// Запускается: node scripts/optimize-images.js
// Берёт тяжёлые PNG в static/bg/ и static/, ресайзит до разумного
// размера и конвертирует в WebP с качеством 85-90.

import sharp from "sharp";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(__dirname, "..", "static");

const tasks = [
	{
		src: path.join(staticDir, "bg", "hero.png"),
		dst: path.join(staticDir, "bg", "hero.webp"),
		width: 1920,
		quality: 82
	},
	{
		src: path.join(staticDir, "bg", "plate.png"),
		dst: path.join(staticDir, "bg", "plate.webp"),
		width: 1400,
		quality: 85
	},
	{
		src: path.join(staticDir, "bg", "texture.png"),
		dst: path.join(staticDir, "bg", "texture.webp"),
		width: 1600,
		quality: 80
	},
	{
		// Логотип: оставляем PNG из-за альфа-канала для mix-blend-mode,
		// но ресайзим до разумного размера (было 2048, станет 512)
		src: path.join(staticDir, "logo.png"),
		dst: path.join(staticDir, "logo.png"),
		width: 512,
		quality: 92,
		keepPng: true
	}
];

async function fmt(size) {
	return size > 1024 * 1024
		? `${(size / 1024 / 1024).toFixed(2)} MB`
		: `${(size / 1024).toFixed(1)} KB`;
}

for (const t of tasks) {
	const before = (await stat(t.src)).size;

	const pipeline = sharp(t.src).resize({
		width: t.width,
		withoutEnlargement: true,
		fit: "inside"
	});

	const buf = t.keepPng
		? await pipeline.png({ quality: t.quality, compressionLevel: 9 }).toBuffer()
		: await pipeline.webp({ quality: t.quality, effort: 6 }).toBuffer();

	await writeFile(t.dst, buf);
	const after = (await stat(t.dst)).size;
	const ratio = (((before - after) / before) * 100).toFixed(0);
	console.log(
		`${path.relative(staticDir, t.src)}  ${await fmt(before)} → ${path.relative(staticDir, t.dst)}  ${await fmt(after)}  (-${ratio}%)`
	);
}
