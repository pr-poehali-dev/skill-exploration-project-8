import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import ProgressRing from '@/components/nutrition/ProgressRing';
import MacroBar from '@/components/nutrition/MacroBar';
import { toast } from 'sonner';
import { useTranslation, Lang } from '@/lib/i18n';

const LS_KEY = 'eatwise_weight_goals';
const LS_SETTINGS = 'eatwise_settings';

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
];

type Theme = 'light' | 'dark' | 'navy';

interface AppSettings {
  units: 'metric' | 'imperial';
  energy: 'kcal' | 'kj';
  theme: Theme;
}

const DEFAULT_SETTINGS: AppSettings = { units: 'metric', energy: 'kcal', theme: 'light' };

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) { /* ignore */ }
  return DEFAULT_SETTINGS;
}

interface WeightGoals {
  startWeight: number;
  targetWeight: number;
  currentWeight: number;
}

function loadWeightGoals(): WeightGoals {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { startWeight: 116, targetWeight: 95, currentWeight: 115.5 };
}

function calcNutrition(currentWeight: number, targetWeight: number) {
  const cal = Math.round(currentWeight * 25);
  const protein = Math.round(targetWeight * 2);
  const fat = Math.round(currentWeight * 0.7 * 100) / 100;
  const fiber = Math.round((cal / 1000) * 14 * 10) / 10;
  const carb = Math.round((cal - (protein * 4 + fat * 9)) / 4);
  return { cal, protein, fat, carb, fiber };
}

const FOOD_IMG =
  'https://cdn.poehali.dev/projects/e6e9bd5f-1d4b-4442-bfac-18c3d0c53b14/files/31646f36-1cec-4eba-8747-044a81070fc8.jpg';

interface Meal {
  name: string;
  time: string;
  img: string;
  cal: number;
  protein: number;
  fat: number;
  carb: number;
  fiber: number;
}

// Приёмы пищи по дням недели (0=Пн … 6=Вс). Пусто — пользователь ещё ничего не вводил.
const MEALS_BY_DAY: Record<number, Meal[]> = {
  0: [],
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
};

// Демо-данные для вкладки «Пример»
const EXAMPLE_MEALS: Meal[] = [
  { name: 'Боул с лососем', time: '08:30', img: FOOD_IMG, cal: 520, protein: 38, fat: 24, carb: 41, fiber: 9 },
  { name: 'Греческий салат', time: '13:15', img: FOOD_IMG, cal: 310, protein: 12, fat: 22, carb: 18, fiber: 6 },
  { name: 'Овсянка с ягодами', time: '17:40', img: FOOD_IMG, cal: 280, protein: 9, fat: 6, carb: 48, fiber: 7 },
];

function sumMeals(list: Meal[]) {
  return list.reduce(
    (a, m) => ({
      cal: a.cal + m.cal,
      protein: a.protein + m.protein,
      fat: a.fat + m.fat,
      carb: a.carb + m.carb,
      fiber: a.fiber + m.fiber,
    }),
    { cal: 0, protein: 0, fat: 0, carb: 0, fiber: 0 }
  );
}

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getMoscowWeek() {
  // Получаем текущее время по МСК (UTC+3)
  const now = new Date();
  const msk = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  // JS: 0=вс,1=пн..6=сб → приводим к 0=пн..6=вс
  const todayIdx = (msk.getDay() + 6) % 7;
  // Начало недели (понедельник)
  const monday = new Date(msk);
  monday.setDate(msk.getDate() - todayIdx);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.getDate();
  });
  return { week, todayIdx };
}

const Index = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'day' | 'example' | 'goals' | 'profile'>('day');
  const { week, todayIdx } = getMoscowWeek();
  const [activeDay, setActiveDay] = useState(todayIdx);
  const [weightGoals, setWeightGoals] = useState<WeightGoals>(loadWeightGoals);

  useEffect(() => {
    const { theme } = loadSettings();
    const root = document.documentElement;
    root.classList.remove('dark', 'navy');
    if (theme === 'dark') root.classList.add('dark');
    if (theme === 'navy') root.classList.add('navy');
  }, []);

  const nutrition = calcNutrition(weightGoals.currentWeight, weightGoals.targetWeight);

  const notify = () => toast(t('photoTitle'), { description: t('photoSub') });

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="max-w-2xl mx-auto px-5 pt-10 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
            <Icon name="Leaf" size={20} className="text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-extrabold tracking-tight">Eatwise</span>
        </div>
        <button onClick={notify} className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <Icon name="Bell" size={18} className="text-foreground" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-5">
        {tab === 'day' && <DayView activeDay={activeDay} setActiveDay={setActiveDay} notify={notify} goals={nutrition} week={week} todayIdx={todayIdx} />}
        {tab === 'example' && <ExampleView goals={nutrition} onStart={() => setTab('day')} />}
        {tab === 'goals' && <GoalsView notify={notify} weightGoals={weightGoals} onSave={setWeightGoals} />}
        {tab === 'profile' && <ProfileView notify={notify} />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40">
        <div className="max-w-2xl mx-auto px-5 pb-5">
          <div className="bg-card/80 backdrop-blur-xl border border-border rounded-[1.75rem] shadow-lg shadow-black/5 flex items-center justify-around p-2">
            {[
              { id: 'example', icon: 'Sparkles', label: t('tab_example') },
              { id: 'day', icon: 'CircleGauge', label: t('tab_day') },
              { id: 'goals', icon: 'Target', label: t('tab_goals') },
              { id: 'profile', icon: 'User', label: t('tab_profile') },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id as typeof tab)}
                className={`flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl transition-all ${
                  tab === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name={item.icon} size={20} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

const DayView = ({
  activeDay,
  setActiveDay,
  notify,
  goals,
  week,
  todayIdx,
}: {
  activeDay: number;
  setActiveDay: (n: number) => void;
  notify: () => void;
  goals: ReturnType<typeof calcNutrition>;
  week: number[];
  todayIdx: number;
}) => {
  const { t } = useTranslation();
  const meals = MEALS_BY_DAY[activeDay] ?? [];
  const eaten = sumMeals(meals);
  return (
  <div className="space-y-6 animate-fade-in">
    <div className="flex gap-1.5 justify-between">
      {DAYS_SHORT.map((d, i) => (
        <button
          key={d}
          onClick={() => setActiveDay(i)}
          className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl transition-all ${
            activeDay === i
              ? 'bg-primary text-primary-foreground'
              : i === todayIdx
              ? 'bg-accent border border-primary/30 text-primary'
              : 'bg-card border border-border text-muted-foreground'
          }`}
        >
          <span className="text-[11px] font-medium">{d}</span>
          <span className="text-base font-display font-bold">{week[i]}</span>
        </button>
      ))}
    </div>

    <section className="bg-card border border-border rounded-[1.75rem] p-7 flex flex-col items-center">
      <ProgressRing value={eaten.cal} max={goals.cal} color="hsl(var(--cal))" label={t('calories')} unit={t('kcal')} ofText={t('of')} leftText={t('left')} />
      <div className="w-full grid grid-cols-2 gap-x-8 gap-y-5 mt-8">
        <MacroBar label={t('protein')} value={eaten.protein} max={goals.protein} color="hsl(var(--protein))" unit={t('g')} />
        <MacroBar label={t('fat')} value={eaten.fat} max={goals.fat} color="hsl(var(--fat))" unit={t('g')} />
        <MacroBar label={t('carbs')} value={eaten.carb} max={goals.carb} color="hsl(var(--carb))" unit={t('g')} />
        <MacroBar label={t('fiber')} value={eaten.fiber} max={goals.fiber} color="hsl(var(--fiber))" unit={t('g')} />
      </div>
    </section>

    <button
      onClick={notify}
      className="w-full group relative overflow-hidden rounded-[1.75rem] bg-primary text-primary-foreground p-6 flex items-center gap-4 hover:opacity-95 transition-opacity"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
        <Icon name="Camera" size={26} />
      </div>
      <div className="text-left">
        <p className="font-display text-lg font-bold">{t('photoTitle')}</p>
        <p className="text-sm opacity-80">{t('photoSub')}</p>
      </div>
      <Icon name="ArrowRight" size={22} className="ml-auto group-hover:translate-x-1 transition-transform" />
    </button>

    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-bold">{t('meals')}</h2>
      </div>
      {meals.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-[1.5rem] p-8 text-center text-muted-foreground">
          <Icon name="UtensilsCrossed" size={28} className="mx-auto mb-2 opacity-50" />
          <p>{t('noMeals')}</p>
        </div>
      )}
      {meals.map((m, i) => (
        <div key={i} className="bg-card border border-border rounded-[1.5rem] p-3 flex items-center gap-4">
          <img src={m.img} alt={m.name} className="w-16 h-16 rounded-2xl object-cover" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{m.name}</p>
              <span className="text-xs text-muted-foreground">{m.time}</span>
            </div>
            <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="text-macroProtein font-medium">Б {m.protein}</span>
              <span className="text-macroFat font-medium">Ж {m.fat}</span>
              <span className="text-macroCarb font-medium">У {m.carb}</span>
              <span className="text-macroFiber font-medium">Кл {m.fiber}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-cal">{m.cal}</p>
            <p className="text-[11px] text-muted-foreground">{t('kcal')}</p>
          </div>
        </div>
      ))}
    </section>
  </div>
  );
};

const HintBubble = ({
  title, sub, icon, delay = 0, side = 'right',
}: {
  title: string; sub: string; icon: string; delay?: number; side?: 'left' | 'right';
}) => (
  <div
    className={`hint-pop absolute z-20 top-1/2 -translate-y-1/2 w-44 ${
      side === 'right' ? 'right-2 sm:-right-3' : 'left-2 sm:-left-3'
    }`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="bg-primary text-primary-foreground rounded-2xl p-3 shadow-xl shadow-primary/20">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon name={icon} size={14} className="hint-bounce" />
        <span className="text-xs font-bold">{title}</span>
      </div>
      <p className="text-[11px] leading-snug opacity-90">{sub}</p>
    </div>
  </div>
);

const ExampleView = ({
  goals,
  onStart,
}: {
  goals: ReturnType<typeof calcNutrition>;
  onStart: () => void;
}) => {
  const { t } = useTranslation();
  const [hints, setHints] = useState(true);
  const eaten = sumMeals(EXAMPLE_MEALS);
  const glow = hints ? 'hint-glow border-primary' : 'border-border';
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-[1.75rem] bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-2 text-sm opacity-90 mb-2">
          <Icon name="Sparkles" size={16} />
          <span>{t('howItWorks')}</span>
        </div>
        <h1 className="font-display text-2xl font-extrabold leading-tight">
          {t('exampleHeadline')}
        </h1>
        <p className="text-sm opacity-85 mt-2">
          {t('exampleSub')}
        </p>
        <button
          onClick={() => setHints((v) => !v)}
          className="mt-4 inline-flex items-center gap-2 bg-primary-foreground/15 hover:bg-primary-foreground/25 transition-colors rounded-full px-4 py-2 text-sm font-medium"
        >
          <Icon name={hints ? 'EyeOff' : 'Eye'} size={16} />
          {hints ? t('hideHints') : t('showHints')}
        </button>
      </div>

      <div className="space-y-3">
        {[
          { icon: 'Camera', title: t('step1'), sub: t('step1s') },
          { icon: 'Brain', title: t('step2'), sub: t('step2s') },
          { icon: 'ChartPie', title: t('step3'), sub: t('step3s') },
        ].map((s) => (
          <div key={s.title} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-accent flex items-center justify-center shrink-0">
              <Icon name={s.icon} size={20} className="text-accent-foreground" />
            </div>
            <div>
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Кольцо калорий с пометкой */}
      <div className="relative">
        <span className="absolute -top-3 left-5 z-20 bg-macroFiber text-white text-xs font-medium px-3 py-1 rounded-full">
          {t('exampleDay')}
        </span>
        {hints && <HintBubble icon="Activity" title={t('hintRing')} sub={t('hintRingS')} delay={100} side="right" />}
        <section className={`bg-card border-2 rounded-[1.75rem] p-7 flex flex-col items-center transition-all ${glow}`}>
          <ProgressRing value={eaten.cal} max={goals.cal} color="hsl(var(--cal))" label={t('calories')} unit={t('kcal')} ofText={t('of')} leftText={t('left')} />
        </section>
      </div>

      {/* Шкалы КБЖУ с пометкой */}
      <div className="relative">
        {hints && <HintBubble icon="BarChart3" title={t('hintMacros')} sub={t('hintMacrosS')} delay={250} side="left" />}
        <section className={`bg-card border-2 rounded-[1.75rem] p-7 transition-all ${glow}`}>
          <div className="w-full grid grid-cols-2 gap-x-8 gap-y-5">
            <MacroBar label={t('protein')} value={eaten.protein} max={goals.protein} color="hsl(var(--protein))" unit={t('g')} />
            <MacroBar label={t('fat')} value={eaten.fat} max={goals.fat} color="hsl(var(--fat))" unit={t('g')} />
            <MacroBar label={t('carbs')} value={eaten.carb} max={goals.carb} color="hsl(var(--carb))" unit={t('g')} />
            <MacroBar label={t('fiber')} value={eaten.fiber} max={goals.fiber} color="hsl(var(--fiber))" unit={t('g')} />
          </div>
        </section>
      </div>

      {/* Кнопка съёмки с пометкой */}
      <div className="relative">
        {hints && <HintBubble icon="Hand" title={t('hintPhoto')} sub={t('hintPhotoS')} delay={400} side="right" />}
        <button className={`w-full rounded-[1.75rem] bg-primary text-primary-foreground p-6 flex items-center gap-4 border-2 transition-all ${hints ? 'hint-glow border-primary-foreground/20' : 'border-transparent'}`}>
          <div className="w-14 h-14 rounded-2xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
            <Icon name="Camera" size={26} />
          </div>
          <div className="text-left">
            <p className="font-display text-lg font-bold">{t('photoTitle')}</p>
            <p className="text-sm opacity-80">{t('photoSub')}</p>
          </div>
        </button>
      </div>

      {/* Список приёмов пищи с пометкой */}
      <div className="relative">
        {hints && <HintBubble icon="ListChecks" title={t('hintMeals')} sub={t('hintMealsS')} delay={550} side="left" />}
        <section className={`bg-card border-2 rounded-[1.75rem] p-4 space-y-3 transition-all ${glow}`}>
          <h2 className="font-display text-lg font-bold px-1">{t('mealsExample')}</h2>
          {EXAMPLE_MEALS.map((m, i) => (
            <div key={i} className="bg-background border border-border rounded-[1.5rem] p-3 flex items-center gap-4">
              <img src={m.img} alt={m.name} className="w-16 h-16 rounded-2xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{m.name}</p>
                  <span className="text-xs text-muted-foreground">{m.time}</span>
                </div>
                <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="text-macroProtein font-medium">Б {m.protein}</span>
                  <span className="text-macroFat font-medium">Ж {m.fat}</span>
                  <span className="text-macroCarb font-medium">У {m.carb}</span>
                  <span className="text-macroFiber font-medium">Кл {m.fiber}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-cal">{m.cal}</p>
                <p className="text-[11px] text-muted-foreground">{t('kcal')}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <Button onClick={onStart} className="w-full h-14 rounded-2xl text-base font-semibold">
        <Icon name="Rocket" size={18} className="mr-2" />
        {t('startDay')}
      </Button>
    </div>
  );
};

const GoalsView = ({
  notify: _notify,
  weightGoals,
  onSave,
}: {
  notify: () => void;
  weightGoals: WeightGoals;
  onSave: (g: WeightGoals) => void;
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<WeightGoals>({ ...weightGoals });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft({ ...weightGoals });
  }, [weightGoals]);

  const nutrition = calcNutrition(draft.currentWeight, draft.targetWeight);

  const totalToLose = Math.max(draft.startWeight - draft.targetWeight, 0.01);
  const alreadyLost = Math.max(draft.startWeight - draft.currentWeight, 0);
  const remaining = Math.max(draft.currentWeight - draft.targetWeight, 0);
  const progressPct = Math.min(Math.round((alreadyLost / totalToLose) * 100), 100);

  const handleSave = () => {
    onSave({ ...draft });
    localStorage.setItem(LS_KEY, JSON.stringify(draft));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChange = (field: keyof WeightGoals, val: string) => {
    const num = parseFloat(val.replace(',', '.'));
    setDraft((d) => ({ ...d, [field]: isNaN(num) ? 0 : num }));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="px-1">
        <h1 className="font-display text-3xl font-extrabold">{t('goals')}</h1>
        <p className="text-muted-foreground mt-1">{t('goalsSub')}</p>
      </div>

      {/* Весовые данные */}
      <section className="bg-card border border-border rounded-[1.75rem] p-6 space-y-4">
        <h2 className="font-display text-lg font-bold">{t('weightData')}</h2>
        <div className="grid grid-cols-3 gap-3">
          <WeightField label={t('startWeight')} unit={t('kg')} value={draft.startWeight} onChange={(v) => handleChange('startWeight', v)} />
          <WeightField label={t('targetWeight')} unit={t('kg')} value={draft.targetWeight} onChange={(v) => handleChange('targetWeight', v)} />
          <WeightField label={t('currentWeight')} unit={t('kg')} value={draft.currentWeight} onChange={(v) => handleChange('currentWeight', v)} highlight />
        </div>
      </section>

      {/* Прогресс снижения */}
      <section className="bg-card border border-border rounded-[1.75rem] p-6">
        <h2 className="font-display text-lg font-bold mb-4">{t('weightProgress')}</h2>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatChip label={t('lost')} value={`${alreadyLost.toFixed(1)} ${t('kg')}`} color="text-macroProtein" />
          <StatChip label={t('remaining')} value={`${remaining.toFixed(1)} ${t('kg')}`} color="text-cal" />
          <StatChip label={t('done')} value={`${progressPct}%`} color="text-primary" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{draft.startWeight} {t('kg')}</span>
            <span>{draft.targetWeight} {t('kg')}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, backgroundColor: 'hsl(var(--protein))' }}
            />
          </div>
        </div>
      </section>

      {/* Расчётные нормы КБЖУ */}
      <section className="bg-card border border-border rounded-[1.75rem] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{t('dailyNorms')}</h2>
          <span className="text-sm text-muted-foreground">{t('forWeight')} {draft.currentWeight} {t('kg')}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NormCard label={t('calories')} value={nutrition.cal} unit={t('kcal')} color="hsl(var(--cal))" />
          <NormCard label={t('protein')} value={nutrition.protein} unit={t('g')} color="hsl(var(--protein))" />
          <NormCard label={t('fat')} value={nutrition.fat} unit={t('g')} color="hsl(var(--fat))" />
          <NormCard label={t('carbs')} value={nutrition.carb} unit={t('g')} color="hsl(var(--carb))" />
        </div>
        <div className="bg-muted rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--fiber) / 0.15)' }}>
              <Icon name="Leaf" size={18} style={{ color: 'hsl(var(--fiber))' }} />
            </div>
            <span className="font-medium">{t('fiber')}</span>
          </div>
          <span className="font-display text-2xl font-bold" style={{ color: 'hsl(var(--fiber))' }}>
            {nutrition.fiber} <span className="text-sm text-muted-foreground font-sans font-normal">{t('g')}</span>
          </span>
        </div>
      </section>

      <Button
        onClick={handleSave}
        className="w-full h-14 rounded-2xl text-base font-semibold"
      >
        {saved ? (
          <><Icon name="Check" size={18} className="mr-2" />{t('saved')}</>
        ) : (
          t('saveData')
        )}
      </Button>
    </div>
  );
};

const WeightField = ({
  label, unit, value, onChange, highlight,
}: {
  label: string; unit: string; value: number; onChange: (v: string) => void; highlight?: boolean;
}) => (
  <div className={`rounded-2xl p-3.5 border space-y-1 ${highlight ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="flex items-baseline gap-1">
      <input
        type="number"
        step="0.1"
        defaultValue={value}
        key={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-transparent font-display text-xl font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${highlight ? 'text-primary' : 'text-foreground'}`}
      />
      <span className="text-xs text-muted-foreground shrink-0">{unit}</span>
    </div>
  </div>
);

const StatChip = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="bg-muted rounded-2xl p-3.5 text-center">
    <p className={`font-display text-lg font-bold ${color}`}>{value}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
  </div>
);

const NormCard = ({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) => (
  <div className="rounded-2xl border border-border bg-background p-4 flex items-center justify-between">
    <span className="text-sm font-medium text-muted-foreground">{label}</span>
    <span className="font-display text-xl font-bold" style={{ color }}>
      {value} <span className="text-xs text-muted-foreground font-sans font-normal">{unit}</span>
    </span>
  </div>
);

const ProfileView = ({ notify: _notify }: { notify: () => void }) => {
  const { t } = useTranslation();
  const [reminders, setReminders] = useState({ meals: true, goals: true, water: false });
  const [gender, setGender] = useState<'male' | 'female'>('female');

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="bg-card border border-border rounded-[1.75rem] p-7 flex items-center gap-5">
        <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center">
          <Icon name="User" size={36} className="text-accent-foreground" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold">Анна</h1>
          <p className="text-muted-foreground">28 · 168 см</p>
        </div>
      </section>

      <section className="bg-card border border-border rounded-[1.75rem] p-6 space-y-5">
        <h2 className="font-display text-lg font-bold">{t('personalData')}</h2>
        <Field label={t('name')} value="Анна" />
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('height')} value="168" />
          <Field label={t('age')} value="28" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-sm">{t('gender')}</Label>
          <SegmentGroup
            value={gender}
            onChange={(v) => setGender(v as 'male' | 'female')}
            options={[
              { value: 'female', label: t('female') },
              { value: 'male', label: t('male') },
            ]}
          />
        </div>
      </section>

      <section className="bg-card border border-border rounded-[1.75rem] p-6 space-y-1">
        <h2 className="font-display text-lg font-bold mb-3">{t('reminders')}</h2>
        {[
          { key: 'meals', icon: 'Utensils', title: t('remMeals'), sub: t('remMealsS') },
          { key: 'goals', icon: 'Target', title: t('remGoals'), sub: t('remGoalsS') },
          { key: 'water', icon: 'Droplet', title: t('remWater'), sub: t('remWaterS') },
        ].map((r) => (
          <div key={r.key} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
            <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center shrink-0">
              <Icon name={r.icon} size={20} className="text-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{r.title}</p>
              <p className="text-sm text-muted-foreground">{r.sub}</p>
            </div>
            <Switch
              checked={reminders[r.key as keyof typeof reminders]}
              onCheckedChange={(v) => setReminders((s) => ({ ...s, [r.key]: v }))}
            />
          </div>
        ))}
      </section>

      <SettingsSheet />

      <a
        href="https://tbank.ru/cf/8O611IzOKrc"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full h-14 rounded-2xl text-base font-semibold flex items-center justify-center gap-2.5 bg-[#FFDD2D] text-[#1a1a1a] hover:bg-[#f5d300] transition-colors"
      >
        <Icon name="Heart" size={18} />
        {t('support')}
      </a>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1.5">
    <Label className="text-muted-foreground text-sm">{label}</Label>
    <Input defaultValue={value} className="h-12 rounded-xl bg-background" />
  </div>
);

const SettingsSheet = () => {
  const { t, lang, setLang } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
    const root = document.documentElement;
    root.classList.remove('dark', 'navy');
    if (settings.theme === 'dark') root.classList.add('dark');
    if (settings.theme === 'navy') root.classList.add('navy');
  }, [settings]);

  const update = <K extends keyof AppSettings>(key: K, val: AppSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: val }));

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full h-14 rounded-2xl text-base font-semibold">
          <Icon name="Settings" size={18} className="mr-2" />
          {t('settings')}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl font-extrabold text-left">{t('settings')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-7 mt-6">
          <SettingRow icon="Ruler" title={t('units')} sub={t('unitsSub')}>
            <SegmentGroup
              value={settings.units}
              onChange={(v) => update('units', v as AppSettings['units'])}
              options={[
                { value: 'metric', label: t('metric') },
                { value: 'imperial', label: t('imperial') },
              ]}
            />
          </SettingRow>

          <SettingRow icon="Flame" title={t('energy')} sub={t('energySub')}>
            <SegmentGroup
              value={settings.energy}
              onChange={(v) => update('energy', v as AppSettings['energy'])}
              options={[
                { value: 'kcal', label: t('kcal') },
                { value: 'kj', label: 'кДж' },
              ]}
            />
          </SettingRow>

          <SettingRow icon="Palette" title={t('theme')} sub={t('themeSub')}>
            <SegmentGroup
              value={settings.theme}
              onChange={(v) => update('theme', v as Theme)}
              options={[
                { value: 'light', label: t('light') },
                { value: 'dark', label: t('dark') },
                { value: 'navy', label: t('navy') },
              ]}
            />
          </SettingRow>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                <Icon name="Languages" size={20} className="text-foreground" />
              </div>
              <div>
                <p className="font-medium">{t('language')}</p>
                <p className="text-sm text-muted-foreground">{t('languageSub')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                    lang === l.code
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="text-xl">{l.flag}</span>
                  <span className="font-medium">{l.label}</span>
                  {lang === l.code && <Icon name="Check" size={18} className="ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const SettingRow = ({
  icon, title, sub, children,
}: {
  icon: string; title: string; sub: string; children: React.ReactNode;
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center shrink-0">
        <Icon name={icon} size={20} className="text-foreground" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
    </div>
    {children}
  </div>
);

const SegmentGroup = ({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) => (
  <div className="flex gap-1.5 p-1 bg-muted rounded-2xl">
    {options.map((o) => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
          value === o.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export default Index;