"use strict";

var assert = require("assert");
var L = require("./layout.js");

function approx(a, b, msg) {
  assert.ok(Math.abs(a - b) < 1e-6, msg || a + " ≈ " + b);
}

(function testSewableLeftoverExamples() {
  approx(L.leftoverSewableMm(15, 30, 8), 11);
  approx(L.leftoverSewableMm(30, 30, 8), 22);
  approx(L.leftoverSewableMm(10, 30, 8), 6);
  approx(L.leftoverSewableMm(25, 30, 8), 21);
  approx(L.ghostInvasionMm(30, 30, 8), 4);
  approx(L.ghostInvasionMm(15, 30, 8), 0);
})();

(function test140D8DropsFiveButton() {
  var plan = L.plan({ W: 20, D: 8, S: 30, L: 140 });
  assert.strictEqual(plan.ok, true);
  assert.strictEqual(plan.nMax, 4);
  assert.strictEqual(plan.schemes.length, 1);
  assert.strictEqual(plan.schemes[0].N, 4);
  approx(plan.schemes[0].leftoverSewable, 21);
  assert.strictEqual(plan.schemes[0].endsWasted, true);
  approx(plan.schemes[0].wasteSeamMm, 10);
  approx(plan.schemes[0].useMm, 150);
  var five = L.resolveSelection(plan, 5);
  assert.strictEqual(five.source, "custom");
  approx(five.scheme.leftoverSewable, 6);
  assert.ok(five.warning.indexOf("不合理") !== -1);
})();

(function test150D8OnlyFiveButtonRealizable() {
  var plan = L.plan({ W: 20, D: 8, S: 30, L: 150 });
  assert.strictEqual(plan.ok, true);
  assert.strictEqual(plan.schemes.length, 1);
  assert.strictEqual(plan.schemes[0].N, 5);
  approx(plan.schemes[0].leftoverSewable, 11);
  assert.strictEqual(plan.schemes[0].ghostInvasion, 0);
  assert.strictEqual(plan.schemes[0].endsWasted, false);
  approx(plan.schemes[0].useMm, 150);
  var four = L.resolveSelection(plan, 4);
  assert.strictEqual(four.source, "custom");
  approx(four.scheme.leftoverSewable, 22);
  approx(four.scheme.ghostInvasion, 4);
  approx(four.scheme.ghostEdgeLeftover, -4);
  assert.ok(four.warning.indexOf("无法实现") !== -1);
})();

(function test170D15NoAutoBecauseCutHitsButton() {
  var plan = L.plan({ W: 20, D: 15, S: 30, L: 170 });
  assert.strictEqual(plan.ok, true);
  assert.strictEqual(plan.nMax, 0);
  assert.strictEqual(plan.schemes.length, 0);
  var auto = L.resolveSelection(plan, null);
  assert.strictEqual(auto.scheme, null);
  assert.ok(auto.warning.indexOf("可裁可车") !== -1);
  var six = L.resolveSelection(plan, 6);
  assert.ok(six.warning.indexOf("不合理") !== -1);
  approx(six.scheme.leftoverSewable, 2.5);
  var five = L.resolveSelection(plan, 5);
  assert.strictEqual(five.source, "custom");
  approx(five.scheme.M, 25);
  assert.ok(five.warning.indexOf("无法实现") !== -1);
  var custom4 = L.resolveSelection(plan, 4);
  assert.strictEqual(custom4.source, "custom");
  approx(custom4.scheme.M, 40);
})();

(function test150D15FourButtonCutsThroughButton() {
  var plan = L.plan({ W: 20, D: 15, S: 30, L: 150 });
  assert.strictEqual(plan.ok, true);
  assert.strictEqual(plan.schemes.length, 0);
  var four = L.resolveSelection(plan, 4);
  assert.strictEqual(four.source, "custom");
  approx(four.scheme.leftoverSewable, 15);
  assert.ok(four.scheme.ghostInvasion > 0);
  assert.ok(four.warning.indexOf("无法实现") !== -1);
})();

(function testMMinUsesLeftoverFloor() {
  approx(L.mMin(8), 14);
  approx(L.mMin(15), 17.5);
  approx(L.mMin(8, 8), 12);
})();

(function testWasteSeamAndRowUse() {
  approx(L.wasteSeamMm(140, 30, true), 10);
  approx(L.wasteSeamMm(150, 30, false), 0);
  approx(L.wasteSeamMm(165, 30, true), 15);
  approx(L.rowUseMm(140, 1000, 10, 0, true), 150010);
  approx(L.rowUseMm(140, 1, 10, 0, true), 160);
  approx(L.rowUseMm(150, 3000, 0, 2, false), 450000);
  approx(L.rowUseMm(140, 1000, 10, 2, true), 152012);
})();

(function testLeftoverMinEightKeeps150FiveButton() {
  var plan = L.plan({ W: 20, D: 8, S: 30, L: 150, leftoverMin: 8 });
  assert.strictEqual(plan.schemes.length, 1);
  assert.strictEqual(plan.schemes[0].N, 5);
})();

(function testWidthSmallerThanButton() {
  var plan = L.plan({ W: 10, D: 15, S: 30, L: 170 });
  assert.strictEqual(plan.ok, false);
  assert.ok(plan.errors.some(function (e) {
    return e.indexOf("布宽不能小于扣径") !== -1;
  }));
})();

(function testSpacingNotGreaterThanDiameter() {
  var plan = L.plan({ W: 20, D: 15, S: 15, L: 170 });
  assert.strictEqual(plan.ok, false);
  assert.ok(plan.errors.some(function (e) {
    return e.indexOf("间距必须大于扣径") !== -1;
  }));
})();

(function testButtonCenters() {
  var xs = L.buttonCenters(15, 30, 5);
  assert.deepStrictEqual(xs, [15, 45, 75, 105, 135]);
})();

(function testLeftoverStop() {
  approx(L.leftoverMm(25, 8), 21);
  approx(L.leftoverMm(10, 15), 2.5);
  approx(L.leftoverMm(15, 15), 7.5);
})();

(function testGhostCenters() {
  var g5 = L.ghostCenters(25, 30, 170);
  approx(g5.left, -5);
  approx(g5.right, 175);
  var g6 = L.ghostCenters(10, 30, 170);
  approx(g6.left, -20);
  approx(g6.right, 190);
  var g4 = L.ghostCenters(40, 30, 170);
  approx(g4.left, 10);
  approx(g4.right, 160);
})();

(function testDrawingMode() {
  assert.strictEqual(L.drawingMode(150, 5, 40), "full");
  assert.strictEqual(L.drawingMode(450, 15, 30), "full-table");
  assert.strictEqual(L.drawingMode(1200, 40, 10), "breakout");
})();

console.log("layout.test.js: all passed");
