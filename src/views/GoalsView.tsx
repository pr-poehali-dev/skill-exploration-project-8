import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { WeightGoals, LS_KEY, calcNutrition } from '@/lib/eatwise-types';

const WeightField = ({
  label, unit, value, onChange, highlight,
}: {
  label: string; unit: string; value: number; onChange: (v: string) => void; highlight?: boolean;
}) => {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    if (parseFloat(text.replace(',', '.')) !== value) {
      setText(String(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={`rounded-2xl p-3.5 border space-y-1 ${highlight ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1">
        <input
          type="text"
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            const v = e.target.value.replace(',', '.');
            if (v === '' || /^\d*\.?\d*$/.test(v)) {
              setText(v);
              onChange(v);
            }
          }}
          className={`w-full bg-transparent font-display text-xl font-bold outline-none ${highlight ? 'text-primary' : 'text-foreground'}`}
        />
        <span className="text-xs text-muted-foreground shrink-0">{unit}</span>
      </div>
    </div>
  );
};

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

  const totalToLose  = Math.max(draft.startWeight - draft.targetWeight, 0.01);
  const alreadyLost  = Math.max(draft.startWeight - draft.currentWeight, 0);
  const remaining    = Math.max(draft.currentWeight - draft.targetWeight, 0);
  const progressPct  = Math.min(Math.round((alreadyLost / totalToLose) * 100), 100);

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
          <WeightField label={t('startWeight')}   unit={t('kg')} value={draft.startWeight}   onChange={(v) => handleChange('startWeight', v)} />
          <WeightField label={t('targetWeight')}  unit={t('kg')} value={draft.targetWeight}  onChange={(v) => handleChange('targetWeight', v)} />
          <WeightField label={t('currentWeight')} unit={t('kg')} value={draft.currentWeight} onChange={(v) => handleChange('currentWeight', v)} highlight />
        </div>
      </section>

      {/* Прогресс снижения */}
      <section className="bg-card border border-border rounded-[1.75rem] p-6">
        <h2 className="font-display text-lg font-bold mb-4">{t('weightProgress')}</h2>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatChip label={t('lost')}      value={`${alreadyLost.toFixed(1)} ${t('kg')}`} color="text-macroProtein" />
          <StatChip label={t('remaining')} value={`${remaining.toFixed(1)} ${t('kg')}`}   color="text-cal" />
          <StatChip label={t('done')}      value={`${progressPct}%`}                       color="text-primary" />
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
          <NormCard label={t('calories')} value={nutrition.cal}     unit={t('kcal')} color="hsl(var(--cal))" />
          <NormCard label={t('protein')}  value={nutrition.protein} unit={t('g')}    color="hsl(var(--protein))" />
          <NormCard label={t('fat')}      value={nutrition.fat}     unit={t('g')}    color="hsl(var(--fat))" />
          <NormCard label={t('carbs')}    value={nutrition.carb}    unit={t('g')}    color="hsl(var(--carb))" />
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

      <Button onClick={handleSave} className="w-full h-14 rounded-2xl text-base font-semibold">
        {saved ? (
          <><Icon name="Check" size={18} className="mr-2" />{t('saved')}</>
        ) : (
          t('saveData')
        )}
      </Button>
    </div>
  );
};

export default GoalsView;
