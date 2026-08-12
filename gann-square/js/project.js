/**
 * Constellate projection table (推演表)
 * 90° ≡ path 45° nearest hit; 180° ≡ path 180° (with consecutive-edge bounce).
 *
 * Segment n (1-based) candidates:
 *   180°(all of segment n-2) ∪ 90°(all of segment n-1)
 *   segment 1 = 90°(start) only
 * Scheme 1 (bounce collapse): if 180°(p) bounces to 45° and lands on the
 *   same price as 90°(p), exclude that 180° hit from the union.
 * Scheme 2 (cross-segment): drop prices already shown; downward new prices
 *   must be strictly below the display frontier (upward: strictly above).
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

  function almostEqualPrice(a, b) {
    return Math.abs(a - b) <= 1e-9;
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

  /**
   * Scheme 1: when planned 180° bounces onto the same land as 90°(p),
   * treat it as collapsed and omit from the 180° union.
   */
  function step180ForUnion(square, price, direction) {
    const s180 = step180(square, price, direction);
    if (!s180) return null;
    if (s180.bounced && s180.used === "45") {
      const s90 = step90(square, price, direction);
      if (s90 && almostEqualPrice(s90.price, s180.price)) return null;
    }
    return s180;
  }

  /** Scheme 2: drop already-shown prices and frontier reversals. */
  function filterMonotone(working, direction, seenDisplay, frontier) {
    let out = working.filter((p) => !seenDisplay.has(p));
    if (Number.isFinite(frontier)) {
      if (direction === "down") out = out.filter((p) => p < frontier);
      else out = out.filter((p) => p > frontier);
    }
    return out;
  }

  function updateFrontier(displayPrices, direction, frontier) {
    if (!displayPrices.length) return frontier;
    const edge =
      direction === "down" ? Math.min(...displayPrices) : Math.max(...displayPrices);
    if (!Number.isFinite(frontier)) return edge;
    if (direction === "down") return Math.min(frontier, edge);
    return Math.max(frontier, edge);
  }

  function sortEncounter(prices, direction) {
    return prices.slice().sort((a, b) => (direction === "down" ? b - a : a - b));
  }

  /** Keep up to `max` prices in encounter order, skipping |Δ|===unit neighbors of kept. */
  function takeNonAdjacent(prices, direction, max, unit) {
    const ordered = sortEncounter(prices, direction);
    const kept = [];
    for (let i = 0; i < ordered.length; i += 1) {
      const p = ordered[i];
      if (kept.some((k) => Math.abs(k - p) === unit)) continue;
      kept.push(p);
      if (kept.length >= max) break;
    }
    return kept;
  }

  /**
   * Display subset from a working set (秘诀展示). Segments after the first
   * keep at most 2 targets:
   * - All still before target: min+max (drop middles), e.g. 822/833/834 → 834,822
   * - Mixed sides: first encountered before-target + first past-target
   *   (drops adjacent near-side like 700 then 699 → keep 700 + 680)
   * - All past target: first two non-adjacent in encounter order (805,793)
   */
  function pickDisplay(prices, target, direction, unit) {
    const step = Number.isFinite(unit) && unit > 0 ? unit : 1;
    const uniq = uniqueSorted(prices);
    if (uniq.length <= 2) {
      return takeNonAdjacent(uniq, direction, 2, step);
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
      const firstBefore = sortEncounter(before, direction)[0];
      const firstPast = sortEncounter(past, direction)[0];
      return takeNonAdjacent([firstBefore, firstPast], direction, 2, step);
    }
    // All at/past target: first two non-adjacent (B: 805,793; drop 792)
    return takeNonAdjacent(past, direction, 2, step);
  }

  const PROJ_SEG_MIN = 2;
  const PROJ_SEG_MAX = 40;

  /** True when prices include at least one on the target side. */
  function touchesTargetSide(prices, target, direction) {
    const all = (Array.isArray(prices[0]) ? prices.flat() : prices).filter((p) =>
      Number.isFinite(p)
    );
    if (!all.length || !Number.isFinite(target)) return false;
    if (direction === "up") return all.some((p) => p >= target);
    return all.some((p) => p <= target);
  }

  /**
   * Complete when the last segment lands on the target side, or soft-lands:
   * frontier's own 90° is not closer, and the next segment's new last display
   * is also not closer (910→710 stops at 712; 248→1025 continues past 1012).
   */
  function isProjectionComplete(display, target, direction, square, nextLastDisplay) {
    if (!display || !display.length) return false;
    const last = display[display.length - 1] || [];
    if (touchesTargetSide(last, target, direction)) return true;
    if (!square || !last.length) return false;

    const frontier = direction === "down" ? Math.min(...last) : Math.max(...last);
    const curDist = Math.abs(frontier - target);
    const next = step90(square, frontier, direction);
    if (next && Math.abs(next.price - target) < curDist) return false;
    if (!nextLastDisplay) return false;
    const nextBest = Math.min(
      ...nextLastDisplay.filter((p) => Number.isFinite(p)).map((p) => Math.abs(p - target)),
      Infinity
    );
    return nextBest >= curDist;
  }

  /**
   * Smallest segment count (2…maxSeg) whose display covers the target.
   */
  function minSegmentsForProjection(square, options, maxSeg = PROJ_SEG_MAX) {
    const startRaw = Number(options.start);
    const targetRaw = Number(options.target);
    const direction = options.direction === "up" ? "up" : "down";
    const cap = Math.max(PROJ_SEG_MIN, Math.min(PROJ_SEG_MAX, Number(maxSeg) || PROJ_SEG_MAX));

    let prev = null;
    for (let s = PROJ_SEG_MIN; s <= cap; s += 1) {
      const r = runProjection(square, {
        start: startRaw,
        target: targetRaw,
        direction,
        segments: s,
      });
      if (!r.ok) continue;
      const last = r.display[r.display.length - 1] || [];
      // Soft-land on previous segment first (e.g. 712 before past-target 682).
      if (
        prev &&
        isProjectionComplete(prev.display, targetRaw, direction, square, last)
      ) {
        return { segments: s - 1, complete: true };
      }
      if (touchesTargetSide(last, targetRaw, direction)) {
        return { segments: s, complete: true };
      }
      prev = r;
    }
    if (prev) {
      const last = prev.display[prev.display.length - 1] || [];
      if (touchesTargetSide(last, targetRaw, direction)) {
        return { segments: cap, complete: true };
      }
    }
    return { segments: cap, complete: false };
  }

  /** effective = max(userSegments, minNeeded) when auto; honors user raising segments. */
  function resolveProjectionSegments(square, options) {
    const userSegments = Math.max(
      PROJ_SEG_MIN,
      Math.min(PROJ_SEG_MAX, Number(options.userSegments) || 4)
    );
    const { segments: minNeeded, complete: minComplete } = minSegmentsForProjection(square, {
      start: options.start,
      target: options.target,
      direction: options.direction,
    });
    const effective = Math.max(userSegments, minNeeded);
    const complete = minComplete || effective > minNeeded;
    return {
      effective,
      userSegments,
      minNeeded,
      complete,
      adapted: effective > userSegments,
    };
  }

  /**
   * Secret projection (秘诀). Channel templates are not generated (A1).
   */
  function runProjection(square, options) {
    const startRaw = Number(options.start);
    const targetRaw = Number(options.target);
    const direction = options.direction === "up" ? "up" : "down";
    const segments = Math.max(
      PROJ_SEG_MIN,
      Math.min(PROJ_SEG_MAX, Number(options.segments) || 4)
    );

    if (!Number.isFinite(startRaw) || !Number.isFinite(targetRaw)) {
      return { ok: false, message: "请输入有效起点与目标价" };
    }

    const full = [];
    const display = [];
    const seenDisplay = new Set();
    let frontier = startRaw;

    const unit = Math.abs(Number(square.step)) || 1;
    const first = step90(square, startRaw, direction);
    full[0] = first ? [first.price] : [];
    display[0] = full[0].slice();
    display[0].forEach((p) => seenDisplay.add(p));
    frontier = updateFrontier(display[0], direction, frontier);

    for (let n = 1; n < segments; n += 1) {
      const prev2 = n === 1 ? [startRaw] : full[n - 2];
      const prev1 = full[n - 1];
      const group1 = [];
      const group2 = [];
      prev2.forEach((p) => {
        const s = step180ForUnion(square, p, direction);
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

      working = filterMonotone(working, direction, seenDisplay, frontier);
      full[n] = working;
      display[n] = pickDisplay(working, targetRaw, direction, unit);
      display[n].forEach((p) => seenDisplay.add(p));
      frontier = updateFrontier(display[n], direction, frontier);
    }

    const secretParts = display
      .map((prices) => prices.map((p) => global.GannSquare.formatNumber(p)).join("、"))
      .filter((part) => part.length > 0);
    const secretBody = secretParts.join(" — ");
    const secretLine = `${global.GannSquare.formatNumber(startRaw)} 推 ${global.GannSquare.formatNumber(targetRaw)} · Constellate · 完整推演 = ${secretBody}`;

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
      allDisplayPrices,
      message: secretLine,
    };
  }

  global.GannProject = {
    runProjection,
    resolveProjectionSegments,
    minSegmentsForProjection,
    isProjectionComplete,
    pickDisplay,
    step90,
    step180,
    step180ForUnion,
    filterMonotone,
    angleStep,
    PROJ_SEG_MIN,
    PROJ_SEG_MAX,
  };
})(window);
