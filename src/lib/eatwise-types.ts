export const LS_KEY = 'eatwise_weight_goals';
export const LS_SETTINGS = 'eatwise_settings';

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
];

export type Theme = 'light' | 'dark' | 'navy';
export type Lang = import('@/lib/i18n').Lang;

export interface AppSettings {
  units: 'metric' | 'imperial';
  energy: 'kcal' | 'kj';
  theme: Theme;
}

export const DEFAULT_SETTINGS: AppSettings = { units: 'metric', energy: 'kcal', theme: 'light' };

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) { /* ignore */ }
  return DEFAULT_SETTINGS;
}

export interface WeightGoals {
  startWeight: number;
  targetWeight: number;
  currentWeight: number;
}

export function loadWeightGoals(): WeightGoals {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { startWeight: 116, targetWeight: 95, currentWeight: 115.5 };
}

export function calcNutrition(currentWeight: number, targetWeight: number) {
  const cal = Math.round(currentWeight * 25);
  const protein = Math.round(targetWeight * 2);
  const fat = Math.round(currentWeight * 0.7 * 100) / 100;
  const fiber = Math.round((cal / 1000) * 14 * 10) / 10;
  const carb = Math.round((cal - (protein * 4 + fat * 9)) / 4);
  return { cal, protein, fat, carb, fiber };
}

export const FOOD_IMG =
  'https://cdn.poehali.dev/projects/e6e9bd5f-1d4b-4442-bfac-18c3d0c53b14/files/31646f36-1cec-4eba-8747-044a81070fc8.jpg';

export interface Meal {
  name: string;
  time: string;
  img: string;
  cal: number;
  protein: number;
  fat: number;
  carb: number;
  fiber: number;
}

export const MEALS_BY_DAY: Record<number, Meal[]> = {
  0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
};

export const EXAMPLE_MEALS: Meal[] = [
  { name: 'Боул с лососем',    time: '08:30', img: FOOD_IMG, cal: 520, protein: 38, fat: 24, carb: 41, fiber: 9 },
  { name: 'Греческий салат',   time: '13:15', img: FOOD_IMG, cal: 310, protein: 12, fat: 22, carb: 18, fiber: 6 },
  { name: 'Овсянка с ягодами', time: '17:40', img: FOOD_IMG, cal: 280, protein:  9, fat:  6, carb: 48, fiber: 7 },
];

export function sumMeals(list: Meal[]) {
  return list.reduce(
    (a, m) => ({
      cal:     a.cal     + m.cal,
      protein: a.protein + m.protein,
      fat:     a.fat     + m.fat,
      carb:    a.carb    + m.carb,
      fiber:   a.fiber   + m.fiber,
    }),
    { cal: 0, protein: 0, fat: 0, carb: 0, fiber: 0 },
  );
}

export const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function getMoscowWeek() {
  const now = new Date();
  const msk = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const todayIdx = (msk.getDay() + 6) % 7;
  const monday = new Date(msk);
  monday.setDate(msk.getDate() - todayIdx);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.getDate();
  });
  return { week, todayIdx };
}
