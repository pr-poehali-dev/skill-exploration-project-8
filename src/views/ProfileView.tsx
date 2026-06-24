import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTranslation } from '@/lib/i18n';
import { AppSettings, Theme, LANGUAGES, LS_SETTINGS, DEFAULT_SETTINGS, loadSettings } from '@/lib/eatwise-types';

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1.5">
    <Label className="text-muted-foreground text-sm">{label}</Label>
    <Input defaultValue={value} className="h-12 rounded-xl bg-background" />
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
                { value: 'metric',   label: t('metric') },
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
                { value: 'kj',   label: 'кДж' },
              ]}
            />
          </SettingRow>

          <SettingRow icon="Palette" title={t('theme')} sub={t('themeSub')}>
            <SegmentGroup
              value={settings.theme}
              onChange={(v) => update('theme', v as Theme)}
              options={[
                { value: 'light', label: t('light') },
                { value: 'dark',  label: t('dark') },
                { value: 'navy',  label: t('navy') },
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
          <Field label={t('age')}    value="28" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-sm">{t('gender')}</Label>
          <SegmentGroup
            value={gender}
            onChange={(v) => setGender(v as 'male' | 'female')}
            options={[
              { value: 'female', label: t('female') },
              { value: 'male',   label: t('male') },
            ]}
          />
        </div>
      </section>

      <section className="bg-card border border-border rounded-[1.75rem] p-6 space-y-1">
        <h2 className="font-display text-lg font-bold mb-3">{t('reminders')}</h2>
        {[
          { key: 'meals', icon: 'Utensils', title: t('remMeals'), sub: t('remMealsS') },
          { key: 'goals', icon: 'Target',   title: t('remGoals'), sub: t('remGoalsS') },
          { key: 'water', icon: 'Droplet',  title: t('remWater'), sub: t('remWaterS') },
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

export default ProfileView;
