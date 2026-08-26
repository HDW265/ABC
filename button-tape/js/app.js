(function () {
  "use strict";

  var Layout = window.ButtonTapeLayout;
  var Draw = window.ButtonTapeDraw;
  var Yardage = window.ButtonTapeYardage;

  var els = {
    width: document.getElementById("width"),
    diameter: document.getElementById("diameter"),
    spacing: document.getElementById("spacing"),
    length: document.getElementById("length"),
    leftoverMin: document.getElementById("leftoverMin"),
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
    contractNo: document.getElementById("contractNo"),
    orderNo: document.getElementById("orderNo"),
    lossPct: document.getElementById("lossPct"),
    cutTol: document.getElementById("cutTol"),
    yardageBody: document.getElementById("yardageBody"),
    yardageTotals: document.getElementById("yardageTotals"),
    yardageFormula: document.getElementById("yardageFormula"),
    btnAddSize: document.getElementById("btnAddSize"),
    btnYardageExample: document.getElementById("btnYardageExample"),
    btnYardageClear: document.getElementById("btnYardageClear"),
    btnExpandSheets: document.getElementById("btnExpandSheets"),
    btnCollapseSheets: document.getElementById("btnCollapseSheets"),
    btnCopyYardage: document.getElementById("btnCopyYardage"),
    btnExportSheets: document.getElementById("btnExportSheets"),
  };

  var selectedN = 5;
  var lastPlan = null;
  var lastDraw = null;
  var lastYardage = null;
  var yardageState = {
    selected: -1,
    expanded: {},
    rows: Yardage.exampleBundle().rows,
  };

  function num(el) {
    return parseFloat(String(el.value).trim());
  }

  function currentSpec() {
    return {
      W: num(els.width),
      D: num(els.diameter),
      S: num(els.spacing),
      L: num(els.length),
      leftoverMin: String(els.leftoverMin.value).trim() === "" ? 10 : num(els.leftoverMin),
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
    els.spacing.value = "30";
    els.count.value = "";
    if (kind === "150") {
      els.length.value = "150";
      selectedN = 5;
    } else {
      els.length.value = "170";
      selectedN = 5;
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
      empty.textContent = "按左侧提示改规格后，这里会列出可裁可车的排法。";
      els.schemeGrid.appendChild(empty);
      return;
    }
    els.schemeMeta.textContent = plan.schemes.length
      ? plan.schemes.length + " 种自动方案 · 最多 " + plan.nMax + " 扣"
      : "0 种可裁可车的自动方案";

    var shown = plan.schemes.slice();
    if (selection.scheme && selection.source === "custom") {
      shown.push(selection.scheme);
    }
    if (!shown.length) {
      var none = document.createElement("p");
      none.className = "hint";
      none.textContent =
        "没有可裁可车的自动方案。裁口不能切过循环扣，止口位须 ≥ " +
        Layout.formatMm(plan.spec.leftoverMin) +
        " mm。可手填扣数 N 查看为何不行。";
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
      refreshYardageComputed();
      return;
    }

    var selection = Layout.resolveSelection(plan, requestedN());
    if (selection.scheme) selectedN = selection.scheme.N;

    renderSchemes(plan, selection);

    if (!selection.scheme) {
      statusBox("err", selection.warning || "无法生成图纸");
      renderDrawing(null, null);
      refreshYardageComputed();
      return;
    }

    var leftover = Layout.leftoverSewableMm(selection.scheme.M, spec.S, spec.D);
    var bits = [
      "当前 " + selection.scheme.N + " 扣",
      "中心止口 " + Layout.formatMm(selection.scheme.M) + " mm",
      "止口位 " + Layout.formatMm(leftover) + " mm",
      "扣径 " + Layout.formatMm(spec.D) + " mm",
    ];
    if (selection.warning) {
      statusBox("warn", bits.join(" · ") + "。" + selection.warning);
    } else {
      var T = Layout.formatMm(plan.spec.leftoverMin);
      var wasteNote = selection.scheme.endsWasted
        ? "不能接下一片：片间废缝 " +
          Layout.formatMm(selection.scheme.wasteSeamMm) +
          " mm，计码含整卷头尾各一段废缝。"
        : "下一循环可接同一规格，计码不加废缝、不加公差。";
      statusBox(
        "ok",
        bits.join(" · ") +
          "。可车缝止口位 ≥ " +
          T +
          " mm。循环扣须整颗在片外。" +
          wasteNote
      );
    }
    renderDrawing(plan.spec, selection.scheme);
    refreshYardageComputed();
  }

  function yardageMeta() {
    return {
      contractNo: els.contractNo.value.trim(),
      orderNo: els.orderNo.value.trim(),
    };
  }

  function tapeOpts() {
    var spec = currentSpec();
    return {
      Layout: Layout,
      W: spec.W,
      D: spec.D,
      S: spec.S,
      leftoverMin: spec.leftoverMin,
      cutTol: String(els.cutTol.value).trim() === "" ? 0 : num(els.cutTol),
      selectedN: requestedN(),
      selectedL: spec.L,
    };
  }

  function currentYardage() {
    return Yardage.summarize(yardageState.rows, els.lossPct.value, tapeOpts());
  }

  function markSelectedRow() {
    if (!els.yardageBody) return;
    Array.prototype.forEach.call(els.yardageBody.querySelectorAll("tr[data-row]"), function (tr) {
      var i = Number(tr.getAttribute("data-row"));
      tr.classList.toggle("selected", i === yardageState.selected);
    });
  }

  function applyRowToLayout(index) {
    var row = yardageState.rows[index];
    if (!row) return;
    var mm = Yardage.lengthMm(row.lengthCm);
    if (!isFinite(mm) || !(mm > 0)) return;
    yardageState.selected = index;
    els.length.value = String(mm);
    els.count.value = "";
    render();
    markSelectedRow();
  }

  function fillSheet(sheetTr, parsed) {
    var pre = sheetTr && sheetTr.querySelector(".worksheet");
    if (!pre) return;
    pre.textContent = parsed && parsed.ok ? Yardage.rowWorksheet(parsed, tapeOpts()) : "";
  }

  function updateRowComputed(tr, row) {
    var parsed = Yardage.parseRow(row, 0);
    var mmCell = tr.querySelector("[data-role=mm]");
    var subCell = tr.querySelector("[data-role=sub]");
    var useCell = tr.querySelector("[data-role=use]");
    var sheetTr = tr.nextElementSibling;
    if (parsed.ok) {
      Yardage.attachPieceUse(parsed, tapeOpts());
      mmCell.textContent = Layout.formatMm(parsed.lengthMm);
      subCell.textContent = Yardage.formatFixed(parsed.subtotalM, 2);
      if (useCell) {
        useCell.textContent =
          Yardage.formatFixed(parsed.useCm / 100, 2) +
          (parsed.endsWasted ? " 含废扣" : "");
      }
      fillSheet(sheetTr, parsed);
    } else if (Yardage.rowIsEmpty(row)) {
      mmCell.textContent = "—";
      subCell.textContent = "—";
      if (useCell) useCell.textContent = "—";
      fillSheet(sheetTr, null);
    } else {
      var mm = Yardage.lengthMm(row.lengthCm);
      mmCell.textContent = isFinite(mm) ? Layout.formatMm(mm) : "—";
      subCell.textContent = "—";
      if (useCell) useCell.textContent = "—";
      fillSheet(sheetTr, null);
    }
  }

  function renderYardageTotals() {
    setChipState();
    var result = currentYardage();
    lastYardage = result;
    els.yardageFormula.textContent = result.ok ? Yardage.formulaLine(result) : "";
    if (!result.ok) {
      els.yardageTotals.className = "yardage-totals err";
      els.yardageTotals.textContent =
        result.errors.length ? result.errors.join("；") : "请填写各规格的单件长和数量";
      return;
    }
    els.yardageTotals.className = "yardage-totals";
    els.yardageTotals.innerHTML =
      '<div class="yardage-stat"><span>成品净长</span><strong>' +
      Yardage.formatFixed(result.netM, 2) +
      " m</strong></div>" +
      '<div class="yardage-stat"><span>端扣废料</span><strong>' +
      Yardage.formatFixed(result.endWasteM, 2) +
      " m</strong></div>" +
      '<div class="yardage-stat"><span>用料</span><strong>' +
      Yardage.formatFixed(result.useM, 2) +
      " m</strong></div>" +
      '<div class="yardage-stat"><span>其它损耗 ' +
      Yardage.formatNum(result.lossPercent, 2) +
      "%</span><strong>" +
      Yardage.formatFixed(result.wasteM, 2) +
      " m</strong></div>" +
      '<div class="yardage-stat"><span>含损耗</span><strong>' +
      Yardage.formatFixed(result.grossM, 2) +
      " m</strong></div>" +
      '<div class="yardage-stat accent"><span>码长</span><strong>' +
      Yardage.formatFixed(result.yards, 2) +
      " yd</strong></div>" +
      '<div class="yardage-stat accent"><span>建议下单</span><strong>' +
      Yardage.formatFixed(result.orderYards, 1) +
      " 码</strong></div>";
  }

  function bindYardageRow(tr, index) {
    var row = yardageState.rows[index];
    tr.querySelector("[data-k=name]").addEventListener("input", function () {
      row.name = this.value;
    });
    tr.querySelector("[data-k=length]").addEventListener("input", function () {
      row.lengthCm = this.value;
      updateRowComputed(tr, row);
      renderYardageTotals();
    });
    tr.querySelector("[data-k=qty]").addEventListener("input", function () {
      row.qty = this.value;
      updateRowComputed(tr, row);
      renderYardageTotals();
    });
    tr.querySelector("[data-act=layout]").addEventListener("click", function () {
      applyRowToLayout(index);
    });
    tr.querySelector("[data-act=remove]").addEventListener("click", function () {
      yardageState.rows.splice(index, 1);
      if (!yardageState.rows.length) yardageState.rows.push(Yardage.blankRow());
      if (yardageState.selected === index) yardageState.selected = -1;
      else if (yardageState.selected > index) yardageState.selected -= 1;
      delete yardageState.expanded[index];
      renderYardageTable();
    });
    tr.querySelector("[data-act=sheet]").addEventListener("click", function () {
      yardageState.expanded[index] = !yardageState.expanded[index];
      var sheet = tr.nextElementSibling;
      if (sheet) sheet.classList.toggle("hidden", !yardageState.expanded[index]);
    });
  }

  function renderYardageTable() {
    els.yardageBody.innerHTML = "";
    yardageState.rows.forEach(function (row, index) {
      var tr = document.createElement("tr");
      tr.setAttribute("data-row", String(index));
      if (index === yardageState.selected) tr.classList.add("selected");
      tr.innerHTML =
        '<td><input data-k="name" type="text" spellcheck="false" placeholder="如 6/12 AY" /></td>' +
        '<td><input data-k="length" type="number" inputmode="decimal" min="0" step="0.1" placeholder="cm" /></td>' +
        '<td data-role="mm" class="num">—</td>' +
        '<td><input data-k="qty" type="number" inputmode="numeric" min="0" step="1" placeholder="件数" /></td>' +
        '<td data-role="sub" class="num">—</td>' +
        '<td data-role="use" class="num">—</td>' +
        '<td class="row-acts">' +
        '<button type="button" class="btn-mini" data-act="sheet">演算</button>' +
        '<button type="button" class="btn-mini" data-act="layout">排版</button>' +
        '<button type="button" class="btn-mini danger" data-act="remove">删</button>' +
        "</td>";
      var sheetTr = document.createElement("tr");
      sheetTr.className = "yardage-sheet" + (yardageState.expanded[index] ? "" : " hidden");
      sheetTr.innerHTML = '<td colspan="7"><pre class="worksheet"></pre></td>';
      var nameInput = tr.querySelector("[data-k=name]");
      var lenInput = tr.querySelector("[data-k=length]");
      var qtyInput = tr.querySelector("[data-k=qty]");
      nameInput.value = row.name == null ? "" : String(row.name);
      if (!Yardage.isBlank(row.lengthCm)) lenInput.value = String(row.lengthCm);
      if (!Yardage.isBlank(row.qty)) qtyInput.value = String(row.qty);
      els.yardageBody.appendChild(tr);
      els.yardageBody.appendChild(sheetTr);
      updateRowComputed(tr, row);
      bindYardageRow(tr, index);
    });
    renderYardageTotals();
  }

  function refreshYardageComputed() {
    if (!els.yardageBody) return;
    Array.prototype.forEach.call(els.yardageBody.querySelectorAll("tr[data-row]"), function (tr) {
      var i = Number(tr.getAttribute("data-row"));
      if (yardageState.rows[i]) updateRowComputed(tr, yardageState.rows[i]);
    });
    renderYardageTotals();
  }

  function loadYardageExample() {
    var bundle = Yardage.exampleBundle();
    els.contractNo.value = bundle.contractNo;
    els.orderNo.value = bundle.orderNo;
    els.lossPct.value = String(bundle.lossPercent);
    yardageState.rows = bundle.rows;
    yardageState.selected = -1;
    yardageState.expanded = {};
    renderYardageTable();
  }

  function clearYardage() {
    els.contractNo.value = "";
    els.orderNo.value = "";
    yardageState.rows = [Yardage.blankRow()];
    yardageState.selected = -1;
    yardageState.expanded = {};
    renderYardageTable();
  }

  function setSheetsExpanded(open) {
    yardageState.rows.forEach(function (_row, i) {
      yardageState.expanded[i] = open;
    });
    Array.prototype.forEach.call(els.yardageBody.querySelectorAll("tr.yardage-sheet"), function (tr, i) {
      tr.classList.toggle("hidden", !yardageState.expanded[i]);
    });
  }

  function copyText(text, btn, idleLabel, doneLabel) {
    var done = function () {
      btn.textContent = doneLabel;
      setTimeout(function () {
        btn.textContent = idleLabel;
      }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        window.prompt(idleLabel, text);
      });
    } else {
      window.prompt(idleLabel, text);
    }
  }

  function copyYardage() {
    copyText(Yardage.summaryText(currentYardage(), yardageMeta()), els.btnCopyYardage, "复制码长", "已复制");
  }

  function exportSheets() {
    var text = Yardage.worksheetText(currentYardage(), yardageMeta(), tapeOpts());
    copyText(text, els.btnExportSheets, "导出演算", "已复制");
    try {
      var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "yardage-worksheet.txt";
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 500);
    } catch (err) {}
  }

  ["width", "diameter", "spacing", "length", "leftoverMin", "count"].forEach(function (id) {
    els[id].addEventListener("input", render);
  });

  document.querySelectorAll(".chips button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.parentElement.getAttribute("data-target");
      document.getElementById(id).value = btn.getAttribute("data-value");
      if (id === "lossPct" || id === "cutTol") {
        setChipState();
        refreshYardageComputed();
      } else render();
    });
  });

  els.lossPct.addEventListener("input", renderYardageTotals);
  els.cutTol.addEventListener("input", refreshYardageComputed);
  els.btnAddSize.addEventListener("click", function () {
    yardageState.rows.push(Yardage.blankRow());
    renderYardageTable();
  });
  els.btnYardageExample.addEventListener("click", loadYardageExample);
  els.btnYardageClear.addEventListener("click", clearYardage);
  els.btnExpandSheets.addEventListener("click", function () {
    setSheetsExpanded(true);
  });
  els.btnCollapseSheets.addEventListener("click", function () {
    setSheetsExpanded(false);
  });
  els.btnCopyYardage.addEventListener("click", copyYardage);
  els.btnExportSheets.addEventListener("click", exportSheets);

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

  loadYardageExample();
  render();
})();
