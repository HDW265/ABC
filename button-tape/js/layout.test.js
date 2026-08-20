"use strict";

var assert = require("assert");
var L = require("./layout.js");

function approx(a, b, msg) {
  assert.ok(Math.abs(a - b) < 1e-6, msg || a + " ≈ " + b);
}

(function test170DualSchemes() {
  var plan = L.plan({ W: 20, D: 15, S: 30, L: 170 });
  assert.strictEqual(plan.ok, true);
  assert.strictEqual(plan.nMax, 6);
  assert.strictEqual(plan.schemes.length, 2);
  assert.strictEqual(plan.schemes[0].N, 6);
  approx(plan.schemes[0].M, 10);
  assert.strictEqual(plan.schemes[0].formula, "10 + 30×5 + 10 = 170");
  assert.strictEqual(plan.schemes[1].N, 5);
  approx(plan.schemes[1].M, 25);
  assert.strictEqual(plan.schemes[1].formula, "25 + 30×4 + 25 = 170");
  var auto = L.resolveSelection(plan, null);
  assert.strictEqual(auto.scheme.N, 6);
  var pick5 = L.resolveSelection(plan, 5);
  assert.strictEqual(pick5.scheme.N, 5);
  var custom4 = L.resolveSelection(plan, 4);
  assert.strictEqual(custom4.source, "custom");
  approx(custom4.scheme.M, 40);
  assert.ok(custom4.warning.indexOf("止口大于间距") !== -1);
  var tooMany = L.resolveSelection(plan, 7);
  assert.strictEqual(tooMany.scheme, null);
  assert.ok(tooMany.warning.indexOf("最多只能排 6 扣") !== -1);
})();

(function test150Example() {
  var plan = L.plan({ W: 20, D: 15, S: 30, L: 150 });
  assert.strictEqual(plan.ok, true);
  assert.strictEqual(plan.schemes.length, 2);
  assert.strictEqual(plan.schemes[0].N, 5);
  approx(plan.schemes[0].M, 15);
  assert.strictEqual(plan.schemes[0].formula, "15 + 30×4 + 15 = 150");
  assert.strictEqual(plan.schemes[1].N, 4);
  approx(plan.schemes[1].M, 30);
  assert.strictEqual(plan.schemes[1].formula, "30 + 30×3 + 30 = 150");
})();

(function testMarginEqualsTenAllowed() {
  var sch = L.schemeFor(170, 30, 6, 10);
  assert.strictEqual(sch.valid, true);
  assert.strictEqual(sch.auto, true);
  approx(sch.M, 10);
})();

(function testLargeButtonRaisesMinMargin() {
  var plan = L.plan({ W: 30, D: 25, S: 30, L: 170 });
  assert.strictEqual(plan.ok, true);
  approx(plan.mMin, 12.5);
  assert.ok(plan.nMax <= 5);
  plan.schemes.forEach(function (s) {
    assert.ok(s.M + 1e-6 >= 12.5);
  });
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

(function testDrawingMode() {
  assert.strictEqual(L.drawingMode(150, 5, 40), "full");
  assert.strictEqual(L.drawingMode(450, 15, 30), "full-table");
  assert.strictEqual(L.drawingMode(1200, 40, 10), "breakout");
})();

console.log("layout.test.js: all passed");
