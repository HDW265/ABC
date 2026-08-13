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

function findPrice(p) {
  for (let r = 0; r < sq.size; r++) {
    for (let c = 0; c < sq.size; c++) {
      if (sq.meta[r][c].value === p) return sq.meta[r][c];
    }
  }
  return null;
}

let failed = 0;

const expect = [
  [cellAt(-3, 0), "n"],
  [cellAt(-2, 2), "ne"],
  [cellAt(0, 3), "e"],
  [cellAt(2, 2), "se"],
  [cellAt(3, 0), "s"],
  [cellAt(2, -2), "sw"],
  [cellAt(0, -3), "w"],
  [cellAt(-2, -2), "nw"],
];

for (const [cell, id] of expect) {
  const got = ctx.GannPinwheel.sectorForCell(sq, cell);
  const ok = got && got.id === id;
  console.log(`axis sample → want ${id}: ${ok ? "OK" : "FAIL"} got ${got?.id} @${cell.value}`);
  if (!ok) failed += 1;
}

const tips = {
  1: [16, 24, 63, 79, 142, 166],
  2: [10, 18, 51, 67, 124, 148],
  3: [12, 20, 55, 71, 130, 154],
  4: [14, 22, 59, 75, 136, 160],
};

for (const [tid, prices] of Object.entries(tips)) {
  for (const p of prices) {
    const hit = findPrice(p);
    if (!hit) {
      console.log(`track${tid} missing ${p}`);
      failed += 1;
      continue;
    }
    const onBlade = ctx.GannPinwheel.isOnBlade(sq, hit);
    const sector = ctx.GannPinwheel.sectorForCell(sq, hit);
    const ok = onBlade && !sector;
    console.log(`track${tid} ${p}: ${ok ? "OK" : "FAIL"} onBlade=${onBlade} sector=${sector?.id}`);
    if (!ok) failed += 1;
  }
}

// East/West must not include tracks 2–3 lattice
const ewBoundary = [1, 10, 18, 51, 67, 124, 148, 12, 20, 55, 71, 130, 154];
const west = new Set(ctx.GannPinwheel.cellsInSector(sq, "w").map((c) => c.value));
const east = new Set(ctx.GannPinwheel.cellsInSector(sq, "e").map((c) => c.value));
const leaked = ewBoundary.filter((p) => west.has(p) || east.has(p));
console.log(`E/W boundary leak: ${leaked.length ? leaked.join(",") : "none"}`);
if (leaked.length) failed += 1;

// Non-blade cells still partition into exactly one sector
let partitionFail = 0;
for (let r = 0; r < sq.size; r++) {
  for (let c = 0; c < sq.size; c++) {
    const cell = sq.meta[r][c];
    if (cell.ring === 0) continue;
    if (ctx.GannPinwheel.isOnBlade(sq, cell)) {
      if (ctx.GannPinwheel.sectorForCell(sq, cell)) partitionFail += 1;
      continue;
    }
    if (!ctx.GannPinwheel.sectorForCell(sq, cell)) partitionFail += 1;
  }
}
console.log(`partition issues: ${partitionFail}`);
if (partitionFail) failed += 1;

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll pinwheel sector checks passed.");
