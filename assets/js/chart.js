/* ==========================================================================
   Physik GK — ScatterChart: minimalistische Canvas-Diagrammbibliothek
   ========================================================================== */

function _niceStep(range, targetTicks) {
  if (range === 0) return 1;
  const rough = range / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let step;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  return step * mag;
}

class ScatterChart {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} opts
   */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.opts = Object.assign({
      xLabel: "x", yLabel: "y",
      xUnit: "", yUnit: "",
      showRegression: false,
      regressionLabel: "Ausgleichsgerade",
      pointColor: null,
      lineColor: null,
      minPointsForFit: 2,
      height: 320,
      padZero: true,
    }, opts);
    this.points = [];
    this._resizeObserver = new ResizeObserver(() => this._draw());
    this._resizeObserver.observe(canvas.parentElement);
    this._draw();
  }

  setPoints(points) {
    this.points = points;
    this._draw();
    return this;
  }

  _cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  _dpr() { return Math.max(1, window.devicePixelRatio || 1); }

  _draw() {
    const ctx = this.ctx;
    const cssWidth = this.canvas.parentElement.clientWidth - 32; // minus panel padding
    const cssHeight = this.opts.height;
    const dpr = this._dpr();
    this.canvas.width = Math.max(1, cssWidth * dpr);
    this.canvas.height = Math.max(1, cssHeight * dpr);
    this.canvas.style.width = cssWidth + "px";
    this.canvas.style.height = cssHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const textColor = this._cssVar("--text-muted", "#5b6274");
    const faint = this._cssVar("--text-faint", "#8790a3");
    const border = this._cssVar("--border", "#dde1ea");
    const pointColor = this.opts.pointColor || this._cssVar("--accent", "#3454d1");
    const lineColor = this.opts.lineColor || this._cssVar("--teal", "#0f9d8c");

    const padL = 58, padR = 20, padT = 18, padB = 46;
    const plotW = cssWidth - padL - padR;
    const plotH = cssHeight - padT - padB;

    ctx.font = "12px " + getComputedStyle(document.body).fontFamily;

    if (this.points.length === 0) {
      ctx.fillStyle = faint;
      ctx.textAlign = "center";
      ctx.fillText("Noch keine Messwerte im Diagramm", cssWidth / 2, cssHeight / 2);
      return;
    }

    let xs = this.points.map(p => p.x);
    let ys = this.points.map(p => p.y);
    let xMin = Math.min(...xs), xMax = Math.max(...xs);
    let yMin = Math.min(...ys), yMax = Math.max(...ys);
    if (this.opts.padZero) { xMin = Math.min(xMin, 0); yMin = Math.min(yMin, 0); }
    if (xMin === xMax) { xMin -= 1; xMax += 1; }
    if (yMin === yMax) { yMin -= 1; yMax += 1; }

    const xStep = _niceStep(xMax - xMin, 5);
    const yStep = _niceStep(yMax - yMin, 5);
    const xTicks = [];
    for (let v = Math.floor(xMin / xStep) * xStep; v <= xMax + 1e-9; v += xStep) xTicks.push(v);
    const yTicks = [];
    for (let v = Math.floor(yMin / yStep) * yStep; v <= yMax + 1e-9; v += yStep) yTicks.push(v);

    const xLo = xTicks[0], xHi = xTicks[xTicks.length - 1];
    const yLo = yTicks[0], yHi = yTicks[yTicks.length - 1];

    const X = x => padL + ((x - xLo) / (xHi - xLo || 1)) * plotW;
    const Y = y => padT + plotH - ((y - yLo) / (yHi - yLo || 1)) * plotH;

    // Gridlines + Ticks
    ctx.strokeStyle = border;
    ctx.fillStyle = textColor;
    ctx.lineWidth = 1;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    yTicks.forEach(v => {
      const y = Y(v);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.strokeStyle = border;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillText(fmt(v, Math.abs(yStep) < 1 ? 2 : 0), padL - 8, y);
    });
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    xTicks.forEach(v => {
      const x = X(v);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.strokeStyle = border;
      ctx.globalAlpha = 0.35;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillText(fmt(v, Math.abs(xStep) < 1 ? 2 : 0), x, padT + plotH + 8);
    });

    // Axes
    ctx.strokeStyle = faint;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = textColor;
    ctx.font = "600 12.5px " + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const xLabelText = this.opts.xLabel + (this.opts.xUnit ? ` [${this.opts.xUnit}]` : "");
    ctx.fillText(xLabelText, padL + plotW / 2, cssHeight - 6);

    ctx.save();
    ctx.translate(14, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    const yLabelText = this.opts.yLabel + (this.opts.yUnit ? ` [${this.opts.yUnit}]` : "");
    ctx.fillText(yLabelText, 0, 0);
    ctx.restore();

    // Regression line
    let reg = null;
    if (this.opts.showRegression && this.points.length >= this.opts.minPointsForFit) {
      reg = linearRegression(this.points);
      if (reg) {
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        const y1 = reg.m * xLo + reg.b;
        const y2 = reg.m * xHi + reg.b;
        ctx.moveTo(X(xLo), Y(y1));
        ctx.lineTo(X(xHi), Y(y2));
        ctx.stroke();
      }
    }

    // Points
    this.points.forEach(p => {
      ctx.beginPath();
      ctx.arc(X(p.x), Y(p.y), 5, 0, Math.PI * 2);
      ctx.fillStyle = pointColor;
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = this._cssVar("--bg-elevated", "#fff");
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    this._lastRegression = reg;
    return reg;
  }

  getRegression() {
    return this._lastRegression || (this.points.length >= 2 ? linearRegression(this.points) : null);
  }
}
