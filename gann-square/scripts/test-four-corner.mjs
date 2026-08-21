/**
 * Regression: Four-Corner Path (四角推图法).
 * Run: node gann-square/scripts/test-four-corner.mjs
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
for (const f of ["js/square.js", "js/path.js", "js/corner.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx);
}

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? "OK" : "FAIL"} ${name}${detail ? " " + detail : ""}`);
  if (!ok) failed += 1;
}

const sq = ctx.GannSquare.generateSquare({ begin: 1, step: 1, rings: 17 });
const down = ctx.GannCorner.runCornerPath(sq, {
  start: 922,
  target: 660,
  direction: "down",
});

const want45 = [922, 880, 862, 822, 804, 766, 748, 712, 694, 660];
const got45 = down.steps.map((s) => s.price);
check("down 45° chain", down.ok && got45.join("-") === want45.join("-"), got45.join(" → "));
check("start is origin not a 45° landing", down.steps[0].move === "start");
check("no 180° from start 922", down.rebounds.every((rb) => rb.fromPrice !== 922 && rb.fromStep !== 0));

const want180 = {
  880: 952,
  862: 910,
  822: 891,
  804: 851,
  766: 832,
  748: 794,
  712: 775,
  694: 739,
  660: 720,
};
const got180 = {};
down.rebounds.forEach((rb) => {
  got180[rb.fromPrice] = rb.price;
});
const pairs = Object.keys(want180)
  .map(Number)
  .map((p) => `${p}→${got180[p]}`)
  .join(", ");
check(
  "180° rebound table",
  Object.keys(want180).every((p) => got180[Number(p)] === want180[Number(p)]),
  pairs
);
check("822 expands past 776 to 891", down.rebounds.find((rb) => rb.fromPrice === 822)?.expanded === true);
check("880 exact opposite 952 no expand", down.rebounds.find((rb) => rb.fromPrice === 880)?.expanded === false);
check("down reached 660", down.reached === true);

const up = ctx.GannCorner.runCornerPath(sq, {
  start: 660,
  target: 922,
  direction: "up",
});
const wantUp = [...want45].reverse();
check("up 45° chain", up.ok && up.steps.map((s) => s.price).join("-") === wantUp.join("-"), up.steps.map((s) => s.price).join(" → "));
check("up start 660 has no 180°", up.rebounds.every((rb) => rb.fromStep !== 0));

const wantUp180 = {
  694: 634,
  712: 668,
  748: 685,
  766: 721,
  804: 738,
  822: 776,
  862: 793,
  880: 833,
  922: 850,
};
const gotUp180 = {};
up.rebounds.forEach((rb) => {
  gotUp180[rb.fromPrice] = rb.price;
});
const upPairs = Object.keys(wantUp180)
  .map(Number)
  .map((p) => `${p}→${gotUp180[p]}`)
  .join(", ");
check(
  "up 180° pullback table",
  Object.keys(wantUp180).every((p) => gotUp180[Number(p)] === wantUp180[Number(p)]),
  upPairs
);
check("up 748 inward to 685", up.rebounds.find((rb) => rb.fromPrice === 748)?.expanded === true);
check("up 694 exact opposite no expand", up.rebounds.find((rb) => rb.fromPrice === 694)?.expanded === false);
check("up all pullbacks lower", up.rebounds.every((rb) => rb.price != null && rb.price < rb.fromPrice));
check("up reached 922", up.reached === true);

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll four-corner checks passed.");
