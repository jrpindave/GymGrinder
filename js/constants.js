/* ── App constants & shared mutable state ── */
const MUSCLES = [
  { id:"pecho",         label:"Pecho",   icon:"💪" },
  { id:"espalda",       label:"Espalda", icon:"🔙" },
  { id:"piernas_front", label:"Cuad",    icon:"🦵" },
  { id:"piernas_back",  label:"Isquio",  icon:"🦿" },
  { id:"hombros",       label:"Hombros", icon:"🏋" },
  { id:"core",          label:"Core",    icon:"🎯" },
  { id:"cardio",        label:"Cardio",  icon:"🏃" },
];

const MUSCLE_COLORS = {
  pecho:         { cube: 0xe8553d, css: "#e8553d" },
  espalda:       { cube: 0x3d88e8, css: "#3d88e8" },
  piernas_front: { cube: 0x3de87a, css: "#3de87a" },
  piernas_back:  { cube: 0x3dd8e8, css: "#3dd8e8" },
  hombros:       { cube: 0x9b3de8, css: "#9b3de8" },
  core:          { cube: 0xe8c23d, css: "#e8c23d" },
  cardio:        { cube: 0xe83d9b, css: "#e83d9b" },
};

const MONTHS  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                 "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ES = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"];

/* Equipment labels (DB value → español) */
const EQUIP_ES = {
  "Barbell":"Barra", "Dumbbell":"Mancuerna", "Cable":"Cable",
  "Machine":"Máquina", "Bodyweight":"Peso corporal", "Kettlebell":"Kettlebell",
  "Resistance Band":"Banda", "EZ Bar":"Barra Z", "Trap Bar":"Barra Trampa",
  "Pull Up Bar":"Barra fija", "Medicine Ball":"Med. Ball", "Landmine":"Landmine",
  "Gymnastic Rings":"Anillas", "Stability Ball":"Fit Ball", "Ab Wheel":"Rueda ab",
  "Battle Ropes":"Cuerdas", "Sandbag":"Sandbag", "Sled":"Trineo",
  "Miniband":"Miniband", "Superband":"Superband", "Suspension Trainer":"TRX",
  "Slam Ball":"Slam Ball", "Kettlebell":"Kettlebell"
};

/* Muscle labels (DB target_muscle → español) */
const MUSCLE_ES = {
  "Chest":"Pecho", "Back":"Espalda", "Shoulders":"Hombros",
  "Biceps":"Bíceps", "Triceps":"Tríceps", "Quadriceps":"Cuádríceps",
  "Hamstrings":"Isquios", "Glutes":"Glúteos", "Abdominals":"Abdominales",
  "Calves":"Pantorrillas", "Forearms":"Antebrazos", "Trapezius":"Trapecios",
  "Abductors":"Abductores", "Adductors":"Aductores", "Hip Flexors":"Flexores cadera",
  "Shins":"Tibiales"
};

const today      = new Date();
let curMonth     = today.getMonth();
let curYear      = today.getFullYear();
let monthCache   = { days:{}, photo_counts:{}, set_counts:{}, reward:null, value_per_day:0 };
const WEEK_GOALS = [2, 3, 4, 5, 6];
let weeklyGoal   = parseInt(localStorage.getItem("gymWeeklyGoal") || "4");
if (!WEEK_GOALS.includes(weeklyGoal)) weeklyGoal = 4;

function dbg(msg) { console.log("[GG]", msg); }
