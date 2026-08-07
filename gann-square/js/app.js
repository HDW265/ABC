(function () {
  const $ = (id) => document.getElementById(id);

  const els = {
    preset: $("preset"),
    begin: $("begin"),
    step: $("step"),
    rings: $("rings"),
    ringsLabel: $("ringsLabel"),
    sizeHint: $("sizeHint"),
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
  };

  const state = {
    mode: "price",
    zoom: 1,
    square: null,
    selectedKey: null,
    lookupKey: null,
    renderTimer: null,
  };

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
    const rings = Number(els.rings.value);
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
    if (params.rings != null) {
      els.rings.value = params.rings;
      els.ringsLabel.textContent = String(params.rings);
    }
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
    const rings = Number(els.rings.value);
    const delay = rings > 12 ? 180 : 80;
    state.renderTimer = setTimeout(render, delay);
  }

  function render() {
    const params = readParams();
    if (!Number.isFinite(params.begin)) params.begin = 1;
    if (!Number.isFinite(params.step) || params.step <= 0) params.step = 1;

    const square = GannSquare.generateSquare(params);
    state.square = square;

    const size = square.size;
    els.ringsLabel.textContent = String(params.rings);
    els.sizeHint.textContent = `边长 ${size} × ${size} · 共 ${size * size} 格`;

    els.square.style.gridTemplateColumns = `repeat(${size}, auto)`;
    els.square.innerHTML = "";

    const frag = document.createDocumentFragment();
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const cell = square.meta[r][c];
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cell";
        btn.style.animationDelay = `${Math.min(cell.ring, 8) * 18}ms`;
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

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `gann-square-${size}x${size}.png`;
    a.click();
    showToast("PNG 已导出");
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
    els.preset.value = "classic";
    state.selectedKey = null;
    state.lookupKey = null;
    state.zoom = 1;
    els.emptyReadout.classList.remove("hidden");
    els.readoutBody.classList.add("hidden");
    els.lookupHint.textContent = "定位最接近的格子与邻近关键位";
    scheduleRender();
  }

  function bind() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => setMode(tab.dataset.mode));
    });

    ["begin", "step", "rings", "beginDate", "timeStepUnit", "rowOffset", "colOffset"].forEach((id) => {
      els[id === "timeStepUnit" ? "timeStepUnit" : id].addEventListener("input", scheduleRender);
      els[id === "timeStepUnit" ? "timeStepUnit" : id].addEventListener("change", scheduleRender);
    });

    els.rings.addEventListener("input", () => {
      els.ringsLabel.textContent = els.rings.value;
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
  }

  function init() {
    els.beginDate.value = todayISO();
    bind();
    const fromUrl = loadUrlState();
    if (!fromUrl) applyParams({ mode: "price", begin: 1, step: 1, rings: 6 });
    render();
  }

  init();
})();
