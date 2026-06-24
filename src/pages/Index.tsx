import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import EatwiseScanner from '@/components/EatwiseScanner';
import DayView from '@/views/DayView';
import ExampleView from '@/views/ExampleView';
import GoalsView from '@/views/GoalsView';
import ProfileView from '@/views/ProfileView';
import {
  Meal,
  WeightGoals,
  loadWeightGoals,
  loadSettings,
  calcNutrition,
  getMoscowWeek,
} from '@/lib/eatwise-types';

const Index = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'day' | 'example' | 'goals' | 'profile'>('day');
  const { week, todayIdx } = getMoscowWeek();
  const [activeDay, setActiveDay] = useState(todayIdx);
  const [weightGoals, setWeightGoals] = useState<WeightGoals>(loadWeightGoals);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [userMeals, setUserMeals] = useState<Record<number, Meal[]>>({});

  useEffect(() => {
    const { theme } = loadSettings();
    const root = document.documentElement;
    root.classList.remove('dark', 'navy');
    if (theme === 'dark') root.classList.add('dark');
    if (theme === 'navy') root.classList.add('navy');
  }, []);

  const nutrition = calcNutrition(weightGoals.currentWeight, weightGoals.targetWeight);

  const notify = () => toast(t('photoTitle'), { description: t('photoSub') });

  const handleAddMeal = (meal: Meal) => {
    setUserMeals(prev => ({
      ...prev,
      [activeDay]: [...(prev[activeDay] ?? []), meal],
    }));
    toast('Добавлено!', { description: meal.name });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {scannerOpen && (
        <EatwiseScanner
          onAdd={handleAddMeal}
          onClose={() => setScannerOpen(false)}
        />
      )}

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
        {tab === 'day'     && <DayView     activeDay={activeDay} setActiveDay={setActiveDay} onOpenScanner={() => setScannerOpen(true)} goals={nutrition} week={week} todayIdx={todayIdx} userMeals={userMeals[activeDay] ?? []} />}
        {tab === 'example' && <ExampleView goals={nutrition} onStart={() => setTab('day')} />}
        {tab === 'goals'   && <GoalsView   notify={notify} weightGoals={weightGoals} onSave={setWeightGoals} />}
        {tab === 'profile' && <ProfileView notify={notify} />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40">
        <div className="max-w-2xl mx-auto px-5 pb-5">
          <div className="bg-card/80 backdrop-blur-xl border border-border rounded-[1.75rem] shadow-lg shadow-black/5 flex items-center justify-around p-2">
            {[
              { id: 'example', icon: 'Sparkles',    label: t('tab_example') },
              { id: 'day',     icon: 'CircleGauge', label: t('tab_day') },
              { id: 'goals',   icon: 'Target',      label: t('tab_goals') },
              { id: 'profile', icon: 'User',        label: t('tab_profile') },
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

export default Index;
