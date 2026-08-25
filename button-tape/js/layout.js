/**
 * 扣带排版计算（毫米）。
 * 成品长 L = 中心止口 M + 间距 S × (N-1) + 中心止口 M
 * 可车缝止口位 = M − 半径 − 伸进本片的循环扣；自动方案要求 ≥ 10 mm，
 * 且循环扣整颗在片外（裁口不能切过扣，止口里不能有扣位）。
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

  var LEFTOVER_MIN = 10;

  function leftoverMin() {
    return LEFTOVER_MIN;
  }

  /** 无循环扣侵入时，可车缝止口位 ≥ 10 所需的中心止口 */
  function mMin(diameter) {
    return LEFTOVER_MIN + Number(diameter) / 2;
  }

  function nMax(length, spacing, minMargin) {
    if (!(spacing > 0)) return 0;
    return Math.floor((length - 2 * minMargin) / spacing + EPS) + 1;
  }

  function marginFor(length, spacing, count) {
    return (length - (count - 1) * spacing) / 2;
  }

  /** 扣外缘到布边（未扣循环扣） */
  function leftoverMm(margin, diameter) {
    return roundMm(Number(margin) - Number(diameter) / 2);
  }

  /** 下一循环扣伸进本片的长度 */
  function ghostInvasionMm(margin, spacing, diameter) {
    var r = Number(diameter) / 2;
    return roundMm(Math.max(0, Number(margin) - Number(spacing) + r));
  }

  /** 可车缝止口位：中心止口 − 本颗半径 − 伸进本片的循环扣 */
  function leftoverSewableMm(margin, spacing, diameter) {
    return roundMm(
      leftoverMm(margin, diameter) - ghostInvasionMm(margin, spacing, diameter)
    );
  }

  /** 下一循环扣相对裁口的净止口位（外缘到裁口） */
  function ghostEdgeLeftoverMm(margin, spacing, diameter) {
    var delta = Math.abs(Number(spacing) - Number(margin));
    return roundMm(delta - Number(diameter) / 2);
  }

  function nestsSameSpec(margin, spacing) {
    return Math.abs(Number(margin) - Number(spacing) / 2) <= EPS;
  }

  /** 成卷连裁同一规格时，两端下一循环是否作废 */
  function endsWasted(margin, spacing, diameter) {
    return !(
      gte(ghostEdgeLeftoverMm(margin, spacing, diameter), LEFTOVER_MIN) &&
      nestsSameSpec(margin, spacing)
    );
  }

  function pieceUseMm(length, spacing, margin, diameter) {
    var L = Number(length);
    var S = Number(spacing);
    return roundMm(endsWasted(margin, S, diameter) ? L + 2 * S : L);
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
        "成品长太短，无法保证左右可车缝止口位各 ≥ " +
          formatMm(LEFTOVER_MIN) +
          " mm"
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

  function schemeFor(length, spacing, count, diameter) {
    var D = Number(diameter);
    var N = Math.round(Number(count));
    var M = marginFor(length, spacing, N);
    var cycles = N - 1;
    var sewable = leftoverSewableMm(M, spacing, D);
    var invasion = ghostInvasionMm(M, spacing, D);
    var valid = N >= 1 && gt(M, D / 2);
    var auto =
      valid &&
      gte(sewable, LEFTOVER_MIN) &&
      lte(M, spacing) &&
      !gt(invasion, 0);
    var kind = "invalid";
    if (auto) kind = "auto";
    else if (valid) kind = "custom";
    var wasted = valid ? endsWasted(M, spacing, D) : true;
    var scheme = {
      N: N,
      cycles: Math.max(0, cycles),
      M: roundMm(M),
      L: roundMm(length),
      S: roundMm(spacing),
      D: roundMm(D),
      mMin: roundMm(mMin(D)),
      leftover: leftoverMm(M, D),
      leftoverSewable: sewable,
      ghostInvasion: ghostInvasionMm(M, spacing, D),
      ghostEdgeLeftover: ghostEdgeLeftoverMm(M, spacing, D),
      endsWasted: wasted,
      useMm: valid ? pieceUseMm(length, spacing, M, D) : roundMm(length),
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
    if (!spec.ok) {
      return {
        ok: false,
        errors: spec.errors,
        spec: spec,
        schemes: schemes,
        nMax: 0,
        nFit: 0,
        mMin: spec.mMin,
      };
    }

    var nFit = nMax(spec.L, spec.S, spec.D / 2);
    if (nFit < 1) {
      return {
        ok: false,
        errors: ["无法排出至少 1 颗扣"],
        spec: spec,
        schemes: schemes,
        nMax: 0,
        nFit: 0,
        mMin: spec.mMin,
      };
    }

    var n;
    var autoIndex = 0;
    for (n = nFit; n >= 1; n -= 1) {
      var sch = schemeFor(spec.L, spec.S, n, spec.D);
      if (sch.auto) {
        sch.letter = letterAt(autoIndex);
        sch.title = "方案 " + sch.letter;
        sch.subtitle =
          sch.N + " 扣 · 止口位 " + formatMm(sch.leftoverSewable) + " mm";
        autoIndex += 1;
        schemes.push(sch);
      }
    }

    return {
      ok: true,
      errors: [],
      spec: spec,
      schemes: schemes,
      nMax: schemes.length ? schemes[0].N : 0,
      nFit: nFit,
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
      if (!planResult.schemes.length) {
        return {
          scheme: null,
          source: "auto",
          warning:
            "没有可裁可车的自动方案。裁口不能切过循环扣，可车缝止口位须 ≥ 10 mm。可改扣径或成品长，或手填扣数查看。",
        };
      }
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
    if (n > (planResult.nFit || planResult.nMax)) {
      return {
        scheme: null,
        source: "invalid",
        warning: "扣会超出布条，最多只能排 " + (planResult.nFit || planResult.nMax) + " 扣",
      };
    }
    var match = planResult.schemes.find(function (s) {
      return s.N === n;
    });
    if (match) {
      return { scheme: match, source: "auto", warning: "" };
    }
    var custom = schemeFor(spec.L, spec.S, n, spec.D);
    custom.letter = "自";
    custom.title = "自定义";
    custom.subtitle =
      custom.N + " 扣 · 止口位 " + formatMm(custom.leftoverSewable) + " mm";
    var warning = "";
    if (custom.valid && !gte(custom.leftoverSewable, LEFTOVER_MIN)) {
      warning =
        "可车缝止口位 " +
        formatMm(custom.leftoverSewable) +
        " mm < 10 mm，不合理";
    } else if (custom.valid && gt(custom.ghostInvasion, 0)) {
      warning =
        "循环扣压在裁口或止口里，扣位不能车缝，该排法无法实现";
    } else if (custom.valid && !custom.auto) {
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
    leftoverMin: leftoverMin,
    mMin: mMin,
    nMax: nMax,
    marginFor: marginFor,
    leftoverMm: leftoverMm,
    ghostInvasionMm: ghostInvasionMm,
    leftoverSewableMm: leftoverSewableMm,
    ghostEdgeLeftoverMm: ghostEdgeLeftoverMm,
    nestsSameSpec: nestsSameSpec,
    endsWasted: endsWasted,
    pieceUseMm: pieceUseMm,
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
