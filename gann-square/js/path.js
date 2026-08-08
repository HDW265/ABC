/**
 * Path runner: alternate 45° and 180° steps on the Square of Nine.
 *
 * Downward search rule (matches manual charting):
 * - 45°: among cells on 45° diagonal rays from the current cell,
 *   take the nearest price toward the target (scan n-1, n-2… until a
 *   diagonal hit — e.g. 594 → 560).
 * - 180°: geometric opposition along the dominant axis —
 *   |dr|≥|dc| → same column (N–S); |dc|>|dr| → same row (E–W) —
 *   on the opposite side of center, nearest price toward target
 *   (e.g. 560 → 523; axis case 916 → 886 → 827).
 *
 * Canonical chain (begin=1, step=1, down):
 * 922 → 880 → 833 → 793 → 749 → 711 → 669 → 633 → 594 → 560 → 523 → …
 */
(function (global) {
  const MAX_STEPS = 64;

  function towardPrice(a, b, direction) {
    return direction === "down" ? b < a : b > a;
  }

  function reached(value, target, direction, eps) {
    if (Math.abs(value - target) <= eps) return true;
    if (direction === "down") return value <= target;
    return value >= target;
  }

  function rel(cell, square) {
    return { dr: cell.row - square.cx, dc: cell.col - square.cy };
  }

  function priceOf(cell) {
    return cell.mode === "time" ? cell.index : cell.value;
  }

  function sortToward(a, b, direction) {
    // Nearest toward target: when going down, higher price first (first hit scanning down)
    return direction === "down" ? b - a : a - b;
  }

  /**
   * 45° candidates: all cells on diagonal rays from current (|Δrow|===|Δcol|≠0).
   */
  function candidates45(square, cell, direction) {
    const { dr: dr0, dc: dc0 } = rel(cell, square);
    const currentPrice = priceOf(cell);
    const out = [];

    for (let r = 0; r < square.size; r += 1) {
      for (let c = 0; c < square.size; c += 1) {
        const next = square.meta[r][c];
        if (!next || next.index === cell.index) continue;
        const dr = r - square.cx;
        const dc = c - square.cy;
        const ddr = dr - dr0;
        const ddc = dc - dc0;
        if (Math.abs(ddr) !== Math.abs(ddc) || ddr === 0) continue;
        const price = priceOf(next);
        if (!towardPrice(currentPrice, price, direction)) continue;
        out.push({
          cell: next,
          move: "45",
          transform: "diag_ray",
          axis: "diag",
          price,
        });
      }
    }

    out.sort((a, b) => sortToward(a.price, b.price, direction));
    return out;
  }

  /**
   * 180° candidates: opposition along the dominant axis only.
   * Prefer N–S (same column) when |dr| ≥ |dc|, else E–W (same row).
   * This avoids axis points (e.g. 886 on north) treating the whole
   * row as opposite and picking an adjacent cell (885) instead of
   * the true vertical flip (827).
   */
  function candidates180(square, cell, direction) {
    const { dr: dr0, dc: dc0 } = rel(cell, square);
    const currentPrice = priceOf(cell);
    const preferCol = Math.abs(dr0) >= Math.abs(dc0);
    const out = [];

    for (let r = 0; r < square.size; r += 1) {
      for (let c = 0; c < square.size; c += 1) {
        const next = square.meta[r][c];
        if (!next || next.index === cell.index) continue;
        const sameCol = c === cell.col;
        const sameRow = r === cell.row;
        if (preferCol) {
          if (!sameCol) continue;
        } else if (!sameRow) {
          continue;
        }

        const dr = r - square.cx;
        const dc = c - square.cy;

        if (sameCol) {
          if (dr0 === 0) {
            if (dr === 0) continue;
          } else if (dr * dr0 >= 0) {
            continue;
          }
        } else {
          if (dc0 === 0) {
            if (dc === 0) continue;
          } else if (dc * dc0 >= 0) {
            continue;
          }
        }

        const price = priceOf(next);
        if (!towardPrice(currentPrice, price, direction)) continue;
        out.push({
          cell: next,
          move: "180",
          transform: sameCol ? "flip_col" : "flip_row",
          axis: sameCol ? "col" : "row",
          price,
          reflectGap: sameCol ? Math.abs(dr + dr0) : Math.abs(dc + dc0),
        });
      }
    }

    out.sort((a, b) => {
      const byPrice = sortToward(a.price, b.price, direction);
      if (byPrice !== 0) return byPrice;
      return (a.reflectGap ?? 99) - (b.reflectGap ?? 99);
    });
    return out;
  }

  function pickFirst(cands) {
    return cands.length ? cands[0] : null;
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
    let reachedFlag = reached(priceOf(current), targetPrice, dir, eps);

    for (let i = 0; i < MAX_STEPS && !reachedFlag; i += 1) {
      const cands =
        moveKind === "45"
          ? candidates45(square, current, dir)
          : candidates180(square, current, dir);
      const picked = pickFirst(cands);
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
