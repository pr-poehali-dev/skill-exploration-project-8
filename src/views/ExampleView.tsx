import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import ProgressRing from '@/components/nutrition/ProgressRing';
import MacroBar from '@/components/nutrition/MacroBar';
import { useTranslation } from '@/lib/i18n';
import { EXAMPLE_MEALS, sumMeals, calcNutrition } from '@/lib/eatwise-types';

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
          { icon: 'Camera',   title: t('step1'), sub: t('step1s') },
          { icon: 'Brain',    title: t('step2'), sub: t('step2s') },
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
            <MacroBar label={t('fat')}     value={eaten.fat}     max={goals.fat}     color="hsl(var(--fat))"     unit={t('g')} />
            <MacroBar label={t('carbs')}   value={eaten.carb}    max={goals.carb}    color="hsl(var(--carb))"    unit={t('g')} />
            <MacroBar label={t('fiber')}   value={eaten.fiber}   max={goals.fiber}   color="hsl(var(--fiber))"   unit={t('g')} />
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

export default ExampleView;
