/**
 * Path runner: alternate 45° diagonal jumps and 180° axis flips
 * on the Square of Nine until the snapped target is reached.
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
    // crossed target
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

  /**
   * 45° candidates: same-ring diagonal transforms only.
   * (dr,dc) → (-dc,-dr)  or  (dr,dc) → (dc,dr)
   */
  function candidates45(square, cell) {
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
        axis: "diag",
      });
    }
    return out;
  }

  /**
   * 180° candidates: same row or same column, opposite side of center.
   */
  function candidates180(square, cell) {
    const { dr, dc } = rel(cell, square);
    const out = [];

    // same column → vertical flip family
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

    // same row → horizontal flip family
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

  function pick45(cands, currentPrice, targetPrice, direction) {
    const toward = cands.filter((c) => towardPrice(currentPrice, priceOf(c.cell), direction));
    const pool = toward.length ? toward : cands;
    if (!pool.length) return null;

    const notPast = pool.filter((c) => notPastTarget(priceOf(c.cell), targetPrice, direction));
    const use = notPast.length ? notPast : pool;

    use.sort((a, b) => {
      const da = Math.abs(priceOf(a.cell) - targetPrice);
      const db = Math.abs(priceOf(b.cell) - targetPrice);
      if (da !== db) return da - db;
      return priceOf(a.cell) - priceOf(b.cell);
    });
    return use[0];
  }

  function pick180(cands, currentPrice, targetPrice, direction) {
    const toward = cands.filter((c) => towardPrice(currentPrice, priceOf(c.cell), direction));
    const pool = toward.length ? toward : cands;
    if (!pool.length) return null;

    const notPast = pool.filter((c) => notPastTarget(priceOf(c.cell), targetPrice, direction));
    const use = notPast.length ? notPast : pool;

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

  /**
   * @returns {{
   *   ok:boolean,
   *   steps:Array,
   *   startCell:object,
   *   targetCell:object|null,
   *   startRaw:number,
   *   targetRaw:number,
   *   targetPrice:number,
   *   snapped:boolean,
   *   snapDiff:number,
   *   reached:boolean,
   *   message:string
   * }}
   */
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
    // Steer toward the raw target number (750/756 may not be the structural landing).
    // Arrival snaps to the natural path endpoint nearest that intention (e.g. 749).
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
    let reachedFlag = reached(priceOf(current), targetPrice, dir, eps);

    for (let i = 0; i < MAX_STEPS && !reachedFlag; i += 1) {
      const price = priceOf(current);
      let picked = null;
      if (moveKind === "45") {
        picked = pick45(candidates45(square, current), price, targetPrice, dir);
      } else {
        picked = pick180(candidates180(square, current), price, targetPrice, dir);
      }

      if (!picked) break;

      // Avoid oscillating: do not revisit a price already on the path
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
      });

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
    candidates180,
    MAX_STEPS,
  };
})(window);
