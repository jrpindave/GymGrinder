/* ── Exercise log, search, filters, supersets ── */
let dayExercises  = [];
let exerciseNames = [];
let currentPR     = null;
let _dbLastResults = [];
let _dbSearchTimer = null;

/* Active filters */
let _filterMuscle = "";
let _filterEquip  = "";

/* Superset state */
let _supersetId    = null;
let _supersetCount = 0;

function _genUUID() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

function startSuperset() {
  _supersetId    = _genUUID();
  _supersetCount = 0;
  _updateSupersetBtn();
}
function endSuperset() {
  _supersetId    = null;
  _supersetCount = 0;
  _updateSupersetBtn();
}
function _updateSupersetBtn() {
  const btn = document.getElementById("btnSuperset");
  if (!btn) return;
  if (_supersetId) {
    const label = _supersetCount === 0 ? "1er ejercicio" : `${_supersetCount + 1}° ejercicio`;
    btn.textContent = `⟳ Biserie — ${label}`;
    btn.classList.add("active");
  } else {
    btn.textContent = "⟳ Biserie";
    btn.classList.remove("active");
  }
}

/* ── Exercise names autocomplete ── */
async function loadExerciseNames() {
  try {
    exerciseNames = await supa.rpc("gym_exercise_names") || [];
    const dl = document.getElementById("exNameList");
    if (dl) {
      dl.innerHTML = "";
      exerciseNames.forEach(n => {
        const opt = document.createElement("option"); opt.value = n; dl.appendChild(opt);
      });
    }
  } catch (e) { console.warn("loadExerciseNames:", e); }
}

/* ── Custom dropdown search ── */
function showExDropdown(results) {
  const dd = document.getElementById("exDropdown");
  if (!dd) return;
  if (!results || results.length === 0) { dd.style.display = "none"; dd.innerHTML = ""; return; }
  dd.innerHTML = "";
  results.forEach(ex => {
    const item = document.createElement("div");
    item.className = "ex-dropdown-item";
    const muscles = [ex.target_muscle, ex.secondary_muscle].filter(Boolean)
      .map(m => MUSCLE_ES[m] || m).join(" · ");
    item.innerHTML = `
      <div class="ex-dd-name">${ex.name}</div>
      ${muscles ? `<div class="ex-dd-meta">${muscles}${ex.equipment ? " · " + (EQUIP_ES[ex.equipment]||ex.equipment) : ""}</div>` : ""}
    `;
    item.addEventListener("mousedown", e => e.preventDefault()); // prevent blur
    item.addEventListener("click", () => {
      document.getElementById("exName").value = ex.name;
      hideExDropdown();
      showExInfoCard(ex);
      fetchPR(ex.name);
    });
    item.addEventListener("touchstart", e => {
      e.preventDefault();
      document.getElementById("exName").value = ex.name;
      hideExDropdown();
      showExInfoCard(ex);
      fetchPR(ex.name);
    }, { passive: false });
    dd.appendChild(item);
  });
  dd.style.display = "block";
}

function hideExDropdown() {
  const dd = document.getElementById("exDropdown");
  if (dd) { dd.style.display = "none"; dd.innerHTML = ""; }
}

function searchExerciseDB(query) {
  clearTimeout(_dbSearchTimer);
  if (!query || query.length < 1) { hideExDropdown(); hideExInfoCard(); return; }

  /* Quick match from cached results */
  const q = query.toLowerCase();
  const quick = _dbLastResults.find(ex =>
    ex.name.toLowerCase() === q || (ex.name_en && ex.name_en.toLowerCase() === q));
  if (quick) showExInfoCard(quick);

  _dbSearchTimer = setTimeout(async () => {
    try {
      const results = await supa.rpc("gym_search_exercises", {
        p_query: query, p_limit: 12,
        p_muscle: _filterMuscle || null,
        p_equipment: _filterEquip || null
      });
      _dbLastResults = results || [];
      showExDropdown(_dbLastResults);
      /* Show info card if exact match */
      const val = document.getElementById("exName").value.trim();
      const match = _dbLastResults.find(ex =>
        ex.name.toLowerCase() === val.toLowerCase() ||
        (ex.name_en && ex.name_en.toLowerCase() === val.toLowerCase()));
      if (match) { showExInfoCard(match); hideExDropdown(); }
    } catch (e) { console.warn("DB search:", e); }
  }, 260);
}

function showExInfoCard(ex) {
  const card = document.getElementById("exInfoCard");
  if (!card) return;
  const diffColor = ex.difficulty === "Beginner"    ? "#7dff9b"
                  : ex.difficulty === "Intermediate" ? "#ffd93d"
                  : ex.difficulty === "Advanced"      ? "#ff9b5a"
                  : "rgba(255,255,255,0.45)";
  const diffES = { Beginner:'Principiante', Novice:'Novato', Intermediate:'Intermedio', Advanced:'Avanzado', Expert:'Experto' };
  const moveES = { 'Knee Dominant':'Dom. rodilla', 'Hip Dominant':'Dom. cadera',
    'Horizontal Push':'Empuje horiz.', 'Horizontal Pull':'Jalón horiz.',
    'Vertical Push':'Empuje vert.', 'Vertical Pull':'Jalón vert.',
    'Core':'Core', 'Carry':'Transporte', 'Rotation':'Rotación' };
  const muscles = [ex.target_muscle, ex.secondary_muscle].filter(Boolean)
    .map(m => MUSCLE_ES[m] || m).join(" · ");
  card.innerHTML = `
    ${muscles ? `<span class="ex-info-muscle">${muscles}</span>` : ""}
    ${ex.difficulty ? `<span class="ex-info-badge" style="color:${diffColor}">${diffES[ex.difficulty]||ex.difficulty}</span>` : ""}
    ${ex.equipment && ex.equipment !== 'Bodyweight' ? `<span class="ex-info-badge">${EQUIP_ES[ex.equipment]||ex.equipment}</span>` : ""}
    ${ex.movement_pattern ? `<span class="ex-info-badge">${moveES[ex.movement_pattern]||ex.movement_pattern}</span>` : ""}
    ${ex.demo_url ? `<a href="${ex.demo_url}" target="_blank" rel="noopener" class="ex-info-video">▶ Video</a>` : ""}
  `;
  card.style.display = "flex";
}

function hideExInfoCard() {
  const card = document.getElementById("exInfoCard");
  if (card) { card.style.display = "none"; card.innerHTML = ""; }
}

/* ── Filters ── */
function buildExerciseFilters() {
  /* Muscle filter */
  const muscleFilter = document.getElementById("exFilterMuscle");
  if (!muscleFilter) return;
  muscleFilter.innerHTML = "";
  const muscleOptions = [
    { val:"", label:"Todos" },
    { val:"Chest", label:"Pecho" }, { val:"Back", label:"Espalda" },
    { val:"Shoulders", label:"Hombros" }, { val:"Biceps", label:"Bíceps" },
    { val:"Triceps", label:"Tríceps" }, { val:"Quadriceps", label:"Cuádríceps" },
    { val:"Hamstrings", label:"Isquios" }, { val:"Glutes", label:"Glúteos" },
    { val:"Abdominals", label:"Abdominales" }, { val:"Calves", label:"Pantorrillas" },
    { val:"Trapezius", label:"Trapecios" }, { val:"Forearms", label:"Antebrazos" }
  ];
  muscleOptions.forEach(({ val, label }) => {
    const btn = document.createElement("button");
    btn.className = "ex-filter-chip" + (val === _filterMuscle ? " active" : "");
    btn.textContent = label;
    btn.addEventListener("click", () => {
      _filterMuscle = val;
      muscleFilter.querySelectorAll(".ex-filter-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const q = document.getElementById("exName").value.trim();
      if (q) searchExerciseDB(q); else _loadFilteredDefault();
    });
    muscleFilter.appendChild(btn);
  });

  /* Equipment filter */
  const equipFilter = document.getElementById("exFilterEquip");
  if (!equipFilter) return;
  equipFilter.innerHTML = "";
  const equipOptions = [
    { val:"", label:"Todo" }, { val:"Barbell", label:"Barra" },
    { val:"Dumbbell", label:"Mancuerna" }, { val:"Cable", label:"Cable" },
    { val:"Machine", label:"Máquina" }, { val:"Bodyweight", label:"Peso corporal" },
    { val:"Kettlebell", label:"Kettlebell" }, { val:"Resistance Band", label:"Banda" },
    { val:"EZ Bar", label:"Barra Z" }, { val:"Pull Up Bar", label:"Barra fija" }
  ];
  equipOptions.forEach(({ val, label }) => {
    const btn = document.createElement("button");
    btn.className = "ex-filter-chip" + (val === _filterEquip ? " active" : "");
    btn.textContent = label;
    btn.addEventListener("click", () => {
      _filterEquip = val;
      equipFilter.querySelectorAll(".ex-filter-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const q = document.getElementById("exName").value.trim();
      if (q) searchExerciseDB(q); else _loadFilteredDefault();
    });
    equipFilter.appendChild(btn);
  });
}

async function _loadFilteredDefault() {
  try {
    const results = await supa.rpc("gym_search_exercises", {
      p_query: "", p_limit: 12,
      p_muscle: _filterMuscle || null,
      p_equipment: _filterEquip || null
    });
    _dbLastResults = results || [];
    showExDropdown(_dbLastResults);
  } catch(e) { console.warn("filter default:", e); }
}

/* ── PR ── */
async function fetchPR(exerciseName) {
  if (!exerciseName.trim()) { currentPR = null; renderPRHint(); return; }
  try {
    currentPR = await supa.rpc("gym_get_pr", { p_exercise: exerciseName.trim() });
    renderPRHint();
  } catch (e) { currentPR = null; }
}

function renderPRHint() {
  const el = document.getElementById("exPRHint");
  if (!el) return;
  if (!currentPR || !currentPR.weight_kg) { el.textContent = ""; return; }
  el.textContent = `🏆 PR: ${currentPR.weight_kg}kg × ${currentPR.reps} reps`;
}

/* ── Exercise sets rendering (grouped cards) ── */
const SUPERSET_COLORS = ["#e8553d","#3d88e8","#3de87a","#ffd93d","#9b3de8","#e83d9b"];

function renderExerciseSets() {
  const list = document.getElementById("exSetsList");
  if (!list) return;
  list.innerHTML = "";

  /* Group by exercise, preserving order */
  const groups = {};
  const order  = [];
  dayExercises.forEach(s => {
    if (!groups[s.exercise]) { groups[s.exercise] = []; order.push(s.exercise); }
    groups[s.exercise].push(s);
  });

  /* Assign superset group colors */
  const groupColorMap = {};
  let colorIdx = 0;
  dayExercises.forEach(s => {
    if (s.group_id && !groupColorMap[s.group_id]) {
      groupColorMap[s.group_id] = SUPERSET_COLORS[colorIdx++ % SUPERSET_COLORS.length];
    }
  });

  order.forEach(name => {
    const sets = groups[name];
    const card = document.createElement("div");
    card.className = "ex-group";

    /* Superset indicator */
    const groupId = sets[0]?.group_id;
    if (groupId && groupColorMap[groupId]) {
      card.style.borderLeft = `3px solid ${groupColorMap[groupId]}`;
      const label = document.createElement("div");
      label.className = "ex-superset-label";
      label.textContent = "BISERIE";
      label.style.color = groupColorMap[groupId];
      card.appendChild(label);
    }

    /* Header: full name + 📈 */
    const header = document.createElement("div");
    header.className = "ex-group-header";
    const nameEl = document.createElement("span");
    nameEl.className = "ex-group-name";
    nameEl.textContent = name;
    const progBtn = document.createElement("button");
    progBtn.className = "ex-group-prog";
    progBtn.title     = "Ver progresión";
    progBtn.textContent = "📈";
    progBtn.addEventListener("click", () => openProgressModal(name));
    header.appendChild(nameEl);
    header.appendChild(progBtn);
    card.appendChild(header);

    /* Set rows */
    sets.forEach((s, i) => {
      const row = document.createElement("div");
      row.className = "ex-set-row";
      const detail = [
        s.weight_kg != null ? `${s.weight_kg}kg` : null,
        s.reps != null ? `${s.reps} reps` : null,
        s.rpe != null ? `RPE ${s.rpe}` : null,
      ].filter(Boolean).join(" · ");
      const isPR = currentPR && s.weight_kg != null &&
                   s.weight_kg >= currentPR.weight_kg && s.reps >= currentPR.reps;
      row.innerHTML = `
        <span class="ex-set-num">${i+1}</span>
        <span class="ex-set-detail">${detail}${isPR ? '<span class="ex-set-pr">🏆</span>' : ""}</span>
        <button class="ex-set-del" data-id="${s.id}">✕</button>
      `;
      row.querySelector(".ex-set-del").addEventListener("click", () => deleteExerciseSet(s.id));
      card.appendChild(row);
    });
    list.appendChild(card);
  });

  const badge = document.getElementById("exerciseCountBadge");
  if (badge) badge.textContent = dayExercises.length ? `(${dayExercises.length})` : "";
}

/* ── Add set ── */
async function addExerciseSet() {
  const name   = document.getElementById("exName").value.trim();
  const weight = parseFloat(document.getElementById("exWeight").value) || null;
  const reps   = parseInt(document.getElementById("exReps").value)   || null;
  const sets   = Math.max(1, Math.min(20, parseInt(document.getElementById("exSets").value) || 1));
  if (!name) { showMsg("Ingresá el nombre del ejercicio","#ff6b6b"); return; }
  if (!dayPopup._day) return;

  /* If superset mode, count this exercise in the group */
  const groupId = _supersetId;
  if (_supersetId) _supersetCount++;

  try {
    const dk = String(dayPopup._day);
    for (let s = 0; s < sets; s++) {
      const id = await supa.rpc("gym_log_set", {
        p_year: curYear, p_month: curMonth+1, p_day: dayPopup._day,
        p_exercise: name, p_weight: weight, p_reps: reps,
        p_group_id: groupId || null
      });
      dayExercises.push({ id, year:curYear, month:curMonth+1, day:dayPopup._day,
                          exercise:name, weight_kg:weight, reps, sets_done:1, rpe:null,
                          group_id: groupId || null });
      monthCache.set_counts[dk] = (monthCache.set_counts[dk]||0) + 1;
    }
    buildGrid();
    renderExerciseSets();
    if (!exerciseNames.includes(name)) exerciseNames.push(name);
    await fetchPR(name);
    if (currentPR && weight && reps && weight >= currentPR.weight_kg && reps >= currentPR.reps) {
      showMsg(`🏆 Nuevo PR en ${name}!`, "#ffd93d");
    } else {
      showMsg(`✅ ${sets > 1 ? sets+"× " : ""}${name} registrado`);
    }
    document.getElementById("exReps").value = "";
    _updateSupersetBtn();
  } catch (e) { showMsg("Error al guardar","#ff6b6b"); console.error(e); }
}

async function deleteExerciseSet(id) {
  try {
    await supa.rpc("gym_delete_set", { p_id: id });
    dayExercises = dayExercises.filter(s => s.id !== id);
    const dk = String(dayPopup._day);
    monthCache.set_counts[dk] = Math.max(0, (monthCache.set_counts[dk]||1) - 1);
    if (!monthCache.set_counts[dk]) delete monthCache.set_counts[dk];
    buildGrid();
    renderExerciseSets();
  } catch (e) { showMsg("Error al borrar","#ff6b6b"); console.error(e); }
}

async function loadDayExercises(year, month, day) {
  try {
    const res = await fetchWithTimeout(
      `${SUPA_URL}/rest/v1/gym_sets?year=eq.${year}&month=eq.${month}&day=eq.${day}&order=created_at.asc`,
      { headers: { "apikey": SUPA_KEY, "Authorization": "Bearer "+SUPA_KEY } }
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) { console.warn("loadDayExercises:", e); return []; }
}

function resetExerciseForm() {
  const f = ["exName","exWeight","exReps","exSets"];
  f.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  hideExInfoCard();
  hideExDropdown();
  _dbLastResults = [];
  _filterMuscle = "";
  _filterEquip  = "";
  buildExerciseFilters();
}

/* ── Wire listeners (called after DOM ready) ── */
function initExerciseListeners() {
  const addBtn = document.getElementById("exAddBtn");
  if (addBtn) {
    addBtn.addEventListener("click", addExerciseSet);
    addBtn.addEventListener("touchstart", e => { e.preventDefault(); addExerciseSet(); }, { passive: false });
  }

  const exName = document.getElementById("exName");
  if (exName) {
    exName.addEventListener("input", e => {
      const val = e.target.value.trim();
      fetchPR(val);
      if (val.length >= 1) searchExerciseDB(val);
      else { hideExDropdown(); hideExInfoCard(); }
    });
    exName.addEventListener("focus", () => {
      const val = exName.value.trim();
      if (val.length >= 1) searchExerciseDB(val);
    });
    exName.addEventListener("blur", () => {
      setTimeout(hideExDropdown, 200);
    });
    exName.addEventListener("keydown", e => {
      if (e.key === "Escape") { hideExDropdown(); exName.blur(); }
    });
  }

  document.getElementById("exReps")?.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); addExerciseSet(); }
  });
  document.getElementById("exWeight")?.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); document.getElementById("exReps").focus(); }
  });

  const btnSuperset = document.getElementById("btnSuperset");
  if (btnSuperset) {
    btnSuperset.addEventListener("click", () => {
      if (_supersetId) endSuperset(); else startSuperset();
    });
  }
}
