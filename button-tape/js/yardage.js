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

  function parseCutTol(cutTolMm) {
    if (isBlank(cutTolMm)) return { ok: true, value: 0, errors: [] };
    var n = parseNumber(cutTolMm);
    if (!isFinite(n)) {
      return { ok: false, value: NaN, errors: ["切布公差请填数字"] };
    }
    if (n < 0) {
      return { ok: false, value: n, errors: ["切布公差不能为负数"] };
    }
    return { ok: true, value: n, errors: [] };
  }

  function attachPieceUse(parsed, tape) {
    parsed.useMm = parsed.lengthMm;
    parsed.useTotalMm = parsed.lengthMm * parsed.qty;
    parsed.useCm = parsed.subtotalCm;
    parsed.endsWasted = false;
    parsed.schemeN = null;
    parsed.wasteSeamMm = 0;
    parsed.cutTolMm = 0;
    parsed.seamCount = 0;
    parsed.schemeFormula = "";
    parsed.leftoverSewable = NaN;
    parsed.schemeM = NaN;
    parsed.unrealizable = false;
    parsed.warning = "";
    if (!parsed || !tape || !tape.Layout || !(tape.S > 0) || !(tape.D > 0)) {
      return;
    }
    var Layout = tape.Layout;
    var spec = {
      W: tape.W > 0 ? tape.W : tape.D,
      D: tape.D,
      S: tape.S,
      L: parsed.lengthMm,
      leftoverMin: tape.leftoverMin,
    };
    var plan = Layout.plan(spec);
    var n = tape.selectedN;
    if (
      tape.selectedL != null &&
      isFinite(Number(tape.selectedL)) &&
      Math.abs(parsed.lengthMm - Number(tape.selectedL)) > 0.05
    ) {
      n = null;
    }
    var sel = Layout.resolveSelection(plan, n);
    var sch = null;
    if (sel.scheme && (sel.source === "auto" || sel.source === "custom")) {
      sch = sel.scheme;
    }
    if (!sch && plan.schemes && plan.schemes[0]) sch = plan.schemes[0];
    if (!sch) {
      parsed.warning = (sel && sel.warning) || "无自动排法，用料暂按成品长";
      return;
    }
    parsed.schemeN = sch.N;
    parsed.schemeFormula = sch.formula;
    parsed.leftoverSewable = sch.leftoverSewable;
    parsed.schemeM = sch.M;
    parsed.unrealizable = !sch.auto;
    parsed.warning = (sel && sel.warning) || "";
    var wasted = !!sch.endsWasted && !!sch.auto;
    if (!sch.auto) {
      parsed.endsWasted = false;
      parsed.useMm = parsed.lengthMm;
      parsed.useTotalMm = parsed.lengthMm * parsed.qty;
      parsed.useCm = parsed.subtotalCm;
      return;
    }
    var seam = wasted ? Number(sch.wasteSeamMm) || 0 : 0;
    var tol = wasted ? Number(tape.cutTol) || 0 : 0;
    if (!(tol > 0)) tol = 0;
    var totalMm = Layout.rowUseMm(parsed.lengthMm, parsed.qty, seam, tol, wasted);
    parsed.endsWasted = wasted;
    parsed.wasteSeamMm = seam;
    parsed.cutTolMm = tol;
    parsed.seamCount = wasted ? parsed.qty + 1 : 0;
    parsed.useTotalMm = totalMm;
    parsed.useMm = totalMm / parsed.qty;
    parsed.useCm = totalMm / 10;
  }

  function rowWorksheet(parsed, tape) {
    if (!parsed || !parsed.ok) return "";
    tape = tape || {};
    var Layout = tape.Layout;
    var fmt = Layout && Layout.formatMm ? Layout.formatMm : formatNum;
    var T =
      tape.leftoverMin != null && tape.leftoverMin !== ""
        ? Number(tape.leftoverMin)
        : 10;
    var lines = [];
    var title = parsed.name ? parsed.name + "　" : "";
    lines.push(
      title +
        formatNum(parsed.lengthCm, 2) +
        " cm = " +
        formatNum(parsed.lengthMm, 2) +
        " mm × " +
        formatNum(parsed.qty, 0)
    );
    if (parsed.schemeN) {
      lines.push(
        "排版：" +
          parsed.schemeN +
          " 扣　" +
          (parsed.schemeFormula || "")
      );
    }
    if (isFinite(parsed.leftoverSewable)) {
      lines.push(
        "止口位 " +
          fmt(parsed.leftoverSewable) +
          " mm，下限 T = " +
          fmt(T) +
          " mm"
      );
    }
    if (parsed.unrealizable) {
      lines.push(parsed.warning || "无自动排法，用料暂按成品长");
      lines.push(
        "成品 " +
          formatFixed(parsed.subtotalM, 2) +
          " m　用料 " +
          formatFixed(parsed.useCm / 100, 2) +
          " m"
      );
      return lines.join("\n");
    }
    if (!parsed.endsWasted) {
      lines.push("可接同一规格，不加片间废缝、不加公差、不加头尾废扣");
    } else {
      lines.push(
        "不能按间距一半对接。片间废缝 = ⌈L/S⌉×S − L = " +
          fmt(parsed.wasteSeamMm) +
          " mm（含 1 颗废扣）"
      );
      lines.push(
        "整卷头尾各 1 段废缝，共 " +
          formatNum(parsed.seamCount, 0) +
          " 段"
      );
      lines.push("切布公差 δ = " + fmt(parsed.cutTolMm) + " mm");
    }
    lines.push(
      "用料 = " +
        formatNum(parsed.qty, 0) +
        "×" +
        fmt(parsed.lengthMm) +
        (parsed.endsWasted
          ? " + " +
            formatNum(parsed.seamCount, 0) +
            "×(" +
            fmt(parsed.wasteSeamMm) +
            "+" +
            fmt(parsed.cutTolMm) +
            ")"
          : "") +
        " = " +
        fmt(parsed.useTotalMm) +
        " mm = " +
        formatFixed(parsed.useCm / 100, 2) +
        " m"
    );
    lines.push("成品 " + formatFixed(parsed.subtotalM, 2) + " m");
    return lines.join("\n");
  }

  function worksheetText(result, meta, tape) {
    meta = meta || {};
    tape = tape || {};
    var lines = [];
    var head = [meta.contractNo, meta.orderNo].filter(function (s) {
      return s && String(s).trim();
    });
    if (head.length) lines.push(head.join(" / "));
    if (tape.W || tape.D || tape.S) {
      lines.push(
        "布宽 " +
          formatNum(tape.W, 2) +
          " mm · 扣径 " +
          formatNum(tape.D, 2) +
          " mm · 间距 " +
          formatNum(tape.S, 2) +
          " mm · 止口下限 T " +
          formatNum(tape.leftoverMin != null ? tape.leftoverMin : 10, 2) +
          " mm · 切布公差 δ " +
          formatNum(tape.cutTol || 0, 2) +
          " mm"
      );
    }
    lines.push("");
    if (!result || !result.ok) {
      lines.push((result && result.errors && result.errors.join("；")) || "请填写规格、单件长和数量");
      return lines.join("\n");
    }
    result.rows.forEach(function (row, i) {
      if (i) lines.push("");
      lines.push(rowWorksheet(row, tape));
    });
    lines.push("");
    lines.push(formulaLine(result));
    lines.push(summaryText(result, meta));
    return lines.join("\n");
  }

  function summarize(rows, lossPercent, tape) {
    tape = tape || {};
    var loss = parseLoss(lossPercent);
    var tol = parseCutTol(tape.cutTol);
    var errors = loss.errors.concat(tol.errors);
    var tapeUse = {
      Layout: tape.Layout,
      W: tape.W,
      D: tape.D,
      S: tape.S,
      leftoverMin: tape.leftoverMin,
      cutTol: tol.ok ? tol.value : 0,
      selectedN: tape.selectedN,
      selectedL: tape.selectedL,
    };
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
    var useCm = 0;
    for (i = 0; i < used.length; i += 1) {
      attachPieceUse(used[i], tapeUse);
      used[i].worksheet = rowWorksheet(used[i], tapeUse);
      netCm += used[i].subtotalCm;
      useCm += used[i].useCm;
    }
    var endWasteCm = useCm - netCm;
    var factor = 1 + (loss.ok ? loss.value : 0) / 100;
    var grossCm = useCm * factor;
    var otherWasteCm = grossCm - useCm;
    var ok = errors.length === 0 && used.length > 0 && loss.ok;
    var yards = grossCm / CM_PER_YARD;
    return {
      ok: ok,
      errors: errors,
      rows: used,
      count: used.length,
      lossPercent: loss.ok ? loss.value : NaN,
      netCm: netCm,
      useCm: useCm,
      endWasteCm: endWasteCm,
      wasteCm: otherWasteCm,
      grossCm: grossCm,
      netM: netCm / 100,
      useM: useCm / 100,
      endWasteM: endWasteCm / 100,
      wasteM: otherWasteCm / 100,
      grossM: grossCm / 100,
      yards: yards,
      orderYards: ceilTo(yards, 0.1),
    };
  }

  function formulaLine(result) {
    if (!result || !result.ok) return "";
    return (
      "Σ成品 = " +
      formatNum(result.netCm, 2) +
      " cm" +
      (result.endWasteCm > 0.001
        ? " + 端扣废料 " + formatNum(result.endWasteCm, 2) + " cm"
        : "") +
      " → 用料 " +
      formatNum(result.useCm, 2) +
      " cm × (1+" +
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
      " m" +
      (result.endWasteM > 0.001
        ? "，端扣废料 " + formatFixed(result.endWasteM, 2) + " m"
        : "") +
      "，用料 " +
      formatFixed(result.useM, 2) +
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
    parseCutTol: parseCutTol,
    attachPieceUse: attachPieceUse,
    rowWorksheet: rowWorksheet,
    worksheetText: worksheetText,
    summarize: summarize,
    formulaLine: formulaLine,
    summaryText: summaryText,
  };
});
