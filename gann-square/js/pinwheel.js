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

  function createState() {
    return {
      enabled: false,
      showFrame: true,
      showBlades: true,
      showAnchorLabels: false,
    };
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

    const drawRay = (ray, className) => {
      const centers = ray.points.map((p) => cellCenterEl(squareEl, stackEl, p.row, p.col));
      if (centers.some((c) => !c) || centers.length < 2) return;
      const poly = document.createElementNS(ns, "polyline");
      poly.setAttribute("points", centers.map((c) => `${c.x},${c.y}`).join(" "));
      poly.setAttribute("class", className);
      poly.style.pointerEvents = "none";
      overlay.appendChild(poly);
    };

    if (state.showFrame) {
      model.frame.forEach((ray) => drawRay(ray, "pinwheel-frame"));
    }

    if (state.showBlades) {
      model.blades.forEach((ray) => {
        drawRay(ray, "pinwheel-blade");
        // Hollow anchors on non-center points
        ray.points.slice(1).forEach((p) => {
          const c = cellCenterEl(squareEl, stackEl, p.row, p.col);
          if (!c) return;
          const circle = document.createElementNS(ns, "circle");
          circle.setAttribute("cx", c.x);
          circle.setAttribute("cy", c.y);
          circle.setAttribute("r", String(c.r));
          circle.setAttribute("class", "pinwheel-anchor");
          circle.style.pointerEvents = "none";
          overlay.appendChild(circle);
          if (state.showAnchorLabels) {
            const t = document.createElementNS(ns, "text");
            t.setAttribute("x", c.x);
            t.setAttribute("y", c.y - c.r - 3);
            t.setAttribute("class", "pinwheel-anchor-label");
            t.textContent = String(p.display || p.value);
            t.style.pointerEvents = "none";
            overlay.appendChild(t);
          }
        });
      });
    }

    return model;
  }

  global.GannPinwheel = {
    FRAME_DIRS,
    BLADE_DIRS,
    createState,
    anchorUserRings,
    anchorCodeRings,
    buildModel,
    frameRays,
    bladeRays,
    render,
  };
})(window);
