/* ── Boot ── */
async function init() {
  buildMuscleGrid();
  buildExerciseFilters();
  initExerciseListeners();
  await loadMonth(curYear, curMonth);
  buildGrid();
  loadExerciseNames();
  initRoutines();
}

init();
