/* ── UI layer: status bar, reward modal, stats ── */
let _msgTimer = null;
function showMsg(txt, color = "#7dff9b") {
  const el = document.getElementById("msg");
  el.textContent = txt; el.style.color = color;
  clearTimeout(_msgTimer);
  _msgTimer = setTimeout(() => { el.textContent = ""; }, 3200);
}

function setSyncStatus(txt) {
  const el = document.getElementById("syncStatus");
  el.textContent = txt;
  el.style.color = txt.startsWith("❌") ? "#ff6b6b"
                 : txt.startsWith("✅") ? "#7dff9b"
                 : "rgba(255,255,255,0.3)";
}

function updateUI() {
  const r    = monthCache.reward;
  const days = daysInMonth(curYear, curMonth);
  let done = 0, miss = 0, weekendBonus = 0;
  for (let d = 1; d <= days; d++) {
    const s = getDayState(d);
    if (s==="done"||s==="weekend_bonus") done++;
    if (s==="miss") miss++;
    if (s==="weekend_bonus") weekendBonus++;
  }
  document.getElementById("sPerGym").textContent = monthCache.value_per_day ? Math.round(monthCache.value_per_day) : 0;
  document.getElementById("sDone").textContent   = done + (weekendBonus ? ` (${weekendBonus}×3)` : "");
  document.getElementById("sFail").textContent   = miss;
  document.getElementById("sEarned").textContent = r ? Math.round(r.current_amount) : 0;

  const streak = calcStreak();
  const sEl    = document.getElementById("sStreak");
  sEl.textContent = streak;
  sEl.className   = streak>=7 ? "fire" : streak>=5 ? "orange" : streak>=3 ? "yellow" : "";

  document.getElementById("sCompletion").textContent = calcCompletion();
  document.getElementById("sWeek").textContent       = calcWeekDone();
  document.getElementById("sWeekGoal").textContent   = weeklyGoal;

  const rewardBtn = document.getElementById("rewardBtn");
  if (r) {
    const pct = r.target_amount > 0 ? Math.round(r.current_amount/r.target_amount*100) : 0;
    rewardBtn.textContent = `🎯 ${r.name} (${pct}%)`;
    document.getElementById("rewardProgressBar").style.width = Math.min(100,pct) + "%";
    document.getElementById("sReward").textContent = r.name;
  } else {
    rewardBtn.textContent = "🎯 Nueva recompensa";
    document.getElementById("rewardProgressBar").style.width = "0%";
    document.getElementById("sReward").textContent = "Sin recompensa";
  }

  document.getElementById("penaltyInfo").style.display = "none";
  if (r && r.penalized) {
    document.getElementById("penaltyInfo").style.display = "";
    document.getElementById("sPenalty").textContent = "Penalizado 25%";
  } else if (r && r.deadline_at) {
    const dLeft = Math.ceil((new Date(r.deadline_at) - new Date()) / 86400000);
    if (dLeft <= 7 && dLeft > 0) {
      document.getElementById("penaltyInfo").style.display = "";
      document.getElementById("sPenalty").textContent = `⏰ ${dLeft}d para penalización`;
    }
  }
  renderMuscleChips();
}

function renderMuscleChips() {
  const counts = calcMuscleStats();
  const row    = document.getElementById("muscleStatsRow");
  row.innerHTML = "";
  let any = false;
  MUSCLES.forEach(m => {
    const cnt = counts[m.id];
    if (!cnt) return;
    any = true;
    const mc   = MUSCLE_COLORS[m.id];
    const chip = document.createElement("div");
    chip.className = "muscle-chip";
    chip.innerHTML = `<span class="mdot" style="background:${mc.css}"></span>${m.icon} ${m.label} <strong>${cnt}</strong>`;
    row.appendChild(chip);
  });
  row.style.display = any ? "flex" : "none";
}

/* ── Week goal click ── */
document.getElementById("weekStatEl").addEventListener("click", () => {
  const idx = WEEK_GOALS.indexOf(weeklyGoal);
  weeklyGoal = WEEK_GOALS[(idx+1) % WEEK_GOALS.length];
  localStorage.setItem("gymWeeklyGoal", weeklyGoal);
  updateUI();
  showMsg(`Meta semanal: ${weeklyGoal} días/semana`, "#ffaa22");
});

/* ── Month/year selectors ── */
const monthSel = document.getElementById("monthSel");
const yearSel  = document.getElementById("yearSel");
MONTHS.forEach((m, i) => {
  const o = document.createElement("option");
  o.value = i; o.textContent = m; monthSel.appendChild(o);
});
monthSel.value = curMonth;
for (let y = 2024; y <= 2030; y++) {
  const o = document.createElement("option");
  o.value = y; o.textContent = y; yearSel.appendChild(o);
}
yearSel.value = curYear;
monthSel.onchange = () => { curMonth = Number(monthSel.value); targetInitialized = false; init(); };
yearSel.onchange  = () => { curYear  = Number(yearSel.value);  targetInitialized = false; init(); };

/* ── Reward modal ── */
const rewardModal = document.getElementById("rewardModal");
document.getElementById("rewardBtn").addEventListener("click", () => {
  const r    = monthCache.reward;
  const card = document.getElementById("rewardCard");
  if (r) {
    card.querySelector("h2").textContent = "Nueva recompensa";
    card.querySelector("p").textContent  =
      r.name + " activa ($" + Math.round(r.current_amount) + " de $" + Math.round(r.target_amount) + "). Al guardar una nueva, se cierra la actual.";
  } else {
    card.querySelector("h2").textContent = "Nueva recompensa";
    card.querySelector("p").textContent  = "Si no la cumplís en 30 días, se penaliza un 25%. Los fines de semana cuentan 3×.";
  }
  document.getElementById("modalRewardName").value = "";
  document.getElementById("modalRewardCost").value = "";
  rewardModal.classList.add("open");
});
document.getElementById("btnCancelReward").addEventListener("click", () => rewardModal.classList.remove("open"));
document.getElementById("btnSaveReward").addEventListener("click", async () => {
  const name = document.getElementById("modalRewardName").value.trim();
  const cost = Number(document.getElementById("modalRewardCost").value || 0);
  if (!name || !cost) { showMsg("Completá nombre y valor","#ff6b6b"); return; }
  const hasActive = monthCache.reward !== null;
  if (hasActive) {
    const r   = monthCache.reward;
    const pct = r.target_amount > 0 ? Math.round(r.current_amount/r.target_amount*100) : 0;
    const ok  = confirm(`¿Completaste "${r.name}"?\n\nAcumulado: $${Math.round(r.current_amount)} de $${Math.round(r.target_amount)} (${pct}%)\n\nAl confirmar se cierra y arranca la nueva.`);
    if (!ok) return;
  }
  rewardModal.classList.remove("open");
  setSyncStatus("⏳ Guardando recompensa…");
  try {
    if (hasActive) {
      await supa.rpc("gym_complete_reward", { p_name:name, p_amount:cost });
    } else {
      await supa.insert("gym_reward", { name, target_amount: cost });
    }
    await loadMonth(curYear, curMonth);
    buildGrid();
    showMsg("✓ Recompensa guardada");
  } catch (e) { setSyncStatus("❌ " + e.message); }
});

/* ── Stats button (open progress modal) ── */
document.getElementById("statsBtn").addEventListener("click", () => openProgressModal(null));
