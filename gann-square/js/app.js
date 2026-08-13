(function () {
  const $ = (id) => document.getElementById(id);
  const LABEL_PATH_LINE = "Constellate · 角十角";
  const LABEL_PROJECT_FULL = "Constellate · 完整推演";

  const els = {
    layout: $("layout"),
    panelLeft: $("panelLeft"),
    panelRight: $("panelRight"),
    toggleLeft: $("toggleLeft"),
    toggleRight: $("toggleRight"),
    reopenLeft: $("reopenLeft"),
    reopenRight: $("reopenRight"),
    preset: $("preset"),
    begin: $("begin"),
    step: $("step"),
    rings: $("rings"),
    ringsInput: $("ringsInput"),
    ringsMax: $("ringsMax"),
    ringsLabel: $("ringsLabel"),
    sizeHint: $("sizeHint"),
    stepRangeHint: $("stepRangeHint"),
    perfHint: $("perfHint"),
    beginDate: $("beginDate"),
    timeStepUnit: $("timeStepUnit"),
    priceControls: $("priceControls"),
    timeControls: $("timeControls"),
    hlCross: $("hlCross"),
    hlDiag: $("hlDiag"),
    hlSquares: $("hlSquares"),
    lookupValue: $("lookupValue"),
    lookupHint: $("lookupHint"),
    btnLookup: $("btnLookup"),
    rowOffset: $("rowOffset"),
    colOffset: $("colOffset"),
    btnReset: $("btnReset"),
    btnCopyLink: $("btnCopyLink"),
    btnExportCsv: $("btnExportCsv"),
    btnExportPng: $("btnExportPng"),
    square: $("square"),
    canvasScaler: $("canvasScaler"),
    stageTitle: $("stageTitle"),
    emptyReadout: $("emptyReadout"),
    readoutBody: $("readoutBody"),
    readoutValue: $("readoutValue"),
    readoutAngle: $("readoutAngle"),
    readoutRing: $("readoutRing"),
    readoutCoord: $("readoutCoord"),
    readoutIndex: $("readoutIndex"),
    relatedList: $("relatedList"),
    neighborList: $("neighborList"),
    toast: $("toast"),
    zoomLabel: $("zoomLabel"),
    btnZoomIn: $("btnZoomIn"),
    btnZoomOut: $("btnZoomOut"),
    btnZoomReset: $("btnZoomReset"),
    stepChips: $("stepChips"),
    pathStart: $("pathStart"),
    pathTarget: $("pathTarget"),
    pathSnapHint: $("pathSnapHint"),
    pathLabelIndex: $("pathLabelIndex"),
    pathLabelPrice: $("pathLabelPrice"),
    pathProjectDots: $("pathProjectDots"),
    pathSegments: $("pathSegments"),
    pathAutoExpand: $("pathAutoExpand"),
    pathAutoSegments: $("pathAutoSegments"),
    pathCollapsePanels: $("pathCollapsePanels"),
    btnPathRun: $("btnPathRun"),
    btnPathClear: $("btnPathClear"),
    pathSummary: $("pathSummary"),
    pathOverlay: $("pathOverlay"),
    squareStack: $("squareStack"),
    pathMinibar: $("pathMinibar"),
    pathMinibarText: $("pathMinibarText"),
    btnPathExpandPanels: $("btnPathExpandPanels"),
    pathResult: $("pathResult"),
    pathResultSummary: $("pathResultSummary"),
    pathTableBody: $("pathTableBody"),
    btnPathCopy: $("btnPathCopy"),
    btnPathExport: $("btnPathExport"),
    projectResult: $("projectResult"),
    projectSecret: $("projectSecret"),
    projectChips: $("projectChips"),
    btnProjectCopy: $("btnProjectCopy"),
    resizeLeft: $("resizeLeft"),
    resizeRight: $("resizeRight"),
    drawToolbar: $("drawToolbar"),
    drawToolbarBody: $("drawToolbarBody"),
    btnDrawToggle: $("btnDrawToggle"),
    btnDrawAngle: $("btnDrawAngle"),
    btnDrawColor: $("btnDrawColor"),
    drawColorPop: $("drawColorPop"),
    drawColorSwatch: $("drawColorSwatch"),
    btnDrawDash: $("btnDrawDash"),
    btnDrawWidth: $("btnDrawWidth"),
    btnDrawUndo: $("btnDrawUndo"),
    btnDrawClear: $("btnDrawClear"),
    btnDrawCollapse: $("btnDrawCollapse"),
    drawOverlay: $("drawOverlay"),
    drawHud: $("drawHud"),
    pinwheelOverlay: $("pinwheelOverlay"),
    constellateControls: $("constellateControls"),
    pinwheelControls: $("pinwheelControls"),
    pathOverlayCompare: $("pathOverlayCompare"),
    pinwheelShowFrame: $("pinwheelShowFrame"),
    pinwheelShowBlades: $("pinwheelShowBlades"),
    pinwheelShowLabels: $("pinwheelShowLabels"),
    pinwheelAnchorHint: $("pinwheelAnchorHint"),
    pinwheelSummary: $("pinwheelSummary"),
    btnPinwheelDraw: $("btnPinwheelDraw"),
    btnPinwheelClear: $("btnPinwheelClear"),
    btnPinFrameColor: $("btnPinFrameColor"),
    btnPinBladeColor: $("btnPinBladeColor"),
    btnPinFrameDash: $("btnPinFrameDash"),
    btnPinBladeDash: $("btnPinBladeDash"),
    btnPinFrameWidth: $("btnPinFrameWidth"),
    btnPinBladeWidth: $("btnPinBladeWidth"),
    btnPinStyleReset: $("btnPinStyleReset"),
    pinFrameSwatch: $("pinFrameSwatch"),
    pinBladeSwatch: $("pinBladeSwatch"),
    pinColorPop: $("pinColorPop"),
  };

  const STORAGE_KEY = "gann-square-ui-v1";
  const PANEL_WIDTH = {
    leftDefault: 300,
    rightDefault: 320,
    leftMin: 240,
    leftMax: 480,
    rightMin: 260,
    rightMax: 560,
  };

  const state = {
    mode: "price",
    zoom: 1,
    square: null,
    selectedKey: null,
    lookupKey: null,
    renderTimer: null,
    ringsMax: 50,
    leftCollapsed: false,
    rightCollapsed: false,
    leftWidth: PANEL_WIDTH.leftDefault,
    rightWidth: PANEL_WIDTH.rightDefault,
    pathResult: null,
    projectResult: null,
    pathActiveStep: null,
    pathDrawTimer: null,
    projectActivePrice: null,
    locateKey: null,
    locateMode: null,
    draw: GannDraw.createState(),
    pinwheel: GannPinwheel.createState(),
    pathMethod: "constellate",
  };

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw);
      if (Number.isFinite(prefs.ringsMax)) state.ringsMax = clampRingsMax(prefs.ringsMax);
      if (typeof prefs.leftCollapsed === "boolean") state.leftCollapsed = prefs.leftCollapsed;
      if (typeof prefs.rightCollapsed === "boolean") state.rightCollapsed = prefs.rightCollapsed;
      if (Number.isFinite(prefs.leftWidth)) state.leftWidth = clampPanelWidth("left", prefs.leftWidth);
      if (Number.isFinite(prefs.rightWidth)) state.rightWidth = clampPanelWidth("right", prefs.rightWidth);
    } catch (err) {
      /* ignore */
    }
  }

  function savePrefs() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ringsMax: state.ringsMax,
        leftCollapsed: state.leftCollapsed,
        rightCollapsed: state.rightCollapsed,
        leftWidth: state.leftWidth,
        rightWidth: state.rightWidth,
      })
    );
  }

  function clampPanelWidth(side, value) {
    const n = Math.round(Number(value));
    if (side === "left") {
      return Math.min(PANEL_WIDTH.leftMax, Math.max(PANEL_WIDTH.leftMin, n || PANEL_WIDTH.leftDefault));
    }
    return Math.min(PANEL_WIDTH.rightMax, Math.max(PANEL_WIDTH.rightMin, n || PANEL_WIDTH.rightDefault));
  }

  function panelResizeEnabled() {
    const el = els.resizeLeft || els.resizeRight;
    if (!el) return false;
    // Follow CSS visibility (hidden under ≤1100px) instead of a separate media query
    return window.getComputedStyle(el).display !== "none";
  }

  function applyPanelWidths() {
    if (!els.layout) return;
    // Set width vars directly on the layout so the grid always picks them up
    if (!state.leftCollapsed) {
      els.layout.style.setProperty("--panel-left-w", `${state.leftWidth}px`);
    } else {
      els.layout.style.removeProperty("--panel-left-w");
    }
    if (!state.rightCollapsed) {
      els.layout.style.setProperty("--panel-right-w", `${state.rightWidth}px`);
    } else {
      els.layout.style.removeProperty("--panel-right-w");
    }
    if (els.resizeLeft) {
      els.resizeLeft.setAttribute("aria-valuenow", String(state.leftWidth));
      els.resizeLeft.setAttribute("aria-valuemin", String(PANEL_WIDTH.leftMin));
      els.resizeLeft.setAttribute("aria-valuemax", String(PANEL_WIDTH.leftMax));
    }
    if (els.resizeRight) {
      els.resizeRight.setAttribute("aria-valuenow", String(state.rightWidth));
      els.resizeRight.setAttribute("aria-valuemin", String(PANEL_WIDTH.rightMin));
      els.resizeRight.setAttribute("aria-valuemax", String(PANEL_WIDTH.rightMax));
    }
  }

  function bindPanelResizers() {
    const bindOne = (el, side) => {
      if (!el) return;

      const canDragSide = () => {
        if (!panelResizeEnabled()) return false;
        if (side === "left" && state.leftCollapsed) return false;
        if (side === "right" && state.rightCollapsed) return false;
        return true;
      };

      el.addEventListener("dblclick", () => {
        if (!canDragSide()) return;
        if (side === "left") state.leftWidth = PANEL_WIDTH.leftDefault;
        else state.rightWidth = PANEL_WIDTH.rightDefault;
        applyPanelWidths();
        savePrefs();
        redrawPathAndProject();
        showToast(side === "left" ? "参数栏已恢复默认宽度" : "解读栏已恢复默认宽度");
      });

      el.addEventListener("keydown", (ev) => {
        if (!canDragSide()) return;
        const step = ev.shiftKey ? 24 : 12;
        let next = side === "left" ? state.leftWidth : state.rightWidth;
        if (ev.key === "ArrowLeft") next += side === "left" ? -step : step;
        else if (ev.key === "ArrowRight") next += side === "left" ? step : -step;
        else return;
        ev.preventDefault();
        if (side === "left") state.leftWidth = clampPanelWidth("left", next);
        else state.rightWidth = clampPanelWidth("right", next);
        applyPanelWidths();
        savePrefs();
        redrawPathAndProject();
      });

      const startDrag = (clientX, pointerId) => {
        if (!canDragSide()) return false;
        const startX = clientX;
        const startW = side === "left" ? state.leftWidth : state.rightWidth;
        els.layout.classList.add("is-resizing");
        document.body.classList.add("panel-resizing");
        el.classList.add("is-active");

        const onMove = (moveEv) => {
          const x = moveEv.clientX != null ? moveEv.clientX : moveEv.touches?.[0]?.clientX;
          if (!Number.isFinite(x)) return;
          const dx = x - startX;
          if (side === "left") state.leftWidth = clampPanelWidth("left", startW + dx);
          else state.rightWidth = clampPanelWidth("right", startW - dx);
          applyPanelWidths();
        };

        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
          els.layout.classList.remove("is-resizing");
          document.body.classList.remove("panel-resizing");
          el.classList.remove("is-active");
          savePrefs();
          redrawPathAndProject();
        };

        if (window.PointerEvent) {
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
          window.addEventListener("pointercancel", onUp);
          try {
            if (pointerId != null) el.setPointerCapture(pointerId);
          } catch (err) {
            /* ignore capture failures */
          }
        } else {
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }
        return true;
      };

      el.addEventListener("pointerdown", (ev) => {
        if (ev.button != null && ev.button !== 0) return;
        if (!startDrag(ev.clientX, ev.pointerId)) return;
        ev.preventDefault();
      });

      // Fallback for environments where pointer events are flaky
      el.addEventListener("mousedown", (ev) => {
        if (window.PointerEvent) return;
        if (ev.button !== 0) return;
        if (!startDrag(ev.clientX, null)) return;
        ev.preventDefault();
      });
    };

    bindOne(els.resizeLeft, "left");
    bindOne(els.resizeRight, "right");
  }

  function clampRingsMax(value) {
    return Math.min(120, Math.max(10, Math.floor(Number(value) || 50)));
  }

  function clampRings(value) {
    const rings = Math.floor(Number(value) || 3);
    return Math.min(state.ringsMax, Math.max(3, rings));
  }

  function applyRingsMax(max) {
    state.ringsMax = clampRingsMax(max);
    els.ringsMax.value = String(state.ringsMax);
    els.rings.max = String(state.ringsMax);
    els.ringsInput.max = String(state.ringsMax);
    const rings = clampRings(els.rings.value);
    syncRingsControls(rings);
    savePrefs();
  }

  function syncRingsControls(rings) {
    const v = clampRings(rings);
    els.rings.value = String(v);
    els.ringsInput.value = String(v);
    els.ringsLabel.textContent = String(v);
  }

  function setPanelCollapsed(side, collapsed) {
    if (side === "left") {
      state.leftCollapsed = collapsed;
      els.layout.classList.toggle("left-collapsed", collapsed);
      els.reopenLeft.classList.toggle("hidden", !collapsed);
      els.toggleLeft.setAttribute("aria-label", collapsed ? "展开参数面板" : "收起参数面板");
      els.toggleLeft.title = collapsed ? "展开参数面板" : "收起参数面板";
    } else {
      state.rightCollapsed = collapsed;
      els.layout.classList.toggle("right-collapsed", collapsed);
      els.reopenRight.classList.toggle("hidden", !collapsed);
      els.toggleRight.setAttribute("aria-label", collapsed ? "展开解读面板" : "收起解读面板");
      els.toggleRight.title = collapsed ? "展开解读面板" : "收起解读面板";
    }
    savePrefs();
    applyPanelWidths();
    if (state.pathResult) {
      const anyCollapsed = state.leftCollapsed || state.rightCollapsed;
      els.pathMinibar.classList.toggle("hidden", !anyCollapsed);
    }
    requestAnimationFrame(() => redrawPathAndProject());
  }

  function togglePanel(side) {
    if (side === "left") setPanelCollapsed("left", !state.leftCollapsed);
    else setPanelCollapsed("right", !state.rightCollapsed);
  }

  function updatePerfHint(rings, cellCount) {
    if (rings >= 30) {
      els.perfHint.textContent = `当前 ${cellCount} 格，渲染可能较慢，建议配合缩放查看`;
      els.perfHint.classList.remove("hidden");
      els.perfHint.classList.add("warn");
    } else if (rings >= 20) {
      els.perfHint.textContent = `当前 ${cellCount} 格，环数较大时建议收起侧栏以扩大画布`;
      els.perfHint.classList.remove("hidden", "warn");
    } else {
      els.perfHint.classList.add("hidden");
      els.perfHint.classList.remove("warn");
    }
  }

  function updateStepRangeHint(params, square) {
    if (params.mode !== "price" || params.step >= 0) {
      els.stepRangeHint.classList.add("hidden");
      els.stepRangeHint.classList.remove("warn");
      return;
    }
    const cellCount = square.size * square.size;
    const range = GannSquare.priceRange(square.begin, square.step, cellCount);
    if (range.min >= 0) {
      els.stepRangeHint.classList.add("hidden");
      els.stepRangeHint.classList.remove("warn");
      return;
    }
    const maxRings = GannSquare.maxRingsWithoutNegative(square.begin, square.step);
    const safeCells = maxRings ? (2 * maxRings - 1) ** 2 : cellCount;
    const safeRange = GannSquare.priceRange(square.begin, square.step, safeCells);
    els.stepRangeHint.textContent =
      `负步长且环数偏大：最外圈最低约 ${GannSquare.formatNumber(range.min)}；` +
      `建议环数 ≤ ${maxRings}（最外圈约 ${GannSquare.formatNumber(safeRange.min)}）`;
    els.stepRangeHint.classList.remove("hidden");
    els.stepRangeHint.classList.add("warn");
  }

  function todayISO() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => els.toast.classList.remove("show"), 1800);
  }

  function readParams() {
    const rings = clampRings(els.rings.value);
    return {
      mode: state.mode,
      begin: Number(els.begin.value),
      step: Number(els.step.value),
      rings,
      beginDate: els.beginDate.value || todayISO(),
      timeUnit: els.timeStepUnit.value,
      rowOffset: Number(els.rowOffset.value) || 0,
      colOffset: Number(els.colOffset.value) || 0,
      hlCross: els.hlCross.checked,
      hlDiag: els.hlDiag.checked,
      hlSquares: els.hlSquares.checked,
    };
  }

  function applyParams(params) {
    if (params.mode) setMode(params.mode, false);
    if (params.begin != null) els.begin.value = params.begin;
    if (params.step != null) {
      els.step.value = params.step;
      syncStepChips(params.step);
    }
    if (params.rings != null) syncRingsControls(params.rings);
    if (params.beginDate) els.beginDate.value = params.beginDate;
    if (params.timeUnit) els.timeStepUnit.value = params.timeUnit;
    if (params.rowOffset != null) els.rowOffset.value = params.rowOffset;
    if (params.colOffset != null) els.colOffset.value = params.colOffset;
    if (params.hlCross != null) els.hlCross.checked = params.hlCross === true || params.hlCross === "1";
    if (params.hlDiag != null) els.hlDiag.checked = params.hlDiag === true || params.hlDiag === "1";
    if (params.hlSquares != null) els.hlSquares.checked = params.hlSquares === true || params.hlSquares === "1";
  }

  function syncStepChips(step) {
    const n = Number(step);
    els.stepChips.querySelectorAll("button").forEach((btn) => {
      btn.classList.toggle("on", Number(btn.dataset.step) === n);
    });
  }

  function setMode(mode, render = true) {
    state.mode = mode;
    document.querySelectorAll(".tab").forEach((tab) => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    els.priceControls.classList.toggle("hidden", mode !== "price");
    els.timeControls.classList.toggle("hidden", mode !== "time");
    els.stageTitle.textContent = mode === "price" ? "价格方阵" : "时间方阵";
    if (render) scheduleRender();
  }

  function cellKey(cell) {
    return `${cell.row}:${cell.col}`;
  }

  function scheduleRender() {
    clearTimeout(state.renderTimer);
    const rings = clampRings(els.rings.value);
    const delay = rings > 25 ? 280 : rings > 15 ? 180 : 80;
    state.renderTimer = setTimeout(render, delay);
  }

  function render() {
    const params = readParams();
    if (!Number.isFinite(params.begin)) params.begin = 1;
    if (!Number.isFinite(params.step) || params.step === 0) params.step = 1;
    syncRingsControls(params.rings);

    const square = GannSquare.generateSquare(params);
    state.square = square;

    const size = square.size;
    const cellCount = size * size;
    els.sizeHint.textContent = `边长 ${size} × ${size} · 共 ${cellCount.toLocaleString()} 格`;
    updatePerfHint(params.rings, cellCount);
    updateStepRangeHint(params, square);

    els.square.className = "square";
    if (params.rings >= 15) els.square.classList.add("dense");
    if (params.rings >= 22) els.square.classList.add("compact", "no-anim");
    else if (params.rings >= 15) els.square.classList.add("no-anim");

    els.square.style.gridTemplateColumns = `repeat(${size}, auto)`;
    els.square.innerHTML = "";

    const frag = document.createDocumentFragment();
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const cell = square.meta[r][c];
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cell";
        if (params.rings < 15) btn.style.animationDelay = `${Math.min(cell.ring, 8) * 18}ms`;
        btn.textContent = cell.display;
        btn.dataset.row = String(r);
        btn.dataset.col = String(c);
        btn.title = `${cell.display} · ${cell.angleLabel} · 环 ${cell.ring}`;

        if (cell.ring % 2 === 1) btn.classList.add("ring-odd");
        if (cell.isCenter) btn.classList.add("center");
        if (params.hlCross && cell.isCross) btn.classList.add("cross");
        if (params.hlDiag && cell.isDiag) btn.classList.add("diag");
        if (params.hlSquares && cell.isOddSquare) btn.classList.add("square-num");

        const key = cellKey(cell);
        if (state.selectedKey === key) btn.classList.add("selected");
        if (state.locateKey === key) {
          btn.classList.add(state.locateMode === "lookup" ? "locate-lookup" : "locate-project");
        }

        btn.addEventListener("click", (ev) => {
          if (handleDrawCellClick(cell, ev)) return;
          selectCell(cell);
        });
        btn.addEventListener("mouseenter", () => {
          if (!state.draw.enabled || !state.draw.draft) return;
          state.draw.hoverCell = cell;
          redrawDrawLayer();
          updateDrawAnchorHints();
        });
        frag.appendChild(btn);
      }
    }
    els.square.appendChild(frag);

    if (state.locateKey) els.square.classList.add("focus-locate");
    else els.square.classList.remove("focus-locate");

    // optional visual offset via CSS translate on scaler
    const ox = params.colOffset * 4;
    const oy = params.rowOffset * 4;
    els.canvasScaler.style.transform = `scale(${state.zoom}) translate(${ox}px, ${oy}px)`;
    els.zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;

    writeUrlState(params);

    if (state.selectedKey) {
      const [sr, sc] = state.selectedKey.split(":").map(Number);
      if (square.meta[sr] && square.meta[sr][sc]) {
        updateReadout(square.meta[sr][sc]);
      }
    }

    requestAnimationFrame(() => {
      redrawPathAndProject();
    });
  }

  function clearLocateHighlight() {
    state.locateKey = null;
    state.locateMode = null;
    if (els.square) els.square.classList.remove("focus-locate");
    document.querySelectorAll(".cell.locate-project, .cell.locate-lookup").forEach((el) => {
      el.classList.remove("locate-project", "locate-lookup", "locate-pulse");
    });
  }

  function applyLocateHighlight(cell) {
    if (!cell || !els.square) return;
    const key = cellKey(cell);
    document.querySelectorAll(".cell.locate-project, .cell.locate-lookup").forEach((el) => {
      el.classList.remove("locate-project", "locate-lookup", "locate-pulse");
    });
    state.locateKey = key;
    els.square.classList.add("focus-locate");
    const el = els.square.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
    if (el) {
      const cls = state.locateMode === "lookup" ? "locate-lookup" : "locate-project";
      el.classList.add(cls, "locate-pulse");
    }
  }

  function locateCell(cell, mode, options = {}) {
    if (!cell) return;
    state.locateMode = mode === "lookup" ? "lookup" : "project";
    if (state.locateMode === "lookup") {
      state.projectActivePrice = null;
      if (state.projectResult?.ok) updateProjectPanel(state.projectResult);
    }
    applyLocateHighlight(cell);
    selectCell(cell, { keepLocate: true });
    if (options.scroll !== false) {
      const el = els.square.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
      if (el) el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    }
    redrawPathAndProject();
  }

  function projectSegForPrice(proj, price) {
    if (!proj || !proj.display) return null;
    for (let i = 0; i < proj.display.length; i += 1) {
      if (proj.display[i].some((p) => GannSquare.almostEqual(p, price))) return i + 1;
    }
    return null;
  }

  function selectCell(cell, options = {}) {
    const key = cellKey(cell);
    if (!options.keepLocate && state.locateKey && state.locateKey !== key) {
      clearLocateHighlight();
    }
    state.selectedKey = key;
    document.querySelectorAll(".cell.selected").forEach((el) => el.classList.remove("selected"));
    const el = els.square.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
    if (el) el.classList.add("selected");
    updateReadout(cell);
  }

  function updateReadout(cell) {
    if (!cell || !state.square) {
      els.emptyReadout.classList.remove("hidden");
      els.readoutBody.classList.add("hidden");
      return;
    }

    els.emptyReadout.classList.add("hidden");
    els.readoutBody.classList.remove("hidden");
    els.readoutValue.textContent = cell.display;
    els.readoutAngle.textContent = cell.angleLabel;
    els.readoutRing.textContent = String(cell.ring);
    els.readoutCoord.textContent = `r${cell.row + 1}, c${cell.col + 1}`;
    els.readoutIndex.textContent = String(cell.index);

    const related = GannSquare.relatedOnAxis(state.square, cell).slice(0, 12);
    els.relatedList.innerHTML = "";
    related.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = item.display;
      btn.title = item.angleLabel;
      btn.addEventListener("click", () => selectCell(item));
      els.relatedList.appendChild(btn);
    });
    if (!related.length) {
      const li = document.createElement("li");
      li.textContent = "无";
      els.relatedList.appendChild(li);
    }

    const near = GannSquare.neighbors(state.square, cell);
    els.neighborList.innerHTML = "";
    near.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = item.display;
      btn.addEventListener("click", () => selectCell(item));
      els.neighborList.appendChild(btn);
    });
  }

  function lookup() {
    if (!state.square) return;
    const raw = Number(els.lookupValue.value);
    if (!Number.isFinite(raw)) {
      showToast("请输入有效数值");
      return;
    }
    const { cell, diff } = GannSquare.findNearest(state.square, raw);
    if (!cell) return;
    state.lookupKey = cellKey(cell);
    locateCell(cell, "lookup");
    const cellCount = state.square.size * state.square.size;
    const range =
      state.mode === "price"
        ? GannSquare.priceRange(state.square.begin, state.square.step, cellCount)
        : { min: 1, max: cellCount };
    const minVal = range.min;
    const maxVal = range.max;
    const outOfRange = raw < minVal || raw > maxVal;
    if (state.mode === "price") {
      els.lookupHint.textContent = outOfRange
        ? `超出当前方阵范围（${GannSquare.formatNumber(minVal)}–${GannSquare.formatNumber(maxVal)}），已定位边界最近格 ${cell.display}`
        : `最接近 ${cell.display}（差值 ${GannSquare.formatNumber(diff)}）`;
    } else {
      els.lookupHint.textContent = `最接近序号 ${cell.index} → ${cell.display}`;
    }
    showToast(outOfRange ? "已定位到边界最近格" : "已定位");
  }

  function writeUrlState(params) {
    const q = new URLSearchParams({
      mode: params.mode,
      begin: String(params.begin),
      step: String(params.step),
      rings: String(params.rings),
      beginDate: params.beginDate,
      timeUnit: params.timeUnit,
      hlCross: params.hlCross ? "1" : "0",
      hlDiag: params.hlDiag ? "1" : "0",
      hlSquares: params.hlSquares ? "1" : "0",
    });
    const url = `${location.pathname}?${q.toString()}${location.hash}`;
    history.replaceState(null, "", url);
  }

  function loadUrlState() {
    const q = new URLSearchParams(location.search);
    if (![...q.keys()].length) return false;
    applyParams({
      mode: q.get("mode") || "price",
      begin: q.get("begin"),
      step: q.get("step"),
      rings: q.get("rings"),
      beginDate: q.get("beginDate"),
      timeUnit: q.get("timeUnit"),
      hlCross: q.get("hlCross"),
      hlDiag: q.get("hlDiag"),
      hlSquares: q.get("hlSquares"),
    });
    return true;
  }

  function applyPreset(name) {
    const presets = {
      classic: { mode: "price", begin: 1, step: 1, rings: 6 },
      price01: { mode: "price", begin: 1, step: 0.1, rings: 6 },
      price1: { mode: "price", begin: 10, step: 1, rings: 7 },
      index: { mode: "price", begin: 1000, step: 10, rings: 6 },
      timeDay: { mode: "time", beginDate: todayISO(), timeUnit: "day", rings: 6 },
    };
    const p = presets[name] || presets.classic;
    applyParams(p);
    scheduleRender();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      showToast("链接已复制");
    } catch (err) {
      showToast("复制失败，请手动复制地址栏");
    }
  }

  function exportCsv() {
    if (!state.square) return;
    const csv = GannSquare.toCsv(state.square);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gann-square-${state.square.size}x${state.square.size}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("CSV 已导出");
  }

  async function exportPng() {
    const node = els.square;
    const size = state.square.size;
    const cell = 40;
    const gap = 2;
    const pad = 8;
    const width = pad * 2 + size * cell + (size - 1) * gap;
    const height = width;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#eef2f0";
    ctx.fillRect(0, 0, width, height);

    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const m = state.square.meta[r][c];
        const x = pad + c * (cell + gap);
        const y = pad + r * (cell + gap);
        ctx.fillStyle = m.ring % 2 === 1 ? "#f4e4dc" : "#ffffff";
        ctx.fillRect(x, y, cell, cell);

        if (m.isCenter) ctx.strokeStyle = "rgba(178,58,47,0.55)";
        else ctx.strokeStyle = "rgba(20,32,40,0.08)";
        ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);

        ctx.fillStyle = m.isDiag || m.isCenter ? "#b23a2f" : m.isCross ? "#1f5f8a" : "#142028";
        ctx.font = `600 ${Math.max(9, Math.floor(cell * 0.28))}px "IBM Plex Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(m.display), x + cell / 2, y + cell / 2);
      }
    }

    if (state.pathResult && state.pathResult.steps && state.pathResult.steps.length > 1) {
      const pts = state.pathResult.steps.map((s) => ({
        x: pad + s.cell.col * (cell + gap) + cell / 2,
        y: pad + s.cell.row * (cell + gap) + cell / 2,
        move: s.move,
      }));
      for (let i = 0; i < pts.length - 1; i += 1) {
        const a = pts[i];
        const b = pts[i + 1];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = pts[i + 1].move === "180" ? "#1f5f8a" : "#1f6f6a";
        ctx.lineWidth = 2.5;
        if (pts[i + 1].move === "180") ctx.setLineDash([8, 5]);
        else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      pts.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, cell * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,252,248,0.95)";
        ctx.fill();
        ctx.strokeStyle = i === 0 ? "#2f8f4e" : i === pts.length - 1 ? "#b23a2f" : "#b8652f";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = "#142028";
        ctx.font = `600 ${Math.max(9, Math.floor(cell * 0.22))}px "IBM Plex Mono", monospace`;
        ctx.fillText(`#${i}`, p.x, p.y);
      });
    }

    if (state.draw && state.draw.objects && state.draw.objects.length) {
      GannDraw.paintToCanvas(ctx, state.draw, { pad, cell, gap });
    }

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `gann-square-${size}x${size}.png`;
    a.click();
    showToast("PNG 已导出");
  }

  function pathDirection() {
    const checked = document.querySelector('input[name="pathDir"]:checked');
    return checked ? checked.value : "down";
  }

  function pathOutputMode() {
    const checked = document.querySelector('input[name="pathOutput"]:checked');
    return checked ? checked.value : "both";
  }

  function pathPriceEps() {
    const step = state.square ? Math.abs(state.square.step || 1) : Math.abs(Number(els.step.value) || 1);
    return Math.max(step * 0.5, 0.5);
  }

  /** Auto direction from high/low; equal prices → no direction (prompt user). */
  function syncPathDirectionFromPrices() {
    const start = Number(els.pathStart.value);
    const target = Number(els.pathTarget.value);
    const radios = document.querySelectorAll('input[name="pathDir"]');
    radios.forEach((el) => {
      el.disabled = true;
    });
    if (!Number.isFinite(start) || !Number.isFinite(target)) {
      if (els.btnPathRun) els.btnPathRun.disabled = true;
      return { ok: false, same: false, direction: pathDirection() };
    }
    const same = Math.abs(start - target) <= pathPriceEps();
    if (same) {
      if (els.btnPathRun) els.btnPathRun.disabled = true;
      return { ok: false, same: true, direction: pathDirection() };
    }
    const direction = start > target ? "down" : "up";
    radios.forEach((el) => {
      el.checked = el.value === direction;
    });
    if (els.btnPathRun) els.btnPathRun.disabled = false;
    return { ok: true, same: false, direction };
  }

  function updateSnapHint() {
    if (!state.square || state.mode !== "price") {
      els.pathSnapHint.textContent = "Constellate：目标沿 45°/180° 星线落到最近结构点";
      els.pathSnapHint.classList.remove("snap-on");
      return;
    }
    const start = Number(els.pathStart.value);
    const raw = Number(els.pathTarget.value);
    if (!Number.isFinite(raw) || !Number.isFinite(start)) {
      els.pathSnapHint.textContent = "请输入起点与目标价";
      els.pathSnapHint.classList.remove("snap-on");
      if (els.btnPathRun) els.btnPathRun.disabled = true;
      return;
    }
    const sync = syncPathDirectionFromPrices();
    if (sync.same) {
      els.pathSnapHint.textContent = "起点与目标相同，无法判定方向，请调整高低点";
      els.pathSnapHint.classList.add("snap-on");
      return;
    }
    const preview = GannPath.runPath(state.square, {
      start,
      target: raw,
      direction: sync.direction,
    });
    if (!preview.ok || !preview.steps.length) {
      els.pathSnapHint.textContent = preview.message || "无法预览路径";
      els.pathSnapHint.classList.remove("snap-on");
      return;
    }
    const end = preview.steps[preview.steps.length - 1].price;
    const diff = Math.abs(end - raw);
    const dirLabel = sync.direction === "up" ? "向上" : "向下";
    if (diff < 0.5) {
      els.pathSnapHint.textContent = `${dirLabel} · 预计落点 ${GannSquare.formatNumber(end)}`;
      els.pathSnapHint.classList.remove("snap-on");
    } else {
      els.pathSnapHint.textContent = `${dirLabel} · 输入 ${GannSquare.formatNumber(raw)} → 预计落点 ${GannSquare.formatNumber(end)}（差值 ${GannSquare.formatNumber(diff)}）`;
      els.pathSnapHint.classList.add("snap-on");
    }
  }

  function ensureRingsForPath(start, target) {
    const begin = Number(els.begin.value) || 1;
    const step = Number(els.step.value) || 1;
    const need =
      Math.max(
        GannPath.minRingsForValue(begin, step, start),
        GannPath.minRingsForValue(begin, step, target)
      ) + 1;
    const desired = Math.min(state.ringsMax, Math.max(3, need));
    if (desired > clampRings(els.rings.value)) {
      syncRingsControls(desired);
      return true;
    }
    return false;
  }

  function resolvePathCells(result) {
    if (!result || !state.square) return result;
    const steps = result.steps.map((s) => {
      const cell = state.square.meta[s.cell.row] && state.square.meta[s.cell.row][s.cell.col];
      return cell ? { ...s, cell, price: cell.mode === "time" ? cell.index : cell.value } : s;
    });
    return { ...result, steps };
  }

  function clearPathOverlay() {
    if (els.pathOverlay) els.pathOverlay.innerHTML = "";
  }

  function cellCenter(row, col) {
    const el = els.square.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!el || !els.squareStack) return null;
    const x = el.offsetLeft + el.offsetWidth / 2;
    const y = el.offsetTop + el.offsetHeight / 2;
    return {
      x: els.square.offsetLeft + x,
      y: els.square.offsetTop + y,
      r: Math.max(8, Math.min(el.offsetWidth, el.offsetHeight) * 0.38),
    };
  }

  function moveLabel(move) {
    if (move === "start") return "起点";
    if (move === "45") return "45°";
    if (move === "180") return "180°";
    return move;
  }

  function preparePathOverlaySize() {
    if (!els.pathOverlay || !els.squareStack) return null;
    const width = els.squareStack.offsetWidth;
    const height = els.squareStack.offsetHeight;
    els.pathOverlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
    els.pathOverlay.setAttribute("width", String(width));
    els.pathOverlay.setAttribute("height", String(height));
    return { width, height, ns: "http://www.w3.org/2000/svg" };
  }

  function drawPathOverlay(result, revealUntil) {
    clearPathOverlay();
    const sized = preparePathOverlaySize();
    if (!sized) return;

    if (result && result.steps && result.steps.length >= 1) {
      const resolved = resolvePathCells(result);
      const steps = resolved.steps;
      const limit = Number.isFinite(revealUntil) ? revealUntil : steps.length - 1;
      const showIndex = els.pathLabelIndex.checked;
      const showPrice = els.pathLabelPrice.checked;
      const rings = clampRings(els.rings.value);
      const forceIndexOnly = rings >= 19;
      const allowPrice = showPrice && !forceIndexOnly;
      const centers = steps.map((s) => cellCenter(s.cell.row, s.cell.col));
      const ns = sized.ns;

      for (let i = 0; i < steps.length - 1; i += 1) {
        if (i + 1 > limit) break;
        const a = centers[i];
        const b = centers[i + 1];
        if (!a || !b) continue;
        const line = document.createElementNS(ns, "line");
        line.setAttribute("x1", a.x);
        line.setAttribute("y1", a.y);
        line.setAttribute("x2", b.x);
        line.setAttribute("y2", b.y);
        const move = steps[i + 1].move;
        line.setAttribute("class", move === "180" ? "path-line-180" : "path-line-45");
        els.pathOverlay.appendChild(line);

        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const ah = 7;
        const ax = b.x - Math.cos(angle) * (b.r + 2);
        const ay = b.y - Math.sin(angle) * (b.r + 2);
        const arrow = document.createElementNS(ns, "polygon");
        const p1 = `${ax},${ay}`;
        const p2 = `${ax - ah * Math.cos(angle - 0.4)},${ay - ah * Math.sin(angle - 0.4)}`;
        const p3 = `${ax - ah * Math.cos(angle + 0.4)},${ay - ah * Math.sin(angle + 0.4)}`;
        arrow.setAttribute("points", `${p1} ${p2} ${p3}`);
        arrow.setAttribute("class", "path-arrow");
        arrow.style.color = move === "180" ? "#1f5f8a" : "#1f6f6a";
        els.pathOverlay.appendChild(arrow);
      }

      for (let i = 0; i <= Math.min(limit, steps.length - 1); i += 1) {
        const s = steps[i];
        const p = centers[i];
        if (!p) continue;
        const isStart = i === 0;
        const isEnd = i === steps.length - 1 && resolved.reached;
        const circle = document.createElementNS(ns, "circle");
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
        circle.setAttribute("r", p.r);
        let cls = "path-node mid";
        if (isStart) cls = "path-node start";
        if (isEnd) cls = "path-node end";
        if (state.pathActiveStep === i) cls += " active";
        circle.setAttribute("class", cls);
        els.pathOverlay.appendChild(circle);

        if (showIndex) {
          const badge = document.createElementNS(ns, "text");
          badge.setAttribute("x", p.x);
          badge.setAttribute("y", p.y);
          badge.setAttribute("class", "path-badge");
          badge.textContent = `#${i}`;
          els.pathOverlay.appendChild(badge);
        }

        const labels = [];
        if (allowPrice) labels.push(GannSquare.formatNumber(s.price));
        if (isEnd) labels.push("目标✓");
        if (labels.length) {
          const lab = document.createElementNS(ns, "text");
          lab.setAttribute("x", p.x);
          lab.setAttribute("y", p.y + p.r + 11);
          lab.setAttribute("class", "path-label");
          lab.textContent = labels.join(" · ");
          els.pathOverlay.appendChild(lab);
        }
      }
    }

    drawProjectOverlay();
    drawLocateOverlay();
  }

  function drawProjectOverlay() {
    const proj = state.projectResult;
    if (!proj || !proj.ok || !els.pathOverlay) return;
    const sized = preparePathOverlaySize();
    if (!sized) return;
    const ns = sized.ns;
    const showDots = !els.pathProjectDots || els.pathProjectDots.checked;

    if (showDots && proj.allDisplayPrices) {
      proj.allDisplayPrices.forEach((price) => {
        const hit = GannSquare.findNearest(state.square, price);
        if (!hit.cell) return;
        const p = cellCenter(hit.cell.row, hit.cell.col);
        if (!p) return;
        const isActive = state.projectActivePrice === price;
        if (isActive) {
          const outer = document.createElementNS(ns, "circle");
          outer.setAttribute("cx", p.x);
          outer.setAttribute("cy", p.y);
          outer.setAttribute("r", Math.max(10, p.r * 1.55));
          outer.setAttribute("class", "project-mark active-ring");
          els.pathOverlay.appendChild(outer);

          const inner = document.createElementNS(ns, "circle");
          inner.setAttribute("cx", p.x);
          inner.setAttribute("cy", p.y);
          inner.setAttribute("r", Math.max(6, p.r * 0.95));
          inner.setAttribute("class", "project-mark active-fill");
          els.pathOverlay.appendChild(inner);

          const seg = projectSegForPrice(proj, price);
          const label = document.createElementNS(ns, "text");
          label.setAttribute("x", p.x);
          label.setAttribute("y", p.y - Math.max(10, p.r * 1.55) - 4);
          label.setAttribute("class", "locate-mark-label project");
          label.textContent = seg
            ? `${GannSquare.formatNumber(price)} · 段${seg}`
            : GannSquare.formatNumber(price);
          els.pathOverlay.appendChild(label);
        } else {
          const mark = document.createElementNS(ns, "circle");
          mark.setAttribute("cx", p.x);
          mark.setAttribute("cy", p.y);
          mark.setAttribute("r", Math.max(5, p.r * 0.85));
          mark.setAttribute("class", "project-mark");
          els.pathOverlay.appendChild(mark);
        }
      });
    }
  }

  function drawLocateOverlay() {
    if (!state.locateKey || state.locateMode !== "lookup" || !els.pathOverlay) return;
    const sized = preparePathOverlaySize();
    if (!sized) return;
    const [sr, sc] = state.locateKey.split(":").map(Number);
    const cell = state.square?.meta[sr]?.[sc];
    if (!cell) return;
    const p = cellCenter(sr, sc);
    if (!p) return;
    const ns = sized.ns;

    const outer = document.createElementNS(ns, "circle");
    outer.setAttribute("cx", p.x);
    outer.setAttribute("cy", p.y);
    outer.setAttribute("r", Math.max(10, p.r * 1.55));
    outer.setAttribute("class", "lookup-mark active-ring");
    els.pathOverlay.appendChild(outer);

    const inner = document.createElementNS(ns, "circle");
    inner.setAttribute("cx", p.x);
    inner.setAttribute("cy", p.y);
    inner.setAttribute("r", Math.max(6, p.r * 0.95));
    inner.setAttribute("class", "lookup-mark active-fill");
    els.pathOverlay.appendChild(inner);

    const label = document.createElementNS(ns, "text");
    label.setAttribute("x", p.x);
    label.setAttribute("y", p.y - Math.max(10, p.r * 1.55) - 4);
    label.setAttribute("class", "locate-mark-label lookup");
    label.textContent = `${GannSquare.formatNumber(cell.value)} · 反查`;
    els.pathOverlay.appendChild(label);
  }

  function updateProjectPanel(proj) {
    if (!els.projectResult) return;
    if (!proj || !proj.ok) {
      els.projectResult.classList.add("hidden");
      return;
    }
    els.projectResult.classList.remove("hidden");
    els.projectSecret.textContent = proj.secretLine;

    const starPrices = new Set();
    if (state.pathResult && state.pathResult.steps) {
      state.pathResult.steps.forEach((s) => starPrices.add(s.price));
    }

    els.projectChips.innerHTML = "";
    proj.display.forEach((prices, segIdx) => {
      prices.forEach((price) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "project-chip";
        if (starPrices.has(price)) btn.classList.add("star");
        if (state.projectActivePrice === price) btn.classList.add("active");
        btn.innerHTML = `<span class="chip-seg">${segIdx + 1}</span>${GannSquare.formatNumber(price)}`;
        btn.addEventListener("click", () => {
          state.projectActivePrice = price;
          const hit = GannSquare.findNearest(state.square, price);
          if (hit.cell) {
            locateCell(hit.cell, "project");
            updateProjectPanel(state.projectResult);
          } else {
            updateProjectPanel(state.projectResult);
            redrawPathAndProject();
          }
        });
        els.projectChips.appendChild(btn);
      });
    });
  }

  function redrawPathAndProject() {
    if (shouldShowConstellateLayers() && state.pathResult) drawPathOverlay(state.pathResult);
    else {
      clearPathOverlay();
      preparePathOverlaySize();
      if (shouldShowConstellateLayers()) {
        drawProjectOverlay();
        drawLocateOverlay();
      } else {
        drawLocateOverlay();
      }
    }
    redrawDrawLayer();
    redrawPinwheelLayer();
  }

  function currentPathMethod() {
    const checked = document.querySelector('input[name="pathMethod"]:checked');
    return checked ? checked.value : state.pathMethod || "constellate";
  }

  function shouldShowConstellateLayers() {
    return currentPathMethod() === "constellate" || !!(els.pathOverlayCompare && els.pathOverlayCompare.checked);
  }

  function shouldShowPinwheelLayer() {
    return (
      state.pinwheel.enabled &&
      (currentPathMethod() === "pinwheel" || !!(els.pathOverlayCompare && els.pathOverlayCompare.checked))
    );
  }

  function syncPathMethodUi() {
    state.pathMethod = currentPathMethod();
    const isPin = state.pathMethod === "pinwheel";
    if (els.constellateControls) els.constellateControls.classList.toggle("hidden", isPin);
    if (els.pinwheelControls) els.pinwheelControls.classList.toggle("hidden", !isPin);
    updatePinwheelHints();
  }

  function updatePinwheelHints() {
    if (!els.pinwheelAnchorHint) return;
    const rings = clampRings(els.rings.value);
    const anchors = GannPinwheel.anchorUserRings(rings);
    els.pinwheelAnchorHint.textContent = anchors.length
      ? `锚点环：${anchors.join(", ")}（总环数 ${rings}）`
      : `锚点环：—（总环数 ${rings}，需 ≥ 3）`;
  }

  function syncPinwheelStyleUi() {
    if (!state.pinwheel || !state.pinwheel.styles) return;
    const { frame, blade } = state.pinwheel.styles;
    const dashLabel = (d) => (d === "dash" ? "┅" : d === "dot" ? "···" : "═");
    if (els.pinFrameSwatch) els.pinFrameSwatch.setAttribute("fill", frame.color);
    if (els.pinBladeSwatch) els.pinBladeSwatch.setAttribute("fill", blade.color);
    if (els.btnPinFrameDash) els.btnPinFrameDash.textContent = dashLabel(frame.dash);
    if (els.btnPinBladeDash) els.btnPinBladeDash.textContent = dashLabel(blade.dash);
    if (els.btnPinFrameWidth) els.btnPinFrameWidth.textContent = String(frame.width);
    if (els.btnPinBladeWidth) els.btnPinBladeWidth.textContent = String(blade.width);
    document.querySelectorAll(".swatch.pinwheel-frame").forEach((el) => {
      el.style.background = `repeating-linear-gradient(90deg, ${frame.color} 0 4px, transparent 4px 7px)`;
    });
    document.querySelectorAll(".swatch.pinwheel-blade").forEach((el) => {
      el.style.background = `linear-gradient(135deg, transparent 45%, ${blade.color} 45%, ${blade.color} 55%, transparent 55%)`;
    });
  }

  function persistPinwheelStyles() {
    GannPinwheel.saveStyles(state.pinwheel.styles);
    syncPinwheelStyleUi();
    if (state.pinwheel.enabled) redrawPinwheelLayer();
  }

  function openPinColorPop(kind, anchorBtn) {
    if (!els.pinColorPop) return;
    state.pinColorTarget = kind;
    els.pinColorPop.innerHTML = "";
    const current = state.pinwheel.styles[kind].color;
    GannPinwheel.COLORS.forEach((color) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.style.background = color;
      btn.title = color;
      if (color === current) btn.classList.add("on");
      btn.addEventListener("click", () => {
        state.pinwheel.styles[kind].color = color;
        els.pinColorPop.classList.add("hidden");
        persistPinwheelStyles();
      });
      els.pinColorPop.appendChild(btn);
    });
    els.pinColorPop.classList.remove("hidden");
  }

  function syncPinwheelFromUi() {
    if (!state.pinwheel) return;
    if (els.pinwheelShowFrame) state.pinwheel.showFrame = els.pinwheelShowFrame.checked;
    if (els.pinwheelShowBlades) state.pinwheel.showBlades = els.pinwheelShowBlades.checked;
    if (els.pinwheelShowLabels) state.pinwheel.showAnchorLabels = els.pinwheelShowLabels.checked;
  }

  function redrawPinwheelLayer() {
    if (!els.pinwheelOverlay || !state.square) return;
    syncPinwheelFromUi();
    const drawState = {
      ...state.pinwheel,
      enabled: shouldShowPinwheelLayer(),
    };
    const model = GannPinwheel.render(drawState, {
      overlay: els.pinwheelOverlay,
      squareEl: els.square,
      stackEl: els.squareStack,
      square: state.square,
    });
    if (els.pinwheelSummary && state.pinwheel.enabled && model) {
      els.pinwheelSummary.textContent = model.label;
    }
    updatePinwheelHints();
  }

  function enablePinwheelScaffold(announce) {
    state.pinwheel.enabled = true;
    if (els.hlCross) els.hlCross.checked = true;
    if (els.hlDiag) els.hlDiag.checked = true;
    redrawPinwheelLayer();
    scheduleRender();
    if (announce) showToast("风车架构已绘制");
  }

  function clearPinwheelScaffold() {
    state.pinwheel.enabled = false;
    if (els.pinwheelOverlay) els.pinwheelOverlay.innerHTML = "";
    if (els.pinwheelSummary) els.pinwheelSummary.textContent = "尚未绘制风车架构";
    updatePinwheelHints();
    showToast("已清除风车层");
  }

  function redrawDrawLayer() {
    if (!els.drawOverlay || !state.square) return;
    GannDraw.render(state.draw, {
      overlay: els.drawOverlay,
      squareEl: els.square,
      stackEl: els.squareStack,
      square: state.square,
    });
    updateDrawHud();
  }

  function updateDrawHud() {
    if (!els.drawHud) return;
    if (!state.draw.enabled) {
      els.drawHud.classList.add("hidden");
      return;
    }
    const toolNames = {
      select: "选择",
      line: "直线",
      polyline: "折线",
      marker: "圆标",
      eraser: "橡皮",
    };
    const angle = GannDraw.ANGLE_LABEL[state.draw.angleMode] || state.draw.angleMode;
    const n = state.draw.objects.length;
    const draftNote = state.draw.draft
      ? ` · 草稿${state.draw.draft.points.length}点`
      : "";
    els.drawHud.textContent = `${toolNames[state.draw.tool] || state.draw.tool} · ${angle} · ${state.draw.style.color} · ${n}条${draftNote}`;
    els.drawHud.classList.remove("hidden");
  }

  function syncDrawToolbar() {
    const d = state.draw;
    if (els.btnDrawToggle) {
      els.btnDrawToggle.setAttribute("aria-pressed", d.enabled ? "true" : "false");
    }
    if (els.drawToolbar) {
      els.drawToolbar.classList.toggle("is-active", d.enabled);
      els.drawToolbar.classList.toggle("is-collapsed", !d.toolbarExpanded);
    }
    if (els.btnDrawCollapse) {
      els.btnDrawCollapse.textContent = d.toolbarExpanded ? "«" : "»";
      els.btnDrawCollapse.title = d.toolbarExpanded ? "收缩工具条" : "展开工具条";
    }
    document.querySelectorAll("[data-draw-tool]").forEach((btn) => {
      btn.classList.toggle("on", d.enabled && btn.dataset.drawTool === d.tool);
    });
    if (els.btnDrawAngle) {
      els.btnDrawAngle.textContent = `∠${GannDraw.ANGLE_LABEL[d.angleMode] || d.angleMode}`;
    }
    if (els.drawColorSwatch) els.drawColorSwatch.setAttribute("fill", d.style.color);
    if (els.btnDrawDash) {
      els.btnDrawDash.textContent =
        d.style.dash === "dash" ? "┅" : d.style.dash === "dot" ? "···" : "═";
    }
    if (els.btnDrawWidth) els.btnDrawWidth.textContent = String(d.style.width);
    if (els.square) els.square.classList.toggle("draw-mode", d.enabled);
    updateDrawHud();
    updateDrawAnchorHints();
  }

  function updateDrawAnchorHints() {
    if (!els.square || !state.square) return;
    els.square.querySelectorAll(".cell.draw-forbidden, .cell.draw-anchor").forEach((el) => {
      el.classList.remove("draw-forbidden", "draw-anchor");
    });
    if (!state.draw.enabled || !state.draw.draft || !state.draw.draft.points.length) return;
    if (state.draw.tool !== "line" && state.draw.tool !== "polyline") return;
    const last = state.draw.draft.points[state.draw.draft.points.length - 1];
    const anchor = els.square.querySelector(`[data-row="${last.row}"][data-col="${last.col}"]`);
    if (anchor) anchor.classList.add("draw-anchor");
    if (state.draw.angleMode === "free") return;
    const size = state.square.size;
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (r === last.row && c === last.col) continue;
        const cell = state.square.meta[r][c];
        if (GannDraw.isAllowedByAngle(state.square, last, cell, state.draw.angleMode)) continue;
        const el = els.square.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (el) el.classList.add("draw-forbidden");
      }
    }
  }

  function finishDrawDraft(announce) {
    const obj = GannDraw.commitDraft(state.draw);
    if (obj) {
      GannDraw.save(state.draw);
      if (announce) showToast("已完成一段折线");
    }
    redrawDrawLayer();
    syncDrawToolbar();
  }

  function clearDrawTransient() {
    state.draw.selectedId = null;
    state.draw.draft = null;
    state.draw.hoverCell = null;
    if (els.square) {
      els.square.querySelectorAll(".cell.draw-forbidden, .cell.draw-anchor").forEach((el) => {
        el.classList.remove("draw-forbidden", "draw-anchor");
      });
      els.square.querySelectorAll(".cell.selected").forEach((el) => el.classList.remove("selected"));
    }
    state.selectedKey = null;
  }

  function handleDrawCellClick(cell, ev) {
    if (!state.draw.enabled) return false;
    const tool = state.draw.tool;

    if (tool === "select") {
      const marker = GannDraw.findMarkerAt(state.draw, cell.row, cell.col);
      state.draw.selectedId = marker ? marker.id : null;
      els.square.querySelectorAll(".cell.selected").forEach((el) => el.classList.remove("selected"));
      state.selectedKey = null;
      updateReadout(cell);
      redrawDrawLayer();
      return true;
    }

    if (tool === "eraser") {
      const marker = GannDraw.findMarkerAt(state.draw, cell.row, cell.col);
      if (marker) {
        GannDraw.deleteObject(state.draw, marker.id);
        GannDraw.save(state.draw);
        showToast("已删除");
        redrawDrawLayer();
        return true;
      }
      if (state.draw.selectedId) {
        GannDraw.deleteSelected(state.draw);
        GannDraw.save(state.draw);
        showToast("已删除");
        redrawDrawLayer();
        return true;
      }
      return true;
    }

    if (tool === "marker") {
      // Ignore multi-click / double-fire from the same gesture
      if (ev && ev.detail > 1) return true;
      const mKey = `${Number(cell.row)}:${Number(cell.col)}`;
      const now = Date.now();
      if (
        state.draw._lastMarkerClick &&
        state.draw._lastMarkerClick.key === mKey &&
        now - state.draw._lastMarkerClick.t < 280
      ) {
        return true;
      }
      state.draw._lastMarkerClick = { key: mKey, t: now };
      const before = GannDraw.findMarkersAt(state.draw, cell.row, cell.col).length;
      const res = GannDraw.toggleMarker(state.draw, cell);
      const after = GannDraw.findMarkersAt(state.draw, cell.row, cell.col).length;
      // Hard invariant: a cell never holds more than one marker
      if (after > 1) {
        GannDraw.sanitizeDrawState(state.draw);
      }
      GannDraw.save(state.draw);
      updateReadout(cell);
      redrawDrawLayer();
      syncDrawToolbar();
      showToast(
        res.removed
          ? `已取消圆标 ${cell.display}`
          : before > 0
            ? `圆标已重置 ${cell.display}`
            : `圆标 ${cell.display}`
      );
      return true;
    }

    if (tool === "line" || tool === "polyline") {
      if (ev && ev.detail > 1 && tool === "polyline" && state.draw.draft) {
        finishDrawDraft(true);
        return true;
      }
      if (!state.draw.draft) {
        GannDraw.beginDraft(state.draw, cell, tool);
        selectCell(cell, { keepLocate: true });
        redrawDrawLayer();
        syncDrawToolbar();
        showToast(tool === "line" ? "直线：再点终点" : "折线：继续点格，双击结束");
        return true;
      }
      const res = GannDraw.addPointToDraft(state.draw, state.square, cell);
      if (!res.ok) {
        if (res.reason === "angle") showToast(`当前角度 ${GannDraw.ANGLE_LABEL[state.draw.angleMode]} 不允许该落点`);
        return true;
      }
      selectCell(cell, { keepLocate: true });
      if (tool === "line") {
        finishDrawDraft(false);
        showToast("直线已绘制");
      } else {
        GannDraw.save(state.draw);
        redrawDrawLayer();
        syncDrawToolbar();
      }
      return true;
    }
    return false;
  }

  function buildColorPopover() {
    if (!els.drawColorPop) return;
    els.drawColorPop.innerHTML = "";
    GannDraw.COLORS.forEach((color) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.style.background = color;
      btn.title = color;
      if (color === state.draw.style.color) btn.classList.add("on");
      btn.addEventListener("click", () => {
        state.draw.style.color = color;
        els.drawColorPop.classList.add("hidden");
        GannDraw.save(state.draw);
        syncDrawToolbar();
        redrawDrawLayer();
      });
      els.drawColorPop.appendChild(btn);
    });
  }

  function bindDrawUi() {
    if (!els.btnDrawToggle) return;
    const drawMigration = GannDraw.loadInto(state.draw);
    buildColorPopover();
    syncDrawToolbar();
    if (drawMigration.merged > 0) {
      showToast(`已合并 ${drawMigration.merged} 个叠层圆标`);
    }

    els.btnDrawToggle.addEventListener("click", () => {
      state.draw.enabled = !state.draw.enabled;
      if (!state.draw.enabled) {
        state.draw.draft = null;
        state.draw.hoverCell = null;
        if (els.drawColorPop) els.drawColorPop.classList.add("hidden");
      } else if (!state.draw.toolbarExpanded) {
        state.draw.toolbarExpanded = true;
      }
      GannDraw.save(state.draw);
      syncDrawToolbar();
      redrawDrawLayer();
      showToast(
        state.draw.enabled
          ? "画笔已开启：请在方阵格子上点击绘制"
          : "画笔已关闭"
      );
    });

    document.querySelectorAll("[data-draw-tool]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!state.draw.enabled) {
          state.draw.enabled = true;
        }
        if (state.draw.draft && state.draw.tool === "polyline") finishDrawDraft(true);
        const next = btn.dataset.drawTool;
        if (next !== state.draw.tool) clearDrawTransient();
        state.draw.tool = next;
        state.draw.draft = null;
        GannDraw.save(state.draw);
        syncDrawToolbar();
        redrawDrawLayer();
      });
    });

    els.btnDrawAngle.addEventListener("click", () => {
      state.draw.angleMode = GannDraw.cycleAngle(state.draw.angleMode);
      GannDraw.save(state.draw);
      syncDrawToolbar();
      redrawDrawLayer();
      showToast(`画线角度：${GannDraw.ANGLE_LABEL[state.draw.angleMode]}`);
    });

    els.btnDrawColor.addEventListener("click", (ev) => {
      ev.stopPropagation();
      buildColorPopover();
      els.drawColorPop.classList.toggle("hidden");
    });

    els.btnDrawDash.addEventListener("click", () => {
      const order = ["solid", "dash", "dot"];
      const i = order.indexOf(state.draw.style.dash);
      state.draw.style.dash = order[(i + 1) % order.length];
      GannDraw.save(state.draw);
      syncDrawToolbar();
      redrawDrawLayer();
    });

    els.btnDrawWidth.addEventListener("click", () => {
      const order = [1, 2, 3, 4];
      const i = order.indexOf(state.draw.style.width);
      state.draw.style.width = order[(i + 1) % order.length];
      GannDraw.save(state.draw);
      syncDrawToolbar();
      redrawDrawLayer();
    });

    els.btnDrawUndo.addEventListener("click", () => {
      if (state.draw.draft) {
        state.draw.draft = null;
        redrawDrawLayer();
        syncDrawToolbar();
        showToast("已取消草稿");
        return;
      }
      if (GannDraw.undo(state.draw)) {
        GannDraw.save(state.draw);
        redrawDrawLayer();
        syncDrawToolbar();
        showToast("已撤销");
      }
    });

    els.btnDrawClear.addEventListener("click", () => {
      if (GannDraw.clearAll(state.draw)) {
        GannDraw.save(state.draw);
        redrawDrawLayer();
        syncDrawToolbar();
        showToast("批注已清空");
      }
    });

    els.btnDrawCollapse.addEventListener("click", () => {
      state.draw.toolbarExpanded = !state.draw.toolbarExpanded;
      GannDraw.save(state.draw);
      syncDrawToolbar();
    });

    if (els.drawOverlay) {
      els.drawOverlay.addEventListener("click", (ev) => {
        if (!state.draw.enabled) return;
        const target = ev.target.closest("[data-id]");
        if (!target) return;
        const id = target.dataset.id;
        if (state.draw.tool === "eraser") {
          GannDraw.deleteObject(state.draw, id);
          GannDraw.save(state.draw);
          showToast("已删除");
          redrawDrawLayer();
          return;
        }
        state.draw.tool = "select";
        state.draw.selectedId = id;
        if (els.square) {
          els.square.querySelectorAll(".cell.selected").forEach((el) => el.classList.remove("selected"));
        }
        state.selectedKey = null;
        syncDrawToolbar();
        redrawDrawLayer();
      });
    }

    document.addEventListener("keydown", (ev) => {
      if (ev.target && ["INPUT", "TEXTAREA", "SELECT"].includes(ev.target.tagName)) return;
      if (ev.key === "Escape") {
        if (state.draw.draft) {
          state.draw.draft = null;
          redrawDrawLayer();
          syncDrawToolbar();
          showToast("已取消草稿");
          ev.preventDefault();
          return;
        }
        if (state.draw.enabled) {
          state.draw.enabled = false;
          GannDraw.save(state.draw);
          syncDrawToolbar();
          redrawDrawLayer();
          showToast("画笔已关闭");
          ev.preventDefault();
        }
        return;
      }
      if (!state.draw.enabled && ev.key.toLowerCase() !== "d") return;
      if (ev.key.toLowerCase() === "d" && !ev.metaKey && !ev.ctrlKey) {
        state.draw.enabled = !state.draw.enabled;
        GannDraw.save(state.draw);
        syncDrawToolbar();
        redrawDrawLayer();
        showToast(state.draw.enabled ? "画笔已开启" : "画笔已关闭");
        ev.preventDefault();
        return;
      }
      if (!state.draw.enabled) return;
      if (ev.key.toLowerCase() === "a") {
        state.draw.angleMode = GannDraw.cycleAngle(state.draw.angleMode);
        GannDraw.save(state.draw);
        syncDrawToolbar();
        redrawDrawLayer();
        showToast(`画线角度：${GannDraw.ANGLE_LABEL[state.draw.angleMode]}`);
        ev.preventDefault();
      } else if (ev.key === "Enter" && state.draw.draft && state.draw.tool === "polyline") {
        finishDrawDraft(true);
        ev.preventDefault();
      } else if ((ev.key === "Delete" || ev.key === "Backspace") && state.draw.selectedId) {
        GannDraw.deleteSelected(state.draw);
        GannDraw.save(state.draw);
        redrawDrawLayer();
        showToast("已删除");
        ev.preventDefault();
      } else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") {
        if (GannDraw.undo(state.draw)) {
          GannDraw.save(state.draw);
          redrawDrawLayer();
          syncDrawToolbar();
          showToast("已撤销");
        }
        ev.preventDefault();
      }
    });

    document.addEventListener("click", (ev) => {
      if (!els.drawColorPop || els.drawColorPop.classList.contains("hidden")) return;
      if (ev.target.closest("#btnDrawColor") || ev.target.closest("#drawColorPop")) return;
      els.drawColorPop.classList.add("hidden");
    });
  }

  function updatePathTable(result) {
    if (!result || !result.ok) {
      els.pathResult.classList.add("hidden");
      els.pathMinibar.classList.add("hidden");
      els.pathSummary.textContent = "尚未跑图";
      return;
    }

    els.pathResult.classList.remove("hidden");
    const prices = result.steps.map((s) => GannSquare.formatNumber(s.price)).join(" → ");
    const snapNote = result.snapped
      ? `（输入 ${GannSquare.formatNumber(result.targetRaw)} → 落点 ${GannSquare.formatNumber(result.targetPrice)}）`
      : "";
    els.pathResultSummary.textContent = `${LABEL_PATH_LINE} · ${prices} · ${result.reached ? "已到达" : "未到达"} · ${result.steps.length - 1} 步${snapNote}`;
    els.pathSummary.textContent = result.message;
    updateMinibarFromState();

    els.pathTableBody.innerHTML = "";
    result.steps.forEach((s, i) => {
      const tr = document.createElement("tr");
      if (state.pathActiveStep === i) tr.classList.add("active");
      tr.innerHTML = `
        <td class="mono">${i}</td>
        <td class="mono">${GannSquare.formatNumber(s.price)}</td>
        <td>${moveLabel(s.move)}</td>
        <td><button type="button" class="btn ghost compact" data-focus="${i}">定位</button></td>
      `;
      tr.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        focusPathStep(i);
      });
      tr.querySelector("button").addEventListener("click", (e) => {
        e.stopPropagation();
        focusPathStep(i);
      });
      els.pathTableBody.appendChild(tr);
    });

    const mini = result.steps.map((s) => GannSquare.formatNumber(s.price)).join(" → ");
    els.pathMinibarText.textContent = `${LABEL_PATH_LINE} · ${mini}${result.reached ? " ✓" : ""}`;
    const collapsed = state.leftCollapsed || state.rightCollapsed;
    els.pathMinibar.classList.toggle("hidden", !collapsed || !result.ok);
  }

  function focusPathStep(index) {
    if (!state.pathResult) return;
    state.pathActiveStep = index;
    const step = state.pathResult.steps[index];
    if (step) {
      selectCell(step.cell);
      const el = els.square.querySelector(`[data-row="${step.cell.row}"][data-col="${step.cell.col}"]`);
      if (el) el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    }
    drawPathOverlay(state.pathResult);
    updatePathTable(state.pathResult);
  }

  function animatePath(result) {
    clearTimeout(state.pathDrawTimer);
    let i = 0;
    const tick = () => {
      drawPathOverlay(result, i);
      if (i < result.steps.length - 1) {
        i += 1;
        state.pathDrawTimer = setTimeout(tick, 180);
      } else {
        drawPathOverlay(result);
      }
    };
    tick();
  }

  function runPathFlow() {
    if (state.mode !== "price") {
      showToast("请先切换到价格模式");
      return;
    }
    const start = Number(els.pathStart.value);
    const target = Number(els.pathTarget.value);
    if (!Number.isFinite(start) || !Number.isFinite(target)) {
      showToast("请输入有效起点与目标");
      return;
    }

    const sync = syncPathDirectionFromPrices();
    if (sync.same) {
      updateSnapHint();
      showToast("起点与目标相同，无法判定方向，请调整高低点");
      return;
    }

    if (els.pathAutoExpand.checked) {
      if (ensureRingsForPath(start, target)) render();
    }

    updateSnapHint();

    const mode = pathOutputMode();
    const wantLine = mode === "line" || mode === "both";
    const wantProject = mode === "project" || mode === "both";
    const segCap = GannProject.PROJ_SEG_MAX || 40;
    const userSegments = Math.max(2, Math.min(segCap, Number(els.pathSegments?.value) || 4));
    let segments = userSegments;
    let segmentAdaptNote = null;

    if (wantProject && els.pathAutoSegments?.checked) {
      const resolved = GannProject.resolveProjectionSegments(state.square, {
        start,
        target,
        direction: sync.direction,
        userSegments,
      });
      segments = resolved.effective;
      if (resolved.adapted) {
        els.pathSegments.value = String(segments);
        segmentAdaptNote = `推演段数已由 ${userSegments} 自动调整为 ${segments}`;
      }
      if (!resolved.complete) {
        segmentAdaptNote = segmentAdaptNote
          ? `${segmentAdaptNote}；已扩至 ${segments} 段仍未触及目标，请增大环数或检查起终点`
          : `推演已扩至 ${segments} 段仍未触及目标，请增大环数或检查起终点`;
      }
    }

    clearTimeout(state.pathDrawTimer);
    state.pathResult = null;
    state.projectResult = null;
    state.pathActiveStep = null;
    state.projectActivePrice = null;
    clearLocateHighlight();
    clearPathOverlay();
    updatePathTable(null);
    updateProjectPanel(null);

    if (wantProject) {
      const proj = GannProject.runProjection(state.square, {
        start,
        target,
        direction: sync.direction,
        segments,
      });
      if (!proj.ok) {
        showToast(proj.message || "推演失败");
        return;
      }
      state.projectResult = proj;
      updateProjectPanel(proj);
    }

    if (wantLine) {
      const result = GannPath.runPath(state.square, {
        start,
        target,
        direction: sync.direction,
      });
      if (!result.ok) {
        showToast(result.message || "跑图失败");
        if (state.projectResult) redrawPathAndProject();
        return;
      }
      state.pathResult = result;
      updatePathTable(result);
      if (els.pathCollapsePanels.checked) {
        setPanelCollapsed("left", true);
        setPanelCollapsed("right", true);
      }
      els.hlCross.checked = true;
      els.hlDiag.checked = true;
      animatePath(result);
      const first = result.steps[0];
      if (first) {
        const el = els.square.querySelector(
          `[data-row="${first.cell.row}"][data-col="${first.cell.col}"]`
        );
        if (el) el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
      }
    } else if (state.projectResult) {
      if (els.pathCollapsePanels.checked) {
        setPanelCollapsed("left", true);
        setPanelCollapsed("right", true);
      }
      els.hlCross.checked = true;
      els.hlDiag.checked = true;
      redrawPathAndProject();
      updateMinibarFromState();
    }

    if (state.projectResult) {
      updateProjectPanel(state.projectResult);
    }
    updateMinibarFromState();

    if (state.projectResult && !state.pathResult) {
      els.pathSummary.textContent = state.projectResult.secretLine;
    } else if (state.pathResult && state.projectResult) {
      els.pathSummary.textContent = `${state.pathResult.message} · 推演已生成`;
    }

    const toastBits = [];
    if (wantLine) toastBits.push(state.pathResult?.reached ? "单线完成" : "单线结束");
    if (wantProject) {
      if (segmentAdaptNote) toastBits.push(segmentAdaptNote);
      else toastBits.push("推演完成");
    }
    showToast(toastBits.join(" · ") || "完成");
  }

  function updateMinibarFromState() {
    if (!els.pathMinibar) return;
    const parts = [];
    if (state.pathResult?.ok) {
      const line = state.pathResult.steps.map((s) => GannSquare.formatNumber(s.price)).join(" → ");
      parts.push(`${LABEL_PATH_LINE} · ${line}${state.pathResult.reached ? " ✓" : ""}`);
    }
    if (state.projectResult?.ok) {
      parts.push(`${LABEL_PROJECT_FULL} · ${state.projectResult.segments}段`);
    }
    if (!parts.length) {
      els.pathMinibar.classList.add("hidden");
      return;
    }
    els.pathMinibar.classList.remove("hidden");
    els.pathMinibarText.textContent = parts.join(" · ");
  }

  function clearPath() {
    clearTimeout(state.pathDrawTimer);
    state.pathResult = null;
    state.projectResult = null;
    state.pathActiveStep = null;
    state.projectActivePrice = null;
    clearLocateHighlight();
    clearPathOverlay();
    updatePathTable(null);
    updateProjectPanel(null);
    els.pathMinibar.classList.add("hidden");
    showToast("已清除路径与推演");
  }

  async function copyPath() {
    if (!state.pathResult) return;
    const text = `${LABEL_PATH_LINE} · ${state.pathResult.steps
      .map((s) => GannSquare.formatNumber(s.price))
      .join(" → ")}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("角十角路径已复制");
    } catch (err) {
      showToast("复制失败");
    }
  }

  function exportPathCsv() {
    if (!state.pathResult) return;
    const lines = ["step,price,move,row,col,ring,transform"];
    state.pathResult.steps.forEach((s) => {
      lines.push(
        [s.step, s.price, s.move, s.cell.row, s.cell.col, s.cell.ring, s.transform || ""].join(",")
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gann-path.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("路径 CSV 已导出");
  }

  function resetAll() {
    applyParams({
      mode: "price",
      begin: 1,
      step: 1,
      rings: 6,
      beginDate: todayISO(),
      timeUnit: "day",
      rowOffset: 0,
      colOffset: 0,
      hlCross: true,
      hlDiag: true,
      hlSquares: false,
    });
    applyRingsMax(50);
    els.preset.value = "classic";
    state.selectedKey = null;
    state.lookupKey = null;
    clearLocateHighlight();
    state.zoom = 1;
    els.emptyReadout.classList.remove("hidden");
    els.readoutBody.classList.add("hidden");
    els.lookupHint.textContent = "定位最接近的格子与邻近关键位";
    els.pathStart.value = "922";
    els.pathTarget.value = "749";
    clearTimeout(state.pathDrawTimer);
    state.pathResult = null;
    state.projectResult = null;
    state.pathActiveStep = null;
    state.projectActivePrice = null;
    clearPathOverlay();
    updatePathTable(null);
    updateProjectPanel(null);
    els.pathMinibar.classList.add("hidden");
    scheduleRender();
  }

  function bind() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => setMode(tab.dataset.mode));
    });

    ["begin", "step", "rings", "ringsInput", "beginDate", "timeStepUnit", "rowOffset", "colOffset"].forEach((id) => {
      const el = els[id];
      if (!el) return;
      el.addEventListener("input", scheduleRender);
      el.addEventListener("change", scheduleRender);
    });

    els.rings.addEventListener("input", () => {
      syncRingsControls(els.rings.value);
    });

    els.ringsInput.addEventListener("input", () => {
      syncRingsControls(els.ringsInput.value);
    });

    els.ringsInput.addEventListener("change", () => {
      syncRingsControls(els.ringsInput.value);
      scheduleRender();
    });

    els.ringsMax.addEventListener("change", () => {
      applyRingsMax(els.ringsMax.value);
      scheduleRender();
    });

    els.toggleLeft.addEventListener("click", () => {
      togglePanel("left");
      if (state.pathResult) updatePathTable(state.pathResult);
    });
    els.toggleRight.addEventListener("click", () => {
      togglePanel("right");
      if (state.pathResult) updatePathTable(state.pathResult);
    });
    els.reopenLeft.addEventListener("click", () => {
      setPanelCollapsed("left", false);
      if (state.pathResult) updatePathTable(state.pathResult);
    });
    els.reopenRight.addEventListener("click", () => {
      setPanelCollapsed("right", false);
      if (state.pathResult) updatePathTable(state.pathResult);
    });

    ["hlCross", "hlDiag", "hlSquares"].forEach((id) => {
      els[id].addEventListener("change", scheduleRender);
    });

    els.stepChips.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-step]");
      if (!btn) return;
      els.step.value = btn.dataset.step;
      syncStepChips(btn.dataset.step);
      scheduleRender();
    });

    els.preset.addEventListener("change", () => applyPreset(els.preset.value));
    els.btnLookup.addEventListener("click", lookup);
    els.lookupValue.addEventListener("keydown", (e) => {
      if (e.key === "Enter") lookup();
    });
    els.btnReset.addEventListener("click", resetAll);
    els.btnCopyLink.addEventListener("click", copyLink);
    els.btnExportCsv.addEventListener("click", exportCsv);
    els.btnExportPng.addEventListener("click", exportPng);

    els.btnZoomIn.addEventListener("click", () => {
      state.zoom = Math.min(2.2, state.zoom + 0.1);
      scheduleRender();
    });
    els.btnZoomOut.addEventListener("click", () => {
      state.zoom = Math.max(0.5, state.zoom - 0.1);
      scheduleRender();
    });
    els.btnZoomReset.addEventListener("click", () => {
      state.zoom = 1;
      scheduleRender();
    });

    els.btnPathRun.addEventListener("click", runPathFlow);
    els.btnPathClear.addEventListener("click", clearPath);
    els.btnPathCopy.addEventListener("click", copyPath);
    els.btnPathExport.addEventListener("click", exportPathCsv);

    document.querySelectorAll('input[name="pathMethod"]').forEach((el) => {
      el.addEventListener("change", () => {
        syncPathMethodUi();
        if (currentPathMethod() === "pinwheel") {
          enablePinwheelScaffold(false);
        }
        redrawPathAndProject();
      });
    });
    if (els.pathOverlayCompare) {
      els.pathOverlayCompare.addEventListener("change", () => redrawPathAndProject());
    }
    ["pinwheelShowFrame", "pinwheelShowBlades", "pinwheelShowLabels"].forEach((id) => {
      if (!els[id]) return;
      els[id].addEventListener("change", () => {
        if (state.pinwheel.enabled) redrawPinwheelLayer();
      });
    });
    if (els.btnPinwheelDraw) {
      els.btnPinwheelDraw.addEventListener("click", () => enablePinwheelScaffold(true));
    }
    if (els.btnPinwheelClear) {
      els.btnPinwheelClear.addEventListener("click", clearPinwheelScaffold);
    }
    if (els.btnPinFrameColor) {
      els.btnPinFrameColor.addEventListener("click", (ev) => {
        ev.stopPropagation();
        openPinColorPop("frame");
      });
    }
    if (els.btnPinBladeColor) {
      els.btnPinBladeColor.addEventListener("click", (ev) => {
        ev.stopPropagation();
        openPinColorPop("blade");
      });
    }
    if (els.btnPinFrameDash) {
      els.btnPinFrameDash.addEventListener("click", () => {
        state.pinwheel.styles.frame.dash = GannPinwheel.cycleDash(state.pinwheel.styles.frame.dash);
        persistPinwheelStyles();
      });
    }
    if (els.btnPinBladeDash) {
      els.btnPinBladeDash.addEventListener("click", () => {
        state.pinwheel.styles.blade.dash = GannPinwheel.cycleDash(state.pinwheel.styles.blade.dash);
        persistPinwheelStyles();
      });
    }
    if (els.btnPinFrameWidth) {
      els.btnPinFrameWidth.addEventListener("click", () => {
        state.pinwheel.styles.frame.width = GannPinwheel.cycleWidth(state.pinwheel.styles.frame.width);
        persistPinwheelStyles();
      });
    }
    if (els.btnPinBladeWidth) {
      els.btnPinBladeWidth.addEventListener("click", () => {
        state.pinwheel.styles.blade.width = GannPinwheel.cycleWidth(state.pinwheel.styles.blade.width);
        persistPinwheelStyles();
      });
    }
    if (els.btnPinStyleReset) {
      els.btnPinStyleReset.addEventListener("click", () => {
        GannPinwheel.resetStyles(state.pinwheel);
        syncPinwheelStyleUi();
        if (state.pinwheel.enabled) redrawPinwheelLayer();
        showToast("风车样式已恢复默认");
      });
    }
    document.addEventListener("click", (ev) => {
      if (!els.pinColorPop || els.pinColorPop.classList.contains("hidden")) return;
      if (ev.target.closest("#btnPinFrameColor") || ev.target.closest("#btnPinBladeColor") || ev.target.closest("#pinColorPop")) {
        return;
      }
      els.pinColorPop.classList.add("hidden");
    });
    if (els.rings) {
      els.rings.addEventListener("input", () => {
        updatePinwheelHints();
        if (state.pinwheel.enabled) {
          /* full render will refresh pinwheel via rAF */
        }
      });
    }
    if (els.btnProjectCopy) {
      els.btnProjectCopy.addEventListener("click", async () => {
        if (!state.projectResult?.secretLine) return;
        try {
          await navigator.clipboard.writeText(state.projectResult.secretLine);
          showToast("完整 Constellate 已复制");
        } catch (err) {
          showToast("复制失败");
        }
      });
    }
    els.btnPathExpandPanels.addEventListener("click", () => {
      setPanelCollapsed("left", false);
      setPanelCollapsed("right", false);
      if (state.pathResult) updatePathTable(state.pathResult);
    });
    els.pathTarget.addEventListener("input", updateSnapHint);
    els.pathTarget.addEventListener("change", updateSnapHint);
    els.pathStart.addEventListener("input", updateSnapHint);
    els.pathStart.addEventListener("change", updateSnapHint);
    document.querySelectorAll('input[name="pathDir"]').forEach((el) => {
      el.addEventListener("change", updateSnapHint);
    });
    ["pathLabelIndex", "pathLabelPrice", "pathProjectDots"].forEach((id) => {
      if (!els[id]) return;
      els[id].addEventListener("change", () => {
        redrawPathAndProject();
      });
    });
    window.addEventListener("resize", () => {
      redrawPathAndProject();
    });
    bindDrawUi();
  }

  function init() {
    els.beginDate.value = todayISO();
    loadPrefs();
    applyPanelWidths();
    applyRingsMax(state.ringsMax);
    setPanelCollapsed("left", state.leftCollapsed);
    setPanelCollapsed("right", state.rightCollapsed);
    bind();
    bindPanelResizers();
    const fromUrl = loadUrlState();
    if (!fromUrl) applyParams({ mode: "price", begin: 1, step: 1, rings: 6 });
    syncPathMethodUi();
    GannPinwheel.loadStylesInto(state.pinwheel);
    syncPinwheelStyleUi();
    render();
    updateSnapHint();
    syncDrawToolbar();
    redrawDrawLayer();
  }

  init();
})();
