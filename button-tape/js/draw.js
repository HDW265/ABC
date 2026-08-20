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
    var mid = (x1 + x2) / 2;
    var boxW = Math.max(56, String(label).length * 9.5 + 18);
    var boxH = 20;
    var box = svgEl("rect", {
      x: mid - boxW / 2,
      y: y - boxH / 2,
      width: boxW,
      height: boxH,
      rx: 4,
      fill: opts.fill || "#c62828",
    });
    parent.appendChild(box);
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

  function drawButton(parent, cx, cy, r, holes) {
    parent.appendChild(
      svgEl("circle", {
        cx: cx,
        cy: cy,
        r: r,
        fill: "#fffefb",
        stroke: "#b7b1a8",
        "stroke-width": Math.max(1, r * 0.08),
      })
    );
    parent.appendChild(
      svgEl("circle", {
        cx: cx,
        cy: cy,
        r: r * 0.78,
        fill: "none",
        stroke: "rgba(140,130,120,0.28)",
        "stroke-width": 1,
      })
    );
    if (r >= 7 && holes) {
      var d = r * 0.28;
      var hr = Math.max(1.1, r * 0.09);
      [
        [-d, -d],
        [d, -d],
        [-d, d],
        [d, d],
      ].forEach(function (p) {
        parent.appendChild(
          svgEl("circle", {
            cx: cx + p[0],
            cy: cy + p[1],
            r: hr,
            fill: "#c5c0b8",
          })
        );
      });
    }
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
    var boxW = Math.max(opts.minWidth || 48, String(text).length * 7.3 + 14);
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
  }

  function drawStopZone(parent, xEdge, xRim, y0, tapeH, leftover, side) {
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
    var value = Layout.formatMm(leftover) + " mm";
    if (w >= 64 && tapeH >= 34) {
      var title = svgEl("text", {
        x: mid,
        y: y0 + 13,
        "text-anchor": "middle",
        fill: "#c62828",
        "font-size": 11,
        "font-weight": 700,
        "font-family": "Outfit, 'Noto Sans SC', sans-serif",
      });
      title.textContent = "止口";
      parent.appendChild(title);
      var dimY = y0 + tapeH * 0.62;
      if (w >= 72) {
        dimLine(parent, left + 5, right - 5, dimY, value);
      } else {
        labelBadge(parent, mid, dimY, value);
      }
    } else {
      var bx = side === "right" ? Math.min(right - 2, right) : Math.max(left + 2, left);
      labelBadge(parent, bx, y0 - 40, "止口 " + value, { minWidth: 78, fontSize: 10 });
      parent.appendChild(
        svgEl("line", {
          x1: mid,
          y1: y0 + 2,
          x2: bx,
          y2: y0 - 31,
          stroke: "#c62828",
          "stroke-width": 1,
        })
      );
    }
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
    labelBadge(
      parent,
      cx,
      cy + r + pad + 13,
      "扣径 " + Layout.formatMm(diameterMm) + " mm",
      { minWidth: 78 }
    );
  }

  function drawCallouts(parent, spec, scheme, geom) {
    var leftover = Layout.leftoverMm(scheme.M, spec.D);
    drawStopZone(
      parent,
      geom.x0,
      geom.firstX - geom.btnR,
      geom.y0,
      geom.tapeH,
      leftover,
      "left"
    );
    drawStopZone(
      parent,
      geom.lastX + geom.btnR,
      geom.x1,
      geom.y0,
      geom.tapeH,
      leftover,
      "right"
    );
    drawDiameterCallout(parent, geom.firstX, geom.cy, geom.btnR, spec.D);
  }

  function drawFull(svg, spec, scheme, pixelWidth, withEveryGap) {
    var padL = 56;
    var padR = 56;
    var padT = 108;
    var padB = 96;
    var innerW = Math.max(280, pixelWidth - padL - padR);
    var scale = innerW / spec.L;
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
      padL,
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
    caption(svg, padL, 48, scheme.formula, 16);

    drawTapeBody(svg, x0, y0, x1 - x0, tapeH);

    scheme.buttonXs.forEach(function (mm) {
      drawButton(svg, x0 + mm * scale, cy, btnR, true);
    });

    var dimY = y0 - 22;
    var firstX = x0 + scheme.buttonXs[0] * scale;
    var lastX = x0 + scheme.buttonXs[scheme.N - 1] * scale;
    var mPx = Math.abs(firstX - x0);
    var mY = mPx < 64 ? dimY - 24 : dimY;
    guide(svg, x0, y0, mY + 8);
    guide(svg, firstX, y0, dimY + 8);
    guide(svg, lastX, y0, dimY + 8);
    guide(svg, x1, y0, mY + 8);

    dimLine(svg, x0, firstX, mY, "中心 " + Layout.formatMm(scheme.M));
    dimLine(svg, lastX, x1, mY, "中心 " + Layout.formatMm(scheme.M));

    if (scheme.N >= 2) {
      var a = x0 + scheme.buttonXs[0] * scale;
      var b = x0 + scheme.buttonXs[1] * scale;
      var label = Layout.formatMm(scheme.S) + " mm";
      if (scheme.cycles > 1) {
        label = Layout.formatMm(scheme.S) + "×" + scheme.cycles;
      }
      dimLine(svg, a, b, dimY, label);
      if (withEveryGap && scheme.N === 3) {
        dimLine(
          svg,
          x0 + scheme.buttonXs[1] * scale,
          x0 + scheme.buttonXs[2] * scale,
          dimY,
          Layout.formatMm(scheme.S) + " mm"
        );
      }
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
    });

    var totalY = y0 + tapeH + 52;
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
    var inner = Math.max(280, pixelWidth - padL - padR - gapW);
    var scale = inner / (leftMm + rightMm);
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
      drawButton(svg, leftX + scheme.buttonXs[i] * scale, cy, btnR, true);
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
      drawButton(svg, rightX + mx * scale, cy, btnR, true);
    }

    var dimY = y0 - 22;
    var firstX = leftX + scheme.buttonXs[0] * scale;
    dimLine(svg, leftX, firstX, dimY, "中心 " + Layout.formatMm(scheme.M));
    if (leftCount >= 2) {
      dimLine(
        svg,
        leftX + scheme.buttonXs[0] * scale,
        leftX + scheme.buttonXs[1] * scale,
        dimY,
        Layout.formatMm(scheme.S) + "×" + scheme.cycles
      );
    }
    var lastX = rightX + (scheme.buttonXs[scheme.N - 1] - rightStartMm) * scale;
    var rightEdge = rightX + rightW;
    dimLine(svg, lastX, rightEdge, dimY, "中心 " + Layout.formatMm(scheme.M));
    drawCallouts(svg, spec, scheme, {
      x0: leftX,
      x1: rightEdge,
      y0: y0,
      cy: cy,
      tapeH: tapeH,
      firstX: firstX,
      lastX: lastX,
      btnR: btnR,
    });

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
