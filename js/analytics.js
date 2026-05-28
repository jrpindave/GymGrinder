/* ── Analytics & helpers ── */
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function isWeekend(y, m, d) { const dw = new Date(y,m,d).getDay(); return dw===0||dw===6; }
function getDayState(d) {
  const v = monthCache.days[String(d)];
  if (!v) return undefined;
  return typeof v === "string" ? v : v.state;
}
function getDayMuscle(d) {
  const v = monthCache.days[String(d)];
  if (!v || typeof v === "string") return null;
  return v.muscle_group || null;
}

function calcStreak() {
  if (curMonth !== today.getMonth() || curYear !== today.getFullYear()) return 0;
  const todayD = today.getDate();
  let streak = 0;
  for (let d = todayD; d >= 1; d--) {
    const dw   = new Date(curYear, curMonth, d).getDay();
    const wknd = (dw===0||dw===6);
    const s    = getDayState(d);
    if (s==="done" || s==="weekend_bonus") { streak++; continue; }
    if (wknd) continue;
    if (d===todayD && !s) continue;
    break;
  }
  return streak;
}

function calcCompletion() {
  const todayD = (curMonth===today.getMonth() && curYear===today.getFullYear())
    ? today.getDate() : daysInMonth(curYear, curMonth);
  let weekdays = 0, done = 0;
  for (let d = 1; d <= todayD; d++) {
    const dw = new Date(curYear, curMonth, d).getDay();
    if (dw===0||dw===6) continue;
    weekdays++;
    const s = getDayState(d);
    if (s==="done" || s==="weekend_bonus") done++;
  }
  return weekdays > 0 ? Math.round(done/weekdays*100) : 0;
}

function calcWeekDone() {
  if (curMonth !== today.getMonth() || curYear !== today.getFullYear()) return 0;
  const todayD = today.getDate();
  const dw = today.getDay();
  const mondayOff = (dw===0) ? -6 : 1-dw;
  const weekStart = todayD + mondayOff;
  let done = 0;
  for (let d = Math.max(1, weekStart); d <= todayD; d++) {
    const s = getDayState(d); if (s==="done"||s==="weekend_bonus") done++;
  }
  return done;
}

function calcMuscleStats() {
  const counts = {};
  MUSCLES.forEach(m => counts[m.id] = 0);
  const total = daysInMonth(curYear, curMonth);
  for (let d = 1; d <= total; d++) {
    const s = getDayState(d);
    if (s==="done" || s==="weekend_bonus") {
      const muscle = getDayMuscle(d);
      if (muscle && counts[muscle] !== undefined) counts[muscle]++;
    }
  }
  return counts;
}

function getLastTrainedDays(muscleId) {
  if (curMonth !== today.getMonth() || curYear !== today.getFullYear()) return null;
  const todayD = today.getDate();
  for (let d = todayD-1; d >= 1; d--) {
    const s = getDayState(d);
    if ((s==="done"||s==="weekend_bonus") && getDayMuscle(d)===muscleId) return todayD - d;
  }
  return null;
}

function getMotivationalMsg(streak, weekDone) {
  if (streak===10) return "¡10 EN RACHA! 🏆🔥";
  if (streak===7)  return "¡SEMANA PERFECTA! 👑";
  if (streak===5)  return "¡5 días seguidos! 🔥🔥";
  if (streak===3)  return "¡3 en racha! 🔥";
  if (streak===1)  return "¡Empezaste la racha! 💪";
  if (weekDone===weeklyGoal) return "¡Meta semanal cumplida! 🎯";
  const misc = ["¡Bien hecho! 💪","¡Un día más! 🙌","¡A romperla! 🔥","¡Constancia! ✅","¡Eso es! 💎"];
  return misc[Math.floor(Math.random()*misc.length)];
}
