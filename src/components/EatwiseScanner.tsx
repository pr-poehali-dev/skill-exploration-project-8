import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import func2url from '../../backend/func2url.json';

const ANALYZE_URL = func2url['analyze-food'];

const LS_KEY = 'eatwise_weight_goals';

function loadNorms() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const g = JSON.parse(raw);
      const currentWeight = g.currentWeight ?? 90;
      const targetWeight = g.targetWeight ?? 80;
      const cal = Math.round(currentWeight * 25);
      const protein = Math.round(targetWeight * 2);
      const fat = Math.round(currentWeight * 0.7);
      const fiber = Math.round((cal / 1000) * 14 * 10) / 10;
      const carb = Math.round((cal - (protein * 4 + fat * 9)) / 4);
      return { calories: cal, protein, fat, carbs: carb, fiber };
    }
  } catch (_e) { /* ignore */ }
  return { calories: 2500, protein: 150, fat: 80, carbs: 300, fiber: 35 };
}

interface ScanResult {
  meal_name: string;
  total: { calories: number; protein: number; fat: number; carbs: number; fiber: number };
  dishes: { name: string; weight: number; calories: number; protein: number; fat: number; carbs: number; fiber: number }[];
  confidence: 'high' | 'medium' | 'low';
  note: string | null;
}

interface Meal {
  name: string; time: string; img: string;
  cal: number; protein: number; fat: number; carb: number; fiber: number;
}

interface Props {
  onAdd: (meal: Meal) => void;
  onClose: () => void;
}

const MACRO_COLORS: Record<string, string> = {
  calories: 'hsl(var(--cal))',
  protein:  'hsl(var(--protein))',
  fat:      'hsl(var(--fat))',
  carbs:    'hsl(var(--carb))',
  fiber:    'hsl(var(--fiber))',
};

function MacroRow({ label, value, unit, pct, color }: {
  label: string; value: number; unit: string; pct: number | null; color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{value}</span> {unit}
        </span>
      </div>
      {pct !== null && (
        <>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">{pct}% от нормы</p>
        </>
      )}
    </div>
  );
}

function DishItem({ dish }: { dish: ScanResult['dishes'][0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-background border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div>
          <p className="font-medium text-sm">{dish.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{dish.weight} г · {dish.calories} ккал</p>
        </div>
        <Icon
          name="ChevronDown"
          size={18}
          className={`text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
          {(['protein', 'fat', 'carbs', 'fiber'] as const).map(m => (
            <div key={m} className="bg-muted rounded-xl px-3 py-2">
              <p className="text-[11px] text-muted-foreground capitalize">
                {{ protein: 'Белки', fat: 'Жиры', carbs: 'Углеводы', fiber: 'Клетчатка' }[m]}
              </p>
              <p className="text-sm font-bold" style={{ color: MACRO_COLORS[m] }}>{dish[m]} г</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EatwiseScanner({ onAdd, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageBase64, setImageBase64] = useState<{ data: string; media_type: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const norms = loadNorms();

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64({ data: dataUrl.split(',')[1], media_type: file.type || 'image/jpeg' });
      setResult(null);
      setError(null);
      setAdded(false);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(ANALYZE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: imageBase64.data, media_type: imageBase64.media_type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка сервера');
      setResult(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось распознать блюдо. Попробуй другое фото.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (!result) return;
    const meal: Meal = {
      name: result.meal_name,
      img: imagePreview || '',
      time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
      cal: result.total.calories,
      protein: result.total.protein,
      fat: result.total.fat,
      carb: result.total.carbs,
      fiber: result.total.fiber,
    };
    setAdded(true);
    setTimeout(() => {
      onAdd(meal);
      onClose();
    }, 700);
  };

  const reset = () => {
    setImageBase64(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    setAdded(false);
  };

  const confidenceLabel = result?.confidence === 'high' ? '✓ Точно'
    : result?.confidence === 'medium' ? '~ Примерно' : '? Неточно';
  const confidenceClass = result?.confidence === 'high'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : result?.confidence === 'medium'
    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-y-auto">

      {/* Шапка */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-extrabold">Сфотографировать еду</h1>
          <p className="text-xs text-muted-foreground">ИИ определит блюдо и КБЖУ</p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <Icon name="X" size={18} />
        </button>
      </header>

      <div className="flex-1 max-w-2xl w-full mx-auto px-5 py-5 space-y-4 pb-10">

        {/* Зона загрузки фото */}
        {!imagePreview ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-primary/40 rounded-[1.75rem] p-12 flex flex-col items-center gap-4 text-center cursor-pointer hover:bg-primary/5 transition-colors"
          >
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Icon name="Camera" size={36} className="text-primary" />
            </div>
            <div>
              <p className="font-display text-lg font-bold">Загрузи фото еды</p>
              <p className="text-sm text-muted-foreground mt-1">Нажми, чтобы выбрать из галереи<br />или сделать снимок</p>
            </div>
            <Button className="rounded-xl px-8">Выбрать фото</Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => handleFile(e.target.files?.[0])}
            />
          </div>
        ) : (
          <div className="relative rounded-[1.75rem] overflow-hidden">
            <img
              src={imagePreview}
              alt="Фото еды"
              className="w-full max-h-72 object-cover block"
            />
            {loading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                <div className="w-11 h-11 rounded-full border-[3px] border-white/20 border-t-primary animate-spin" />
                <p className="text-white font-semibold text-sm">Анализирую состав…</p>
                <p className="text-white/60 text-xs">Claude распознаёт блюдо</p>
              </div>
            )}
            {!loading && (
              <button
                onClick={reset}
                className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/50 text-white flex items-center justify-center"
              >
                <Icon name="X" size={16} />
              </button>
            )}
          </div>
        )}

        {/* Кнопка анализа */}
        {imagePreview && !result && !loading && (
          <Button onClick={analyze} className="w-full h-14 rounded-2xl text-base font-semibold">
            <Icon name="ScanLine" size={20} className="mr-2" />
            Определить КБЖУ
          </Button>
        )}

        {/* Ошибка */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3">
            <Icon name="AlertTriangle" size={18} className="text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Результат */}
        {result && (
          <>
            {/* Название блюда + уверенность */}
            <div className="bg-card border border-border rounded-[1.75rem] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Распознано</p>
                  <h2 className="font-display text-xl font-extrabold">{result.meal_name}</h2>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full ${confidenceClass}`}>
                  {confidenceLabel}
                </span>
              </div>
              {result.note && (
                <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                  💬 {result.note}
                </p>
              )}
            </div>

            {/* КБЖУ итого */}
            <div className="bg-card border border-border rounded-[1.75rem] p-5 space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Итого за приём пищи</p>

              {/* Калории крупно */}
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="font-semibold">Калории</span>
                <span className="font-display text-2xl font-extrabold" style={{ color: MACRO_COLORS.calories }}>
                  {result.total.calories}
                  <span className="text-sm font-sans font-normal text-muted-foreground ml-1">ккал</span>
                </span>
              </div>

              <div className="space-y-4">
                {(['protein', 'fat', 'carbs', 'fiber'] as const).map(m => {
                  const labels = { protein: 'Белки', fat: 'Жиры', carbs: 'Углеводы', fiber: 'Клетчатка' };
                  const norm = norms[m];
                  const val = result.total[m];
                  const pct = norm ? Math.round((val / norm) * 100) : null;
                  return (
                    <MacroRow
                      key={m}
                      label={labels[m]}
                      value={val}
                      unit="г"
                      pct={pct}
                      color={MACRO_COLORS[m]}
                    />
                  );
                })}
              </div>
            </div>

            {/* Разбивка по блюдам */}
            {result.dishes?.length > 1 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Разбивка по блюдам</p>
                {result.dishes.map((d, i) => <DishItem key={i} dish={d} />)}
              </div>
            )}

            {/* Добавить в дневник */}
            <Button
              onClick={handleAdd}
              disabled={added}
              className={`w-full h-14 rounded-2xl text-base font-semibold transition-all ${
                added ? 'bg-green-600 hover:bg-green-600' : ''
              }`}
            >
              {added ? (
                <><Icon name="Check" size={20} className="mr-2" />Добавлено в дневник</>
              ) : (
                <><Icon name="PlusCircle" size={20} className="mr-2" />Добавить в дневник</>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}