/* Profile Picture — one render() draws preview and export; sizes are fractions of the output so every size matches. */
(function () {
  "use strict";
  var $ = S3.$, $$ = S3.$$;
  var PREVIEW = 720;
  var FONT = "Inter, 'Segoe UI', Tahoma, 'Noto Sans Arabic', 'Geeza Pro', Arial, sans-serif";
  var RINGS = [["Teal", "#3dd6d0", "#3b5bdb"], ["Sunset", "#ff9a6b", "#ff3d7f"], ["Gold", "#f7d774", "#c98a1b"], ["Green", "#3fa66b", "#3fa66b"],
    ["Grape", "#7b6cf6", "#e45fd6"], ["White", "#ffffff", "#ffffff"], ["Black", "#111418", "#111418"]];
  var DEF = { shape: "circle", zoom: 1, rot: 0, flip: false, px: 0, py: 0, bg: "none", bg1: "#3dd6d0", bg2: "#3b5bdb", bgA: 135,
    ringW: 4, ringGap: 1.5, ring1: "#3dd6d0", ring2: "#3b5bdb", ringGrad: true, badgeOn: false, badgeText: "#OPENTOWORK", badgeBg: "#2f7d4f", badgeInk: "#ffffff", badgePos: "bl", out: 800 };
  var saved = S3.store("pp.settings") || {};
  var st = Object.assign({}, DEF, saved, { zoom: 1, rot: 0, px: 0, py: 0, flip: false });
  var img = null, imgName = "profile";
  var cv = $("#cv");

  // ---------- geometry ----------
  function shapePath(c, x, y, s, shape) {
    c.beginPath();
    if (shape === "circle") { c.arc(x + s / 2, y + s / 2, s / 2, 0, Math.PI * 2); return; }
    var r = shape === "rounded" ? s * 0.2 : 0;
    c.moveTo(x + r, y); c.arcTo(x + s, y, x + s, y + s, r); c.arcTo(x + s, y + s, x, y + s, r); c.arcTo(x, y + s, x, y, r); c.arcTo(x, y, x + s, y, r); c.closePath();
  }
  function gradLine(S, deg) {
    var a = deg * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), len = Math.abs(S * dx) + Math.abs(S * dy);
    return [S / 2 - dx * len / 2, S / 2 - dy * len / 2, S / 2 + dx * len / 2, S / 2 + dy * len / 2];
  }
  function isRtl(s) { return /[֐-ࣿ]/.test(s || ""); }
  var POS = { b: Math.PI / 2, bl: Math.PI * 0.75, t: Math.PI * 1.5 };
  // Angle where text column u (0..tw) sits on an arc of radius r centred at angle c. Bottom text runs counter-clockwise, top text clockwise.
  function arcAngle(pos, c, r, u, tw) { return pos === "t" ? c - (tw / 2 - u) / r : c + (tw / 2 - u) / r; }

  // ---------- render ----------
  function render(canvas, S, s, source) {
    canvas.width = S; canvas.height = S;
    var c = canvas.getContext("2d");
    c.clearRect(0, 0, S, S);
    c.save();
    shapePath(c, 0, 0, S, s.shape); c.clip();
    if (s.bg !== "none") {
      if (s.bg === "solid") c.fillStyle = s.bg1;
      else { var g = gradLine(S, s.bgA), gr = c.createLinearGradient(g[0], g[1], g[2], g[3]); gr.addColorStop(0, s.bg1); gr.addColorStop(1, s.bg2); c.fillStyle = gr; }
      c.fillRect(0, 0, S, S);
    }
    var rw = S * s.ringW / 100, gap = s.ringW > 0 ? S * s.ringGap / 100 : 0, inset = rw + gap, inner = S - 2 * inset;
    if (source) {
      c.save();
      shapePath(c, inset, inset, inner, s.shape); c.clip();
      var iw = source.naturalWidth || source.width, ih = source.naturalHeight || source.height;
      var k = inner / Math.min(iw, ih) * s.zoom;
      c.translate(S / 2 + s.px * S, S / 2 + s.py * S);
      c.rotate(s.rot * Math.PI / 180);
      if (s.flip) c.scale(-1, 1);
      c.imageSmoothingQuality = "high";
      c.drawImage(source, -iw * k / 2, -ih * k / 2, iw * k, ih * k);
      c.restore();
    }
    if (rw > 0) {
      shapePath(c, rw / 2, rw / 2, S - rw, s.shape);
      if (s.ringGrad && s.ring1 !== s.ring2) { var gr2 = c.createLinearGradient(0, 0, S, S); gr2.addColorStop(0, s.ring1); gr2.addColorStop(1, s.ring2); c.strokeStyle = gr2; }
      else c.strokeStyle = s.ring1;
      c.lineWidth = rw; c.stroke();
    }
    if (s.badgeOn && s.badgeText.trim()) badge(c, S, s);
    c.restore();
  }

  function badge(c, S, s) {
    var text = s.badgeText.trim(), bw = S * 0.13, fs = bw * 0.52, r = S / 2 - bw / 2, mid = POS[s.badgePos] || POS.bl;
    // 1. draw the text straight (the browser shapes Arabic and orders it), 2. bend it along the arc in thin strips.
    var t = document.createElement("canvas"), tc = t.getContext("2d");
    tc.font = "800 " + fs + "px " + FONT;
    var tw = Math.min(tc.measureText(text).width, Math.PI * r * 0.9), th = Math.ceil(bw);
    t.width = Math.ceil(tw) + 2; t.height = th;
    tc.font = "800 " + fs + "px " + FONT; tc.fillStyle = s.badgeInk; tc.textBaseline = "middle";
    tc.direction = isRtl(text) ? "rtl" : "ltr"; tc.textAlign = "center";
    tc.fillText(text, t.width / 2, th / 2 + fs * 0.04, tw);
    var span = (tw + bw * 1.1) / r;
    c.save();
    c.strokeStyle = s.badgeBg; c.lineWidth = bw; c.lineCap = "round";
    c.beginPath(); c.arc(S / 2, S / 2, r, mid - span / 2, mid + span / 2); c.stroke();
    var step = Math.max(1, S / 500);
    for (var u = 0; u < t.width; u += step) {
      var a = arcAngle(s.badgePos, mid, r, u + step / 2, t.width);
      c.save();
      c.translate(S / 2 + r * Math.cos(a), S / 2 + r * Math.sin(a));
      c.rotate(s.badgePos === "t" ? a + Math.PI / 2 : a - Math.PI / 2);
      c.drawImage(t, u, 0, Math.min(step + 0.6, t.width - u), th, -step / 2, -th / 2, Math.min(step + 0.6, t.width - u), th);
      c.restore();
    }
    c.restore();
  }

  // ---------- UI ----------
  function persist() { var keep = Object.assign({}, st); ["zoom", "rot", "px", "py", "flip"].forEach(function (k) { delete keep[k]; }); S3.store("pp.settings", keep); }
  var queued = false;
  function update() {
    persist();
    $("#zLbl").textContent = Math.round(st.zoom * 100) + "%"; $("#rLbl").textContent = st.rot + "°";
    $("#rwLbl").textContent = st.ringW + "%"; $("#rgLbl").textContent = st.ringGap + "%"; $("#bgALbl").textContent = st.bgA + "°";
    $("#bgCols").hidden = st.bg === "none"; $("#bg2Wrap").hidden = st.bg !== "gradient"; $("#bgAWrap").hidden = st.bg !== "gradient";
    $("#flip").setAttribute("aria-pressed", String(st.flip));
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; render(cv, PREVIEW, st, img); });
  }
  function seg(el, value, onPick) {
    $$("button", el).forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.v === String(value)));
      b.addEventListener("click", function () { $$("button", el).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); onPick(b.dataset.v); });
    });
  }
  function bindRange(id, num) { var el = $("#" + id); el.value = st[id]; el.addEventListener("input", function () { st[id] = num ? +el.value : el.value; update(); }); }
  ["zoom", "rot", "bgA", "ringW", "ringGap"].forEach(function (k) { bindRange(k, true); });
  ["bg1", "bg2", "ring1", "ring2", "badgeBg", "badgeInk", "badgeText"].forEach(function (k) { bindRange(k, false); });
  ["ringGrad", "badgeOn"].forEach(function (k) { $("#" + k).checked = st[k]; $("#" + k).addEventListener("change", function () { st[k] = this.checked; update(); }); });
  $("#badgeText").addEventListener("input", function () { if (!st.badgeOn && this.value.trim()) { st.badgeOn = true; $("#badgeOn").checked = true; update(); } });
  seg($("#shape"), st.shape, function (v) { st.shape = v; update(); });
  seg($("#bg"), st.bg, function (v) { st.bg = v; update(); });
  seg($("#badgePos"), st.badgePos, function (v) { st.badgePos = v; update(); });
  seg($("#out"), st.out, function (v) { st.out = +v; persist(); });
  RINGS.forEach(function (p) {
    var b = S3.h("button", { "class": "pp-sw", type: "button", title: p[0], "aria-label": p[0] + " ring", style: "background:linear-gradient(135deg," + p[1] + "," + p[2] + ")" });
    b.addEventListener("click", function () {
      st.ring1 = p[1]; st.ring2 = p[2]; st.ringGrad = p[1] !== p[2]; if (!st.ringW) st.ringW = 4;
      $("#ring1").value = p[1]; $("#ring2").value = p[2]; $("#ringGrad").checked = st.ringGrad; $("#ringW").value = st.ringW; update();
    });
    $("#ringPresets").appendChild(b);
  });
  $("#rot90").addEventListener("click", function () { st.rot = ((st.rot + 90 + 180) % 360) - 180; $("#rot").value = st.rot; update(); });
  $("#flip").addEventListener("click", function () { st.flip = !st.flip; update(); });
  $("#reset").addEventListener("click", function () { st.px = 0; st.py = 0; st.zoom = 1; st.rot = 0; $("#zoom").value = 1; $("#rot").value = 0; update(); });

  // drag / wheel / keys
  var drag = null;
  cv.addEventListener("pointerdown", function (e) { if (!img) return; drag = { x: e.clientX, y: e.clientY, px: st.px, py: st.py }; cv.setPointerCapture(e.pointerId); cv.classList.add("dragging"); });
  cv.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var w = cv.getBoundingClientRect().width;
    st.px = drag.px + (e.clientX - drag.x) / w; st.py = drag.py + (e.clientY - drag.y) / w; update();
  });
  function endDrag() { drag = null; cv.classList.remove("dragging"); }
  cv.addEventListener("pointerup", endDrag); cv.addEventListener("pointercancel", endDrag);
  cv.addEventListener("wheel", function (e) {
    if (!img) return;
    e.preventDefault();
    st.zoom = Math.max(0.5, Math.min(5, st.zoom * Math.exp(-e.deltaY * 0.0015))); $("#zoom").value = st.zoom; update();
  }, { passive: false });
  cv.addEventListener("keydown", function (e) {
    var d = e.shiftKey ? 0.05 : 0.01, m = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
    if (m) { e.preventDefault(); st.px += m[0]; st.py += m[1]; update(); }
    else if (e.key === "+" || e.key === "=") { st.zoom = Math.min(5, st.zoom * 1.05); $("#zoom").value = st.zoom; update(); }
    else if (e.key === "-") { st.zoom = Math.max(0.5, st.zoom / 1.05); $("#zoom").value = st.zoom; update(); }
  });

  // load
  function setImage(source, name) {
    img = source; imgName = name || "profile";
    st.px = 0; st.py = 0; st.zoom = 1; st.rot = 0; st.flip = false; $("#zoom").value = 1; $("#rot").value = 0;
    $("#drop").hidden = true; $("#sample").hidden = true; $("#editor").hidden = false; update();
  }
  var lastUrl = null;
  function openFile(f) {
    var url = URL.createObjectURL(f), im = new Image();
    im.onload = function () { if (lastUrl) URL.revokeObjectURL(lastUrl); lastUrl = url; setImage(im, (f.name || "profile").replace(/\.[^.]+$/, "")); };
    im.onerror = function () { URL.revokeObjectURL(url); S3.toast("Couldn't read that image", "error"); };
    im.src = url;
  }
  var input = S3.drop($("#drop"), function (fs) { openFile(fs[0]); }, { accept: "image/*", multiple: false });
  $("#newImg").addEventListener("click", function () { input.click(); });
  document.addEventListener("paste", function (e) {
    var it = Array.prototype.slice.call((e.clipboardData && e.clipboardData.items) || []).filter(function (x) { return x.type.indexOf("image/") === 0; })[0];
    if (it) { e.preventDefault(); var f = it.getAsFile(); if (f) openFile(f); }
  });

  // export
  function exportBlob() {
    var c = document.createElement("canvas");
    render(c, st.out, st, img);
    return new Promise(function (res, rej) { c.toBlob(function (b) { if (b) res(b); else rej(new Error("Export failed")); }, "image/png"); });
  }
  $("#dl").addEventListener("click", function () {
    if (!img) return;
    exportBlob().then(function (b) { S3.download(b, imgName + "-profile-" + st.out + ".png"); S3.done(); }, function (e) { S3.toast(e.message, "error"); });
  });
  $("#copy").addEventListener("click", function () {
    if (!img) return;
    if (!navigator.clipboard || !window.ClipboardItem || !window.isSecureContext) { S3.toast("Your browser can't copy images here. Use Download instead.", "error"); return; }
    navigator.clipboard.write([new ClipboardItem({ "image/png": exportBlob() })])
      .then(function () { S3.toast("Image copied ✓"); S3.done(); }, function () { S3.toast("Copy was blocked by the browser. Use Download instead.", "error"); });
  });

  // sample portrait drawn locally (no photo shipped)
  function sample() {
    var c = document.createElement("canvas"); c.width = 900; c.height = 1100;
    var x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 1100);
    g.addColorStop(0, "#c9e7f2"); g.addColorStop(1, "#7fb3c9"); x.fillStyle = g; x.fillRect(0, 0, 900, 1100);
    x.fillStyle = "#2c3e50"; x.beginPath(); x.ellipse(450, 1120, 380, 330, 0, Math.PI, 0); x.fill();               // shoulders
    x.fillStyle = "#e9eef2"; x.beginPath(); x.moveTo(370, 800); x.lineTo(450, 930); x.lineTo(530, 800); x.fill();      // collar
    x.fillStyle = "#d9a07a"; x.fillRect(395, 640, 110, 170);                                                           // neck
    x.beginPath(); x.ellipse(450, 520, 175, 215, 0, 0, Math.PI * 2); x.fill();                                         // face
    x.fillStyle = "#3a2a20"; x.beginPath(); x.ellipse(450, 400, 190, 140, 0, Math.PI, 0); x.fill();                   // hair
    x.beginPath(); x.ellipse(450, 345, 185, 90, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#3a2a20"; [380, 520].forEach(function (ex) { x.beginPath(); x.ellipse(ex, 520, 16, 11, 0, 0, 7); x.fill(); });
    x.strokeStyle = "#a2614a"; x.lineWidth = 9; x.lineCap = "round"; x.beginPath(); x.arc(450, 590, 60, 0.2 * Math.PI, 0.8 * Math.PI); x.stroke();
    return c;
  }
  $("#sample").addEventListener("click", function () { setImage(sample(), "sample"); });
  update();

  window.S3_DEMO = function () {
    Object.assign(st, { shape: "circle", bg: "gradient", bg1: "#c9e7f2", bg2: "#7fb3c9", ringW: 4, ringGap: 1.5, ring1: "#3dd6d0", ring2: "#3b5bdb", ringGrad: true,
      badgeOn: true, badgeText: "#OPENTOWORK", badgeBg: "#2f7d4f", badgeInk: "#ffffff", badgePos: "bl" });
    ["bg1", "bg2", "ringW", "ringGap", "ring1", "ring2", "badgeText", "badgeBg", "badgeInk"].forEach(function (k) { $("#" + k).value = st[k]; });
    $("#badgeOn").checked = true; $("#ringGrad").checked = true;
    $$("#bg button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === "gradient")); });
    setImage(sample(), "sample");
    st.zoom = 1.15; st.py = 0.04; $("#zoom").value = st.zoom; update();
  };

  window.S3_SELFTEST = function () {
    function solid(col, w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; var x = c.getContext("2d"); x.fillStyle = col; x.fillRect(0, 0, w, h); return c; }
    function at(c, x, y) { return c.getContext("2d").getImageData(x, y, 1, 1).data; }
    var red = solid("#ff0000", 300, 200), base = Object.assign({}, DEF, { ringW: 0, badgeOn: false, bg: "none" }), out = document.createElement("canvas");
    render(out, 400, Object.assign({}, base, { shape: "circle" }), red);
    var c0 = at(out, 1, 1), c1 = at(out, 398, 398), mid = at(out, 200, 200), edge = at(out, 200, 2);
    var circle = out.width === 400 && c0[3] === 0 && c1[3] === 0 && mid[3] === 255 && mid[0] === 255 && mid[1] === 0 && edge[3] === 255;
    render(out, 400, Object.assign({}, base, { shape: "rounded" }), red);
    var rounded = at(out, 1, 1)[3] === 0 && at(out, 200, 1)[3] === 255 && at(out, 1, 200)[3] === 255;
    render(out, 400, Object.assign({}, base, { shape: "square" }), red);
    var square = at(out, 0, 0)[3] === 255;
    // zoomed out: background fills the corners of the circle area, outside stays transparent
    render(out, 400, Object.assign({}, base, { shape: "circle", zoom: 0.5, bg: "solid", bg1: "#0000ff" }), red);
    var zbg = at(out, 200, 20), zout = at(out, 0, 0);
    var bgOk = zbg[2] === 255 && zbg[0] === 0 && zout[3] === 0;
    // ring: 5% of 400 = 20 px band at the edge, then a 2% gap of background
    render(out, 400, Object.assign({}, base, { ringW: 5, ringGap: 2, ring1: "#00ff00", ringGrad: false, bg: "solid", bg1: "#0000ff" }), red);
    var ring = at(out, 200, 10), gapPx = at(out, 200, 24), photo = at(out, 200, 60);
    var ringOk = ring[1] === 255 && ring[0] === 0 && gapPx[2] === 255 && gapPx[0] === 0 && photo[0] === 255 && photo[2] === 0;
    // badge band sits on the bottom edge; rotate 180 keeps the centre opaque
    render(out, 400, Object.assign({}, base, { badgeOn: true, badgeText: "TEST", badgeBg: "#0000ff", badgeInk: "#0000ff", badgePos: "b", rot: 180 }), red);
    var band = at(out, 200, 400 - 26), top = at(out, 200, 26);
    var badgeOk = band[2] > 200 && band[0] < 60 && top[0] === 255;
    // arc maths: bottom text runs right-to-left in angle (counter-clockwise), top text the other way
    var a0 = arcAngle("b", Math.PI / 2, 100, 0, 50), a1 = arcAngle("b", Math.PI / 2, 100, 50, 50), t0 = arcAngle("t", Math.PI * 1.5, 100, 0, 50);
    var arcOk = Math.abs(a0 - (Math.PI / 2 + 0.25)) < 1e-12 && Math.abs(a1 - (Math.PI / 2 - 0.25)) < 1e-12 && Math.abs(t0 - (Math.PI * 1.5 - 0.25)) < 1e-12;
    // Arabic badge renders without throwing and draws ink
    render(out, 400, Object.assign({}, base, { badgeOn: true, badgeText: "متاح للعمل", badgeBg: "#000000", badgeInk: "#ffffff", badgePos: "bl" }), red);
    return circle && rounded && square && bgOk && ringOk && badgeOk && arcOk && out.width === 400;
  };
})();
