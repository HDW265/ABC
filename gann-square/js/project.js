/**
 * Constellate projection table (推演表)
 * 90° ≡ path 45° nearest hit; 180° ≡ path 180° (with consecutive-edge bounce).
 *
 * Segment n (1-based) candidates:
 *   180°(all of segment n-2) ∪ 90°(all of segment n-1)
 *   segment 1 = 90°(start) only
 * Option B: when segment n-1 has ≥3 prices, drop 90°(extreme of n-1)
 *   if that hit is not also in the 180° group (excludes 822→804 on 922→807).
 * Display: if all on near side of target → min+max; else keep far-side all
 *   + first encountered on past/at-target side.
 *
 * Spec: gann-square/PATH_ALGORITHM.md
 */
(function (global) {
  function uniqueSorted(arr) {
    return Array.from(new Set(arr.filter((v) => Number.isFinite(v)))).sort((a, b) => a - b);
  }

  function angleStep(square, price, plannedKind, direction) {
    const hit = global.GannPath.findNearestCell(square, price);
    if (!hit.cell) return null;
    const cell = hit.cell;
    const resolved = global.GannPath.resolveMoveKind(square, cell, plannedKind, direction);
    const cands =
      resolved.kind === "45"
        ? global.GannPath.candidates45(square, cell, direction)
        : global.GannPath.candidates180(square, cell, direction);
    if (!cands.length) return null;
    const pick = cands[0];
    return {
      price: pick.price,
      cell: pick.cell,
      move: pick.move,
      planned: plannedKind,
      used: resolved.kind,
      bounced: resolved.bounced,
    };
  }

  function step90(square, price, direction) {
    return angleStep(square, price, "45", direction);
  }

  function step180(square, price, direction) {
    return angleStep(square, price, "180", direction);
  }

  /** Ordered templates of 90/180 summing to segmentCount * 90. */
  function templatesForSegments(segmentCount) {
    const total = segmentCount * 90;
    const out = [];
    function rec(remaining, acc) {
      if (remaining === 0) {
        out.push(acc.slice());
        return;
      }
      if (remaining < 90) return;
      acc.push(90);
      rec(remaining - 90, acc);
      acc.pop();
      if (remaining >= 180) {
        acc.push(180);
        rec(remaining - 180, acc);
        acc.pop();
      }
    }
    rec(total, []);
    return out;
  }

  function templateLabel(template) {
    return template.join("-");
  }

  /**
   * Fill columns: each 90 advances 1 col; each 180 skips 1 then lands.
   */
  function fillTemplate(square, start, template, direction) {
    const cols = segmentCountFromTemplate(template);
    const cells = new Array(cols).fill(null);
    let col = 0;
    let price = start;
    for (let i = 0; i < template.length; i += 1) {
      const angle = template[i];
      const planned = angle === 90 ? "45" : "180";
      const step = angleStep(square, price, planned, direction);
      if (!step) break;
      if (angle === 180) {
        col += 1;
        if (col < cols) cells[col] = step.price;
        col += 1;
      } else {
        if (col < cols) cells[col] = step.price;
        col += 1;
      }
      price = step.price;
    }
    return cells;
  }

  function segmentCountFromTemplate(template) {
    return template.reduce((s, a) => s + a / 90, 0);
  }

  function sortEncounter(prices, direction) {
    return prices.slice().sort((a, b) => (direction === "down" ? b - a : a - b));
  }

  /**
   * Display subset from a working set (秘诀展示).
   * - All still before target: keep min+max (drop middles), e.g. 822/833/834 → 822,834
   * - Mixed / all past target: keep far-side points + first one(s) on the past side
   *   by encounter order (down: high→low). All-past with 3+ → first two (805,793; drop 792).
   */
  function pickDisplay(prices, target, direction) {
    const uniq = uniqueSorted(prices);
    if (uniq.length <= 2) {
      return sortEncounter(uniq, direction);
    }
    if (!Number.isFinite(target)) {
      return sortEncounter([uniq[0], uniq[uniq.length - 1]], direction);
    }
    const before =
      direction === "down" ? uniq.filter((p) => p > target) : uniq.filter((p) => p < target);
    const past =
      direction === "down" ? uniq.filter((p) => p <= target) : uniq.filter((p) => p >= target);

    if (before.length && !past.length) {
      return sortEncounter([uniq[0], uniq[uniq.length - 1]], direction);
    }
    if (before.length && past.length) {
      const firstPast = sortEncounter(past, direction)[0];
      return sortEncounter([...before, firstPast], direction);
    }
    // All at/past target: keep first two in encounter order (B: 805,793)
    const ordered = sortEncounter(past, direction);
    return ordered.slice(0, 2);
  }

  function channelTitle(segmentCount, templateCount) {
    if (segmentCount === 4) return "五通道明细";
    if (segmentCount === 5) return "八通道明细";
    return `${templateCount}通道明细`;
  }

  /**
   * Secret projection + channel table.
   */
  function runProjection(square, options) {
    const startRaw = Number(options.start);
    const targetRaw = Number(options.target);
    const direction = options.direction === "up" ? "up" : "down";
    const segments = Math.max(1, Math.min(12, Number(options.segments) || 4));

    if (!Number.isFinite(startRaw) || !Number.isFinite(targetRaw)) {
      return { ok: false, message: "请输入有效起点与目标价" };
    }

    const full = [];
    const display = [];

    const first = step90(square, startRaw, direction);
    full[0] = first ? [first.price] : [];
    display[0] = pickDisplay(full[0], targetRaw, direction);

    for (let n = 1; n < segments; n += 1) {
      const prev2 = n === 1 ? [startRaw] : full[n - 2];
      const prev1 = full[n - 1];
      const group1 = [];
      const group2 = [];
      prev2.forEach((p) => {
        const s = step180(square, p, direction);
        if (s) group1.push(s.price);
      });
      prev1.forEach((p) => {
        const s = step90(square, p, direction);
        if (s) group2.push(s.price);
      });

      let working = uniqueSorted([...group1, ...group2]);

      // Option B: drop 90°(extreme of prev full) when not in 180° group
      if (prev1.length >= 3) {
        const extreme = direction === "down" ? Math.min(...prev1) : Math.max(...prev1);
        const e90 = step90(square, extreme, direction);
        if (e90 && !group1.includes(e90.price)) {
          working = working.filter((p) => p !== e90.price);
        }
      }

      full[n] = working;
      display[n] = pickDisplay(working, targetRaw, direction);
    }

    const templates = templatesForSegments(segments);
    const channels = templates.map((tpl) => ({
      label: templateLabel(tpl),
      template: tpl,
      cells: fillTemplate(square, startRaw, tpl, direction),
    }));

    const secretParts = display.map((prices) =>
      prices.map((p) => global.GannSquare.formatNumber(p)).join("、")
    );
    const secretLine = `${global.GannSquare.formatNumber(startRaw)} 推 ${global.GannSquare.formatNumber(targetRaw)} = ${secretParts.join(" — ")}`;

    const allDisplayPrices = uniqueSorted(display.flat());

    return {
      ok: true,
      startRaw,
      targetRaw,
      direction,
      segments,
      full,
      display,
      secretParts,
      secretLine,
      templates,
      channels,
      channelTitle: channelTitle(segments, templates.length),
      templateCount: templates.length,
      allDisplayPrices,
      message: secretLine,
    };
  }

  global.GannProject = {
    runProjection,
    templatesForSegments,
    fillTemplate,
    pickDisplay,
    step90,
    step180,
    angleStep,
    channelTitle,
  };
})(window);
