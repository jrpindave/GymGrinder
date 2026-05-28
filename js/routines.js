/* ── Routines sheet ── */
let allRoutines = [];

async function loadRoutines() {
  try { allRoutines = await supa.rpc("gym_get_routines") || []; }
  catch (e) { console.warn("loadRoutines:", e); allRoutines = []; }
}

function renderRoutinePicker() {
  const list  = document.getElementById("routinePickerList");
  const empty = document.getElementById("routinePickerEmpty");
  if (!list) return;
  list.innerHTML = "";
  if (!allRoutines.length) { empty.style.display = "block"; return; }
  empty.style.display = "none";
  allRoutines.forEach(r => {
    const mObj   = r.muscle_group ? MUSCLES.find(x => x.id === r.muscle_group) : null;
    const exList = Array.isArray(r.exercises) ? r.exercises : [];
    const preview = exList.slice(0, 3).map(e => e.exercise).join(", ")
                  + (exList.length > 3 ? "…" : "");
    const row = document.createElement("div");
    row.className = "routine-item";
    row.innerHTML = `
      <div class="routine-item-info">
        <div class="routine-item-name">${mObj ? mObj.icon+" " : ""}${r.name}</div>
        <div class="routine-item-detail">${exList.length} ejercicio${exList.length!==1?"s":""} · ${preview||"vacía"}</div>
      </div>
      <button class="routine-apply-btn">Aplicar</button>
      <button class="routine-del-btn" title="Eliminar">🗑</button>
    `;
    row.querySelector(".routine-apply-btn").addEventListener("click", () => applyRoutine(r));
    row.querySelector(".routine-del-btn").addEventListener("click",  () => deleteRoutine(r.id));
    list.appendChild(row);
  });
}

async function applyRoutine(routine) {
  if (!dayPopup._day) return;
  const exercises = Array.isArray(routine.exercises) ? routine.exercises : [];
  if (!exercises.length) { showMsg("Rutina vacía", "#ff6b6b"); return; }

  if (routine.muscle_group && !dayPopup._muscle) {
    const btn = document.querySelector(`.muscle-btn[data-id="${routine.muscle_group}"]`);
    if (btn) btn.click();
  }

  closeRoutinesSheet();
  showMsg("Aplicando rutina…", "#ffaa22");
  let added = 0;
  for (const ex of exercises) {
    try {
      const id = await supa.rpc("gym_log_set", {
        p_year: curYear, p_month: curMonth+1, p_day: dayPopup._day,
        p_exercise: ex.exercise, p_weight: ex.weight_kg||null, p_reps: ex.reps||null,
        p_group_id: null
      });
      dayExercises.push({ id, year:curYear, month:curMonth+1, day:dayPopup._day,
        exercise:ex.exercise, weight_kg:ex.weight_kg||null, reps:ex.reps||null,
        rpe:null, group_id: null });
      const dk = String(dayPopup._day);
      monthCache.set_counts[dk] = (monthCache.set_counts[dk]||0) + 1;
      added++;
    } catch (e) { console.warn("applyRoutine ex:", e); }
  }
  buildGrid();
  renderExerciseSets();
  showMsg(`✅ ${routine.name}: ${added} ejercicios`, "#7dff9b");
}

async function deleteRoutine(id) {
  try {
    await supa.rpc("gym_delete_routine", { p_id: id });
    allRoutines = allRoutines.filter(r => r.id !== id);
    renderRoutinePicker();
    showMsg("Rutina eliminada");
  } catch (e) { showMsg("Error al eliminar", "#ff6b6b"); console.error(e); }
}

async function saveCurrentAsRoutine() {
  const name = document.getElementById("routineNameInput").value.trim();
  if (!name) { showMsg("Ingresá un nombre", "#ff6b6b"); return; }
  if (!dayExercises.length) { showMsg("No hay ejercicios que guardar", "#ff6b6b"); return; }

  const best = {};
  dayExercises.forEach(s => {
    if (!best[s.exercise] || (s.weight_kg||0) > (best[s.exercise].weight_kg||0)) {
      best[s.exercise] = s;
    }
  });
  const exercises = Object.values(best).map(s => ({
    exercise: s.exercise, weight_kg: s.weight_kg, reps: s.reps
  }));

  try {
    await supa.rpc("gym_save_routine", {
      p_name: name,
      p_muscle_group: dayPopup._muscle || null,
      p_exercises: exercises
    });
    await loadRoutines();
    document.getElementById("routineNameInput").value = "";
    closeRoutinesSheet();
    showMsg(`💾 "${name}" guardada`, "#7dff9b");
  } catch (e) { showMsg("Error: " + e.message, "#ff6b6b"); console.error(e); }
}

function openRoutinesSheet(tab) {
  loadRoutines().then(renderRoutinePicker);
  switchRoutinesTab(tab || "apply");
  document.getElementById("routinesSheet").classList.add("open");
}

function closeRoutinesSheet() {
  document.getElementById("routinesSheet").classList.remove("open");
}

function switchRoutinesTab(tab) {
  const applyPanel = document.getElementById("routinesApplyPanel");
  const savePanel  = document.getElementById("routinesSavePanel");
  const tabApplyEl = document.getElementById("tabApply");
  const tabSaveEl  = document.getElementById("tabSave");
  if (tab === "save") {
    applyPanel.style.display = "none";  savePanel.style.display  = "block";
    tabApplyEl.classList.remove("active"); tabSaveEl.classList.add("active");
    setTimeout(() => document.getElementById("routineNameInput").focus(), 80);
  } else {
    applyPanel.style.display = "block"; savePanel.style.display  = "none";
    tabApplyEl.classList.add("active"); tabSaveEl.classList.remove("active");
  }
}

/* Listeners */
document.getElementById("btnRoutines").addEventListener("click", () => openRoutinesSheet("apply"));
document.getElementById("btnRoutines").addEventListener("touchstart", e => {
  e.stopPropagation(); e.preventDefault(); openRoutinesSheet("apply");
}, { passive: false });
document.getElementById("btnCloseRoutinesSheet").addEventListener("click", closeRoutinesSheet);
document.getElementById("tabApply").addEventListener("click", () => switchRoutinesTab("apply"));
document.getElementById("tabSave").addEventListener("click",  () => switchRoutinesTab("save"));
document.getElementById("btnConfirmSaveRoutine").addEventListener("click", saveCurrentAsRoutine);
document.getElementById("routineNameInput").addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); saveCurrentAsRoutine(); }
});

function initRoutines() { loadRoutines(); }
