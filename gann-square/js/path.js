/**
 * Path runner: alternate 45° diagonal jumps and 180° axis flips
 * on the Square of Nine until the soft target is reached.
 *
 * Canonical down-chain (begin=1, step=1):
 * 922 → 880 → 833 → 793 → 749 → 711 → 669 → …
 * 45°   180°  45°   180°  45°   180°
 *
 * 45° rules:
 * - After a column 180° (or at start): prefer same-ring transforms
 *   (swap after flip_col; otherwise best same-ring toward target).
 * - After a row 180°: prefer cross-ring far diagonal landing on ring-1.
 */
(function (global) {
  const MAX_STEPS = 48;

  function towardPrice(a, b, direction) {
    return direction === "down" ? b < a : b > a;
  }

  function notPastTarget(value, target, direction) {
    if (direction === "down") return value >= target;
    return value <= target;
  }

  function reached(value, target, direction, eps) {
    if (Math.abs(value - target) <= eps) return true;
    if (direction === "down") return value <= target;
    return value >= target;
  }

  function rel(cell, square) {
    return { dr: cell.row - square.cx, dc: cell.col - square.cy };
  }

  function cellAt(square, dr, dc) {
    const r = square.cx + dr;
    const c = square.cy + dc;
    if (r < 0 || c < 0 || r >= square.size || c >= square.size) return null;
    return square.meta[r][c];
  }

  function priceOf(cell) {
    return cell.mode === "time" ? cell.index : cell.value;
  }

  function ringOf(cell, square) {
    const { dr, dc } = rel(cell, square);
    return Math.max(Math.abs(dr), Math.abs(dc));
  }

  /**
   * Same-ring 45° transforms: (dr,dc)→(-dc,-dr) or (dr,dc)→(dc,dr)
   */
  function candidates45SameRing(square, cell) {
    const { dr, dc } = rel(cell, square);
    const transforms = [
      { type: "neg_swap", dr: -dc, dc: -dr },
      { type: "swap", dr: dc, dc: dr },
    ];
    const out = [];
    for (const t of transforms) {
      const next = cellAt(square, t.dr, t.dc);
      if (!next || next.index === cell.index) continue;
      out.push({
        cell: next,
        move: "45",
        transform: t.type,
        kind: "same",
        axis: "diag",
      });
    }
    return out;
  }

  /**
   * Cross-ring 45°: along each grid diagonal, collect all hits on ring R-1
   * and keep the farthest (e.g. 749 → 711, not the near-side 643).
   */
  function candidates45CrossFar(square, cell) {
    const { dr: dr0, dc: dc0 } = rel(cell, square);
    const R = Math.max(Math.abs(dr0), Math.abs(dc0));
    if (R <= 0) return [];

    const dirs = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    const out = [];

    for (const [ddr, ddc] of dirs) {
      let dr = dr0;
      let dc = dc0;
      const hits = [];
      for (let i = 0; i < square.size * 2; i += 1) {
        dr += ddr;
        dc += ddc;
        const next = cellAt(square, dr, dc);
        if (!next) break;
        const ring = Math.max(Math.abs(dr), Math.abs(dc));
        if (ring === R - 1) {
          hits.push({
            cell: next,
            move: "45",
            transform: "cross_far",
            kind: "cross",
            axis: "diag",
            dist: i + 1,
            dir: [ddr, ddc],
          });
        }
      }
      if (!hits.length) continue;
      hits.sort((a, b) => b.dist - a.dist);
      out.push(hits[0]);
    }
    return out;
  }

  function candidates45(square, cell) {
    return [...candidates45SameRing(square, cell), ...candidates45CrossFar(square, cell)];
  }

  /**
   * 180° candidates: same row or same column, opposite side of center.
   */
  function candidates180(square, cell) {
    const { dr, dc } = rel(cell, square);
    const out = [];

    for (let r = 0; r < square.size; r += 1) {
      const next = square.meta[r][cell.col];
      if (!next || next.index === cell.index) continue;
      const ndr = r - square.cx;
      const opposite = dr === 0 ? ndr !== 0 : ndr * dr < 0;
      if (!opposite) continue;
      out.push({
        cell: next,
        move: "180",
        transform: "flip_col",
        axis: "col",
        reflectGap: Math.abs(ndr + dr),
      });
    }

    for (let c = 0; c < square.size; c += 1) {
      const next = square.meta[cell.row][c];
      if (!next || next.index === cell.index) continue;
      const ndc = c - square.cy;
      const opposite = dc === 0 ? ndc !== 0 : ndc * dc < 0;
      if (!opposite) continue;
      out.push({
        cell: next,
        move: "180",
        transform: "flip_row",
        axis: "row",
        reflectGap: Math.abs(ndc + dc),
      });
    }
    return out;
  }

  function filterToward(cands, currentPrice, targetPrice, direction) {
    const toward = cands.filter((c) => towardPrice(currentPrice, priceOf(c.cell), direction));
    const pool = toward.length ? toward : cands.slice();
    const notPast = pool.filter((c) => notPastTarget(priceOf(c.cell), targetPrice, direction));
    return notPast.length ? notPast : pool;
  }

  /**
   * @param {'row'|'col'|null} prev180Axis
   */
  function pick45(cands, currentPrice, targetPrice, direction, prev180Axis) {
    if (!cands.length) return null;
    let use = filterToward(cands, currentPrice, targetPrice, direction);
    if (!use.length) return null;

    if (prev180Axis === "row") {
      const cross = use.filter((c) => c.kind === "cross");
      if (cross.length) use = cross;
      // Prefer farthest diagonal landing (749→711 over near-side 643)
      use.sort((a, b) => {
        const da = b.dist || 0;
        const db = a.dist || 0;
        if (da !== db) return da - db;
        // then stay higher when going down (slower descent)
        if (direction === "down") return priceOf(b.cell) - priceOf(a.cell);
        return priceOf(a.cell) - priceOf(b.cell);
      });
      return use[0];
    }

    // Start or after flip_col: prefer same-ring chain
    const same = use.filter((c) => c.kind === "same");
    if (same.length) use = same;

    if (prev180Axis === "col") {
      const swaps = use.filter((c) => c.transform === "swap");
      if (swaps.length) use = swaps;
    }

    // Prefer smaller step from current (keeps 833→793 instead of 737)
    use.sort((a, b) => {
      const sa = Math.abs(priceOf(a.cell) - currentPrice);
      const sb = Math.abs(priceOf(b.cell) - currentPrice);
      if (sa !== sb) return sa - sb;
      const da = Math.abs(priceOf(a.cell) - targetPrice);
      const db = Math.abs(priceOf(b.cell) - targetPrice);
      if (da !== db) return da - db;
      return priceOf(a.cell) - priceOf(b.cell);
    });
    return use[0];
  }

  function pick180(cands, currentPrice, targetPrice, direction) {
    const use = filterToward(cands, currentPrice, targetPrice, direction);
    if (!use.length) return null;

    use.sort((a, b) => {
      const ga = a.reflectGap ?? 99;
      const gb = b.reflectGap ?? 99;
      if (ga !== gb) return ga - gb;
      const da = Math.abs(priceOf(a.cell) - targetPrice);
      const db = Math.abs(priceOf(b.cell) - targetPrice);
      if (da !== db) return da - db;
      return Math.abs(priceOf(a.cell) - currentPrice) - Math.abs(priceOf(b.cell) - currentPrice);
    });
    return use[0];
  }

  function findNearestCell(square, target) {
    let best = null;
    let bestDiff = Infinity;
    for (let r = 0; r < square.size; r += 1) {
      for (let c = 0; c < square.size; c += 1) {
        const cell = square.meta[r][c];
        const val = priceOf(cell);
        const diff = Math.abs(val - target);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = cell;
        }
      }
    }
    return { cell: best, diff: bestDiff };
  }

  function minRingsForValue(begin, step, value) {
    if (!Number.isFinite(value) || step <= 0) return 3;
    const index = Math.floor((value - begin) / step) + 1;
    if (index <= 1) return 1;
    const size = Math.ceil(Math.sqrt(index));
    const odd = size % 2 === 1 ? size : size + 1;
    return Math.max(3, Math.ceil(odd / 2));
  }

  function runPath(square, options) {
    const startRaw = Number(options.start);
    const targetRaw = Number(options.target);
    const direction = options.direction === "up" ? "up" : "down";
    const eps = Number.isFinite(options.eps)
      ? options.eps
      : Math.max(Math.abs(square.step || 1) * 0.5, 0.5);

    if (!Number.isFinite(startRaw) || !Number.isFinite(targetRaw)) {
      return { ok: false, steps: [], message: "请输入有效的起点与目标价" };
    }

    const startHit = findNearestCell(square, startRaw);
    if (!startHit.cell) {
      return { ok: false, steps: [], message: "方阵中找不到起点" };
    }

    const startCell = startHit.cell;
    const targetPrice = targetRaw;
    const dir = direction;

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
    let moveKind = "45";
    let prev180Axis = null;
    let reachedFlag = reached(priceOf(current), targetPrice, dir, eps);

    for (let i = 0; i < MAX_STEPS && !reachedFlag; i += 1) {
      const price = priceOf(current);
      let picked = null;
      if (moveKind === "45") {
        picked = pick45(candidates45(square, current), price, targetPrice, dir, prev180Axis);
      } else {
        picked = pick180(candidates180(square, current), price, targetPrice, dir);
      }

      if (!picked) break;

      if (steps.some((s) => s.cell.row === picked.cell.row && s.cell.col === picked.cell.col)) {
        break;
      }

      current = picked.cell;
      steps.push({
        step: steps.length,
        cell: current,
        price: priceOf(current),
        move: picked.move,
        transform: picked.transform,
        axis: picked.axis,
        reflectGap: picked.reflectGap,
        kind: picked.kind,
      });

      if (picked.move === "180") {
        prev180Axis = picked.axis === "row" ? "row" : "col";
      }

      reachedFlag = reached(priceOf(current), targetPrice, dir, eps);
      moveKind = moveKind === "45" ? "180" : "45";
    }

    const endPrice = priceOf(current);
    const snapDiff = Math.abs(endPrice - targetRaw);
    const snapped = snapDiff > eps;

    return {
      ok: true,
      steps,
      startCell,
      targetCell: current,
      startRaw,
      targetRaw,
      targetPrice: endPrice,
      snapped,
      snapDiff,
      reached: reachedFlag,
      direction: dir,
      message: reachedFlag
        ? snapped
          ? `已到达 ${global.GannSquare.formatNumber(endPrice)}（输入目标 ${global.GannSquare.formatNumber(targetRaw)}，差值 ${global.GannSquare.formatNumber(snapDiff)}）`
          : `已到达 ${global.GannSquare.formatNumber(endPrice)}`
        : `已跑 ${steps.length - 1} 步未达目标，最后停在 ${global.GannSquare.formatNumber(endPrice)}`,
    };
  }

  global.GannPath = {
    runPath,
    findNearestCell,
    minRingsForValue,
    candidates45,
    candidates45SameRing,
    candidates45CrossFar,
    candidates180,
    MAX_STEPS,
  };
})(window);
