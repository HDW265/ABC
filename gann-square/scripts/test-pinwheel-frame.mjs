/**
 * Regression: Pinwheel Phase 2 skeleton-axis zigzag (scheme A).
 * Run: node gann-square/scripts/test-pinwheel-frame.mjs
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

const sq = ctx.GannSquare.generateSquare({ begin: 1, step: 1, rings: 12 });
const cases = [
  [133, 20, "133-111-91-73-57-43-31-21"],
  [121, 66, "121-101-81-65"],
  [127, 69, "127-106-86-69"],
  [23, 78, "23-34-46-61-77"],
];

let failed = 0;
for (const [s, t, exp] of cases) {
  const r = ctx.GannPinwheel.runFramePath(sq, s, t);
  const got = r.steps.map((x) => x.price).join("-");
  const ok = r.ok && got === exp;
  console.log(`${s}→${t}: ${ok ? "OK" : "FAIL"} ${got}`);
  if (!ok) failed += 1;
}

const off = ctx.GannPinwheel.runFramePath(sq, 50, 20);
if (off.ok || off.reason !== "not-on-frame") {
  console.log("off-frame: FAIL", off);
  failed += 1;
} else {
  console.log("off-frame: OK (not-on-frame)");
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll pinwheel frame-path checks passed.");
