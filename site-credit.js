/**
 * 站点版权与开源引用（页脚 / 打印 / 导出 PNG 共用）。
 * 不写开源许可证名称（尚未选定）。
 */
(function (root) {
  "use strict";
  var LINES = [
    "© 2026 起 深圳市思科达科技有限公司　开发总监：谢俊昌",
    "xjcxjc265@gmail.com  ·  https://github.com/HDW265/ABC",
  ];

  function paint(ctx, width, y, opts) {
    opts = opts || {};
    var padX = opts.padX != null ? opts.padX : 12;
    var lineH = opts.lineH != null ? opts.lineH : 16;
    ctx.save();
    ctx.fillStyle = opts.color || "#5c6b73";
    ctx.font = opts.font || "12px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(LINES[0], padX, y);
    ctx.fillText(LINES[1], padX, y + lineH);
    ctx.restore();
  }

  root.SiteCredit = {
    LINES: LINES,
    paint: paint,
    footerHeight: 40,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
