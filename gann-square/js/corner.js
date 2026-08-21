/**
 * 四角推图法 — Four-Corner Path on the Square of Nine.
 *
 * v1: 45° polyline + 180° rebound table/overlay. No projection segments.
 *
 * Understanding:
 * - The start (e.g. 922) is the origin of the hunt, not a 45°-found
 *   low/high. The polyline includes start (922 → 880 → … → 660).
 * - 180° rebound runs only from 45° landing points, never from start.
 *
 * Down: 45° finds lows (smallest |Δprice| toward target); 180° finds
 *   the opposite-side bounce that is *higher* than the low.
 * Up: inverse — 45° finds highs; 180° finds pullbacks lower than the high.
 *
 * 180° geometry: |dr|≥|dc| → same-column flip (dr,dc)→(−dr,dc);
 *   |dc|>|dr| → same-row flip (dr,dc)→(dr,−dc). If that cell is not a
 *   valid rebound, expand +1 ring (and further if needed) on that axis.
 *
 * Canonical down (begin=1, step=1, rings≥17):
 *   922 → 880 → 862 → 822 → 804 → 766 → 748 → 712 → 694 → 660
 *   880→952, 862→910, 822→891, 804→851, 766→832, 748→794,
 *   712→775, 694→739, 660→720
 */
(function (global) {
  const ALGORITHM_NAME = "FourCorner";
  const ALGORITHM_NAME_ZH = "四角推图法";
  const MAX_STEPS = 64;

  function priceOf(cell) {
    return cell.mode === "time" ? cell.index : cell.value;
  }

  function distToTarget(value, target) {
    return Math.abs(value - target);
  }

  function withinEps(value, target, eps) {
    return Math.abs(value - target) <= eps;
  }

  function cellAt(square, dr, dc) {
    const r = square.cx + dr;
    const c = square.cy + dc;
    if (r < 0 || c < 0 || r >= square.size || c >= square.size) return null;
    return square.meta[r][c] || null;
  }

  /**
   * Next 45° stop: diagonal ray, toward target, strictly closer to
   * target, smallest |Δprice| from current.
   */
  function pickNext45(square, cell, direction, targetPrice) {
    const currentPrice = priceOf(cell);
    const curDist = distToTarget(currentPrice, targetPrice);
    const cands = global.GannPath.candidates45(square, cell, direction).filter(
      (x) => distToTarget(x.price, targetPrice) < curDist
    );
    if (!cands.length) return null;
    cands.sort((a, b) => {
      const da = Math.abs(a.price - currentPrice);
      const db = Math.abs(b.price - currentPrice);
      if (da !== db) return da - db;
      return 0;
    });
    return cands[0];
  }

  function isValidRebound(fromPrice, next, direction) {
    if (!next) return false;
    const p = priceOf(next);
    return direction === "down" ? p > fromPrice : p < fromPrice;
  }

  /**
   * 180° rebound from a 45° landing (not from start).
   */
  function rebound180(square, cell, direction) {
    const dr = cell.row - square.cx;
    const dc = cell.col - square.cy;
    const preferCol = Math.abs(dr) >= Math.abs(dc);
    const fromPrice = priceOf(cell);
    const axis = preferCol ? "col" : "row";
    const transform = preferCol ? "flip_col" : "flip_row";

    if (dr === 0 && dc === 0) {
      return { cell: null, expanded: false, axis, transform };
    }

    const oppSign = preferCol
      ? dr === 0
        ? 0
        : -Math.sign(dr)
      : dc === 0
        ? 0
        : -Math.sign(dc);

    if (oppSign === 0) {
      return { cell: null, expanded: false, axis, transform };
    }

    const mag0 = preferCol ? Math.abs(dr) : Math.abs(dc);
    const maxMag = square.cx;
    for (let mag = mag0; mag <= maxMag; mag += 1) {
      const next = preferCol ? cellAt(square, oppSign * mag, dc) : cellAt(square, dr, oppSign * mag);
      if (isValidRebound(fromPrice, next, direction)) {
        return {
          cell: next,
          expanded: mag !== mag0,
          axis,
          transform,
          reflectGap: mag - mag0,
        };
      }
    }

    return { cell: null, expanded: true, axis, transform };
  }

  function runCornerPath(square, options) {
    const startRaw = Number(options.start);
    const targetRaw = Number(options.target);
    const direction = options.direction === "up" ? "up" : "down";
    const eps = Number.isFinite(options.eps)
      ? options.eps
      : Math.max(Math.abs(square.step || 1) * 0.5, 0.5);

    if (!Number.isFinite(startRaw) || !Number.isFinite(targetRaw)) {
      return { ok: false, kind: "four-corner", steps: [], rebounds: [], message: "请输入有效的起点与目标价" };
    }
    if (!global.GannPath) {
      return { ok: false, kind: "four-corner", steps: [], rebounds: [], message: "路径模块未加载" };
    }

    const startHit = global.GannPath.findNearestCell(square, startRaw);
    if (!startHit.cell) {
      return { ok: false, kind: "four-corner", steps: [], rebounds: [], message: "方阵中找不到起点" };
    }

    const startCell = startHit.cell;
    const targetPrice = targetRaw;

    const steps = [
      {
        step: 0,
        cell: startCell,
        price: priceOf(startCell),
        move: "start",
        transform: "start",
        axis: startCell.axis,
      },
    ];

    let current = startCell;
    let reachedFlag = withinEps(priceOf(current), targetPrice, eps);

    for (let i = 0; i < MAX_STEPS && !reachedFlag; i += 1) {
      const picked = pickNext45(square, current, direction, targetPrice);
      if (!picked) break;
      if (steps.some((s) => s.cell.row === picked.cell.row && s.cell.col === picked.cell.col)) {
        break;
      }

      current = picked.cell;
      steps.push({
        step: steps.length,
        cell: current,
        price: priceOf(current),
        move: "45",
        transform: picked.transform,
        axis: picked.axis,
      });
      reachedFlag = withinEps(priceOf(current), targetPrice, eps);
    }

    const rebounds = [];
    for (let i = 1; i < steps.length; i += 1) {
      const landing = steps[i];
      const rb = rebound180(square, landing.cell, direction);
      rebounds.push({
        fromStep: i,
        fromCell: landing.cell,
        fromPrice: landing.price,
        cell: rb.cell,
        price: rb.cell ? priceOf(rb.cell) : null,
        move: "180",
        transform: rb.transform,
        axis: rb.axis,
        expanded: rb.expanded,
        reflectGap: rb.reflectGap,
      });
    }

    const endPrice = priceOf(current);
    const snapDiff = Math.abs(endPrice - targetRaw);
    const snapped = snapDiff > eps;
    const fmt = global.GannSquare ? global.GannSquare.formatNumber : String;

    return {
      ok: true,
      kind: "four-corner",
      steps,
      rebounds,
      startCell,
      targetCell: current,
      startRaw,
      targetRaw,
      targetPrice: endPrice,
      snapped,
      snapDiff,
      reached: reachedFlag,
      direction,
      message: reachedFlag
        ? snapped
          ? `已到达 ${fmt(endPrice)}（输入目标 ${fmt(targetRaw)}，差值 ${fmt(snapDiff)}）`
          : `已到达 ${fmt(endPrice)}`
        : `已跑 ${steps.length - 1} 步未达目标，最后停在 ${fmt(endPrice)}`,
    };
  }

  global.GannCorner = {
    ALGORITHM_NAME,
    ALGORITHM_NAME_ZH,
    runCornerPath,
    pickNext45,
    rebound180,
    MAX_STEPS,
  };
})(window);
