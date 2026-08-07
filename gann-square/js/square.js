/**
 * Gann Square of Nine generator
 * Spiral: leave center to the left, then clockwise.
 */
(function (global) {
  const ANGLE_LABELS = {
    center: "中心",
    n: "北 90°",
    e: "东 0°",
    s: "南 270°",
    w: "西 180°",
    ne: "东北 45°",
    se: "东南 315°",
    sw: "西南 225°",
    nw: "西北 135°",
    other: "环内",
  };

  function createMatrix(size, fill = null) {
    return Array.from({ length: size }, () => Array(size).fill(fill));
  }

  function almostEqual(a, b, eps = 1e-9) {
    return Math.abs(a - b) <= eps;
  }

  function formatNumber(value, digits = 6) {
    if (!Number.isFinite(value)) return String(value);
    const fixed = Number(value.toFixed(digits));
    return String(fixed);
  }

  function addDate(baseDate, index, unit) {
    const d = new Date(baseDate.getTime());
    if (unit === "week") d.setDate(d.getDate() + index * 7);
    else if (unit === "month") d.setMonth(d.getMonth() + index);
    else d.setDate(d.getDate() + index);
    return d;
  }

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  /**
   * @param {{ begin:number, step:number, rings:number, mode?:'price'|'time', beginDate?:string, timeUnit?:'day'|'week'|'month' }} options
   */
  function generateSquare(options) {
    const rings = Math.max(1, Math.floor(options.rings));
    const size = 2 * rings - 1;
    const begin = Number(options.begin);
    const step = Number(options.step);
    const mode = options.mode || "price";
    const cx = rings - 1;
    const cy = rings - 1;

    const values = createMatrix(size, null);
    const meta = createMatrix(size, null);

    let value = begin;
    let index = 1;
    values[cx][cy] = value;
    meta[cx][cy] = buildCellMeta({
      row: cx,
      col: cy,
      cx,
      cy,
      rings,
      index,
      value,
      mode,
      beginDate: options.beginDate,
      timeUnit: options.timeUnit,
    });

    let x = cx;
    let y = cy;

    for (let layer = 1; layer < rings; layer += 1) {
      // enter ring: move left
      y -= 1;
      index += 1;
      value = mode === "price" ? begin + (index - 1) * step : index;
      values[x][y] = value;
      meta[x][y] = buildCellMeta({
        row: x,
        col: y,
        cx,
        cy,
        rings,
        index,
        value,
        mode,
        beginDate: options.beginDate,
        timeUnit: options.timeUnit,
      });

      const upSteps = 2 * layer - 1;
      const sideSteps = 2 * layer;

      for (let i = 0; i < upSteps; i += 1) {
        x -= 1;
        index += 1;
        value = mode === "price" ? begin + (index - 1) * step : index;
        values[x][y] = value;
        meta[x][y] = buildCellMeta({
          row: x,
          col: y,
          cx,
          cy,
          rings,
          index,
          value,
          mode,
          beginDate: options.beginDate,
          timeUnit: options.timeUnit,
        });
      }

      for (let i = 0; i < sideSteps; i += 1) {
        y += 1;
        index += 1;
        value = mode === "price" ? begin + (index - 1) * step : index;
        values[x][y] = value;
        meta[x][y] = buildCellMeta({
          row: x,
          col: y,
          cx,
          cy,
          rings,
          index,
          value,
          mode,
          beginDate: options.beginDate,
          timeUnit: options.timeUnit,
        });
      }

      for (let i = 0; i < sideSteps; i += 1) {
        x += 1;
        index += 1;
        value = mode === "price" ? begin + (index - 1) * step : index;
        values[x][y] = value;
        meta[x][y] = buildCellMeta({
          row: x,
          col: y,
          cx,
          cy,
          rings,
          index,
          value,
          mode,
          beginDate: options.beginDate,
          timeUnit: options.timeUnit,
        });
      }

      for (let i = 0; i < sideSteps; i += 1) {
        y -= 1;
        index += 1;
        value = mode === "price" ? begin + (index - 1) * step : index;
        values[x][y] = value;
        meta[x][y] = buildCellMeta({
          row: x,
          col: y,
          cx,
          cy,
          rings,
          index,
          value,
          mode,
          beginDate: options.beginDate,
          timeUnit: options.timeUnit,
        });
      }
    }

    // In time mode, replace numeric placeholders with dates for display values.
    if (mode === "time") {
      const base = options.beginDate ? new Date(`${options.beginDate}T00:00:00`) : new Date();
      const unit = options.timeUnit || "day";
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
          const cell = meta[r][c];
          const date = addDate(base, cell.index - 1, unit);
          cell.date = formatDate(date);
          cell.display = cell.date;
          values[r][c] = cell.index;
        }
      }
    } else {
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
          meta[r][c].display = formatNumber(values[r][c]);
        }
      }
    }

    return {
      size,
      rings,
      cx,
      cy,
      values,
      meta,
      mode,
      begin,
      step,
    };
  }

  function buildCellMeta({ row, col, cx, cy, rings, index, value, mode, beginDate, timeUnit }) {
    const dr = row - cx;
    const dc = col - cy;
    const ring = Math.max(Math.abs(dr), Math.abs(dc));
    const axis = classifyAxis(dr, dc);
    const oddSquare = Number.isInteger(Math.sqrt(index));

    return {
      row,
      col,
      dr,
      dc,
      ring,
      index,
      value,
      mode,
      axis,
      angleLabel: ANGLE_LABELS[axis] || ANGLE_LABELS.other,
      isCenter: ring === 0,
      isCross: axis === "n" || axis === "e" || axis === "s" || axis === "w",
      isDiag: axis === "ne" || axis === "se" || axis === "sw" || axis === "nw",
      isOddSquare: oddSquare,
      beginDate,
      timeUnit,
      display: "",
      date: null,
    };
  }

  function classifyAxis(dr, dc) {
    if (dr === 0 && dc === 0) return "center";
    if (dr === 0 && dc > 0) return "e";
    if (dr === 0 && dc < 0) return "w";
    if (dc === 0 && dr < 0) return "n";
    if (dc === 0 && dr > 0) return "s";
    if (Math.abs(dr) === Math.abs(dc)) {
      if (dr < 0 && dc > 0) return "ne";
      if (dr > 0 && dc > 0) return "se";
      if (dr > 0 && dc < 0) return "sw";
      if (dr < 0 && dc < 0) return "nw";
    }
    return "other";
  }

  function findNearest(square, target) {
    let best = null;
    let bestDiff = Infinity;
    for (let r = 0; r < square.size; r += 1) {
      for (let c = 0; c < square.size; c += 1) {
        const cell = square.meta[r][c];
        const candidate = square.mode === "time" ? cell.index : cell.value;
        const diff = Math.abs(candidate - target);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = cell;
        }
      }
    }
    return { cell: best, diff: bestDiff };
  }

  function relatedOnAxis(square, cell) {
    if (!cell || cell.axis === "other" || cell.isCenter) {
      return square.meta.flat().filter((m) => m.isCenter || m.isCross || m.isDiag).slice(0, 8);
    }
    return square.meta
      .flat()
      .filter((m) => m.axis === cell.axis && m.index !== cell.index)
      .sort((a, b) => a.ring - b.ring);
  }

  function neighbors(square, cell) {
    if (!cell) return [];
    const list = [];
    const deltas = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    for (const [dr, dc] of deltas) {
      const r = cell.row + dr;
      const c = cell.col + dc;
      if (r >= 0 && c >= 0 && r < square.size && c < square.size) {
        list.push(square.meta[r][c]);
      }
    }
    return list;
  }

  function toCsv(square) {
    const lines = ["row,col,index,value,display,ring,axis,angle"];
    for (let r = 0; r < square.size; r += 1) {
      for (let c = 0; c < square.size; c += 1) {
        const m = square.meta[r][c];
        lines.push(
          [
            m.row,
            m.col,
            m.index,
            m.value,
            JSON.stringify(m.display),
            m.ring,
            m.axis,
            JSON.stringify(m.angleLabel),
          ].join(",")
        );
      }
    }
    return lines.join("\n");
  }

  global.GannSquare = {
    generateSquare,
    findNearest,
    relatedOnAxis,
    neighbors,
    toCsv,
    formatNumber,
    formatDate,
    almostEqual,
    ANGLE_LABELS,
  };
})(window);
