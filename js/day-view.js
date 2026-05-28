/* ── Day view: full-screen panel ── */
const dayPopup = document.getElementById("dayPopup");
dayPopup._day    = null;
dayPopup._muscle = null;

function buildMuscleGrid() {
  const grid = document.getElementById("muscleGrid");
  grid.innerHTML = "";
  MUSCLES.forEach(m => {
    const mc  = MUSCLE_COLORS[m.id];
    const btn = document.createElement("button");
    btn.className   = "muscle-btn";
    btn.dataset.id  = m.id;
    btn.textContent = m.icon + " " + m.label;
    const onSelect = e => { e.stopPropagation(); e.preventDefault(); selectMuscleBtn(btn, m.id, mc); };
    btn.addEventListener("touchstart", onSelect, { passive: false });
    btn.addEventListener("click", onSelect);
    grid.appendChild(btn);
  });
}

function selectMuscleBtn(btn, muscleId, mc) {
  const isAlreadySelected = dayPopup._muscle === muscleId;
  document.querySelectorAll(".muscle-btn").forEach(b => {
    b.classList.remove("selected");
    b.style.background = b.style.borderColor = b.style.color = "";
  });
  if (isAlreadySelected) {
    dayPopup._muscle = null;
    document.getElementById("muscleHint").textContent = "";
  } else {
    btn.classList.add("selected");
    btn.style.background  = mc.css + "22";
    btn.style.borderColor = mc.css + "99";
    btn.style.color       = mc.css;
    dayPopup._muscle      = muscleId;
    const ago = getLastTrainedDays(muscleId);
    document.getElementById("muscleHint").textContent =
      ago===null ? "" : ago===1 ? "Último: ayer" : `Último: hace ${ago} días`;
  }
}

function clearMuscleSelection() {
  document.querySelectorAll(".muscle-btn").forEach(b => {
    b.classList.remove("selected");
    b.style.background = b.style.borderColor = b.style.color = "";
  });
  dayPopup._muscle = null;
  const hint = document.getElementById("muscleHint");
  if (hint) hint.textContent = "";
}

/* ── Status helpers ── */
function _dayStatus(d) {
  if (d.isWeekendBonus) return "💙 Fin de semana 3×";
  if (d.isDone)         return "✅ Gym hecho";
  if (d.isMiss)         return "❌ Falla marcada";
  if (d.isAutofail)     return "🔴 Día pasado sin registrar";
  if (d.isToday)        return "🟡 Hoy";
  if (d.wknd)           return "🏖 Fin de semana (3× si vas)";
  return "⬜ Día futuro";
}

function openPopup(cube, sx, sy) {
  highlightCube(cube);
  const d = cube.userData;
  dayPopup._day = d.day;

  document.getElementById("dvTitle").textContent =
    DAYS_ES[d.dow] + " " + d.day + " de " + MONTHS[curMonth];
  document.getElementById("dvStatus").textContent = _dayStatus(d);

  /* Action buttons visibility */
  const canEdit = !d.isAutofail;
  document.getElementById("btnDone").style.display  = canEdit             ? "" : "none";
  document.getElementById("btnMiss").style.display  = (canEdit&&!d.wknd) ? "" : "none";
  document.getElementById("btnReset").style.display = (canEdit&&d.state)  ? "" : "none";
  document.getElementById("dvMuscleRow").style.display = canEdit ? "" : "none";

  if (canEdit) {
    clearMuscleSelection();
    const existing = getDayMuscle(d.day);
    if (existing) {
      const mc  = MUSCLE_COLORS[existing];
      const btn = document.querySelector(`.muscle-btn[data-id="${existing}"]`);
      if (btn && mc) {
        btn.classList.add("selected");
        btn.style.background  = mc.css + "22";
        btn.style.borderColor = mc.css + "99";
        btn.style.color       = mc.css;
        dayPopup._muscle = existing;
        const ago = getLastTrainedDays(existing);
        document.getElementById("muscleHint").textContent =
          ago===null ? "" : ago===1 ? "Último: ayer" : `Último: hace ${ago} días`;
      }
    }
  }

  /* Photo / exercise badges */
  const pc = monthCache.photo_counts[String(d.day)];
  const sc = monthCache.set_counts[String(d.day)];
  document.getElementById("photoCountBadge").textContent    = pc ? `(${pc})` : "";
  document.getElementById("exerciseCountBadge").textContent = sc ? `(${sc})` : "";

  /* Open the view */
  document.getElementById("popupBackdrop").classList.add("open");
  dayPopup.classList.add("open");

  /* Reset exercise form */
  resetExerciseForm();

  /* Load data */
  dayPhotos = []; renderPhotoGrid();
  dayExercises = []; renderExerciseSets();
  currentPR = null; renderPRHint();
  endSuperset();

  Promise.all([
    loadDayPhotos(curYear, curMonth+1, d.day),
    loadDayExercises(curYear, curMonth+1, d.day)
  ]).then(([photos, exercises]) => {
    dayPhotos = photos; renderPhotoGrid();
    dayExercises = exercises; renderExerciseSets();
  });
}

function closePopup() {
  dayPopup.classList.remove("open");
  document.getElementById("popupBackdrop").classList.remove("open");
  dayPopup._day = null;
  clearMuscleSelection();
  clearEdges();
  closeRoutinesSheet();
  hideExInfoCard();
  hideExDropdown();
  endSuperset();
  _dbLastResults = [];
}

async function applyState(state) {
  const day    = dayPopup._day; if (day === null) return;
  const muscle = (state==="done") ? (dayPopup._muscle || null) : null;
  closePopup();
  await setDay(curYear, curMonth, day, state, muscle);
  buildGrid();
}

/* Bind action buttons */
function bindBtn(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("touchstart", e => { e.stopPropagation(); e.preventDefault(); fn(); }, { passive: false });
  el.addEventListener("click",      e => { e.stopPropagation(); fn(); });
}
bindBtn("btnDone",  () => applyState("done"));
bindBtn("btnMiss",  () => applyState("miss"));
bindBtn("btnReset", () => applyState(null));
bindBtn("btnClose", closePopup);

/* Skip muscle */
const skipBtn = document.getElementById("skipMuscle");
if (skipBtn) {
  skipBtn.addEventListener("touchstart", e => { e.stopPropagation(); e.preventDefault(); clearMuscleSelection(); }, { passive: false });
  skipBtn.addEventListener("click", e => { e.stopPropagation(); clearMuscleSelection(); });
}

/* Backdrop */
document.getElementById("popupBackdrop").addEventListener("click", closePopup);

/* Outside click */
document.addEventListener("click", e => {
  if (!dayPopup.classList.contains("open")) return;
  if (progressModal && progressModal.classList.contains("open")) return;
  if (dayPopup.contains(e.target)) return;
  if (document.getElementById("routinesSheet").contains(e.target)) return;
  if (e.target === renderer.domElement) return;
  closePopup();
});
