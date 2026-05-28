/* ── Progress modal ── */
const progressModal = document.getElementById("progressModal");

function openProgressModal(exerciseName) {
  progressModal.classList.add("open");
  if (exerciseName) {
    document.getElementById("progExSearch").value = exerciseName;
    loadAndRenderProgress(exerciseName);
  } else {
    document.getElementById("progExSearch").value = "";
    document.getElementById("progEmpty").style.display      = "block";
    document.getElementById("progStatStrip").style.display  = "none";
    document.getElementById("progChartWrap").style.display  = "none";
    document.getElementById("progHistWrap").style.display   = "none";
  }
}

function closeProgressModal() {
  progressModal.classList.remove("open");
}

document.getElementById("progClose").addEventListener("click", closeProgressModal);
progressModal.addEventListener("click", e => { if (e.target === progressModal) closeProgressModal(); });

document.getElementById("progExSearch").addEventListener("input", e => {
  const val = e.target.value.trim();
  if (val.length > 0) loadAndRenderProgress(val);
});
document.getElementById("progExSearch").addEventListener("change", e => {
  const val = e.target.value.trim();
  if (val.length > 0) loadAndRenderProgress(val);
});

async function loadAndRenderProgress(exerciseName) {
  document.getElementById("progEmpty").style.display     = "none";
  document.getElementById("progStatStrip").style.display = "none";
  document.getElementById("progChartWrap").style.display = "none";
  document.getElementById("progHistWrap").style.display  = "none";
  const strip = document.getElementById("progStatStrip");
  strip.innerHTML = '<div class="prog-stat"><div class="prog-stat-label">Cargando</div><div class="prog-stat-val">⏳</div></div>';
  strip.style.display = "flex";
  try {
    const history = await supa.rpc("gym_exercise_history", { p_exercise: exerciseName });
    if (!history || history.length === 0) {
      strip.style.display = "none";
      document.getElementById("progEmpty").textContent   = `Sin datos para "${exerciseName}"`;
      document.getElementById("progEmpty").style.display = "block";
      return;
    }
    renderProgressData(exerciseName, history);
  } catch (e) {
    strip.style.display = "none";
    document.getElementById("progEmpty").textContent   = "Error al cargar historial";
    document.getElementById("progEmpty").style.display = "block";
    console.error("loadProgress:", e);
  }
}

function epley1RM(w, r) {
  if (!w || !r || r <= 0) return null;
  if (r === 1) return w;
  return Math.round(w * (1 + r / 30));
}

function renderProgressData(exerciseName, history) {
  const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const sorted = [...history].sort((a, b) => {
    if (a.year  !== b.year)  return a.year  - b.year;
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  });

  const byDay = {};
  sorted.forEach(s => {
    const key = `${s.year}-${String(s.month).padStart(2,"0")}-${String(s.day).padStart(2,"0")}`;
    if (!byDay[key] || (s.weight_kg||0) > (byDay[key].weight_kg||0))
      byDay[key] = { ...s, _key: key };
  });
  const dayPoints = Object.values(byDay).sort((a, b) => a._key.localeCompare(b._key));

  let prSet = null;
  sorted.forEach(s => {
    const rm = epley1RM(s.weight_kg, s.reps);
    if (!prSet || (rm||0) > (epley1RM(prSet.weight_kg, prSet.reps)||0)) prSet = s;
  });

  let progressTxt = "—";
  if (dayPoints.length >= 2) {
    const diff = (dayPoints[dayPoints.length-1].weight_kg||0) - (dayPoints[0].weight_kg||0);
    progressTxt = diff > 0 ? `+${diff}kg ↑` : diff < 0 ? `${diff}kg ↓` : "Sin cambio";
  }

  const lastPt   = dayPoints[dayPoints.length-1];
  const lastDate = lastPt ? new Date(lastPt.year, lastPt.month-1, lastPt.day) : null;
  const daysAgo  = lastDate ? Math.round((new Date()-lastDate)/86400000) : null;
  const lastTxt  = daysAgo === null ? "—" : daysAgo === 0 ? "Hoy" : daysAgo === 1 ? "Ayer" : `Hace ${daysAgo} días`;

  const pr1RM = prSet ? epley1RM(prSet.weight_kg, prSet.reps) : null;
  const strip = document.getElementById("progStatStrip");
  strip.innerHTML = `
    <div class="prog-stat">
      <div class="prog-stat-label">PR</div>
      <div class="prog-stat-val gold">${prSet ? prSet.weight_kg+"kg×"+prSet.reps : "—"}</div>
    </div>
    <div class="prog-stat">
      <div class="prog-stat-label">Est. 1RM</div>
      <div class="prog-stat-val gold">${pr1RM ? pr1RM+"kg" : "—"}</div>
    </div>
    <div class="prog-stat">
      <div class="prog-stat-label">Sesiones</div>
      <div class="prog-stat-val">${dayPoints.length}</div>
    </div>
    <div class="prog-stat">
      <div class="prog-stat-label">Progreso</div>
      <div class="prog-stat-val ${progressTxt.includes("↑")?"green":""}">${progressTxt}</div>
    </div>
    <div class="prog-stat">
      <div class="prog-stat-label">Último</div>
      <div class="prog-stat-val" style="font-size:13px">${lastTxt}</div>
    </div>
  `;
  strip.style.display = "flex";

  if (dayPoints.length >= 2) {
    renderProgressChart(dayPoints, prSet, MONTHS_SHORT);
    document.getElementById("progChartWrap").style.display = "block";
  } else {
    document.getElementById("progChartWrap").style.display = "none";
  }

  const histList = document.getElementById("progHistList");
  histList.innerHTML = "";
  [...sorted].reverse().forEach(s => {
    const rm  = epley1RM(s.weight_kg, s.reps);
    const isPR = prSet && s.weight_kg === prSet.weight_kg && s.reps === prSet.reps;
    const row = document.createElement("div");
    row.className = "prog-session";
    row.innerHTML = `
      <span class="prog-session-date">${s.day} ${MONTHS_SHORT[s.month-1]}</span>
      <span class="prog-session-weight">${s.weight_kg != null ? s.weight_kg+"kg" : "—"}</span>
      <span class="prog-session-reps">${s.reps != null ? "× "+s.reps+" reps" : ""}</span>
      ${isPR ? '<span class="prog-session-pr">🏆 PR</span>' : ""}
      ${rm   ? `<span class="prog-session-1rm">1RM ~${rm}kg</span>` : ""}
    `;
    histList.appendChild(row);
  });
  document.getElementById("progHistWrap").style.display = "block";
}

function renderProgressChart(dayPoints, prSet, MONTHS_SHORT) {
  const svgEl = document.getElementById("progChart");
  const W = svgEl.parentElement.clientWidth || 320;
  const H = 150;
  const PAD = { top:22, right:14, bottom:32, left:44 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  const weights = dayPoints.map(p => p.weight_kg||0);
  const minW  = Math.max(0, Math.min(...weights) - 5);
  const maxW  = Math.max(...weights) + 5;
  const wRange = maxW - minW || 1;

  const n   = dayPoints.length;
  const xOf = i => PAD.left + (i/(n-1)) * chartW;
  const yOf = w => PAD.top  + chartH - ((w-minW)/wRange) * chartH;

  let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;

  [0, 0.5, 1].forEach(t => {
    const y = PAD.top + chartH - t * chartH;
    svg += `<line x1="${PAD.left}" y1="${y}" x2="${PAD.left+chartW}" y2="${y}" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>`;
    svg += `<text x="${PAD.left-6}" y="${y+4}" font-size="9" fill="rgba(255,255,255,0.35)" text-anchor="end">${Math.round(minW+t*wRange)}</text>`;
  });

  const linePoints = dayPoints.map((p,i) => `${xOf(i)},${yOf(p.weight_kg||0)}`).join(" ");
  const areaPoints = `${xOf(0)},${PAD.top+chartH} ${linePoints} ${xOf(n-1)},${PAD.top+chartH}`;
  svg += `<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#7dff9b" stop-opacity="0.25"/>
    <stop offset="100%" stop-color="#7dff9b" stop-opacity="0"/>
  </linearGradient></defs>`;
  svg += `<polygon points="${areaPoints}" fill="url(#cg)"/>`;

  const d = dayPoints.map((p,i) => `${i===0?"M":"L"}${xOf(i)},${yOf(p.weight_kg||0)}`).join(" ");
  svg += `<path d="${d}" fill="none" stroke="#7dff9b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;

  dayPoints.forEach((p, i) => {
    const x   = xOf(i), y = yOf(p.weight_kg||0);
    const isPR = prSet && p.weight_kg === prSet.weight_kg && p.day === prSet.day && p.month === prSet.month;
    const col  = isPR ? "#ffd93d" : "#7dff9b";
    const r    = isPR ? 5 : 3.5;
    svg += `<circle cx="${x}" cy="${y}" r="${r+2}" fill="rgba(0,0,0,0.5)"/>`;
    svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`;
    svg += `<text x="${x}" y="${y-8}" font-size="9" fill="${col}" text-anchor="middle" font-weight="600">${p.weight_kg||""}</text>`;
    if (i===0 || i===n-1 || n<=8 || i%Math.ceil(n/5)===0) {
      svg += `<text x="${x}" y="${H-4}" font-size="8" fill="rgba(255,255,255,0.3)" text-anchor="middle">${p.day} ${MONTHS_SHORT[p.month-1]}</text>`;
    }
  });
  svg += `</svg>`;

  const tmp = document.createElement("div");
  tmp.innerHTML = svg;
  const newSvg = tmp.firstChild;
  newSvg.id = "progChart";
  svgEl.parentNode.replaceChild(newSvg, svgEl);
}
