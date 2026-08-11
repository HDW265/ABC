/**
 * Manual draw / annotate layer for Gann Square (MVP).
 * Angle modes: 45° (diag) → 90° (ortho) → 180° (through-center) → free.
 */
(function (global) {
  const ANGLE_CYCLE = ["45", "90", "180", "free"];
  const ANGLE_LABEL = { "45": "45°", "90": "90°", "180": "180°", free: "自由" };
  const STORAGE_DRAW = "gann-square-draw-v1";
  const COLORS = ["#1f6f6a", "#1f5f8a", "#b8652f", "#b23a2f", "#142028", "#2f8f4e"];

  function uid() {
    return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  function defaultStyle() {
    return {
      color: COLORS[0],
      width: 2,
      dash: "solid",
      markerFill: "none",
    };
  }

  function createState() {
    return {
      enabled: false,
      tool: "polyline",
      angleMode: "45",
      style: defaultStyle(),
      objects: [],
      selectedId: null,
      draft: null,
      toolbarExpanded: true,
      undoStack: [],
      hoverCell: null,
    };
  }

  function cloneStyle(style) {
    return { ...defaultStyle(), ...(style || {}) };
  }

  function dashArray(dash, width) {
    if (dash === "dash") return `${Math.max(6, width * 3)} ${Math.max(4, width * 2)}`;
    if (dash === "dot") return `${width} ${Math.max(3, width * 2)}`;
    return "";
  }

  /** Geometric relation of B relative to A (and square center). */
  function relate(square, a, b) {
    if (!a || !b) return null;
    const dr = b.row - a.row;
    const dc = b.col - a.col;
    if (dr === 0 && dc === 0) return "same";
    if (Math.abs(dr) === Math.abs(dc)) return "45";
    if (dr === 0 || dc === 0) return "90";
    const cx = square.cx;
    const cy = square.cy;
    const ar = a.row - cx;
    const ac = a.col - cy;
    const br = b.row - cx;
    const bc = b.col - cy;
    // Collinear with center (through-center line)
    if (ar * bc - ac * br === 0 && (ar !== 0 || ac !== 0 || br !== 0 || bc !== 0)) {
      return "180";
    }
    return "other";
  }

  function isAllowedByAngle(square, a, b, angleMode) {
    if (angleMode === "free") return !(a.row === b.row && a.col === b.col);
    const rel = relate(square, a, b);
    if (angleMode === "45") return rel === "45";
    if (angleMode === "90") return rel === "90";
    if (angleMode === "180") {
      // Through-center line, or orthogonal through center (same row/col as center axis)
      if (rel === "180") return true;
      // Opposite cell through center
      if (b.row === 2 * square.cx - a.row && b.col === 2 * square.cy - a.col) return true;
      // Same row/col and the segment crosses or includes center column/row
      if (rel === "90") {
        const crosses =
          (a.row === b.row && a.row === square.cx) ||
          (a.col === b.col && a.col === square.cy) ||
          (a.row === b.row &&
            ((a.col - square.cy) * (b.col - square.cy) < 0 ||
              a.col === square.cy ||
              b.col === square.cy)) ||
          (a.col === b.col &&
            ((a.row - square.cx) * (b.row - square.cx) < 0 ||
              a.row === square.cx ||
              b.row === square.cx));
        return crosses;
      }
      return false;
    }
    return false;
  }

  function cycleAngle(mode) {
    const i = ANGLE_CYCLE.indexOf(mode);
    return ANGLE_CYCLE[(i + 1) % ANGLE_CYCLE.length];
  }

  function pushUndo(state) {
    state.undoStack.push(JSON.stringify(state.objects));
    if (state.undoStack.length > 40) state.undoStack.shift();
  }

  function undo(state) {
    if (!state.undoStack.length) return false;
    state.objects = JSON.parse(state.undoStack.pop());
    state.selectedId = null;
    state.draft = null;
    return true;
  }

  function pointFromCell(cell) {
    return {
      row: cell.row,
      col: cell.col,
      price: cell.value,
      display: cell.display,
    };
  }

  function beginDraft(state, cell, type) {
    state.draft = {
      type,
      points: [pointFromCell(cell)],
      angleMode: state.angleMode,
      style: cloneStyle(state.style),
    };
  }

  function commitDraft(state) {
    if (!state.draft) return null;
    const d = state.draft;
    if (d.type === "line" && d.points.length < 2) {
      state.draft = null;
      return null;
    }
    if (d.type === "polyline" && d.points.length < 2) {
      state.draft = null;
      return null;
    }
    pushUndo(state);
    const obj = {
      id: uid(),
      type: d.type,
      points: d.points.slice(),
      angleMode: d.angleMode,
      style: cloneStyle(d.style),
    };
    state.objects.push(obj);
    state.draft = null;
    state.selectedId = obj.id;
    return obj;
  }

  function addPointToDraft(state, square, cell) {
    if (!state.draft || !state.draft.points.length) return { ok: false };
    const last = state.draft.points[state.draft.points.length - 1];
    if (last.row === cell.row && last.col === cell.col) return { ok: false, reason: "same" };
    if (!isAllowedByAngle(square, last, cell, state.angleMode)) {
      return { ok: false, reason: "angle" };
    }
    state.draft.points.push(pointFromCell(cell));
    return { ok: true };
  }

  function addMarker(state, cell) {
    pushUndo(state);
    const obj = {
      id: uid(),
      type: "marker",
      points: [pointFromCell(cell)],
      style: cloneStyle(state.style),
    };
    state.objects.push(obj);
    state.selectedId = obj.id;
    return obj;
  }

  function deleteSelected(state) {
    if (!state.selectedId) return false;
    pushUndo(state);
    state.objects = state.objects.filter((o) => o.id !== state.selectedId);
    state.selectedId = null;
    return true;
  }

  function deleteObject(state, id) {
    if (!id) return false;
    pushUndo(state);
    state.objects = state.objects.filter((o) => o.id !== id);
    if (state.selectedId === id) state.selectedId = null;
    return true;
  }

  function clearAll(state) {
    if (!state.objects.length) return false;
    pushUndo(state);
    state.objects = [];
    state.selectedId = null;
    state.draft = null;
    return true;
  }

  function save(state) {
    try {
      localStorage.setItem(
        STORAGE_DRAW,
        JSON.stringify({
          objects: state.objects,
          style: state.style,
          angleMode: state.angleMode,
          tool: state.tool,
          toolbarExpanded: state.toolbarExpanded,
        })
      );
    } catch (err) {
      /* ignore */
    }
  }

  function loadInto(state) {
    try {
      const raw = localStorage.getItem(STORAGE_DRAW);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.objects)) state.objects = data.objects;
      if (data.style) state.style = cloneStyle(data.style);
      if (data.angleMode && ANGLE_CYCLE.includes(data.angleMode)) state.angleMode = data.angleMode;
      if (data.tool) state.tool = data.tool;
      if (typeof data.toolbarExpanded === "boolean") state.toolbarExpanded = data.toolbarExpanded;
    } catch (err) {
      /* ignore */
    }
  }

  function cellCenterEl(squareEl, stackEl, row, col) {
    const el = squareEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!el || !stackEl) return null;
    const x = el.offsetLeft + el.offsetWidth / 2;
    const y = el.offsetTop + el.offsetHeight / 2;
    return {
      x: squareEl.offsetLeft + x,
      y: squareEl.offsetTop + y,
      r: Math.max(6, Math.min(el.offsetWidth, el.offsetHeight) * 0.32),
    };
  }

  function prepareOverlay(overlay, stackEl) {
    if (!overlay || !stackEl) return null;
    const width = stackEl.offsetWidth;
    const height = stackEl.offsetHeight;
    overlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
    overlay.setAttribute("width", String(width));
    overlay.setAttribute("height", String(height));
    return { width, height, ns: "http://www.w3.org/2000/svg" };
  }

  function render(state, opts) {
    const { overlay, squareEl, stackEl, square } = opts;
    if (!overlay) return;
    const sized = prepareOverlay(overlay, stackEl);
    if (!sized) return;
    const ns = sized.ns;
    overlay.innerHTML = "";
    // Never block the grid: root stays none. Objects opt-in for select/eraser.
    overlay.style.pointerEvents = "none";
    const canHitObjs =
      state.enabled && (state.tool === "select" || state.tool === "eraser");

    const drawPolyline = (points, style, cls, id, interactive) => {
      if (points.length < 2) return;
      const centers = points.map((p) => cellCenterEl(squareEl, stackEl, p.row, p.col));
      if (centers.some((c) => !c)) return;
      const pts = centers.map((c) => `${c.x},${c.y}`).join(" ");
      const dash = dashArray(style.dash, style.width);

      if (interactive) {
        const hit = document.createElementNS(ns, "polyline");
        hit.setAttribute("points", pts);
        hit.setAttribute("fill", "none");
        hit.setAttribute("stroke", style.color);
        hit.setAttribute("stroke-width", String(Math.max(12, style.width * 4)));
        hit.setAttribute("stroke-opacity", "0.01");
        hit.setAttribute("stroke-linecap", "round");
        hit.setAttribute("stroke-linejoin", "round");
        hit.setAttribute("class", cls);
        hit.style.pointerEvents = "stroke";
        hit.style.cursor = state.tool === "eraser" ? "crosshair" : "pointer";
        if (id) hit.dataset.id = id;
        overlay.appendChild(hit);
      }

      const poly = document.createElementNS(ns, "polyline");
      poly.setAttribute("points", pts);
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", style.color);
      poly.setAttribute("stroke-width", String(style.width));
      poly.setAttribute("stroke-linecap", "round");
      poly.setAttribute("stroke-linejoin", "round");
      if (dash) poly.setAttribute("stroke-dasharray", dash);
      poly.setAttribute("class", cls);
      poly.style.pointerEvents = "none";
      if (id) poly.dataset.id = id;
      overlay.appendChild(poly);
    };

    const drawMarker = (pt, style, cls, id, interactive) => {
      const c = cellCenterEl(squareEl, stackEl, pt.row, pt.col);
      if (!c) return;
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", c.x);
      circle.setAttribute("cy", c.y);
      circle.setAttribute("r", Math.max(5, c.r * 0.85));
      circle.setAttribute("stroke", style.color);
      circle.setAttribute("stroke-width", String(Math.max(1.5, style.width)));
      circle.setAttribute(
        "fill",
        style.markerFill === "solid" ? style.color : "rgba(255,252,248,0.85)"
      );
      if (style.markerFill === "solid") circle.setAttribute("fill-opacity", "0.35");
      circle.setAttribute("class", cls);
      circle.style.pointerEvents = interactive ? "all" : "none";
      if (interactive) {
        circle.style.cursor = state.tool === "eraser" ? "crosshair" : "pointer";
      }
      if (id) circle.dataset.id = id;
      overlay.appendChild(circle);
    };

    state.objects.forEach((obj) => {
      const cls = obj.id === state.selectedId ? "draw-obj selected" : "draw-obj";
      if (obj.type === "marker") {
        drawMarker(obj.points[0], obj.style, cls, obj.id, canHitObjs);
      } else {
        drawPolyline(obj.points, obj.style, cls, obj.id, canHitObjs);
      }
    });

    if (state.draft && state.draft.points.length) {
      if (state.draft.type === "marker") {
        drawMarker(state.draft.points[0], state.draft.style, "draw-draft", null, false);
      } else {
        drawPolyline(state.draft.points, state.draft.style, "draw-draft", null, false);
        const last = state.draft.points[state.draft.points.length - 1];
        if (state.hoverCell && square) {
          const ok = isAllowedByAngle(square, last, state.hoverCell, state.angleMode);
          if (ok || state.angleMode === "free") {
            const a = cellCenterEl(squareEl, stackEl, last.row, last.col);
            const b = cellCenterEl(
              squareEl,
              stackEl,
              state.hoverCell.row,
              state.hoverCell.col
            );
            if (a && b) {
              const line = document.createElementNS(ns, "line");
              line.setAttribute("x1", a.x);
              line.setAttribute("y1", a.y);
              line.setAttribute("x2", b.x);
              line.setAttribute("y2", b.y);
              line.setAttribute("class", ok ? "draw-preview ok" : "draw-preview bad");
              line.setAttribute("stroke", state.draft.style.color);
              line.setAttribute("stroke-width", String(state.draft.style.width));
              line.setAttribute("stroke-dasharray", "4 4");
              line.style.pointerEvents = "none";
              overlay.appendChild(line);
            }
          }
        }
      }
    }
  }

  function paintToCanvas(ctx, state, layout) {
    const { pad, cell, gap } = layout;
    const center = (row, col) => ({
      x: pad + col * (cell + gap) + cell / 2,
      y: pad + row * (cell + gap) + cell / 2,
    });
    state.objects.forEach((obj) => {
      const style = obj.style || defaultStyle();
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (style.dash === "dash") ctx.setLineDash([8, 5]);
      else if (style.dash === "dot") ctx.setLineDash([2, 4]);
      else ctx.setLineDash([]);
      if (obj.type === "marker") {
        const p = center(obj.points[0].row, obj.points[0].col);
        ctx.beginPath();
        ctx.arc(p.x, p.y, cell * 0.28, 0, Math.PI * 2);
        ctx.fillStyle =
          style.markerFill === "solid" ? style.color : "rgba(255,252,248,0.9)";
        if (style.markerFill === "solid") ctx.globalAlpha = 0.35;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
      } else if (obj.points.length >= 2) {
        ctx.beginPath();
        obj.points.forEach((pt, i) => {
          const p = center(pt.row, pt.col);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }
      ctx.setLineDash([]);
    });
  }

  global.GannDraw = {
    ANGLE_CYCLE,
    ANGLE_LABEL,
    COLORS,
    STORAGE_DRAW,
    createState,
    defaultStyle,
    cloneStyle,
    cycleAngle,
    isAllowedByAngle,
    relate,
    beginDraft,
    addPointToDraft,
    commitDraft,
    addMarker,
    deleteSelected,
    deleteObject,
    clearAll,
    undo,
    pushUndo,
    save,
    loadInto,
    render,
    paintToCanvas,
    pointFromCell,
  };
})(window);
