/** Génère les textures de fond (grille masquée, halos) en PNG : rendu bien plus rapide que des dégradés recalculés. */
import fs from "node:fs";
import zlib from "node:zlib";

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function writePng(file: string, w: number, h: number, px: (x: number, y: number) => [number, number, number, number]) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = px(x, y);
      const o = y * (w * 4 + 1) + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]));
}
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
// Grille 80 px, masque elliptique (identique à l'ancien mask-image CSS), hauteur +80 px pour le défilement
const W = 1080;
const H = 2000;
writePng("video/public/textures/grille.png", W, H, (x, y) => {
  const onLine = x % 80 < 1.5 || y % 80 < 1.5;
  if (!onLine) return [255, 255, 255, 0];
  const dx = (x - W * 0.5) / (W * 0.75);
  const dy = (y - 1920 * 0.42) / (1920 * 0.6);
  const d = Math.sqrt(dx * dx + dy * dy);
  const m = 1 - smooth(0.2, 0.85, d);
  return [255, 255, 255, Math.round(255 * 0.045 * m)];
});
// Halo doux réutilisable (blanc, alpha radial) : teinté et déplacé en CSS
writePng("video/public/textures/halo.png", 512, 512, (x, y) => {
  const d = Math.hypot(x - 256, y - 256) / 256;
  return [255, 255, 255, Math.round(255 * Math.pow(1 - smooth(0, 1, d), 1.6))];
});
console.log("textures ok");
