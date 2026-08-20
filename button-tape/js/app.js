(function () {
  "use strict";

  var Layout = window.ButtonTapeLayout;
  var Draw = window.ButtonTapeDraw;

  var els = {
    width: document.getElementById("width"),
    diameter: document.getElementById("diameter"),
    spacing: document.getElementById("spacing"),
    length: document.getElementById("length"),
    count: document.getElementById("count"),
    status: document.getElementById("status"),
    schemeGrid: document.getElementById("schemeGrid"),
    schemeMeta: document.getElementById("schemeMeta"),
    svg: document.getElementById("tapeSvg"),
    formulaLine: document.getElementById("formulaLine"),
    coordPanel: document.getElementById("coordPanel"),
    coordBody: document.getElementById("coordBody"),
    ex170: document.getElementById("ex170"),
    ex150: document.getElementById("ex150"),
    btnPrint: document.getElementById("btnPrint"),
    btnExportPng: document.getElementById("btnExportPng"),
  };

  var selectedN = 6;
  var lastPlan = null;
  var lastDraw = null;

  function num(el) {
    return parseFloat(String(el.value).trim());
  }

  function currentSpec() {
    return {
      W: num(els.width),
      D: num(els.diameter),
      S: num(els.spacing),
      L: num(els.length),
    };
  }

  function requestedN() {
    var raw = String(els.count.value).trim();
    if (raw === "") return null;
    return parseInt(raw, 10);
  }

  function setChipState() {
    document.querySelectorAll(".chips").forEach(function (row) {
      var id = row.getAttribute("data-target");
      var input = document.getElementById(id);
      var val = String(input.value);
      row.querySelectorAll("button").forEach(function (btn) {
        btn.classList.toggle("on", btn.getAttribute("data-value") === val);
      });
    });
    var L = String(els.length.value);
    els.ex170.classList.toggle("on", L === "170");
    els.ex150.classList.toggle("on", L === "150");
  }

  function applyPreset(kind) {
    els.width.value = "20";
    els.diameter.value = "15";
    els.spacing.value = "30";
    els.count.value = "";
    if (kind === "150") {
      els.length.value = "150";
      selectedN = 5;
    } else {
      els.length.value = "170";
      selectedN = 6;
    }
    render();
  }

  function statusBox(type, text) {
    els.status.className = "status" + (type === "ok" ? "" : " " + type);
    els.status.textContent = text;
  }

  function cardButton(scheme, selected, extraBadge) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "scheme-card" + (selected ? " selected" : "") + (scheme.kind === "custom" ? " custom" : "");
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", selected ? "true" : "false");
    btn.dataset.n = String(scheme.N);
    var badge = extraBadge ? '<span class="badge">' + extraBadge + "</span>" : "";
    btn.innerHTML =
      '<p class="kicker">' +
      scheme.title +
      "</p>" +
      '<p class="title">' +
      scheme.subtitle +
      badge +
      "</p>" +
      '<p class="formula">' +
      scheme.formula +
      "</p>";
    btn.addEventListener("click", function () {
      selectedN = scheme.N;
      els.count.value = String(scheme.N);
      render();
    });
    return btn;
  }

  function renderSchemes(plan, selection) {
    els.schemeGrid.innerHTML = "";
    if (!plan.ok) {
      els.schemeMeta.textContent = "无法生成方案";
      var empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "按左侧提示改规格后，这里会列出可点选的多种排法。";
      els.schemeGrid.appendChild(empty);
      return;
    }
    els.schemeMeta.textContent =
      plan.schemes.length + " 种自动方案 · 最多 " + plan.nMax + " 扣";

    var shown = plan.schemes.slice();
    if (selection.scheme && selection.source === "custom") {
      shown.push(selection.scheme);
    }
    if (!shown.length) {
      var none = document.createElement("p");
      none.className = "hint";
      none.textContent = "没有自动方案。可手填扣数 N 试自定义排法。";
      els.schemeGrid.appendChild(none);
      return;
    }
    shown.forEach(function (sch, idx) {
      var badge = "";
      if (sch.auto && idx === 0) badge = "最多扣";
      if (sch.kind === "custom") badge = "自定义";
      var selected = selection.scheme && selection.scheme.N === sch.N;
      els.schemeGrid.appendChild(cardButton(sch, selected, badge));
    });
  }

  function renderTable(scheme, mode) {
    var show = scheme && (mode === "full-table" || mode === "breakout" || scheme.N > 8);
    els.coordPanel.classList.toggle("hidden", !show);
    els.coordBody.innerHTML = "";
    if (!show) return;
    scheme.buttonXs.forEach(function (x, i) {
      var tr = document.createElement("tr");
      tr.innerHTML = "<td>" + (i + 1) + "</td><td>" + Layout.formatMm(x) + "</td>";
      els.coordBody.appendChild(tr);
    });
  }

  function renderDrawing(spec, scheme) {
    if (!scheme) {
      Draw.render(els.svg, null, null, els.svg.clientWidth);
      els.formulaLine.textContent = "";
      renderTable(null, "empty");
      lastDraw = null;
      return;
    }
    var width = Math.max(els.svg.parentElement.clientWidth || 0, 640);
    lastDraw = Draw.render(els.svg, spec, scheme, width);
    els.formulaLine.textContent = scheme.formula;
    renderTable(scheme, lastDraw.mode);
  }

  function render() {
    setChipState();
    var spec = currentSpec();
    var plan = Layout.plan(spec);
    lastPlan = plan;

    if (!plan.ok) {
      statusBox("err", plan.errors.join("；"));
      renderSchemes(plan, { scheme: null });
      renderDrawing(null, null);
      return;
    }

    var selection = Layout.resolveSelection(plan, requestedN());
    if (selection.scheme) selectedN = selection.scheme.N;

    renderSchemes(plan, selection);

    if (!selection.scheme) {
      statusBox("err", selection.warning || "无法生成图纸");
      renderDrawing(null, null);
      return;
    }

    var leftover = Layout.leftoverMm(selection.scheme.M, spec.D);
    var bits = [
      "当前 " + selection.scheme.N + " 扣",
      "中心止口 " + Layout.formatMm(selection.scheme.M) + " mm",
      "止口位 " + Layout.formatMm(leftover) + " mm",
      "扣径 " + Layout.formatMm(spec.D) + " mm",
    ];
    if (selection.warning) {
      statusBox("warn", bits.join(" · ") + "。" + selection.warning);
    } else {
      statusBox(
        "ok",
        bits.join(" · ") + "。止口位 = 中心到边 − 扣半径；左右均分，中心止口 ≥ 10 mm。"
      );
    }
    renderDrawing(plan.spec, selection.scheme);
  }

  ["width", "diameter", "spacing", "length", "count"].forEach(function (id) {
    els[id].addEventListener("input", render);
  });

  document.querySelectorAll(".chips button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.parentElement.getAttribute("data-target");
      document.getElementById(id).value = btn.getAttribute("data-value");
      render();
    });
  });

  els.ex170.addEventListener("click", function () {
    applyPreset("170");
  });
  els.ex150.addEventListener("click", function () {
    applyPreset("150");
  });
  els.btnPrint.addEventListener("click", function () {
    window.print();
  });
  els.btnExportPng.addEventListener("click", function () {
    var spec = currentSpec();
    var name =
      "button-tape-" +
      Layout.formatMm(spec.L) +
      "mm-" +
      (selectedN || "n") +
      "btn.png";
    Draw.svgToPng(els.svg, name);
  });

  window.addEventListener("resize", function () {
    if (lastPlan && lastPlan.ok) render();
  });

  render();
})();
