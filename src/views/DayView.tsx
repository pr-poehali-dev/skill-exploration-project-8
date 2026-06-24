import Icon from '@/components/ui/icon';
import ProgressRing from '@/components/nutrition/ProgressRing';
import MacroBar from '@/components/nutrition/MacroBar';
import { useTranslation } from '@/lib/i18n';
import { Meal, MEALS_BY_DAY, DAYS_SHORT, sumMeals, calcNutrition } from '@/lib/eatwise-types';

const MealCard = ({ m, kcal }: { m: Meal; kcal: string }) => (
  <div className="bg-card border border-border rounded-[1.5rem] p-3 flex items-center gap-4">
    {m.img ? (
      <img src={m.img} alt={m.name} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
    ) : (
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center shrink-0">
        <Icon name="Utensils" size={22} className="text-muted-foreground" />
      </div>
    )}
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
      <p className="text-[11px] text-muted-foreground">{kcal}</p>
    </div>
  </div>
);

const DayView = ({
  activeDay,
  setActiveDay,
  onOpenScanner,
  goals,
  week,
  todayIdx,
  userMeals,
}: {
  activeDay: number;
  setActiveDay: (n: number) => void;
  onOpenScanner: () => void;
  goals: ReturnType<typeof calcNutrition>;
  week: number[];
  todayIdx: number;
  userMeals: Meal[];
}) => {
  const { t } = useTranslation();
  const staticMeals = MEALS_BY_DAY[activeDay] ?? [];
  const meals = [...staticMeals, ...userMeals];
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
          <MacroBar label={t('fat')}     value={eaten.fat}     max={goals.fat}     color="hsl(var(--fat))"     unit={t('g')} />
          <MacroBar label={t('carbs')}   value={eaten.carb}    max={goals.carb}    color="hsl(var(--carb))"    unit={t('g')} />
          <MacroBar label={t('fiber')}   value={eaten.fiber}   max={goals.fiber}   color="hsl(var(--fiber))"   unit={t('g')} />
        </div>
      </section>

      <button
        onClick={onOpenScanner}
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
        {meals.map((m, i) => <MealCard key={i} m={m} kcal={t('kcal')} />)}
      </section>
    </div>
  );
};

export default DayView;
