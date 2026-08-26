"use strict";

var assert = require("assert");
var Y = require("./yardage.js");

function approx(a, b, msg) {
  assert.ok(Math.abs(a - b) < 1e-6, msg || a + " ≈ " + b);
}

(function testExamplePhotoFivePercent() {
  var bundle = Y.exampleBundle();
  var result = Y.summarize(bundle.rows, bundle.lossPercent);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.count, 4);
  approx(result.netCm, 14 * 1000 + 15 * 3000 + 16.5 * 3000 + 18 * 3000);
  approx(result.netCm, 162500);
  approx(result.netM, 1625);
  approx(result.lossPercent, 5);
  approx(result.grossCm, 170625);
  approx(result.grossM, 1706.25);
  approx(result.wasteM, 81.25);
  approx(result.yards, 170625 / 91.44);
  approx(result.orderYards, 1866);
  assert.strictEqual(result.rows[0].lengthMm, 140);
  assert.strictEqual(result.rows[2].lengthMm, 165);
})();

(function testZeroLoss() {
  var result = Y.summarize(Y.EXAMPLE.rows, 0);
  assert.strictEqual(result.ok, true);
  approx(result.grossM, 1625);
  approx(result.yards, 162500 / 91.44);
})();

(function testEmptyLossMeansZero() {
  var result = Y.summarize(Y.EXAMPLE.rows, "");
  assert.strictEqual(result.ok, true);
  approx(result.lossPercent, 0);
  approx(result.grossM, 1625);
})();

(function testSkipBlankRows() {
  var rows = [Y.blankRow()].concat(Y.EXAMPLE.rows).concat([Y.blankRow()]);
  var result = Y.summarize(rows, 5);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.count, 4);
  approx(result.netM, 1625);
})();

(function testInvalidRow() {
  var result = Y.summarize([{ name: "A", lengthCm: 14, qty: "" }], 5);
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.some(function (e) {
    return e.indexOf("数量") !== -1;
  }));
})();

(function testNegativeLoss() {
  var result = Y.summarize(Y.EXAMPLE.rows, -1);
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.some(function (e) {
    return e.indexOf("损耗不能为负数") !== -1;
  }));
})();

(function testCeilToTenth() {
  approx(Y.ceilTo(1865.01, 0.1), 1865.1);
  approx(Y.ceilTo(1865.988, 0.1), 1866);
  approx(Y.ceilTo(10, 0.1), 10);
})();

(function testLengthMm() {
  approx(Y.lengthMm(14), 140);
  approx(Y.lengthMm(16.5), 165);
})();

(function testSummaryText() {
  var result = Y.summarize(Y.EXAMPLE.rows, 5);
  var text = Y.summaryText(result, {
    contractNo: "LCM26-0210",
    orderNo: "LC-S026-0401",
  });
  assert.ok(text.indexOf("LCM26-0210") !== -1);
  assert.ok(text.indexOf("LC-S026-0401") !== -1);
  assert.ok(text.indexOf("1625.00 m") !== -1);
  assert.ok(text.indexOf("1706.25 m") !== -1);
  assert.ok(text.indexOf("1865.98") !== -1);
  assert.ok(text.indexOf("MIT") === -1);
})();

(function testEndWasteOnD8Example() {
  var Lout = require("./layout.js");
  var tape = { W: 20, D: 8, S: 30, Layout: Lout, leftoverMin: 10, cutTol: 0 };
  var result = Y.summarize(Y.EXAMPLE.rows, 0, tape);
  assert.strictEqual(result.ok, true);
  approx(result.netM, 1625);
  assert.strictEqual(result.rows[0].endsWasted, true);
  approx(result.rows[0].wasteSeamMm, 10);
  approx(result.rows[0].useTotalMm, 150010);
  approx(result.rows[0].useMm, 150.01);
  assert.strictEqual(result.rows[1].endsWasted, false);
  approx(result.rows[1].useMm, 150);
  assert.strictEqual(result.rows[2].endsWasted, true);
  approx(result.rows[2].wasteSeamMm, 15);
  approx(result.rows[2].useTotalMm, 540015);
  assert.strictEqual(result.rows[3].endsWasted, false);
  approx(result.rows[3].useMm, 180);
  approx(result.useM, 150.01 + 450 + 540.015 + 540);
  approx(result.endWasteM, result.useM - 1625);
})();

(function testNestableIgnoresCutTol() {
  var Lout = require("./layout.js");
  var tape = { W: 20, D: 8, S: 30, Layout: Lout, leftoverMin: 10, cutTol: 2 };
  var result = Y.summarize([{ name: "1/2 YAS", lengthCm: 15, qty: 3000 }], 0, tape);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.rows[0].endsWasted, false);
  approx(result.useM, 450);
})();

(function testCutTolAddsOnWastedSeams() {
  var Lout = require("./layout.js");
  var tape = { W: 20, D: 8, S: 30, Layout: Lout, leftoverMin: 10, cutTol: 2 };
  var result = Y.summarize([{ name: "6/12 AY", lengthCm: 14, qty: 1000 }], 0, tape);
  assert.strictEqual(result.ok, true);
  approx(result.rows[0].useTotalMm, 152012);
})();

(function testFormulaLineHasNoLicense() {
  var line = Y.formulaLine(Y.summarize(Y.EXAMPLE.rows, 5));
  assert.ok(line.indexOf("91.44") !== -1);
  assert.ok(line.indexOf("MIT") === -1);
})();

console.log("yardage.test.js: all passed");
