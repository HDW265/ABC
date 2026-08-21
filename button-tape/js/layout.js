/**
 * 扣带排版计算（毫米）。
 * 成品长 L = 止口 M + 间距 S × (N-1) + 止口 M
 * 止口允许 = 10 mm；有效下限 Mmin = max(10, D/2)
 * 自动方案：Mmin ≤ M ≤ S，按扣数从多到少。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.ButtonTapeLayout = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var EPS = 1e-6;

  function gte(a, b) {
    return a - b >= -EPS;
  }

  function lte(a, b) {
    return a - b <= EPS;
  }

  function gt(a, b) {
    return a - b > EPS;
  }

  function roundMm(n) {
    return Math.round(Number(n) * 1000) / 1000;
  }

  function formatMm(n) {
    var r = Math.round(Number(n) * 100) / 100;
    if (!isFinite(r)) return "—";
    if (Math.abs(r - Math.round(r)) < 0.001) return String(Math.round(r));
    return String(r);
  }

  function mMin(diameter) {
    return Math.max(10, Number(diameter) / 2);
  }

  function nMax(length, spacing, minMargin) {
    if (!(spacing > 0)) return 0;
    return Math.floor((length - 2 * minMargin) / spacing + EPS) + 1;
  }

  function marginFor(length, spacing, count) {
    return (length - (count - 1) * spacing) / 2;
  }

  /** 止口位：扣外缘到布边 = 中心到边 − 扣半径 */
  function leftoverMm(margin, diameter) {
    return roundMm(Number(margin) - Number(diameter) / 2);
  }

  function buttonCenters(margin, spacing, count) {
    var xs = [];
    var i;
    for (i = 0; i < count; i += 1) {
      xs.push(roundMm(margin + i * spacing));
    }
    return xs;
  }

  /** 两侧循环虚线扣中心：左 = M−S，右 = L−M+S，不计入扣数 */
  function ghostCenters(margin, spacing, length) {
    return {
      left: roundMm(Number(margin) - Number(spacing)),
      right: roundMm(Number(length) - Number(margin) + Number(spacing)),
    };
  }

  function formulaText(scheme) {
    if (!scheme) return "";
    if (scheme.N === 1) {
      return (
        formatMm(scheme.M) +
        " + " +
        formatMm(scheme.M) +
        " = " +
        formatMm(scheme.L) +
        "（单扣居中）"
      );
    }
    return (
      formatMm(scheme.M) +
      " + " +
      formatMm(scheme.S) +
      "×" +
      scheme.cycles +
      " + " +
      formatMm(scheme.M) +
      " = " +
      formatMm(scheme.L)
    );
  }

  function parsePositive(value, label, errors) {
    var n = typeof value === "number" ? value : parseFloat(String(value).trim());
    if (!isFinite(n)) {
      errors.push(label + "请填数字");
      return NaN;
    }
    if (!gt(n, 0)) {
      errors.push(label + "必须大于 0");
      return NaN;
    }
    return n;
  }

  function validateSpec(input) {
    var errors = [];
    var W = parsePositive(input.W, "布宽 ", errors);
    var D = parsePositive(input.D, "扣径 ", errors);
    var S = parsePositive(input.S, "间距 ", errors);
    var L = parsePositive(input.L, "成品长 ", errors);
    if (errors.length) {
      return { ok: false, errors: errors, W: W, D: D, S: S, L: L, mMin: NaN };
    }
    if (L > 10000) {
      errors.push("成品长超过 10000 mm，请检查是否误把单位当成 cm");
    }
    if (!gte(W, D)) {
      errors.push("布宽不能小于扣径（扣会超出布条）");
    }
    if (!gt(S, D)) {
      errors.push("间距必须大于扣径（扣会重叠）");
    }
    var minMargin = mMin(D);
    if (!gt(L, 2 * minMargin)) {
      errors.push(
        "成品长太短，无法保证左右止口各 ≥ " + formatMm(minMargin) + " mm"
      );
    }
    return {
      ok: errors.length === 0,
      errors: errors,
      W: W,
      D: D,
      S: S,
      L: L,
      mMin: minMargin,
    };
  }

  function schemeFor(length, spacing, count, minMargin) {
    var N = Math.round(Number(count));
    var M = marginFor(length, spacing, N);
    var cycles = N - 1;
    var valid = N >= 1 && gte(M, minMargin);
    var auto = valid && lte(M, spacing);
    var kind = "invalid";
    if (valid && auto) kind = "auto";
    else if (valid) kind = "custom";
    var scheme = {
      N: N,
      cycles: Math.max(0, cycles),
      M: roundMm(M),
      L: roundMm(length),
      S: roundMm(spacing),
      mMin: roundMm(minMargin),
      kind: kind,
      valid: valid,
      auto: auto,
      buttonXs: N >= 1 ? buttonCenters(M, spacing, N) : [],
    };
    scheme.formula = formulaText(scheme);
    return scheme;
  }

  function letterAt(index) {
    return String.fromCharCode(65 + (index % 26));
  }

  function plan(input) {
    var spec = validateSpec(input);
    var schemes = [];
    var maxN = 0;
    if (!spec.ok) {
      return {
        ok: false,
        errors: spec.errors,
        spec: spec,
        schemes: schemes,
        nMax: 0,
        mMin: spec.mMin,
      };
    }

    maxN = nMax(spec.L, spec.S, spec.mMin);
    if (maxN < 1) {
      return {
        ok: false,
        errors: ["无法排出至少 1 颗扣"],
        spec: spec,
        schemes: schemes,
        nMax: 0,
        mMin: spec.mMin,
      };
    }

    var n;
    var autoIndex = 0;
    for (n = maxN; n >= 1; n -= 1) {
      var sch = schemeFor(spec.L, spec.S, n, spec.mMin);
      if (sch.auto) {
        sch.letter = letterAt(autoIndex);
        sch.title = "方案 " + sch.letter;
        sch.subtitle = sch.N + " 扣 · 止口 " + formatMm(sch.M) + " mm";
        autoIndex += 1;
        schemes.push(sch);
      }
    }

    return {
      ok: true,
      errors: [],
      spec: spec,
      schemes: schemes,
      nMax: maxN,
      mMin: spec.mMin,
    };
  }

  function resolveSelection(planResult, requestedN) {
    if (!planResult.ok) {
      return { scheme: null, source: "error", warning: "" };
    }
    var spec = planResult.spec;
    var n = requestedN;
    var hasN = n !== null && n !== undefined && n !== "" && isFinite(Number(n));
    if (!hasN) {
      return {
        scheme: planResult.schemes[0] || null,
        source: "auto",
        warning: "",
      };
    }
    n = Math.round(Number(n));
    if (n < 1) {
      return {
        scheme: null,
        source: "invalid",
        warning: "扣数至少为 1",
      };
    }
    if (n > planResult.nMax) {
      return {
        scheme: null,
        source: "invalid",
        warning:
          "止口会小于 " +
          formatMm(planResult.mMin) +
          " mm，最多只能排 " +
          planResult.nMax +
          " 扣",
      };
    }
    var match = planResult.schemes.find(function (s) {
      return s.N === n;
    });
    if (match) {
      return { scheme: match, source: "auto", warning: "" };
    }
    var custom = schemeFor(spec.L, spec.S, n, spec.mMin);
    custom.letter = "自";
    custom.title = "自定义";
    custom.subtitle = custom.N + " 扣 · 止口 " + formatMm(custom.M) + " mm";
    var warning = "";
    if (custom.valid && !custom.auto) {
      warning = "止口大于间距，看起来会像两端少排了一颗扣";
    }
    return { scheme: custom, source: "custom", warning: warning };
  }

  function drawingMode(length, count, pixelDiameter) {
    if (length >= 800 || (pixelDiameter > 0 && pixelDiameter < 16) || count > 25) {
      return "breakout";
    }
    if (length >= 400 || count > 12 || (pixelDiameter > 0 && pixelDiameter < 24)) {
      return "full-table";
    }
    return "full";
  }

  return {
    EPS: EPS,
    gte: gte,
    lte: lte,
    gt: gt,
    roundMm: roundMm,
    formatMm: formatMm,
    mMin: mMin,
    nMax: nMax,
    marginFor: marginFor,
    leftoverMm: leftoverMm,
    buttonCenters: buttonCenters,
    ghostCenters: ghostCenters,
    formulaText: formulaText,
    validateSpec: validateSpec,
    schemeFor: schemeFor,
    plan: plan,
    resolveSelection: resolveSelection,
    drawingMode: drawingMode,
  };
});
