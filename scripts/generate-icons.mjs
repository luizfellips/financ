/**
 * Generates Financ brand icons for PWA / install / favicon.
 * Brand mark: Wallet on rounded dark square (matches sidebar).
 *
 * Run: node scripts/generate-icons.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

/** Near --foreground light mode / brand mark background */
const BG = "#18181b";
const FG = "#fafafa";

function brandSvg(size, { paddingRatio = 0.22 } = {}) {
  const pad = Math.round(size * paddingRatio);
  const inner = size - pad * 2;
  const radius = Math.round(size * 0.22);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${BG}"/>
  <g transform="translate(${pad} ${pad}) scale(${inner / 24})"
     fill="none" stroke="${FG}" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
  </g>
</svg>`;
}

function maskableSvg(size) {
  // Safe zone ~80%: more padding so Android mask doesn't crop the mark
  return brandSvg(size, { paddingRatio: 0.28 });
}

async function pngFromSvg(svg, outPath) {
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buf);
  console.log("wrote", outPath, `(${buf.length} bytes)`);
}

async function main() {
  const publicIcons = join(root, "public", "icons");
  const appDir = join(root, "src", "app");

  await pngFromSvg(brandSvg(32), join(publicIcons, "icon-32.png"));
  await pngFromSvg(brandSvg(180), join(publicIcons, "apple-touch-icon.png"));
  await pngFromSvg(brandSvg(192), join(publicIcons, "icon-192.png"));
  await pngFromSvg(brandSvg(512), join(publicIcons, "icon-512.png"));
  await pngFromSvg(maskableSvg(512), join(publicIcons, "icon-512-maskable.png"));

  // Next.js file conventions (auto <link rel="icon"> / apple-touch-icon)
  await pngFromSvg(brandSvg(32), join(appDir, "icon.png"));
  await pngFromSvg(brandSvg(180), join(appDir, "apple-icon.png"));

  // Multi-size favicon.ico for browsers that still request it
  const ico16 = await sharp(Buffer.from(brandSvg(16))).png().toBuffer();
  const ico32 = await sharp(Buffer.from(brandSvg(32))).png().toBuffer();
  const ico48 = await sharp(Buffer.from(brandSvg(48))).png().toBuffer();
  const favicon = await sharp(ico32)
    .resize(32, 32)
    .toFormat("png")
    .toBuffer();
  // Prefer a real .ico with multiple sizes via png-to-ico if available;
  // otherwise keep a crisp 32 PNG renamed isn't valid ico — use sharp to write
  // a simple ICO container manually (PNG-in-ICO is widely supported).
  writeFileSync(join(appDir, "favicon.ico"), buildIco([
    { size: 16, png: ico16 },
    { size: 32, png: ico32 },
    { size: 48, png: ico48 },
  ]));
  console.log("wrote", join(appDir, "favicon.ico"));

  // Also keep a high-res PNG copy for explicit metadata links
  void favicon;
}

/** Minimal ICO writer embedding PNG images (Vista+). */
function buildIco(entries) {
  const count = entries.length;
  const headerSize = 6 + count * 16;
  const buffers = [];
  let offset = headerSize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // ICO
  header.writeUInt16LE(count, 4);
  buffers.push(header);

  const dirs = [];
  for (const entry of entries) {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, 0);
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, 1);
    dir.writeUInt8(0, 2);
    dir.writeUInt8(0, 3);
    dir.writeUInt16LE(1, 4);
    dir.writeUInt16LE(32, 6);
    dir.writeUInt32LE(entry.png.length, 8);
    dir.writeUInt32LE(offset, 12);
    dirs.push(dir);
    offset += entry.png.length;
  }
  buffers.push(...dirs);
  buffers.push(...entries.map((e) => e.png));
  return Buffer.concat(buffers);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
