/* ==========================================================================
   Physik GK — gemeinsame Komponenten: DataTable, StepGuide, Helper
   ========================================================================== */

function qs(sel, el) { return (el || document).querySelector(sel); }
function qsa(sel, el) { return Array.from((el || document).querySelectorAll(sel)); }

function fmt(x, decimals) {
  if (x === null || x === undefined || Number.isNaN(x)) return "–";
  if (decimals === undefined) decimals = 2;
  return Number(x).toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/* Formatiert eine Zahl in wissenschaftlicher Schreibweise, z.B. 6,63 · 10⁻³⁴ */
function fmtSci(x, sig) {
  if (x === null || x === undefined || Number.isNaN(x)) return "–";
  sig = sig || 3;
  if (x === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(x)));
  const mant = x / Math.pow(10, exp);
  const sup = String(exp).replace(/-/g, "⁻").replace(/[0-9]/g, d =>
    "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]
  );
  return `${mant.toFixed(sig - 1)} · 10${sup}`;
}

/* ---------------------------------------------------------------------- */
/* DataTable                                                               */
/* ---------------------------------------------------------------------- */

class DataTable {
  /**
   * @param {HTMLElement} container
   * @param {{key:string,label:string,unit?:string,decimals?:number}[]} columns
   * @param {{onChange?:(rows:object[])=>void, emptyText?:string}} opts
   */
  constructor(container, columns, opts = {}) {
    this.container = container;
    this.columns = columns;
    this.rows = [];
    this.onChange = opts.onChange || (() => {});
    this.emptyText = opts.emptyText || "Noch keine Messwerte. Stelle die Größen ein und klicke auf „Messen“.";
    this._render();
  }

  addRow(row) {
    row.__id = Date.now() + Math.random();
    this.rows.push(row);
    this._render();
    this.onChange(this.rows);
  }

  removeAt(index) {
    this.rows.splice(index, 1);
    this._render();
    this.onChange(this.rows);
  }

  clear() {
    this.rows = [];
    this._render();
    this.onChange(this.rows);
  }

  _render() {
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";

    if (this.rows.length === 0) {
      wrap.innerHTML = `<div class="table-empty">${this.emptyText}</div>`;
      this.container.innerHTML = "";
      this.container.appendChild(wrap);
      return;
    }

    const table = document.createElement("table");
    table.className = "data-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.innerHTML = `<th>#</th>` +
      this.columns.map(c => `<th>${c.label}${c.unit ? ` <span style="opacity:.7">[${c.unit}]</span>` : ""}</th>`).join("") +
      `<th></th>`;
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    this.rows.forEach((row, i) => {
      const tr = document.createElement("tr");
      let cells = `<td class="num">${i + 1}</td>`;
      cells += this.columns.map(c => {
        const v = row[c.key];
        let text;
        if (typeof v !== "number") text = v ?? "–";
        else text = c.sci ? fmtSci(v, c.decimals || 3) : fmt(v, c.decimals);
        return `<td class="num">${text}</td>`;
      }).join("");
      cells += `<td class="del-cell"><button class="row-del" title="Messung löschen" data-i="${i}">✕</button></td>`;
      tr.innerHTML = cells;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);

    this.container.innerHTML = "";
    this.container.appendChild(wrap);

    qsa(".row-del", wrap).forEach(btn => {
      btn.addEventListener("click", () => this.removeAt(Number(btn.dataset.i)));
    });
  }
}

/* ---------------------------------------------------------------------- */
/* StepGuide — geführte, schrittweise Auswertung                          */
/* ---------------------------------------------------------------------- */

/**
 * steps: [{
 *   title: string,
 *   body: string (HTML),
 *   note: boolean            -> zeigt ein Notizfeld für eigene Vermutung/Antwort
 *   notePlaceholder: string,
 *   hint: string (HTML)      -> optionaler Hinweis-Toggle
 *   reveal: string (HTML)    -> optionale Lösung/Auswertung, per Klick sichtbar
 *   revealLabel: string      -> Beschriftung des Reveal-Buttons
 * }]
 */
class StepGuide {
  constructor(container, opts) {
    this.container = container;
    this.title = opts.title;
    this.intro = opts.intro || "";
    this.steps = opts.steps;
    this.openIndex = 0;
    this._build();
  }

  _build() {
    const head = document.createElement("div");
    head.className = "stepguide-head";
    head.innerHTML = `<h3>${this.title}</h3>${this.intro ? `<p>${this.intro}</p>` : ""}`;
    this.container.appendChild(head);

    this.steps.forEach((step, i) => {
      const el = document.createElement("div");
      el.className = "step" + (i === 0 ? " open active" : "");
      el.innerHTML = `
        <div class="step-head">
          <div class="step-num">${i + 1}</div>
          <div class="step-title">${step.title}</div>
          <div class="step-chevron">▶</div>
        </div>
        <div class="step-body">
          <div class="step-text">${step.body}</div>
          ${step.note ? `<textarea placeholder="${step.notePlaceholder || "Notiere hier deine Beobachtung oder Vermutung…"}"></textarea>` : ""}
          <div class="step-actions"></div>
          ${step.hint ? `<div class="reveal-box hint"><div class="rb-label">Hinweis</div>${step.hint}</div>` : ""}
          ${step.reveal ? `<div class="reveal-box"><div class="rb-label">${step.revealLabel || "Auswertung"}</div>${step.reveal}</div>` : ""}
        </div>
      `;
      this.container.appendChild(el);

      const headEl = qs(".step-head", el);
      headEl.addEventListener("click", () => this._toggle(el));

      const actions = qs(".step-actions", el);
      if (step.hint) {
        const btn = document.createElement("button");
        btn.className = "btn btn-ghost btn-sm";
        btn.textContent = "💡 Hinweis anzeigen";
        btn.addEventListener("click", () => {
          const box = qs(".reveal-box.hint", el);
          box.classList.toggle("shown");
          btn.textContent = box.classList.contains("shown") ? "Hinweis ausblenden" : "💡 Hinweis anzeigen";
        });
        actions.appendChild(btn);
      }
      if (step.reveal) {
        const btn = document.createElement("button");
        btn.className = "btn btn-secondary btn-sm";
        btn.textContent = (step.revealLabel ? `${step.revealLabel} anzeigen` : "Auswertung anzeigen");
        btn.addEventListener("click", () => {
          const box = qs(".reveal-box:not(.hint)", el);
          box.classList.add("shown");
          el.classList.add("done");
          btn.disabled = true;
          btn.textContent = "✓ angezeigt";
          this._openNext(i);
        });
        actions.appendChild(btn);
      } else if (i < this.steps.length - 1) {
        const btn = document.createElement("button");
        btn.className = "btn btn-secondary btn-sm";
        btn.textContent = "Weiter";
        btn.addEventListener("click", () => {
          el.classList.add("done");
          this._openNext(i);
        });
        actions.appendChild(btn);
      }
    });
  }

  _toggle(stepEl) {
    const wasOpen = stepEl.classList.contains("open");
    qsa(".step", this.container).forEach(s => s.classList.remove("open", "active"));
    if (!wasOpen) {
      stepEl.classList.add("open", "active");
    }
  }

  _openNext(i) {
    const steps = qsa(".step", this.container);
    if (steps[i + 1]) {
      steps.forEach(s => s.classList.remove("open", "active"));
      steps[i + 1].classList.add("open", "active");
      steps[i + 1].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

/* ---------------------------------------------------------------------- */
/* ScenePlayer — szenenbasierte SVG-Erklär-Animationen (3B1B-Stil)        */
/* ---------------------------------------------------------------------- */

const SVGNS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs) {
  const el = document.createElementNS(SVGNS, tag);
  if (attrs) Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
  return el;
}

class ScenePlayer {
  /**
   * @param {HTMLElement} container
   * @param {{caption:string, render:(svg:SVGElement)=>(void|(()=>void))}[]} scenes
   */
  constructor(container, scenes, opts = {}) {
    this.container = container;
    this.scenes = scenes;
    this.idx = 0;
    this.viewBox = opts.viewBox || "0 0 800 450";
    this._cleanup = null;
    this._build();
  }

  _build() {
    this.container.className = "scene-player";
    this.container.innerHTML = `
      <div class="scene-stage">
        <svg viewBox="${this.viewBox}" preserveAspectRatio="xMidYMid meet"></svg>
      </div>
      <div class="scene-caption"></div>
      <div class="scene-controls">
        <button class="btn btn-secondary btn-sm" data-act="prev">◀ Zurück</button>
        <div class="scene-progress"></div>
        <button class="btn btn-secondary btn-sm" data-act="next">Weiter ▶</button>
      </div>
    `;
    this.svg = qs("svg", this.container);
    this.captionEl = qs(".scene-caption", this.container);
    this.progressEl = qs(".scene-progress", this.container);

    this.scenes.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.className = "dot";
      dot.addEventListener("click", () => this.show(i));
      this.progressEl.appendChild(dot);
    });

    qs('[data-act="prev"]', this.container).addEventListener("click", () => this.show(this.idx - 1));
    qs('[data-act="next"]', this.container).addEventListener("click", () => this.show(this.idx + 1));

    document.addEventListener("keydown", e => {
      if (!this._isInViewport()) return;
      if (e.key === "ArrowRight") this.show(this.idx + 1);
      if (e.key === "ArrowLeft") this.show(this.idx - 1);
    });

    this.show(0);
  }

  _isInViewport() {
    const rect = this.container.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  show(i) {
    if (i < 0 || i >= this.scenes.length) return;
    if (this._cleanup) { try { this._cleanup(); } catch (e) {} this._cleanup = null; }
    this.idx = i;
    const scene = this.scenes[i];

    while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);
    const result = scene.render(this.svg);
    if (typeof result === "function") this._cleanup = result;

    this.captionEl.innerHTML = scene.caption;

    qsa(".dot", this.progressEl).forEach((d, di) => {
      d.classList.toggle("active", di === i);
      d.classList.toggle("past", di < i);
    });

    qs('[data-act="prev"]', this.container).disabled = i === 0;
    qs('[data-act="next"]', this.container).disabled = i === this.scenes.length - 1;

    // Enter-Transition anstoßen
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        qsa("[data-anim]", this.svg).forEach(el => {
          const delay = Number(el.getAttribute("data-delay") || 0);
          setTimeout(() => el.classList.add("in"), delay);
        });
      });
    });
  }
}

/* ---------------------------------------------------------------------- */
/* Kleine Statistik-Helfer                                                 */
/* ---------------------------------------------------------------------- */

function linearRegression(points) {
  // points: [{x,y}]
  const n = points.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  points.forEach(p => {
    sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; syy += p.y * p.y;
  });
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const m = (n * sxy - sx * sy) / denom;
  const b = (sy - m * sx) / n;
  const yMean = sy / n;
  let ssRes = 0, ssTot = 0;
  points.forEach(p => {
    const yPred = m * p.x + b;
    ssRes += (p.y - yPred) ** 2;
    ssTot += (p.y - yMean) ** 2;
  });
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { m, b, r2 };
}

function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }

/* Wellenlänge (nm, sichtbar 380–700) -> CSS-Farbe, nach Dan Bruton */
function wavelengthToRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / (440 - 380); g = 0; b = 1; }
  else if (nm >= 440 && nm < 490) { r = 0; g = (nm - 440) / (490 - 440); b = 1; }
  else if (nm >= 490 && nm < 510) { r = 0; g = 1; b = -(nm - 510) / (510 - 490); }
  else if (nm >= 510 && nm < 580) { r = (nm - 510) / (580 - 510); g = 1; b = 0; }
  else if (nm >= 580 && nm < 645) { r = 1; g = -(nm - 645) / (645 - 580); b = 0; }
  else if (nm >= 645 && nm <= 700) { r = 1; g = 0; b = 0; }
  let factor = 1;
  if (nm >= 380 && nm < 420) factor = 0.3 + 0.7 * (nm - 380) / (420 - 380);
  else if (nm > 645) factor = 0.3 + 0.7 * (700 - nm) / (700 - 645);
  const gamma = 0.8;
  const to255 = c => c <= 0 ? 0 : Math.round(255 * Math.pow(c * factor, gamma));
  return `rgb(${to255(r)}, ${to255(g)}, ${to255(b)})`;
}

/* Physikalische Konstanten (SI) */
const PHYS = {
  h: 6.62607015e-34,   // J s
  e: 1.602176634e-19,  // C
  me: 9.1093837015e-31,// kg
  c: 2.99792458e8,     // m/s
  g: 9.81,             // m/s^2
  mu0: 4 * Math.PI * 1e-7
};

/* ---------------------------------------------------------------------- */
/* Aktiven Nav-Link markieren                                              */
/* ---------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  const path = location.pathname.replace(/\/index\.html$/, "/");
  qsa("nav.main-nav a").forEach(a => {
    const href = a.getAttribute("href");
    if (!href) return;
    const resolved = new URL(href, location.href).pathname.replace(/\/index\.html$/, "/");
    if (resolved === path) a.classList.add("active");
  });
});

/* Favicon: Atom-Icon als Inline-SVG, einheitlich auf allen Seiten */
(function injectFavicon() {
  if (document.querySelector('link[rel="icon"]')) return;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="15" fill="#10121a"/>
    <g fill="none" stroke="#4fd3c0" stroke-width="1.6">
      <ellipse cx="16" cy="16" rx="13" ry="5.6"/>
      <ellipse cx="16" cy="16" rx="13" ry="5.6" transform="rotate(60 16 16)"/>
      <ellipse cx="16" cy="16" rx="13" ry="5.6" transform="rotate(120 16 16)"/>
    </g>
    <circle cx="16" cy="16" r="3.4" fill="#7e97ff"/>
    <circle cx="29" cy="16" r="1.9" fill="#7e97ff"/>
    <circle cx="8.3" cy="5.1" r="1.9" fill="#4fd3c0"/>
    <circle cx="8.3" cy="26.9" r="1.9" fill="#4fd3c0"/>
  </svg>`;
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  link.href = "data:image/svg+xml," + encodeURIComponent(svg);
  document.head.appendChild(link);
})();
