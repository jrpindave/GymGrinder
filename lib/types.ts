export interface Muscle {
  id: string;
  label: string;
  icon: string;
}

export type DayState = 'done' | 'miss' | 'weekend_bonus';

export interface MonthDay {
  state: DayState;
  muscle_group: string | null;
}

export interface RewardGoal {
  name: string;
  current_amount: number;
  target_amount: number;
  deadline_at?: string | null;
  penalized?: boolean;
}

export interface MonthCache {
  days: Record<string, MonthDay | string>;
  photo_counts: Record<string, number>;
  set_counts: Record<string, number>;
  reward: RewardGoal | null;
  value_per_day: number;
}

export interface ExerciseSet {
  id: string;
  year: number;
  month: number;
  day: number;
  exercise: string;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  group_id: string | null;
}

export interface Photo {
  id: string;
  year: number;
  month: number;
  day: number;
  storage_path: string;
  caption?: string | null;
  created_at: string;
}

export interface RoutineExercise {
  exercise: string;
  weight_kg: number | null;
  reps: number | null;
}

export interface Routine {
  id: string;
  name: string;
  muscle_group: string | null;
  exercises: RoutineExercise[];
}

export interface ProgressPoint {
  year: number;
  month: number;
  day: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
}

export interface ExerciseResult {
  name: string;
  name_en?: string;
  target_muscle?: string;
  secondary_muscle?: string;
  equipment?: string;
  difficulty?: string;
  movement_pattern?: string;
  demo_url?: string;
}

export interface PRData {
  weight_kg: number;
  reps: number;
}

export interface Toast {
  message: string;
  color?: string;
}
