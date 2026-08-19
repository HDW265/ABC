/**
 * Regression: Constellate secret-line punctuation.
 * Run: node gann-square/scripts/test-project-secret.mjs
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
for (const f of ["js/square.js", "js/path.js", "js/project.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx);
}

function bodyOf(secretLine) {
  const i = secretLine.indexOf(" = ");
  return i >= 0 ? secretLine.slice(i + 3) : secretLine;
}

let failed = 0;

const sq = ctx.GannSquare.generateSquare({ begin: 1, step: 1, rings: 6 });
const toy = ctx.GannProject.runProjection(sq, {
  start: 11,
  target: 40,
  direction: "up",
  segments: 4,
});
if (!toy.ok) {
  console.log("toy projection FAIL", toy.message);
  failed += 1;
} else {
  const body = bodyOf(toy.secretLine);
  const hasDun = body.includes("、");
  const usesComma = body.includes("，");
  console.log("sample body:", body);
  if (hasDun) {
    console.log("FAIL: still uses 顿号 inside secret body");
    failed += 1;
  } else if (!usesComma && toy.secretParts.length > 1) {
    console.log("FAIL: multi-segment body should join with ，");
    failed += 1;
  } else {
    console.log("punctuation: OK");
  }
}

// Reconstruct 3185→4300 style grouping: first singleton then pairs
const display = [[3221], [3278, 3299], [3335, 3356], [4256, 4280]];
const parts = display.map((prices) => {
  const nums = prices.map((p) => ctx.GannSquare.formatNumber(p));
  return nums.length <= 1 ? nums[0] : nums.join(" — ");
});
const rebuilt = parts.join("，");
const expect = "3221，3278 — 3299，3335 — 3356，4256 — 4280";
console.log("rebuild:", rebuilt);
if (rebuilt !== expect) {
  console.log("FAIL want", expect);
  failed += 1;
} else {
  console.log("3185-style pairing: OK");
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll project secret punctuation checks passed.");
