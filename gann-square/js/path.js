/**
 * Constellate（星座）跑图法 — Path runner on the Square of Nine.
 *
 * Official name: Constellate Path / Constellate（星座）跑图法
 * Spec archive: gann-square/PATH_ALGORITHM.md
 *
 * Downward search rule (matches manual charting):
 * - 45°: among cells on 45° diagonal rays from the current cell,
 *   take the nearest price toward the target (scan n-1, n-2… until a
 *   diagonal hit — e.g. 594 → 560).
 * - 180°: geometric opposition along the dominant axis —
 *   |dr|≥|dc| → same column (N–S); |dc|>|dr| → same row (E–W) —
 *   on the opposite side of center, nearest price toward target
 *   (e.g. 560 → 523; axis case 916 → 886 → 827).
 * - Consecutive-edge bounce: if the planned angle’s search walk hits
 *   spiral-edge consecutive prices (|Δ|===step for ≥2 steps), use the
 *   other angle instead; the cycle continues from the angle actually
 *   used (scheme B). Example: 241 would 180° along 240,239… → bounce
 *   to 45° → 211.
 *
 * Canonical chain (begin=1, step=1, down):
 * 922 → 880 → 833 → 793 → 749 → 711 → 669 → 633 → 594 → 560 → 523 → …
 */
(function (global) {
  const ALGORITHM_NAME = "Constellate";
  const ALGORITHM_NAME_ZH = "Constellate（星座）跑图法";
  const MAX_STEPS = 64;
  const CONSEC_MIN = 2;

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

  function stepUnit(square) {
    const s = Math.abs(Number(square.step));
    return Number.isFinite(s) && s > 0 ? s : 1;
  }

  /**
   * Count how many successive neighbor steps along (sr,sc) have |Δprice|===unit.
   */
  function consecutiveAlong(square, cell, sr, sc, unit) {
    if (!sr && !sc) return 0;
    let r = cell.row;
    let c = cell.col;
    let prev = priceOf(cell);
    let count = 0;
    for (let i = 0; i < square.size; i += 1) {
      r += sr;
      c += sc;
      if (r < 0 || c < 0 || r >= square.size || c >= square.size) break;
      const next = square.meta[r][c];
      if (!next) break;
      const price = priceOf(next);
      if (Math.abs(price - prev) !== unit) break;
      count += 1;
      prev = price;
    }
    return count;
  }

  /**
   * True when walking the planned angle’s search direction finds a
   * spiral-edge consecutive run (≥ CONSEC_MIN neighbor steps).
   */
  function isConsecutiveRun(square, cell, moveKind, direction) {
    const unit = stepUnit(square);
    if (moveKind === "180") {
      const { dr: dr0, dc: dc0 } = rel(cell, square);
      const preferCol = Math.abs(dr0) >= Math.abs(dc0);
      let sr = 0;
      let sc = 0;
      if (preferCol) {
        if (dr0 < 0) sr = 1;
        else if (dr0 > 0) sr = -1;
        else return false;
      } else if (dc0 < 0) {
        sc = 1;
      } else if (dc0 > 0) {
        sc = -1;
      } else {
        return false;
      }
      return consecutiveAlong(square, cell, sr, sc, unit) >= CONSEC_MIN;
    }

    // 45°: any diagonal ray that first runs consecutive toward search direction
    const dirs = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    for (let i = 0; i < dirs.length; i += 1) {
      const sr = dirs[i][0];
      const sc = dirs[i][1];
      const r = cell.row + sr;
      const c = cell.col + sc;
      if (r < 0 || c < 0 || r >= square.size || c >= square.size) continue;
      const neighbor = square.meta[r][c];
      if (!neighbor) continue;
      if (!towardPrice(priceOf(cell), priceOf(neighbor), direction)) continue;
      if (consecutiveAlong(square, cell, sr, sc, unit) >= CONSEC_MIN) return true;
    }
    return false;
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

  function candidatesFor(square, cell, kind, direction) {
    return kind === "45"
      ? candidates45(square, cell, direction)
      : candidates180(square, cell, direction);
  }

  /**
   * If the planned angle walks a consecutive spiral edge, bounce to the
   * other angle (at most once). When both are consecutive, keep the
   * candidate with the larger price jump (ring skip).
   */
  function resolveMoveKind(square, cell, planned, direction) {
    const plannedConsec = isConsecutiveRun(square, cell, planned, direction);
    if (!plannedConsec) {
      return { kind: planned, bounced: false };
    }

    const alt = planned === "45" ? "180" : "45";
    const altConsec = isConsecutiveRun(square, cell, alt, direction);
    const altCands = candidatesFor(square, cell, alt, direction);
    if (!altCands.length) {
      return { kind: planned, bounced: false };
    }

    if (!altConsec) {
      return { kind: alt, bounced: true };
    }

    const plannedPick = pickFirst(candidatesFor(square, cell, planned, direction));
    const altPick = pickFirst(altCands);
    if (!plannedPick) return { kind: alt, bounced: true };
    const jumpPlanned = Math.abs(plannedPick.price - priceOf(cell));
    const jumpAlt = Math.abs(altPick.price - priceOf(cell));
    if (jumpAlt > jumpPlanned) return { kind: alt, bounced: true };
    return { kind: planned, bounced: false };
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
      const resolved = resolveMoveKind(square, current, moveKind, dir);
      const usedKind = resolved.kind;
      const cands = candidatesFor(square, current, usedKind, dir);
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
        transform: resolved.bounced ? `${picked.transform}_bounce` : picked.transform,
        axis: picked.axis,
        reflectGap: picked.reflectGap,
        bounced: resolved.bounced,
        plannedMove: moveKind,
      });

      reachedFlag = reached(priceOf(current), targetPrice, dir, eps);
      // Scheme B: continue cycle from the angle actually used
      moveKind = usedKind === "45" ? "180" : "45";
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
    ALGORITHM_NAME,
    ALGORITHM_NAME_ZH,
    runPath,
    findNearestCell,
    minRingsForValue,
    candidates45,
    candidates180,
    isConsecutiveRun,
    resolveMoveKind,
    MAX_STEPS,
    CONSEC_MIN,
  };
})(window);
