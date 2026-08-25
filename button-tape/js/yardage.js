/**
 * 细数分配计码长。
 * 净长 cm = Σ(单件长 cm × 数量)
 * 含损耗 cm = 净长 × (1 + 损耗% / 100)
 * 码长 yd = 含损耗 cm / 91.44（1 码 = 0.9144 m）
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.ButtonTapeYardage = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var CM_PER_YARD = 91.44;
  var M_PER_YARD = 0.9144;

  var EXAMPLE = {
    contractNo: "LCM26-0210",
    orderNo: "LC-S026-0401",
    lossPercent: 5,
    rows: [
      { name: "6/12 AY", lengthCm: 14, qty: 1000 },
      { name: "1/2 YAS", lengthCm: 15, qty: 3000 },
      { name: "2/3 YAS", lengthCm: 16.5, qty: 3000 },
      { name: "3/4 YAS", lengthCm: 18, qty: 3000 },
    ],
  };

  function blankRow() {
    return { name: "", lengthCm: "", qty: "" };
  }

  function exampleBundle() {
    return {
      contractNo: EXAMPLE.contractNo,
      orderNo: EXAMPLE.orderNo,
      lossPercent: EXAMPLE.lossPercent,
      rows: EXAMPLE.rows.map(cloneRow),
    };
  }

  function cloneRow(row) {
    return {
      name: row.name,
      lengthCm: row.lengthCm,
      qty: row.qty,
    };
  }

  function isBlank(value) {
    return value === null || value === undefined || String(value).trim() === "";
  }

  function parseNumber(value) {
    if (typeof value === "number") return value;
    var n = parseFloat(String(value).trim().replace(/,/g, ""));
    return n;
  }

  function roundTo(n, digits) {
    var f = Math.pow(10, digits);
    return Math.round(Number(n) * f) / f;
  }

  function formatNum(n, digits) {
    if (!isFinite(n)) return "—";
    var r = roundTo(n, digits);
    if (digits === 0) return String(Math.round(r));
    return r.toFixed(digits).replace(/\.?0+$/, function (m) {
      return m.indexOf(".") === -1 ? m : m.replace(/0+$/, "").replace(/\.$/, "");
    });
  }

  function formatFixed(n, digits) {
    if (!isFinite(n)) return "—";
    return roundTo(n, digits).toFixed(digits);
  }

  function lengthMm(lengthCm) {
    var n = parseNumber(lengthCm);
    if (!isFinite(n)) return NaN;
    return roundTo(n * 10, 3);
  }

  function ceilTo(n, step) {
    if (!(step > 0) || !isFinite(n)) return NaN;
    return Math.ceil((n - 1e-12) / step) * step;
  }

  function rowIsEmpty(row) {
    if (!row) return true;
    return isBlank(row.name) && isBlank(row.lengthCm) && isBlank(row.qty);
  }

  function parseRow(row, index) {
    if (rowIsEmpty(row)) {
      return { skip: true };
    }
    var errors = [];
    var lengthCm = parseNumber(row.lengthCm);
    var qty = parseNumber(row.qty);
    var label = "第 " + (index + 1) + " 档";
    if (isBlank(row.lengthCm) || !isFinite(lengthCm) || !(lengthCm > 0)) {
      errors.push(label + "单件长须大于 0 cm");
    }
    if (isBlank(row.qty) || !isFinite(qty) || !(qty > 0)) {
      errors.push(label + "数量须大于 0");
    }
    if (errors.length) {
      return { skip: false, ok: false, errors: errors };
    }
    var subtotalCm = lengthCm * qty;
    return {
      skip: false,
      ok: true,
      errors: [],
      name: String(row.name || "").trim(),
      lengthCm: lengthCm,
      lengthMm: lengthMm(lengthCm),
      qty: qty,
      subtotalCm: subtotalCm,
      subtotalM: subtotalCm / 100,
    };
  }

  function parseLoss(lossPercent) {
    if (isBlank(lossPercent)) return { ok: true, value: 0, errors: [] };
    var n = parseNumber(lossPercent);
    if (!isFinite(n)) {
      return { ok: false, value: NaN, errors: ["损耗请填数字"] };
    }
    if (n < 0) {
      return { ok: false, value: n, errors: ["损耗不能为负数"] };
    }
    return { ok: true, value: n, errors: [] };
  }

  function summarize(rows, lossPercent) {
    var loss = parseLoss(lossPercent);
    var errors = loss.errors.slice();
    var used = [];
    var i;
    var parsed;
    var list = Array.isArray(rows) ? rows : [];
    for (i = 0; i < list.length; i += 1) {
      parsed = parseRow(list[i], i);
      if (parsed.skip) continue;
      if (!parsed.ok) {
        errors = errors.concat(parsed.errors);
        continue;
      }
      used.push(parsed);
    }
    var netCm = 0;
    for (i = 0; i < used.length; i += 1) {
      netCm += used[i].subtotalCm;
    }
    var factor = 1 + (loss.ok ? loss.value : 0) / 100;
    var grossCm = netCm * factor;
    var wasteCm = grossCm - netCm;
    var ok = errors.length === 0 && used.length > 0 && loss.ok;
    var yards = grossCm / CM_PER_YARD;
    return {
      ok: ok,
      errors: errors,
      rows: used,
      count: used.length,
      lossPercent: loss.ok ? loss.value : NaN,
      netCm: netCm,
      wasteCm: wasteCm,
      grossCm: grossCm,
      netM: netCm / 100,
      wasteM: wasteCm / 100,
      grossM: grossCm / 100,
      yards: yards,
      orderYards: ceilTo(yards, 0.1),
    };
  }

  function formulaLine(result) {
    if (!result || !result.ok) return "";
    return (
      "Σ(单件长 cm × 数量) = " +
      formatNum(result.netCm, 2) +
      " cm → × (1+" +
      formatNum(result.lossPercent, 2) +
      "%) = " +
      formatNum(result.grossCm, 2) +
      " cm → ÷ 91.44 = " +
      formatFixed(result.yards, 2) +
      " 码"
    );
  }

  function summaryText(result, meta) {
    meta = meta || {};
    if (!result || !result.ok) {
      return (result && result.errors && result.errors.join("；")) || "请填写规格、单件长和数量";
    }
    var head = [meta.contractNo, meta.orderNo].filter(function (s) {
      return s && String(s).trim();
    });
    var prefix = head.length ? head.join(" / ") + "：" : "";
    return (
      prefix +
      "净长 " +
      formatFixed(result.netM, 2) +
      " m，损耗 " +
      formatNum(result.lossPercent, 2) +
      "%，含损耗 " +
      formatFixed(result.grossM, 2) +
      " m，码长 " +
      formatFixed(result.yards, 2) +
      " yd（建议下单 " +
      formatFixed(result.orderYards, 1) +
      " 码）"
    );
  }

  return {
    CM_PER_YARD: CM_PER_YARD,
    M_PER_YARD: M_PER_YARD,
    EXAMPLE: EXAMPLE,
    blankRow: blankRow,
    exampleBundle: exampleBundle,
    cloneRow: cloneRow,
    isBlank: isBlank,
    parseNumber: parseNumber,
    roundTo: roundTo,
    formatNum: formatNum,
    formatFixed: formatFixed,
    lengthMm: lengthMm,
    ceilTo: ceilTo,
    rowIsEmpty: rowIsEmpty,
    parseRow: parseRow,
    parseLoss: parseLoss,
    summarize: summarize,
    formulaLine: formulaLine,
    summaryText: summaryText,
  };
});
