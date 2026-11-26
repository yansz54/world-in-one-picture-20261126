// The World in One Picture — Thursday 26 November 2026 (v2 rebuild)
// Node 22, stdlib only, no network. Writes /output/entry.png (1024x1024).
// Draws a newspaper front page: masthead, photorealistic hero (hero.png
// shipped beside this file), 3 leads, 20 briefs, world map, UTC timeline,
// date check, sources. All text is drawn with a hand-written 5x7 bitmap
// font; the PNG writer and the PNG decoder for hero.png are hand-written too.
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

// ---------------------------------------------------------------- canvas
const W = 1024;
const H = 1024;
const img = Buffer.alloc(W * H * 3);
type RGB = [number, number, number];
const PAPER: RGB = [247, 243, 234];
const INK: RGB = [20, 24, 32];
const NAVY: RGB = [18, 33, 61];
const RED: RGB = [178, 34, 34];
const GREY: RGB = [110, 108, 100];
const LIGHT: RGB = [232, 228, 218];
const TEAL: RGB = [0, 110, 110];
const ORANGE: RGB = [200, 90, 0];
const BLUE: RGB = [30, 80, 160];
const GREEN: RGB = [40, 120, 50];
const PURPLE: RGB = [120, 60, 140];
const BROWN: RGB = [130, 80, 30];

function fill(c: RGB): void {
  for (let i = 0; i < W * H; i++) {
    img[i * 3] = c[0];
    img[i * 3 + 1] = c[1];
    img[i * 3 + 2] = c[2];
  }
}
function px(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0];
  img[i + 1] = c[1];
  img[i + 2] = c[2];
}
function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) px(xx, yy, c);
}
function hline(x: number, y: number, w: number, c: RGB): void {
  rect(x, y, w, 1, c);
}
function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let yy = cy - r; yy <= cy + r; yy++)
    for (let xx = cx - r; xx <= cx + r; xx++) {
      const dx = xx - cx;
      const dy = yy - cy;
      if (dx * dx + dy * dy <= r * r) px(xx, yy, c);
    }
}
function ring(cx: number, cy: number, r: number, c: RGB): void {
  for (let a = 0; a < 360; a += 6) {
    const t = (a * Math.PI) / 180;
    px(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), c);
  }
}

// ---------------------------------------------------------------- font
// 5x7 bitmap font, one row per number (5 bits, bit 4 = leftmost pixel).
const FONT: Record<string, number[]> = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14], J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  "0": [14, 17, 19, 21, 25, 17, 14], "1": [4, 12, 4, 4, 4, 4, 14],
  "2": [14, 17, 1, 6, 8, 16, 31], "3": [31, 2, 4, 2, 1, 17, 14],
  "4": [2, 6, 10, 18, 31, 2, 2], "5": [31, 16, 30, 1, 1, 17, 14],
  "6": [6, 8, 16, 30, 17, 17, 14], "7": [31, 1, 2, 4, 8, 8, 8],
  "8": [14, 17, 17, 14, 17, 17, 14], "9": [14, 17, 17, 15, 1, 2, 12],
  " ": [0, 0, 0, 0, 0, 0, 0], ".": [0, 0, 0, 0, 0, 12, 12],
  ",": [0, 0, 0, 0, 12, 4, 8], ":": [0, 12, 12, 0, 12, 12, 0],
  ";": [0, 12, 12, 0, 12, 4, 8], "!": [4, 4, 4, 4, 4, 0, 4],
  "?": [14, 17, 1, 6, 4, 0, 4], "'": [4, 4, 8, 0, 0, 0, 0],
  '"': [10, 10, 0, 0, 0, 0, 0], "-": [0, 0, 0, 14, 0, 0, 0],
  "/": [1, 2, 2, 4, 8, 8, 16], "(": [2, 4, 8, 8, 8, 4, 2],
  ")": [8, 4, 2, 2, 2, 4, 8], "&": [12, 18, 20, 8, 21, 18, 13],
  "%": [25, 26, 2, 4, 8, 11, 19], "+": [0, 4, 4, 31, 4, 4, 0],
  "=": [0, 0, 31, 0, 31, 0, 0], "$": [4, 15, 20, 14, 5, 30, 4],
  "#": [10, 10, 31, 10, 31, 10, 10], "@": [14, 17, 23, 21, 22, 16, 14],
  "\u2022": [0, 0, 4, 14, 14, 4, 0], "\u2192": [0, 4, 2, 31, 2, 4, 0],
};
const FALLBACK_GLYPH = FONT["?"];

function glyph(ch: string): number[] {
  return FONT[ch] || FALLBACK_GLYPH;
}
function textWidth(s: string, scale: number): number {
  const up = s.toUpperCase();
  if (up.length === 0) return 0;
  return up.length * (5 * scale + scale) - scale;
}
function drawText(x: number, y: number, s: string, scale: number, c: RGB): number {
  const up = s.toUpperCase();
  let cx = x;
  for (const ch of up) {
    const g = glyph(ch);
    for (let row = 0; row < 7; row++) {
      const bits = g[row];
      for (let col = 0; col < 5; col++) {
        if (bits & (1 << (4 - col))) {
          rect(cx + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
    cx += 5 * scale + scale;
  }
  return cx - x - scale;
}
function drawCentered(y: number, s: string, scale: number, c: RGB): void {
  const w = textWidth(s, scale);
  drawText(Math.round((W - w) / 2), y, s, scale, c);
}
function wrapText(s: string, maxW: number, scale: number): string[] {
  const words = s.toUpperCase().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (textWidth(trial, scale) <= maxW) {
      cur = trial;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawWrapped(
  x: number,
  y: number,
  s: string,
  maxW: number,
  scale: number,
  c: RGB,
  lineH: number,
  maxLines: number,
): number {
  const lines = wrapText(s, maxW, scale).slice(0, maxLines);
  lines.forEach((ln, i) => drawText(x, y + i * lineH, ln, scale, c));
  return lines.length;
}

// ---------------------------------------------------------------- PNG out
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}
function pngEncode(w: number, h: number, rgb: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0; // filter none
    rgb.copy(raw, y * (1 + w * 3) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- PNG in
function pngDecode(file: Buffer): { w: number; h: number; rgb: Buffer } | null {
  try {
    if (file.readUInt32BE(0) !== 0x89504e47) return null;
    let pos = 8;
    let w = 0;
    let h = 0;
    let bitDepth = 0;
    let colourType = 0;
    const idatParts: Buffer[] = [];
    while (pos + 8 <= file.length) {
      const len = file.readUInt32BE(pos);
      const type = file.toString("ascii", pos + 4, pos + 8);
      const data = file.subarray(pos + 8, pos + 8 + len);
      if (type === "IHDR") {
        w = data.readUInt32BE(0);
        h = data.readUInt32BE(4);
        bitDepth = data[8];
        colourType = data[9];
      } else if (type === "IDAT") {
        idatParts.push(Buffer.from(data));
      } else if (type === "IEND") {
        break;
      }
      pos += 12 + len;
    }
    if (!w || !h || bitDepth !== 8 || (colourType !== 2 && colourType !== 6)) return null;
    const ch = colourType === 6 ? 4 : 3;
    const raw = zlib.inflateSync(Buffer.concat(idatParts));
    const stride = w * ch;
    const rgb = Buffer.alloc(w * h * 3);
    let prev = Buffer.alloc(stride);
    for (let y = 0; y < h; y++) {
      const f = raw[y * (stride + 1)];
      const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
      const cur = Buffer.alloc(stride);
      for (let x = 0; x < stride; x++) {
        const a = x >= ch ? cur[x - ch] : 0;
        const b = prev[x];
        const cc = x >= ch ? prev[x - ch] : 0;
        let v = row[x];
        if (f === 1) v = (v + a) & 0xff;
        else if (f === 2) v = (v + b) & 0xff;
        else if (f === 3) v = (v + ((a + b) >> 1)) & 0xff;
        else if (f === 4) {
          const p = a + b - cc;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - cc);
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : cc;
          v = (v + pr) & 0xff;
        }
        cur[x] = v;
      }
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 3;
        const s = x * ch;
        rgb[o] = cur[s];
        rgb[o + 1] = cur[s + 1];
        rgb[o + 2] = cur[s + 2];
      }
      prev = cur;
    }
    return { w, h, rgb };
  } catch {
    return null;
  }
}

function scriptDir(): string {
  try {
    return path.dirname(new URL(import.meta.url).pathname);
  } catch {
    return process.cwd();
  }
}
function findHero(): { w: number; h: number; rgb: Buffer } | null {
  const roots: string[] = [];
  if (process.env.MAKEFUN_BOT_DIR) roots.push(process.env.MAKEFUN_BOT_DIR);
  roots.push("/bot", scriptDir(), process.cwd());
  for (const r of roots) {
    const p = path.join(r, "hero.png");
    try {
      if (fs.existsSync(p)) {
        const d = pngDecode(fs.readFileSync(p));
        if (d) return d;
      }
    } catch {
      // keep looking
    }
  }
  return null;
}

// Draw a decoded image into a box, centre-cropped, averaging 2 source rows
// per target row when the source is about twice as tall as the box.
function drawHeroInto(hero: { w: number; h: number; rgb: Buffer }, bx: number, by: number, bw: number, bh: number): void {
  // Cover-fit: scale so the image covers the box, then centre-crop.
  const s = Math.min(hero.w / bw, hero.h / bh);
  const sw = bw * s;
  const sh = bh * s;
  const ox = (hero.w - sw) / 2;
  const oy = (hero.h - sh) / 2;
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const srcX = Math.floor(ox + (x + 0.5) * s);
      const srcY = Math.floor(oy + (y + 0.5) * s);
      const si = (Math.min(srcY, hero.h - 1) * hero.w + Math.min(srcX, hero.w - 1)) * 3;
      const di = ((by + y) * W + (bx + x)) * 3;
      img[di] = hero.rgb[si];
      img[di + 1] = hero.rgb[si + 1];
      img[di + 2] = hero.rgb[si + 2];
    }
  }
}
function drawFallbackSkyline(bx: number, by: number, bw: number, bh: number): void {
  // Procedural dusk sky + building silhouettes + balloon circles, in case
  // hero.png cannot be found or decoded.
  for (let y = 0; y < bh; y++) {
    const t = y / bh;
    const r = Math.round(250 - 120 * t);
    const g = Math.round(200 - 60 * t);
    const b = Math.round(150 + 60 * t);
    rect(bx, by + y, bw, 1, [r, g, b]);
  }
  const heights = [150, 220, 180, 260, 200, 240, 170, 230, 190, 250, 160, 210];
  const bw2 = Math.floor(bw / heights.length);
  heights.forEach((hh, i) => {
    rect(bx + i * bw2, by + bh - hh, bw2 - 4, hh, [40, 45, 60]);
  });
  disc(bx + Math.floor(bw * 0.3), by + 90, 46, [230, 120, 40]);
  disc(bx + Math.floor(bw * 0.55), by + 70, 52, [60, 140, 70]);
  disc(bx + Math.floor(bw * 0.8), by + 95, 44, [240, 240, 240]);
}

// ---------------------------------------------------------------- content
const LEADS: { n: number; head: string; body: string }[] = [
  { n: 1, head: "MACY'S 100TH PARADE", body: "100 BALLOONS OVER MANHATTAN - RECORD 100 INFLATABLES, 26 FLOATS, 3M WATCH" },
  { n: 2, head: "THANKSGIVING IN AMERICA", body: "MARKETS SHUT - NFL: BEARS-LIONS, EAGLES-COWBOYS, CHIEFS-BILLS" },
  { n: 3, head: "31 DEAD IN CAIRO TANKER FIRE", body: "FUEL TANKER OVERTURNS ON RING ROAD, GIZA - 31 KILLED, 21 HURT (B)" },
];
const BRIEFS: { n: number; text: string }[] = [
  { n: 4, text: "DETROIT'S PARADE TURNS 100 TOO - 3 MILES DOWN WOODWARD AVE." },
  { n: 5, text: "EU LEADERS MEET IN BRUSSELS - BUDGET FIGHT, UKRAINE CASH, ECB JOB" },
  { n: 6, text: "INDIA: CONSTITUTION DAY, 77 YEARS - PREAMBLE READ IN 23 LANGUAGES" },
  { n: 7, text: "INDIA MARKS 18 YEARS SINCE THE 26/11 MUMBAI ATTACKS" },
  { n: 8, text: "CHESS GAME 3, GENEVA 15:00 CET - SINDAROV (WHITE) V GUKESH, LEVEL" },
  { n: 9, text: "BRENT +3.6% TO $94.65 - GULF ATTACKS STOKE SUPPLY FEARS" },
  { n: 10, text: "ASIAN MARKETS STEADY - ASX +0.24%, GOLD $3,570, TECH DOWN AGAIN" },
  { n: 11, text: "MISSISSIPPI CRASH VICTIMS NAMED (B) - FAMILY OF SIX, HOME FOR THANKSGIVING" },
  { n: 12, text: "SYDNEY FERRIES STOP 4 HOURS - CREWS VOTE ON PAY DEAL" },
  { n: 13, text: "PALM BEACH FERRIES STRIKE FROM 07:30 - CREWS PAID 30% LESS" },
  { n: 14, text: "WBBL DOUBLE-HEADER AT NORTH SYDNEY OVAL" },
  { n: 15, text: "HISENSE RECALLS FREEZERS IN NZ (B) - CHILD-TRAP RISK, 501L AND 702L" },
  { n: 16, text: "SOUTH MARLBOROUGH FIRE SEASON STARTS 08:00 - DRY VEGETATION" },
  { n: 17, text: "SNOW INTO THURSDAY MORNING, HOKKAIDO (F) - 10-20 CM MORE" },
  { n: 18, text: "ECUADOR CAMPAIGN ENDS - SILENCE, 72-HOUR DRINK BAN BEFORE VOTE" },
  { n: 19, text: "RARE-DISEASE FORUM MEETS IN LATIN AMERICA - MINISTERS, ROADMAP" },
  { n: 20, text: "DURAN DURAN CONFIRMS ANDY TAYLOR DIED, 65 (B) - CANCER BATTLE" },
  { n: 21, text: "FED MINUTES: SPLIT OVER INFLATION (B) - RATE PATH UNCLEAR" },
  { n: 22, text: "NEUREN SHARES HALTED - FDA MEETING UPDATE DUE" },
  { n: 23, text: "UBER ADDS TRAIN BOOKINGS IN FRANCE - SNCF, EUROSTAR FROM 30 NOV" },
];
const TIMELINE: [string, string][] = [
  ["23:00 WED", "SYDNEY FERRIES STOP"],
  ["05:30", "CONSTITUTION DAY, DELHI"],
  ["13:30", "MACY'S 100TH STEPS OFF"],
  ["14:00", "CHESS GAME 3, GENEVA"],
  ["17:00", "SANTA CLOSES PARADE"],
];
// Schematic world map, 48 cols x 14 rows ('#' = land).
// Columns are 7.5 deg of longitude; rows are ~12.9 deg of latitude.
const MAP_ROWS: string[] = [
  "......####.......####...........................",
  "....##################...###...#################",
  "...#################...########################.",
  "....#############.....######################....",
  ".....###########......######################....",
  "........#####.........#################.........",
  "...........###........#########.....#####.......",
  ".............######.....######........#####.....",
  "..............######....########.......######...",
  ".............####........####..........######...",
  ".............###..............................#.",
  "................................................",
  "................................................",
  "................................................",
];
// Map dots: [lon, lat, region colour, number, dx offset, dy offset]
// Offsets keep near-identical locations (NY/Detroit, Brussels/Geneva)
// from covering each other.
const MAP_DOTS: [number, number, RGB, number, number, number][] = [
  [-74, 41, RED, 1, 0, 0], [-83, 42, RED, 4, -12, 3], [-89, 30, RED, 11, 0, 0],
  [4.4, 50.8, BLUE, 5, 0, 0], [6, 46, BLUE, 8, 0, 11],
  [77, 28.6, ORANGE, 6, 0, 0], [31.2, 30, PURPLE, 3, 0, 0],
  [141, 43, GREEN, 17, 0, 0], [151, -33.9, TEAL, 12, 0, 0], [-78.5, -0.2, BROWN, 18, 0, 0],
];

// ---------------------------------------------------------------- layout
fill(PAPER);

// Masthead
rect(0, 0, W, 78, NAVY);
drawCentered(10, "THE WORLD IN ONE PICTURE", 5, [250, 246, 236]);
drawCentered(50, "THURSDAY 26 NOVEMBER 2026", 3, [220, 200, 140]);
rect(0, 78, W, 4, RED);

// Hero
const HX = 24;
const HY = 88;
const HW = 976;
const HH = 300;
const hero = findHero();
if (hero) drawHeroInto(hero, HX, HY, HW, HH);
else drawFallbackSkyline(HX, HY, HW, HH);
rect(HX, HY + HH - 26, HW, 26, [0, 0, 0]);
drawText(HX + 10, HY + HH - 21, "MACY'S 100TH PARADE, NEW YORK", 2, [255, 255, 255]);
drawText(HX + HW - textWidth("23 STORIES - 7 REGIONS - 12 FIELDS", 2) - 10, HY + HH - 21, "23 STORIES - 7 REGIONS - 12 FIELDS", 2, [255, 220, 140]);

// Leads: three boxes
const LY = 398;
const LW = 312;
const LH = 118;
const LGAP = 20;
LEADS.forEach((lead, i) => {
  const x = HX + i * (LW + LGAP);
  rect(x, LY, LW, LH, [255, 255, 255]);
  rect(x, LY, LW, 3, RED);
  disc(x + 18, LY + 20, 11, RED);
  drawText(x + 14, LY + 14, String(lead.n), 2, [255, 255, 255]);
  const headLines = drawWrapped(x + 38, LY + 10, lead.head, LW - 48, 2, NAVY, 17, 2);
  drawWrapped(x + 10, LY + 10 + headLines * 17 + 4, lead.body, LW - 20, 2, INK, 16, 4);
});

// Section label
const SY = LY + LH + 12;
drawText(HX, SY, "THE DAY IN BRIEF", 2, RED);
hline(HX + textWidth("THE DAY IN BRIEF", 2) + 10, SY + 7, HW - textWidth("THE DAY IN BRIEF", 2) - 10, GREY);

// Briefs: two columns, ten rows
const BY = SY + 26;
const BCOLW = 478;
const BROW_H = 30;
BRIEFS.forEach((b, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = HX + col * (BCOLW + 20);
  const y = BY + row * BROW_H;
  disc(x + 10, y + 8, 9, NAVY);
  const num = String(b.n);
  drawText(x + 10 - Math.round(textWidth(num, 1) / 2), y + 4, num, 1, [255, 255, 255]);
  drawWrapped(x + 24, y + 1, b.text, BCOLW - 24, 2, INK, 14, 2);
});

// Bottom band: map (left) + timeline / date check / sources (right)
const TY = BY + 10 * BROW_H + 8;
hline(HX, TY, HW, GREY);
const MX = HX;
const MY = TY + 12;
const MW = 470;
const MH = 128;
drawText(MX, MY, "WHERE IT HAPPENED", 2, RED);
// Map grid: 48 x 14 cells over MW x (MH - 24)
const cellW = MW / 48;
const cellH = (MH - 24) / 14;
for (let r = 0; r < 14; r++) {
  for (let c = 0; c < 48; c++) {
    if (MAP_ROWS[r][c] === "#") {
      rect(
        Math.round(MX + c * cellW),
        Math.round(MY + 18 + r * cellH),
        Math.max(2, Math.round(cellW) - 1),
        Math.max(2, Math.round(cellH) - 1),
        [150, 160, 175],
      );
    }
  }
}
for (const [lon, lat, col, n, ox, oy] of MAP_DOTS) {
  const dx = Math.round(MX + ((lon + 180) / 360) * MW) + ox;
  const dy = Math.round(MY + 18 + ((90 - lat) / 180) * (MH - 24)) + oy;
  disc(dx, dy, 5, col);
  ring(dx, dy, 6, [255, 255, 255]);
  drawText(dx - 2, dy - 3, String(n), 1, [255, 255, 255]);
}
// Map legend
const legend: [RGB, string][] = [
  [RED, "N. AMERICA"], [BLUE, "EUROPE"], [ORANGE, "S. ASIA"],
  [GREEN, "E. ASIA"], [TEAL, "OCEANIA"], [PURPLE, "AFRICA/M.E."],
  [BROWN, "LATIN AM."],
];
let lx = MX;
legend.forEach(([c, label]) => {
  rect(lx, MY + MH - 2, 8, 8, c);
  drawText(lx + 11, MY + MH - 3, label, 1, GREY);
  lx += 11 + textWidth(label, 1) + 12;
});

// Right column: UTC timeline + date check + sources
const RX = 516;
drawText(RX, MY, "UTC TIMELINE - THURSDAY 26 NOVEMBER", 2, RED);
TIMELINE.forEach(([t, ev], i) => {
  const y = MY + 20 + i * 15;
  drawText(RX, y, t, 2, NAVY);
  drawText(RX + 116, y, ev, 2, INK);
});
const DY = MY + 20 + 5 * 15 + 6;
rect(RX, DY, HW - (RX - HX), 2, RED);
drawText(RX, DY + 8, "DATE CHECK: 26 NOV 2026 IS A THURSDAY", 2, INK);
drawText(RX, DY + 22, "(B) FIRST REPORTED 26 NOV IN ASIA-PACIFIC  (F) FORECAST FOR 26 NOV MORNING", 1, GREY);
drawText(RX, DY + 34, "SOURCES: REUTERS AP PEOPLE PIB CHESS.COM TRANSPORT FOR NSW MARKETINDEX", 1, GREY);

// ---------------------------------------------------------------- write
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "entry.png"), pngEncode(W, H, img));
console.log("wrote entry.png");
