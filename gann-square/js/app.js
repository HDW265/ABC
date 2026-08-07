(function () {
  const $ = (id) => document.getElementById(id);

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
    pathLabelMove: $("pathLabelMove"),
    pathAutoExpand: $("pathAutoExpand"),
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
  };

  const STORAGE_KEY = "gann-square-ui-v1";

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
    pathResult: null,
    pathActiveStep: null,
    pathDrawTimer: null,
  };

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw);
      if (Number.isFinite(prefs.ringsMax)) state.ringsMax = clampRingsMax(prefs.ringsMax);
      if (typeof prefs.leftCollapsed === "boolean") state.leftCollapsed = prefs.leftCollapsed;
      if (typeof prefs.rightCollapsed === "boolean") state.rightCollapsed = prefs.rightCollapsed;
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
      })
    );
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
    if (state.pathResult) {
      const anyCollapsed = state.leftCollapsed || state.rightCollapsed;
      els.pathMinibar.classList.toggle("hidden", !anyCollapsed);
    }
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
    if (!Number.isFinite(params.step) || params.step <= 0) params.step = 1;
    syncRingsControls(params.rings);

    const square = GannSquare.generateSquare(params);
    state.square = square;

    const size = square.size;
    const cellCount = size * size;
    els.sizeHint.textContent = `边长 ${size} × ${size} · 共 ${cellCount.toLocaleString()} 格`;
    updatePerfHint(params.rings, cellCount);

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
        if (state.lookupKey === key) btn.classList.add("lookup-hit");

        // Dim non-highlighted cells when any highlight filter is conceptually "focus mode"
        // Keep subtle: only dim if squares-only emphasis? Skip heavy dimming for clarity.

        btn.addEventListener("click", () => selectCell(cell));
        frag.appendChild(btn);
      }
    }
    els.square.appendChild(frag);

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
      if (state.pathResult) drawPathOverlay(state.pathResult);
      else clearPathOverlay();
    });
  }

  function selectCell(cell) {
    state.selectedKey = cellKey(cell);
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
    document.querySelectorAll(".cell.lookup-hit").forEach((el) => el.classList.remove("lookup-hit"));
    const el = els.square.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
    if (el) {
      el.classList.add("lookup-hit");
      el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    }
    selectCell(cell);
    const maxVal =
      state.mode === "price"
        ? state.square.begin + (state.square.size * state.square.size - 1) * state.square.step
        : state.square.size * state.square.size;
    const minVal = state.mode === "price" ? state.square.begin : 1;
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

  function updateSnapHint() {
    if (!state.square || state.mode !== "price") {
      els.pathSnapHint.textContent = "目标将沿 45°/180° 路径落到最近结构点";
      els.pathSnapHint.classList.remove("snap-on");
      return;
    }
    const start = Number(els.pathStart.value);
    const raw = Number(els.pathTarget.value);
    if (!Number.isFinite(raw) || !Number.isFinite(start)) {
      els.pathSnapHint.textContent = "请输入起点与目标价";
      els.pathSnapHint.classList.remove("snap-on");
      return;
    }
    const preview = GannPath.runPath(state.square, {
      start,
      target: raw,
      direction: pathDirection(),
    });
    if (!preview.ok || !preview.steps.length) {
      els.pathSnapHint.textContent = preview.message || "无法预览路径";
      els.pathSnapHint.classList.remove("snap-on");
      return;
    }
    const end = preview.steps[preview.steps.length - 1].price;
    const diff = Math.abs(end - raw);
    if (diff < 0.5) {
      els.pathSnapHint.textContent = `预计落点 ${GannSquare.formatNumber(end)}`;
      els.pathSnapHint.classList.remove("snap-on");
    } else {
      els.pathSnapHint.textContent = `输入 ${GannSquare.formatNumber(raw)} → 预计落点 ${GannSquare.formatNumber(end)}（差值 ${GannSquare.formatNumber(diff)}）`;
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

  function drawPathOverlay(result, revealUntil) {
    clearPathOverlay();
    if (!result || !result.steps || result.steps.length < 1 || !els.pathOverlay) return;

    const resolved = resolvePathCells(result);
    const steps = resolved.steps;
    const limit = Number.isFinite(revealUntil) ? revealUntil : steps.length - 1;
    const showIndex = els.pathLabelIndex.checked;
    const showPrice = els.pathLabelPrice.checked;
    const showMove = els.pathLabelMove.checked;
    const rings = clampRings(els.rings.value);
    const forceIndexOnly = rings >= 19;
    const allowPrice = showPrice && !forceIndexOnly;
    const allowMove = showMove && rings <= 10;

    const width = els.squareStack.offsetWidth;
    const height = els.squareStack.offsetHeight;
    els.pathOverlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
    els.pathOverlay.setAttribute("width", String(width));
    els.pathOverlay.setAttribute("height", String(height));

    const centers = steps.map((s) => cellCenter(s.cell.row, s.cell.col));
    const ns = "http://www.w3.org/2000/svg";

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
      if (allowMove && !isStart) labels.push(moveLabel(s.move));
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
    els.pathResultSummary.textContent = `${prices} · ${result.reached ? "已到达" : "未到达"} · ${result.steps.length - 1} 步${snapNote}`;
    els.pathSummary.textContent = result.message;

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
    els.pathMinibarText.textContent = `${mini}${result.reached ? " ✓" : ""}`;
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

    if (els.pathAutoExpand.checked) {
      if (ensureRingsForPath(start, target)) render();
    }

    updateSnapHint();

    const result = GannPath.runPath(state.square, {
      start,
      target,
      direction: pathDirection(),
    });

    if (!result.ok) {
      showToast(result.message || "跑图失败");
      return;
    }

    state.pathResult = result;
    state.pathActiveStep = null;

    if (els.pathCollapsePanels.checked) {
      setPanelCollapsed("left", true);
      setPanelCollapsed("right", true);
    }

    els.hlCross.checked = true;
    els.hlDiag.checked = true;

    updatePathTable(result);
    animatePath(result);
    showToast(result.reached ? "跑图完成" : "跑图结束（未完全到达）");

    const first = result.steps[0];
    if (first) {
      const el = els.square.querySelector(`[data-row="${first.cell.row}"][data-col="${first.cell.col}"]`);
      if (el) el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    }
  }

  function clearPath() {
    clearTimeout(state.pathDrawTimer);
    state.pathResult = null;
    state.pathActiveStep = null;
    clearPathOverlay();
    updatePathTable(null);
    els.pathMinibar.classList.add("hidden");
    showToast("已清除路径");
  }

  async function copyPath() {
    if (!state.pathResult) return;
    const text = state.pathResult.steps.map((s) => GannSquare.formatNumber(s.price)).join(" → ");
    try {
      await navigator.clipboard.writeText(text);
      showToast("路径已复制");
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
    state.zoom = 1;
    els.emptyReadout.classList.remove("hidden");
    els.readoutBody.classList.add("hidden");
    els.lookupHint.textContent = "定位最接近的格子与邻近关键位";
    els.pathStart.value = "922";
    els.pathTarget.value = "749";
    clearTimeout(state.pathDrawTimer);
    state.pathResult = null;
    state.pathActiveStep = null;
    clearPathOverlay();
    updatePathTable(null);
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
    ["pathLabelIndex", "pathLabelPrice", "pathLabelMove"].forEach((id) => {
      els[id].addEventListener("change", () => {
        if (state.pathResult) drawPathOverlay(state.pathResult);
      });
    });
    window.addEventListener("resize", () => {
      if (state.pathResult) drawPathOverlay(state.pathResult);
    });
  }

  function init() {
    els.beginDate.value = todayISO();
    loadPrefs();
    applyRingsMax(state.ringsMax);
    setPanelCollapsed("left", state.leftCollapsed);
    setPanelCollapsed("right", state.rightCollapsed);
    bind();
    const fromUrl = loadUrlState();
    if (!fromUrl) applyParams({ mode: "price", begin: 1, step: 1, rings: 6 });
    render();
    updateSnapHint();
  }

  init();
})();
