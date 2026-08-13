/**
 * Regression: Pinwheel Phase 3 blade sectors.
 * Run: node gann-square/scripts/test-pinwheel-sectors.mjs
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ["js/square.js", "js/pinwheel.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx);
}

const sq = ctx.GannSquare.generateSquare({ begin: 1, step: 1, rings: 7 });
const cx = Math.floor(sq.size / 2);

function cellAt(dr, dc) {
  return sq.meta[cx + dr][cx + dc];
}

const expect = [
  [cellAt(-3, 0), "n"], // north cross
  [cellAt(-2, 2), "ne"], // near NE diag
  [cellAt(0, 3), "e"],
  [cellAt(2, 2), "se"],
  [cellAt(3, 0), "s"],
  [cellAt(2, -2), "sw"],
  [cellAt(0, -3), "w"],
  [cellAt(-2, -2), "nw"],
  // track samples must sit on boundaries (half-open: belong to one side)
];

let failed = 0;
for (const [cell, id] of expect) {
  const got = ctx.GannPinwheel.sectorForCell(sq, cell);
  const ok = got && got.id === id;
  console.log(`axis sample → want ${id}: ${ok ? "OK" : "FAIL"} got ${got?.id} @${cell.value}`);
  if (!ok) failed += 1;
}

// Track tip prices from frozen table
const tips = {
  1: [16, 24, 63, 79, 142, 166],
  2: [10, 18, 51, 67, 124, 148],
  3: [12, 20, 55, 71, 130, 154],
  4: [14, 22, 59, 75, 136, 160],
};
for (const [tid, prices] of Object.entries(tips)) {
  const track = ctx.GannPinwheel.trackById(Number(tid));
  const dirs = track.bladeIds.map((id) => ctx.GannPinwheel.BLADE_DIRS.find((d) => d.id === id));
  for (const p of prices) {
    let hit = null;
    for (let r = 0; r < sq.size; r++) {
      for (let c = 0; c < sq.size; c++) {
        if (sq.meta[r][c].value === p) hit = sq.meta[r][c];
      }
    }
    if (!hit) {
      console.log(`track${tid} missing ${p}`);
      failed += 1;
      continue;
    }
    const dr = hit.row - cx;
    const dc = hit.col - cx;
    const onTrack = dirs.some((d) => {
      if (!d) return false;
      // proportional to blade step
      return dr * d.dc === dc * d.dr && Math.sign(dr || d.dr) === Math.sign(d.dr || dr) && Math.sign(dc || d.dc) === Math.sign(d.dc || dc);
    });
    console.log(`track${tid} ${p} (${dr},${dc}): ${onTrack ? "OK" : "FAIL"}`);
    if (!onTrack) failed += 1;
  }
}

// Partition: every non-center cell belongs to exactly one sector
let partitionFail = 0;
for (let r = 0; r < sq.size; r++) {
  for (let c = 0; c < sq.size; c++) {
    const cell = sq.meta[r][c];
    if (cell.ring === 0) continue;
    const s = ctx.GannPinwheel.sectorForCell(sq, cell);
    if (!s) partitionFail += 1;
  }
}
console.log(`partition holes: ${partitionFail}`);
if (partitionFail) failed += 1;

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll pinwheel sector checks passed.");
