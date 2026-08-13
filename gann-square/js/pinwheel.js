/**
 * Pinwheel（风车）构图层 — Phase 1 scaffold.
 * Frame: 8 axis rays (cross + diagonal).
 * Blades: 8 rays along (±1,±2)/(±2,±1), anchors on user-rings 3,5,7,… ≤ N.
 *
 * Ring numbering: user ring 1 = center; codebase meta.ring = userRing - 1.
 */
(function (global) {
  const FRAME_DIRS = [
    { dr: -1, dc: 0, id: "n" },
    { dr: 1, dc: 0, id: "s" },
    { dr: 0, dc: -1, id: "w" },
    { dr: 0, dc: 1, id: "e" },
    { dr: -1, dc: -1, id: "nw" },
    { dr: -1, dc: 1, id: "ne" },
    { dr: 1, dc: -1, id: "sw" },
    { dr: 1, dc: 1, id: "se" },
  ];

  /** Unit steps at the first off-axis ring (codebase ring 2 / user ring 3). */
  const BLADE_DIRS = [
    { dr: 1, dc: -2, id: "b0" },
    { dr: -1, dc: 2, id: "b1" },
    { dr: 1, dc: 2, id: "b2" },
    { dr: -1, dc: -2, id: "b3" },
    { dr: 2, dc: -1, id: "b4" },
    { dr: -2, dc: 1, id: "b5" },
    { dr: 2, dc: 1, id: "b6" },
    { dr: -2, dc: -1, id: "b7" },
  ];

  const COLORS = ["#c45c4a", "#2f8f4e", "#1f6f6a", "#1f5f8a", "#b8652f", "#b23a2f", "#142028", "#5a6a72"];
  const DASH_CYCLE = ["solid", "dash", "dot"];
  const WIDTH_CYCLE = [1, 1.35, 2, 2.15, 2.5];
  const STORAGE_STYLE = "gann-pinwheel-style-v1";

  function defaultLineStyle(kind) {
    if (kind === "blade") {
      return { color: "#2f8f4e", dash: "solid", width: 2.15 };
    }
    return { color: "#c45c4a", dash: "dash", width: 1.35 };
  }

  function cloneLineStyle(style, kind) {
    const base = defaultLineStyle(kind);
    return {
      color: style && style.color ? style.color : base.color,
      dash: style && DASH_CYCLE.includes(style.dash) ? style.dash : base.dash,
      width: style && Number.isFinite(style.width) ? style.width : base.width,
    };
  }

  function defaultStyles() {
    return {
      frame: defaultLineStyle("frame"),
      blade: defaultLineStyle("blade"),
    };
  }

  function createState() {
    return {
      enabled: false,
      showFrame: true,
      showBlades: true,
      showAnchorLabels: false,
      styles: defaultStyles(),
    };
  }

  function dashArray(dash, width) {
    if (dash === "dash") return `${Math.max(5, width * 3.2)} ${Math.max(3.5, width * 2)}`;
    if (dash === "dot") return `${Math.max(1.2, width)} ${Math.max(3, width * 2.2)}`;
    return "";
  }

  function cycleDash(dash) {
    const i = DASH_CYCLE.indexOf(dash);
    return DASH_CYCLE[(i + 1) % DASH_CYCLE.length];
  }

  function cycleWidth(width) {
    const i = WIDTH_CYCLE.findIndex((w) => Math.abs(w - width) < 0.01);
    return WIDTH_CYCLE[(i + 1) % WIDTH_CYCLE.length];
  }

  function saveStyles(styles) {
    try {
      localStorage.setItem(STORAGE_STYLE, JSON.stringify(styles || defaultStyles()));
    } catch (err) {
      /* ignore */
    }
  }

  function loadStylesInto(state) {
    try {
      const raw = localStorage.getItem(STORAGE_STYLE);
      if (!raw) return;
      const data = JSON.parse(raw);
      state.styles = {
        frame: cloneLineStyle(data.frame, "frame"),
        blade: cloneLineStyle(data.blade, "blade"),
      };
    } catch (err) {
      /* ignore */
    }
  }

  function resetStyles(state) {
    state.styles = defaultStyles();
    saveStyles(state.styles);
    return state.styles;
  }

  /** User-facing anchor rings: 3,5,7,… ≤ N */
  function anchorUserRings(totalRings) {
    const N = Math.max(1, Math.floor(totalRings));
    const out = [];
    for (let r = 3; r <= N; r += 2) out.push(r);
    return out;
  }

  /** Codebase meta.ring values for anchors: 2,4,6,… ≤ N-1 */
  function anchorCodeRings(totalRings) {
    return anchorUserRings(totalRings).map((r) => r - 1);
  }

  function cellAt(square, row, col) {
    if (!square || row < 0 || col < 0 || row >= square.size || col >= square.size) return null;
    return square.meta[row][col];
  }

  function frameRays(square) {
    if (!square) return [];
    const { cx, cy } = square;
    const outer = square.rings - 1;
    return FRAME_DIRS.map((d) => {
      const end = cellAt(square, cx + d.dr * outer, cy + d.dc * outer);
      const start = cellAt(square, cx, cy);
      return {
        id: d.id,
        kind: "frame",
        points: [start, end].filter(Boolean),
      };
    }).filter((ray) => ray.points.length >= 2);
  }

  function bladeRays(square) {
    if (!square) return [];
    const { cx, cy } = square;
    const codeRings = anchorCodeRings(square.rings);
    const center = cellAt(square, cx, cy);
    return BLADE_DIRS.map((d) => {
      const points = [center];
      codeRings.forEach((R) => {
        const k = R / 2;
        if (!Number.isInteger(k) || k < 1) return;
        const cell = cellAt(square, cx + d.dr * k, cy + d.dc * k);
        if (cell) points.push(cell);
      });
      return {
        id: d.id,
        kind: "blade",
        dir: d,
        points: points.filter(Boolean),
      };
    }).filter((ray) => ray.points.length >= 2);
  }

  function buildModel(square) {
    const anchors = anchorUserRings(square ? square.rings : 1);
    return {
      ok: !!square,
      totalRings: square ? square.rings : 0,
      anchorUserRings: anchors,
      frame: frameRays(square),
      blades: bladeRays(square),
      label: anchors.length
        ? `风车 · 锚点环 ${anchors.join(",")}`
        : "风车 · 环数不足（需 ≥ 3）",
    };
  }

  function cellCenterEl(squareEl, stackEl, row, col) {
    const el = squareEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!el || !stackEl) return null;
    return {
      x: squareEl.offsetLeft + el.offsetLeft + el.offsetWidth / 2,
      y: squareEl.offsetTop + el.offsetTop + el.offsetHeight / 2,
      r: Math.max(4, Math.min(el.offsetWidth, el.offsetHeight) * 0.22),
    };
  }

  function render(state, opts) {
    const { overlay, squareEl, stackEl, square } = opts;
    if (!overlay) return null;
    const width = stackEl.offsetWidth;
    const height = stackEl.offsetHeight;
    overlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
    overlay.setAttribute("width", String(width));
    overlay.setAttribute("height", String(height));
    overlay.innerHTML = "";
    overlay.style.pointerEvents = "none";

    if (!state.enabled || !square) return buildModel(square);

    const model = buildModel(square);
    const ns = "http://www.w3.org/2000/svg";
    const styles = state.styles || defaultStyles();

    const drawRay = (ray, className, lineStyle) => {
      const centers = ray.points.map((p) => cellCenterEl(squareEl, stackEl, p.row, p.col));
      if (centers.some((c) => !c) || centers.length < 2) return;
      const poly = document.createElementNS(ns, "polyline");
      poly.setAttribute("points", centers.map((c) => `${c.x},${c.y}`).join(" "));
      poly.setAttribute("class", className);
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", lineStyle.color);
      poly.setAttribute("stroke-width", String(lineStyle.width));
      poly.setAttribute("stroke-linecap", "round");
      poly.setAttribute("stroke-linejoin", "round");
      const dash = dashArray(lineStyle.dash, lineStyle.width);
      if (dash) poly.setAttribute("stroke-dasharray", dash);
      else poly.removeAttribute("stroke-dasharray");
      poly.style.pointerEvents = "none";
      overlay.appendChild(poly);
    };

    if (state.showFrame) {
      model.frame.forEach((ray) => drawRay(ray, "pinwheel-frame", styles.frame));
    }

    if (state.showBlades) {
      model.blades.forEach((ray) => {
        drawRay(ray, "pinwheel-blade", styles.blade);
        // No marker circles — digits stay plain on the grid.
        if (!state.showAnchorLabels) return;
        ray.points.slice(1).forEach((p) => {
          const c = cellCenterEl(squareEl, stackEl, p.row, p.col);
          if (!c) return;
          const t = document.createElementNS(ns, "text");
          t.setAttribute("x", c.x);
          t.setAttribute("y", c.y - Math.max(8, c.r));
          t.setAttribute("class", "pinwheel-anchor-label");
          t.setAttribute("fill", styles.blade.color);
          t.textContent = String(p.display || p.value);
          t.style.pointerEvents = "none";
          overlay.appendChild(t);
        });
      });
    }

    return model;
  }

  const OPPOSITE_RAY = {
    n: "s",
    s: "n",
    e: "w",
    w: "e",
    ne: "sw",
    sw: "ne",
    nw: "se",
    se: "nw",
  };

  const AXIS_FAMILY = {
    n: "ns",
    s: "ns",
    e: "ew",
    w: "ew",
    ne: "nesw",
    sw: "nesw",
    nw: "nwse",
    se: "nwse",
  };

  function cellOnRay(square, axis, ring) {
    if (!square || ring < 1) return null;
    for (let r = 0; r < square.size; r += 1) {
      for (let c = 0; c < square.size; c += 1) {
        const m = square.meta[r][c];
        if (m.axis === axis && m.ring === ring) return m;
      }
    }
    return null;
  }

  function isOnFrame(cell) {
    return !!(cell && (cell.isCross || cell.isDiag));
  }

  /**
   * Phase 2: run on a single skeleton axis only (cross/diag diameter).
   * Zigzag opposite rays; try same-ring then ring±1; stop at closest to target.
   */
  function runFramePath(square, startRaw, targetRaw) {
    const GS = global.GannSquare;
    if (!square || !GS) {
      return { ok: false, reason: "no-square", message: "方阵未就绪", steps: [] };
    }
    if (!Number.isFinite(startRaw) || !Number.isFinite(targetRaw)) {
      return { ok: false, reason: "bad-input", message: "请输入有效起点与目标价", steps: [] };
    }
    const startHit = GS.findNearest(square, startRaw);
    const start = startHit && startHit.cell;
    if (!isOnFrame(start)) {
      return {
        ok: false,
        reason: "not-on-frame",
        message: "起点不在骨架线（十字/对角）上，暂不跑图（叶线跑图见阶段三）",
        steps: [],
      };
    }
    if (GS.almostEqual(start.value, targetRaw)) {
      return { ok: false, reason: "same", message: "起点与目标相同，无法判定方向", steps: [] };
    }

    const dist = (price) => Math.abs(price - targetRaw);
    const pathCells = [start];
    const seen = new Set([`${start.row}:${start.col}`]);
    let guard = 0;
    while (guard < 240) {
      guard += 1;
      const cur = pathCells[pathCells.length - 1];
      if (GS.almostEqual(cur.value, targetRaw)) break;
      const opp = OPPOSITE_RAY[cur.axis];
      if (!opp) break;
      let next = null;
      for (let i = 0; i < 3; i += 1) {
        const delta = i === 0 ? 0 : i === 1 ? -1 : 1;
        const ring = cur.ring + delta;
        const cand = cellOnRay(square, opp, ring);
        if (!cand) continue;
        const key = `${cand.row}:${cand.col}`;
        if (seen.has(key)) continue;
        if (dist(cand.value) < dist(cur.value) - 1e-12) {
          next = cand;
          break;
        }
      }
      if (!next) break;
      pathCells.push(next);
      seen.add(`${next.row}:${next.col}`);
    }

    const last = pathCells[pathCells.length - 1];
    const reached = GS.almostEqual(last.value, targetRaw);
    const steps = pathCells.map((cell, i) => ({
      cell,
      price: cell.value,
      move: i === 0 ? "start" : "frame",
      axis: cell.axis,
    }));

    return {
      ok: true,
      kind: "pinwheel-frame",
      algorithm: "PinwheelFrame",
      axisFamily: AXIS_FAMILY[start.axis] || start.axis,
      startAxis: start.axis,
      startRaw,
      targetRaw,
      targetPrice: targetRaw,
      steps,
      reached,
      message: reached
        ? `风车 · 骨架轴 · 已到达 ${GS.formatNumber(last.value)}`
        : `风车 · 骨架轴 · 最接近 ${GS.formatNumber(last.value)}`,
    };
  }

  global.GannPinwheel = {
    FRAME_DIRS,
    BLADE_DIRS,
    OPPOSITE_RAY,
    AXIS_FAMILY,
    COLORS,
    DASH_CYCLE,
    WIDTH_CYCLE,
    STORAGE_STYLE,
    createState,
    defaultStyles,
    defaultLineStyle,
    cloneLineStyle,
    dashArray,
    cycleDash,
    cycleWidth,
    saveStyles,
    loadStylesInto,
    resetStyles,
    anchorUserRings,
    anchorCodeRings,
    buildModel,
    frameRays,
    bladeRays,
    render,
    cellOnRay,
    isOnFrame,
    runFramePath,
  };
})(window);
