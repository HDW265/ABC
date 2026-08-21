/**
 * 扣带排版 SVG 图纸：完整比例图 / 中长补表 / 超长两端断开示意。
 */
(function (root) {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var Layout = root.ButtonTapeLayout;

  function svgEl(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      el.setAttribute(key, String(attrs[key]));
    });
    return el;
  }

  function emptySvg(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  function drawModeFor(spec, scheme, pixelWidth) {
    var inner = Math.max(320, pixelWidth - 120);
    var scale = inner / spec.L;
    var pxD = spec.D * scale;
    return Layout.drawingMode(spec.L, scheme.N, pxD);
  }

  function addDefs(svg) {
    var defs = svgEl("defs");
    var fabric = svgEl("pattern", {
      id: "tapeFabric",
      patternUnits: "userSpaceOnUse",
      width: 8,
      height: 8,
    });
    fabric.appendChild(
      svgEl("rect", { width: 8, height: 8, fill: "#f6f1ea" })
    );
    fabric.appendChild(
      svgEl("path", {
        d: "M0 8 L8 0",
        stroke: "rgba(160,140,120,0.22)",
        "stroke-width": 0.6,
      })
    );
    defs.appendChild(fabric);

    function marker(id, color) {
      var m = svgEl("marker", {
        id: id,
        viewBox: "0 0 10 10",
        refX: 8,
        refY: 5,
        markerWidth: 7,
        markerHeight: 7,
        orient: "auto-start-reverse",
      });
      m.appendChild(svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: color }));
      defs.appendChild(m);
    }
    marker("dimArrow", "#c62828");
    svg.appendChild(defs);
  }

  function dimLine(parent, x1, x2, y, label, opts) {
    opts = opts || {};
    var color = opts.color || "#c62828";
    parent.appendChild(
      svgEl("line", {
        x1: x1,
        y1: y,
        x2: x2,
        y2: y,
        stroke: color,
        "stroke-width": 1.4,
        "marker-start": "url(#dimArrow)",
        "marker-end": "url(#dimArrow)",
      })
    );
    var boxW = badgeWidth(label);
    var boxH = 20;
    var mid = opts.labelX != null ? opts.labelX : (x1 + x2) / 2;
    parent.appendChild(
      svgEl("rect", {
        x: mid - boxW / 2,
        y: y - boxH / 2,
        width: boxW,
        height: boxH,
        rx: 4,
        fill: opts.fill || "#c62828",
      })
    );
    var text = svgEl("text", {
      x: mid,
      y: y + 5,
      "text-anchor": "middle",
      fill: "#fff",
      "font-size": 12,
      "font-family": "IBM Plex Mono, ui-monospace, monospace",
      "font-weight": 600,
    });
    text.textContent = label;
    parent.appendChild(text);
    return { x: mid - boxW / 2, y: y - boxH / 2, w: boxW, h: boxH };
  }

  function badgeWidth(text) {
    return Math.max(56, String(text).length * 9.5 + 18);
  }

  function guide(parent, x, y1, y2) {
    parent.appendChild(
      svgEl("line", {
        x1: x,
        y1: y1,
        x2: x,
        y2: y2,
        stroke: "rgba(198,40,40,0.35)",
        "stroke-width": 1,
        "stroke-dasharray": "3 3",
      })
    );
  }

  function drawButton(parent, cx, cy, r, ghost) {
    var strokeW = Math.max(1.1, r * (ghost ? 0.12 : 0.1));
    parent.appendChild(
      svgEl("circle", {
        cx: cx,
        cy: cy,
        r: r,
        fill: ghost ? "rgba(255, 254, 251, 0.18)" : "#fffefb",
        stroke: ghost ? "#8a847a" : "#b7b1a8",
        "stroke-width": strokeW,
        "stroke-dasharray": ghost ? String(Math.max(2.5, r * 0.28)) + " " + String(Math.max(2, r * 0.2)) : "none",
        opacity: ghost ? "0.85" : "1",
      })
    );
  }

  function ghostOverhangMm(spec, scheme) {
    var g = Layout.ghostCenters(scheme.M, spec.S, spec.L);
    var r = spec.D / 2;
    return {
      left: Math.max(0, -g.left + r),
      right: Math.max(0, g.right - spec.L + r),
    };
  }

  function drawGhostPair(parent, spec, firstX, lastX, cy, scale, btnR) {
    drawButton(parent, firstX - spec.S * scale, cy, btnR, true);
    drawButton(parent, lastX + spec.S * scale, cy, btnR, true);
  }

  function drawTapeBody(parent, x, y, w, h) {
    parent.appendChild(
      svgEl("rect", {
        x: x,
        y: y,
        width: w,
        height: h,
        rx: Math.min(h * 0.35, 10),
        fill: "url(#tapeFabric)",
        stroke: "#c4b9ac",
        "stroke-width": 1.4,
      })
    );
    parent.appendChild(
      svgEl("line", {
        x1: x + 6,
        y1: y + h * 0.22,
        x2: x + w - 6,
        y2: y + h * 0.22,
        stroke: "rgba(150,130,110,0.25)",
        "stroke-width": 1,
        "stroke-dasharray": "4 6",
      })
    );
    parent.appendChild(
      svgEl("line", {
        x1: x + 6,
        y1: y + h * 0.78,
        x2: x + w - 6,
        y2: y + h * 0.78,
        stroke: "rgba(150,130,110,0.25)",
        "stroke-width": 1,
        "stroke-dasharray": "4 6",
      })
    );
  }

  function caption(parent, x, y, text, size) {
    var t = svgEl("text", {
      x: x,
      y: y,
      fill: "#142028",
      "font-size": size || 13,
      "font-family": "Outfit, 'Noto Sans SC', sans-serif",
      "font-weight": 600,
    });
    t.textContent = text;
    parent.appendChild(t);
  }

  function labelBadge(parent, cx, cy, text, opts) {
    opts = opts || {};
    var fontSize = opts.fontSize || 11;
    var boxH = opts.height || 18;
    var boxW = Math.max(opts.minWidth || 48, badgeWidth(text) - 6);
    parent.appendChild(
      svgEl("rect", {
        x: cx - boxW / 2,
        y: cy - boxH / 2,
        width: boxW,
        height: boxH,
        rx: 4,
        fill: opts.fill || "#c62828",
        stroke: opts.stroke || "none",
      })
    );
    var t = svgEl("text", {
      x: cx,
      y: cy + boxH * 0.28,
      "text-anchor": "middle",
      fill: opts.color || "#fff",
      "font-size": fontSize,
      "font-weight": 700,
      "font-family": "IBM Plex Mono, ui-monospace, monospace",
    });
    t.textContent = text;
    parent.appendChild(t);
    return { x: cx - boxW / 2, y: cy - boxH / 2, w: boxW, h: boxH };
  }

  function drawStopZone(parent, xEdge, xRim, y0, tapeH, leftover, side, bounds) {
    var left = Math.min(xEdge, xRim);
    var right = Math.max(xEdge, xRim);
    var w = right - left;
    if (w < 1.5 || leftover < -0.05) return;
    parent.appendChild(
      svgEl("rect", {
        x: left,
        y: y0 + 1,
        width: w,
        height: Math.max(1, tapeH - 2),
        rx: 3,
        fill: "rgba(198,40,40,0.12)",
        stroke: "#c62828",
        "stroke-width": 1.25,
      })
    );
    var mid = (left + right) / 2;
    var label = "止口 " + Layout.formatMm(leftover) + " mm";
    var needW = badgeWidth(label) + 8;
    if (w >= needW && tapeH >= 34) {
      dimLine(parent, left + 4, right - 4, y0 + tapeH * 0.62, label);
      return;
    }
    var boxW = badgeWidth(label);
    var cy = y0 + tapeH + 16;
    var cx;
    if (side === "left") {
      cx = xEdge - 10 - boxW / 2;
      if (cx < boxW / 2 + 4) cx = boxW / 2 + 4;
    } else {
      var maxX = bounds && bounds.maxX ? bounds.maxX : xEdge + 160;
      cx = xEdge + 10 + boxW / 2;
      if (cx + boxW / 2 > maxX - 4) cx = maxX - 4 - boxW / 2;
    }
    labelBadge(parent, cx, cy, label, { minWidth: 78, fontSize: 10 });
    parent.appendChild(
      svgEl("line", {
        x1: mid,
        y1: y0 + tapeH - 2,
        x2: side === "left" ? cx + boxW / 2 - 4 : cx - boxW / 2 + 4,
        y2: cy - 9,
        stroke: "#c62828",
        "stroke-width": 1,
      })
    );
  }

  function drawDiameterCallout(parent, cx, cy, r, diameterMm) {
    var pad = Math.max(3.5, r * 0.16);
    parent.appendChild(
      svgEl("rect", {
        x: cx - r - pad,
        y: cy - r - pad,
        width: 2 * (r + pad),
        height: 2 * (r + pad),
        rx: 5,
        fill: "none",
        stroke: "#c62828",
        "stroke-width": 1.5,
      })
    );
    var yLine = cy + r * 0.42;
    parent.appendChild(
      svgEl("line", {
        x1: cx - r,
        y1: yLine,
        x2: cx + r,
        y2: yLine,
        stroke: "#c62828",
        "stroke-width": 1.25,
        "marker-start": "url(#dimArrow)",
        "marker-end": "url(#dimArrow)",
      })
    );
    var bx = cx + r + Math.max(34, r * 1.1);
    var by = cy + Math.min(10, r * 0.25);
    parent.appendChild(
      svgEl("line", {
        x1: cx + r + pad,
        y1: cy,
        x2: bx - 40,
        y2: by,
        stroke: "#c62828",
        "stroke-width": 1,
      })
    );
    labelBadge(parent, bx, by, "扣径 " + Layout.formatMm(diameterMm) + " mm", {
      minWidth: 78,
    });
  }

  function drawCallouts(parent, spec, scheme, geom) {
    var leftover = Layout.leftoverMm(scheme.M, spec.D);
    var bounds = { maxX: geom.viewW || 900 };
    drawStopZone(
      parent,
      geom.x0,
      geom.firstX - geom.btnR,
      geom.y0,
      geom.tapeH,
      leftover,
      "left",
      bounds
    );
    drawStopZone(
      parent,
      geom.lastX + geom.btnR,
      geom.x1,
      geom.y0,
      geom.tapeH,
      leftover,
      "right",
      bounds
    );
    drawDiameterCallout(parent, geom.firstX, geom.cy, geom.btnR, spec.D);
  }

  function spacingGapIndex(scheme, x0, scale) {
    if (scheme.N < 3) return 0;
    var firstX = x0 + scheme.buttonXs[0] * scale;
    var leftMid = (x0 + firstX) / 2;
    var gap0mid = x0 + ((scheme.buttonXs[0] + scheme.buttonXs[1]) / 2) * scale;
    if (Math.abs(gap0mid - leftMid) < 80) return 1;
    return 0;
  }

  function drawCenterDims(parent, x0, x1, firstX, lastX, dimY, marginMm) {
    var leftLabel = "中心 " + Layout.formatMm(marginMm);
    var leftW = badgeWidth(leftLabel);
    var leftSpan = Math.abs(firstX - x0);
    dimLine(parent, x0, firstX, dimY, leftLabel, {
      labelX: leftSpan < leftW ? firstX : (x0 + firstX) / 2,
    });
    var rightSpan = Math.abs(x1 - lastX);
    dimLine(parent, lastX, x1, dimY, leftLabel, {
      labelX: rightSpan < leftW ? lastX : (lastX + x1) / 2,
    });
  }

  function drawFull(svg, spec, scheme, pixelWidth, withEveryGap) {
    var basePad = 56;
    var padT = 108;
    var padB = 110;
    var over = ghostOverhangMm(spec, scheme);
    var scale = (Math.max(280, pixelWidth - 2 * basePad)) / (spec.L + over.left + over.right);
    var padL = basePad + over.left * scale;
    var padR = basePad + over.right * scale;
    var tapeH = Math.max(36, spec.W * scale);
    var btnR = (spec.D * scale) / 2;
    if (btnR * 2 > tapeH * 0.96) {
      tapeH = btnR * 2 + 8;
    }
    var height = padT + tapeH + padB;
    svg.setAttribute("viewBox", "0 0 " + pixelWidth + " " + height);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", String(height));
    addDefs(svg);

    var x0 = padL;
    var y0 = padT;
    var cy = y0 + tapeH / 2;
    var x1 = x0 + spec.L * scale;

    caption(
      svg,
      24,
      28,
      "布宽 " +
        Layout.formatMm(spec.W) +
        " mm · 扣径 " +
        Layout.formatMm(spec.D) +
        " mm · " +
        scheme.N +
        " 扣 · " +
        scheme.cycles +
        " 循环",
      13
    );
    caption(svg, 24, 48, scheme.formula, 16);

    drawTapeBody(svg, x0, y0, x1 - x0, tapeH);

    scheme.buttonXs.forEach(function (mm) {
      drawButton(svg, x0 + mm * scale, cy, btnR, false);
    });

    var dimY = y0 - 22;
    var firstX = x0 + scheme.buttonXs[0] * scale;
    var lastX = x0 + scheme.buttonXs[scheme.N - 1] * scale;
    guide(svg, x0, y0, dimY + 8);
    guide(svg, firstX, y0, dimY + 8);
    guide(svg, lastX, y0, dimY + 8);
    guide(svg, x1, y0, dimY + 8);

    drawCenterDims(svg, x0, x1, firstX, lastX, dimY, scheme.M);

    if (scheme.N >= 2) {
      var gi = spacingGapIndex(scheme, x0, scale);
      var a = x0 + scheme.buttonXs[gi] * scale;
      var b = x0 + scheme.buttonXs[gi + 1] * scale;
      var label = Layout.formatMm(scheme.S) + " mm";
      if (scheme.cycles > 1) {
        label = Layout.formatMm(scheme.S) + "×" + scheme.cycles;
      }
      dimLine(svg, a, b, dimY, label);
    }

    drawCallouts(svg, spec, scheme, {
      x0: x0,
      x1: x1,
      y0: y0,
      cy: cy,
      tapeH: tapeH,
      firstX: firstX,
      lastX: lastX,
      btnR: btnR,
      viewW: pixelWidth,
    });
    drawGhostPair(svg, spec, firstX, lastX, cy, scale, btnR);

    var totalY = y0 + tapeH + 64;
    guide(svg, x0, y0 + tapeH, totalY);
    guide(svg, x1, y0 + tapeH, totalY);
    dimLine(svg, x0, x1, totalY, Layout.formatMm(spec.L) + " mm", {
      fill: "#8f4a1f",
    });
    return { mode: withEveryGap ? "full" : "full-table", height: height };
  }

  function drawBreakout(svg, spec, scheme, pixelWidth) {
    var padL = 40;
    var padR = 40;
    var padT = 96;
    var padB = 100;
    var leftCount = Math.min(3, scheme.N);
    var rightCount = Math.min(3, Math.max(0, scheme.N - leftCount));
    if (scheme.N <= 6) {
      return drawFull(svg, spec, scheme, pixelWidth, false);
    }

    var gapW = 72;
    var leftMm = scheme.buttonXs[leftCount - 1] + spec.D / 2 + 6;
    var rightStartMm = scheme.buttonXs[scheme.N - rightCount] - spec.D / 2 - 6;
    if (rightStartMm < 0) rightStartMm = 0;
    var rightMm = spec.L - rightStartMm;
    var over = ghostOverhangMm(spec, scheme);
    var basePad = 40;
    var scale =
      (Math.max(280, pixelWidth - 2 * basePad - gapW)) /
      (leftMm + rightMm + over.left + over.right);
    padL = basePad + over.left * scale;
    padR = basePad + over.right * scale;
    var tapeH = Math.max(32, spec.W * scale);
    var btnR = (spec.D * scale) / 2;
    if (btnR < 8) {
      scale = 16 / spec.D;
      btnR = 8;
      tapeH = Math.max(tapeH, 32);
    }
    var leftW = leftMm * scale;
    var rightW = rightMm * scale;
    var height = padT + tapeH + padB + 36;
    svg.setAttribute("viewBox", "0 0 " + pixelWidth + " " + height);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", String(height));
    addDefs(svg);

    caption(
      svg,
      padL,
      26,
      "超长条 · 两端详图（中间 " +
        (scheme.N - leftCount - rightCount) +
        " 扣省略）· 全长 " +
        Layout.formatMm(spec.L) +
        " mm",
      13
    );
    caption(svg, padL, 48, scheme.formula, 16);

    var y0 = padT;
    var cy = y0 + tapeH / 2;
    var leftX = padL;
    drawTapeBody(svg, leftX, y0, leftW, tapeH);
    var i;
    for (i = 0; i < leftCount; i += 1) {
      drawButton(svg, leftX + scheme.buttonXs[i] * scale, cy, btnR, false);
    }

    var ellX = leftX + leftW + gapW / 2;
    var dots = svgEl("text", {
      x: ellX,
      y: cy + 6,
      "text-anchor": "middle",
      fill: "#8f4a1f",
      "font-size": 22,
      "font-weight": 700,
      "font-family": "IBM Plex Mono, ui-monospace, monospace",
    });
    dots.textContent = "···";
    svg.appendChild(dots);

    var rightX = leftX + leftW + gapW;
    drawTapeBody(svg, rightX, y0, rightW, tapeH);
    for (i = scheme.N - rightCount; i < scheme.N; i += 1) {
      var mx = scheme.buttonXs[i] - rightStartMm;
      drawButton(svg, rightX + mx * scale, cy, btnR, false);
    }

    var dimY = y0 - 22;
    var firstX = leftX + scheme.buttonXs[0] * scale;
    var lastX = rightX + (scheme.buttonXs[scheme.N - 1] - rightStartMm) * scale;
    var rightEdge = rightX + rightW;
    drawCenterDims(svg, leftX, rightEdge, firstX, lastX, dimY, scheme.M);
    if (leftCount >= 2) {
      var gi = spacingGapIndex(scheme, leftX, scale);
      if (gi > leftCount - 2) gi = 0;
      dimLine(
        svg,
        leftX + scheme.buttonXs[gi] * scale,
        leftX + scheme.buttonXs[gi + 1] * scale,
        dimY,
        Layout.formatMm(scheme.S) + "×" + scheme.cycles
      );
    }
    drawCallouts(svg, spec, scheme, {
      x0: leftX,
      x1: rightEdge,
      y0: y0,
      cy: cy,
      tapeH: tapeH,
      firstX: firstX,
      lastX: lastX,
      btnR: btnR,
      viewW: pixelWidth,
    });
    drawGhostPair(svg, spec, firstX, lastX, cy, scale, btnR);

    var overviewY = y0 + tapeH + 28;
    var ovX = padL;
    var ovW = pixelWidth - padL - padR;
    var ovH = 18;
    var ovScale = ovW / spec.L;
    svg.appendChild(
      svgEl("rect", {
        x: ovX,
        y: overviewY,
        width: ovW,
        height: ovH,
        rx: 4,
        fill: "#efe8df",
        stroke: "#c4b9ac",
      })
    );
    scheme.buttonXs.forEach(function (mm) {
      svg.appendChild(
        svgEl("circle", {
          cx: ovX + mm * ovScale,
          cy: overviewY + ovH / 2,
          r: Math.max(1.2, (spec.D * ovScale) / 2),
          fill: "#fff",
          stroke: "#b7b1a8",
          "stroke-width": 0.6,
        })
      );
    });
    var ovLabel = svgEl("text", {
      x: ovX,
      y: overviewY + ovH + 16,
      fill: "#5c6b73",
      "font-size": 11,
      "font-family": "Outfit, 'Noto Sans SC', sans-serif",
    });
    ovLabel.textContent = "全长缩略（仅示意密度，尺寸以两端详图和坐标表为准）";
    svg.appendChild(ovLabel);
    return { mode: "breakout", height: height };
  }

  function render(svg, spec, scheme, pixelWidth) {
    emptySvg(svg);
    if (!spec || !scheme) return { mode: "empty", height: 120 };
    var width = Math.max(520, pixelWidth || 800);
    var mode = drawModeFor(spec, scheme, width);
    if (mode === "breakout") return drawBreakout(svg, spec, scheme, width);
    return drawFull(svg, spec, scheme, width, mode === "full");
  }

  function svgToPng(svg, filename) {
    var clone = svg.cloneNode(true);
    var box = svg.viewBox.baseVal;
    var w = Math.max(1, box.width || svg.clientWidth || 900);
    var h = Math.max(1, box.height || svg.clientHeight || 280);
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));
    clone.setAttribute("xmlns", NS);
    var xml = new XMLSerializer().serializeToString(clone);
    var blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement("canvas");
      var scale = 2;
      canvas.width = w * scale;
      canvas.height = h * scale;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#f7f3ee";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (root.SiteCredit) {
        var creditH = (root.SiteCredit.footerHeight || 40) * scale;
        var taller = document.createElement("canvas");
        taller.width = canvas.width;
        taller.height = canvas.height + creditH;
        var tctx = taller.getContext("2d");
        tctx.fillStyle = "#f7f3ee";
        tctx.fillRect(0, 0, taller.width, taller.height);
        tctx.drawImage(canvas, 0, 0);
        root.SiteCredit.paint(tctx, taller.width, canvas.height + 8 * scale, {
          padX: 16 * scale,
          lineH: 16 * scale,
          font: 11 * scale + "px sans-serif",
          color: "#5c6b73",
        });
        canvas = taller;
      }
      URL.revokeObjectURL(url);
      var a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = filename || "button-tape.png";
      a.click();
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  root.ButtonTapeDraw = {
    render: render,
    drawModeFor: drawModeFor,
    svgToPng: svgToPng,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
