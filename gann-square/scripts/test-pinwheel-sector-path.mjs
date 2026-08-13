/**
 * Regression: Pinwheel Phase 4 sector/blade path + Phase 2 frame routing.
 * Run: node gann-square/scripts/test-pinwheel-sector-path.mjs
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

const sq = ctx.GannSquare.generateSquare({ begin: 1, step: 1, rings: 14 });

const cases = [
  // Phase 2: frame start forced
  [11, 40, "pinwheel-frame", "11-19-28-40"],
  [133, 20, "pinwheel-frame", "133-111-91-73-57-43-31-21"],
  // Phase 4 EW / NS / diag / blade
  [29, 106, "pinwheel-sector", "29-39-54-68-87-105"],
  [35, 76, "pinwheel-sector", "35-45-62-76"],
  [56, 113, "pinwheel-sector", "56-74-90-112"],
  [100, 50, "pinwheel-sector", "100-82-64-50"],
  [51, 100, "pinwheel-sector", "51-63-83-99"],
  [136, 209, "pinwheel-sector", "136-154-186-208"],
];

let failed = 0;
for (const [s, t, kind, exp] of cases) {
  const r = ctx.GannPinwheel.runPinwheelPath(sq, s, t);
  const got = r.steps.map((x) => x.price).join("-");
  const ok = r.ok && r.kind === kind && got === exp;
  console.log(`${s}→${t}: ${ok ? "OK" : "FAIL"} kind=${r.kind} ${got}`);
  if (!ok) {
    console.log(`  want kind=${kind} path=${exp} msg=${r.message}`);
    failed += 1;
  }
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll pinwheel sector-path checks passed.");
