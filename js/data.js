/* ── Data layer: Supabase reads/writes ── */
async function loadMonth(y, m) {
  setSyncStatus("⏳ Cargando…");
  try {
    const data = await supa.rpc("gym_load_month", { p_year: y, p_month: m+1 });
    monthCache = {
      days:          (data && data.days)          || {},
      photo_counts:  (data && data.photo_counts)  || {},
      set_counts:    (data && data.set_counts)    || {},
      reward:        (data && data.reward)        || null,
      value_per_day: (data && data.value_per_day) || 0
    };
    setSyncStatus("✅ Sincronizado");
    Promise.all([
      supa.rpc("gym_autofail_past_days"),
      supa.rpc("gym_check_penalty")
    ]).then(async () => {
      const fresh = await supa.rpc("gym_load_month", { p_year: y, p_month: m+1 });
      monthCache = {
        days:          (fresh && fresh.days)          || {},
        photo_counts:  (fresh && fresh.photo_counts)  || {},
        set_counts:    (fresh && fresh.set_counts)    || {},
        reward:        (fresh && fresh.reward)        || null,
        value_per_day: (fresh && fresh.value_per_day) || 0
      };
      buildGrid();
    }).catch(e => console.warn("autofail bg:", e));
  } catch (e) {
    setSyncStatus("❌ Sin conexión");
    showMsg("Sin conexión — mostrando datos locales", "#ffaa22");
    console.error("loadMonth:", e);
    if (!monthCache.days || Object.keys(monthCache.days).length === 0) {
      monthCache = { days:{}, reward:null, value_per_day:0 };
    }
  }
}

async function setDay(y, m, d, state, muscle) {
  setSyncStatus("⏳ Guardando…");
  try {
    await supa.rpc("gym_set_day", {
      p_year: y, p_month: m+1, p_day: d,
      p_state: state, p_muscle_group: muscle || null
    });
    const cacheState = (state==="done" && isWeekend(y,m,d)) ? "weekend_bonus" : state;
    if (state === null) {
      delete monthCache.days[String(d)];
    } else {
      monthCache.days[String(d)] = { state: cacheState, muscle_group: muscle || null };
    }
    await loadMonth(y, m);
    setSyncStatus("✅ Guardado");
    if (state === "done") showMsg(getMotivationalMsg(calcStreak(), calcWeekDone()));
  } catch (e) {
    setSyncStatus("❌ " + e.message);
    console.error("setDay:", e);
  }
}
