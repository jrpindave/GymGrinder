import type { Muscle } from './types';

export const MUSCLES: Muscle[] = [
  { id: 'pecho',         label: 'Pecho',   icon: '💪' },
  { id: 'espalda',       label: 'Espalda', icon: '🔙' },
  { id: 'piernas_front', label: 'Cuad',    icon: '🦵' },
  { id: 'piernas_back',  label: 'Isquio',  icon: '🦿' },
  { id: 'hombros',       label: 'Hombros', icon: '🏋' },
  { id: 'core',          label: 'Core',    icon: '🎯' },
  { id: 'cardio',        label: 'Cardio',  icon: '🏃' },
];

export const MUSCLE_COLORS: Record<string, string> = {
  pecho:         '#e8553d',
  espalda:       '#3d88e8',
  piernas_front: '#3de87a',
  piernas_back:  '#3dd8e8',
  hombros:       '#9b3de8',
  core:          '#e8c23d',
  cardio:        '#e83d9b',
};

export const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

export const MONTHS_SHORT = [
  'Ene','Feb','Mar','Abr','May','Jun',
  'Jul','Ago','Sep','Oct','Nov','Dic',
];

export const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export const EQUIP_ES: Record<string, string> = {
  'Barbell': 'Barra', 'Dumbbell': 'Mancuerna', 'Cable': 'Cable',
  'Machine': 'Máquina', 'Bodyweight': 'Peso corporal', 'Kettlebell': 'Kettlebell',
  'Resistance Band': 'Banda', 'EZ Bar': 'Barra Z', 'Trap Bar': 'Barra Trampa',
  'Pull Up Bar': 'Barra fija', 'Medicine Ball': 'Med. Ball', 'Landmine': 'Landmine',
  'Gymnastic Rings': 'Anillas', 'Stability Ball': 'Fit Ball', 'Ab Wheel': 'Rueda ab',
  'Battle Ropes': 'Cuerdas', 'Sandbag': 'Sandbag', 'Sled': 'Trineo',
  'Miniband': 'Miniband', 'Superband': 'Superband', 'Suspension Trainer': 'TRX',
  'Slam Ball': 'Slam Ball',
};

export const MUSCLE_ES: Record<string, string> = {
  'Chest': 'Pecho', 'Back': 'Espalda', 'Shoulders': 'Hombros',
  'Biceps': 'Bíceps', 'Triceps': 'Tríceps', 'Quadriceps': 'Cuádríceps',
  'Hamstrings': 'Isquios', 'Glutes': 'Glúteos', 'Abdominals': 'Abdominales',
  'Calves': 'Pantorrillas', 'Forearms': 'Antebrazos', 'Trapezius': 'Trapecios',
  'Abductors': 'Abductores', 'Adductors': 'Aductores',
  'Hip Flexors': 'Flexores cadera', 'Shins': 'Tibiales',
};

export const DIFF_ES: Record<string, string> = {
  Beginner: 'Principiante', Novice: 'Novato', Intermediate: 'Intermedio',
  Advanced: 'Avanzado', Expert: 'Experto',
};

export const MOVE_ES: Record<string, string> = {
  'Knee Dominant': 'Dom. rodilla', 'Hip Dominant': 'Dom. cadera',
  'Horizontal Push': 'Empuje horiz.', 'Horizontal Pull': 'Jalón horiz.',
  'Vertical Push': 'Empuje vert.', 'Vertical Pull': 'Jalón vert.',
  'Core': 'Core', 'Carry': 'Transporte', 'Rotation': 'Rotación',
};

export const DIFF_COLOR: Record<string, string> = {
  Beginner: '#7dff9b', Novice: '#a0ff9b', Intermediate: '#ffd93d',
  Advanced: '#ff9b5a', Expert: '#ff6b6b',
};

export const SUPERSET_COLORS = [
  '#e8553d','#3d88e8','#3de87a','#ffd93d','#9b3de8','#e83d9b',
];

export const WEEK_GOALS = [2, 3, 4, 5, 6];

export const MUSCLE_FILTER_OPTIONS = [
  { val: '', label: 'Todos' },
  { val: 'Chest', label: 'Pecho' },
  { val: 'Back', label: 'Espalda' },
  { val: 'Shoulders', label: 'Hombros' },
  { val: 'Biceps', label: 'Bíceps' },
  { val: 'Triceps', label: 'Tríceps' },
  { val: 'Quadriceps', label: 'Cuádríceps' },
  { val: 'Hamstrings', label: 'Isquios' },
  { val: 'Glutes', label: 'Glúteos' },
  { val: 'Abdominals', label: 'Abdominales' },
  { val: 'Calves', label: 'Pantorrillas' },
  { val: 'Trapezius', label: 'Trapecios' },
  { val: 'Forearms', label: 'Antebrazos' },
];

export const EQUIP_FILTER_OPTIONS = [
  { val: '', label: 'Todo' },
  { val: 'Barbell', label: 'Barra' },
  { val: 'Dumbbell', label: 'Mancuerna' },
  { val: 'Cable', label: 'Cable' },
  { val: 'Machine', label: 'Máquina' },
  { val: 'Bodyweight', label: 'Peso corporal' },
  { val: 'Kettlebell', label: 'Kettlebell' },
  { val: 'Resistance Band', label: 'Banda' },
  { val: 'EZ Bar', label: 'Barra Z' },
  { val: 'Pull Up Bar', label: 'Barra fija' },
];
