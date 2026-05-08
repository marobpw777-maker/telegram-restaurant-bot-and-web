import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  CalendarDays, 
  Calculator, 
  LogOut,
  TrendingUp,
  X,
  Check,
  AlertTriangle,
  Menu,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useBookings, useUpdateBooking } from '@/hooks/useBookings';
import { useCategories, useMenuItems, useUpdateMenuItem, useCreateMenuItem, useDeleteMenuItem } from '@/hooks/useMenu';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

import type { BookingWithUser } from '@/services/api/bookings';
import { useUnitEconomicsReport, useUnitEconomicsSettings, useUpdateUnitEconomicsSettings } from '@/hooks/useEconomics';
import type { UnitEconomicsSettings as UnitEconomicsSettingsType } from '@/services/api/economics';

const formatMoney = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₽`;
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';
type EconomicsFormState = Record<keyof UnitEconomicsSettingsType, string>;

const ECONOMICS_DEFAULT_FORM: EconomicsFormState = {
  average_check: '2850',
  average_guests_per_booking: '3.2',
  bookings_per_day: '12',
  occupancy_rate_percent: '70',
  no_show_rate_percent: '8',
  days_open_per_month: '30',
  tax_rate_percent: '20',
  payroll_tax_percent: '30',
  rent_monthly: '350000',
  electricity_monthly: '55000',
  water_monthly: '12000',
  salaries_monthly: '900000',
  marketing_monthly: '60000',
  delivery_monthly: '0',
  other_fixed_monthly: '40000',
  food_cost_percent: '32',
  acquiring_percent: '2.5',
  packaging_cost_per_guest: '35',
  other_variable_percent: '1.5',
};

const settingsToForm = (settings?: Partial<UnitEconomicsSettingsType>): EconomicsFormState => ({
  average_check: String(settings?.average_check ?? ECONOMICS_DEFAULT_FORM.average_check),
  average_guests_per_booking: String(settings?.average_guests_per_booking ?? ECONOMICS_DEFAULT_FORM.average_guests_per_booking),
  bookings_per_day: String(settings?.bookings_per_day ?? ECONOMICS_DEFAULT_FORM.bookings_per_day),
  occupancy_rate_percent: String(settings?.occupancy_rate_percent ?? ECONOMICS_DEFAULT_FORM.occupancy_rate_percent),
  no_show_rate_percent: String(settings?.no_show_rate_percent ?? ECONOMICS_DEFAULT_FORM.no_show_rate_percent),
  days_open_per_month: String(settings?.days_open_per_month ?? ECONOMICS_DEFAULT_FORM.days_open_per_month),
  tax_rate_percent: String(settings?.tax_rate_percent ?? ECONOMICS_DEFAULT_FORM.tax_rate_percent),
  payroll_tax_percent: String(settings?.payroll_tax_percent ?? ECONOMICS_DEFAULT_FORM.payroll_tax_percent),
  rent_monthly: String(settings?.rent_monthly ?? ECONOMICS_DEFAULT_FORM.rent_monthly),
  electricity_monthly: String(settings?.electricity_monthly ?? ECONOMICS_DEFAULT_FORM.electricity_monthly),
  water_monthly: String(settings?.water_monthly ?? ECONOMICS_DEFAULT_FORM.water_monthly),
  salaries_monthly: String(settings?.salaries_monthly ?? ECONOMICS_DEFAULT_FORM.salaries_monthly),
  marketing_monthly: String(settings?.marketing_monthly ?? ECONOMICS_DEFAULT_FORM.marketing_monthly),
  delivery_monthly: String(settings?.delivery_monthly ?? ECONOMICS_DEFAULT_FORM.delivery_monthly),
  other_fixed_monthly: String(settings?.other_fixed_monthly ?? ECONOMICS_DEFAULT_FORM.other_fixed_monthly),
  food_cost_percent: String(settings?.food_cost_percent ?? ECONOMICS_DEFAULT_FORM.food_cost_percent),
  acquiring_percent: String(settings?.acquiring_percent ?? ECONOMICS_DEFAULT_FORM.acquiring_percent),
  packaging_cost_per_guest: String(settings?.packaging_cost_per_guest ?? ECONOMICS_DEFAULT_FORM.packaging_cost_per_guest),
  other_variable_percent: String(settings?.other_variable_percent ?? ECONOMICS_DEFAULT_FORM.other_variable_percent),
});

const formToSettings = (form: EconomicsFormState): UnitEconomicsSettingsType => ({
  average_check: Number(form.average_check || 0),
  average_guests_per_booking: Number(form.average_guests_per_booking || 0),
  bookings_per_day: Number(form.bookings_per_day || 0),
  occupancy_rate_percent: Number(form.occupancy_rate_percent || 0),
  no_show_rate_percent: Number(form.no_show_rate_percent || 0),
  days_open_per_month: Number(form.days_open_per_month || 0),
  tax_rate_percent: Number(form.tax_rate_percent || 0),
  payroll_tax_percent: Number(form.payroll_tax_percent || 0),
  rent_monthly: Number(form.rent_monthly || 0),
  electricity_monthly: Number(form.electricity_monthly || 0),
  water_monthly: Number(form.water_monthly || 0),
  salaries_monthly: Number(form.salaries_monthly || 0),
  marketing_monthly: Number(form.marketing_monthly || 0),
  delivery_monthly: Number(form.delivery_monthly || 0),
  other_fixed_monthly: Number(form.other_fixed_monthly || 0),
  food_cost_percent: Number(form.food_cost_percent || 0),
  acquiring_percent: Number(form.acquiring_percent || 0),
  packaging_cost_per_guest: Number(form.packaging_cost_per_guest || 0),
  other_variable_percent: Number(form.other_variable_percent || 0),
});

function NumberField({
  label,
  value,
  onChange,
  suffix,
  helper,
  step = '1',
  min = '0',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  helper?: string;
  step?: string;
  min?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">{label}{suffix ? <span className="ml-1 text-muted-foreground">({suffix})</span> : null}</label>
      <Input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function AdminLoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || `HTTP ${res.status}`);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-grain">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Вход в админ-панель</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Логин</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Пароль</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Вход...' : 'Войти'}</Button>
            <p className="text-xs text-muted-foreground">Если вход не работает, добавьте ADMIN_PASSWORD в BOTREST/.env и перезапустите бэкенд.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { id: 'menu', label: 'Меню', icon: UtensilsCrossed },
    { id: 'reservations', label: 'Бронирования', icon: CalendarDays },
    { id: 'marketing', label: 'Маркетинг', icon: TrendingUp },
    { id: 'economics', label: 'Юнит-экономика', icon: Calculator },
  ];

  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-8 border-b border-border">
        <Link to="/menu" className="flex flex-col gap-1 group no-underline">
          <div className="flex items-center gap-2">
            <span className="text-2xl group-hover:scale-110 transition-transform">🍷</span>
            <span className="text-sm font-serif font-bold uppercase tracking-[0.2em] text-muted-foreground">Premium</span>
          </div>
          <span className="font-serif text-2xl font-bold text-gradient leading-tight">Вкус</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 mt-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Администратор</p>
            <p className="text-xs text-muted-foreground">admin@restaurant-vkus.ru</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
              window.location.reload()
            }}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}


function DashboardView() {
  const { data: report, isLoading, isError } = useUnitEconomicsReport(6);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          Загружаем расчёты unit economics...
        </CardContent>
      </Card>
    );
  }

  if (isError || !report) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground space-y-2">
          <p>Не удалось загрузить дашборд.</p>
          <p className="text-xs">Проверьте, что backend запущен на 8000 порту и доступен API /api/economics/report.</p>
        </CardContent>
      </Card>
    );
  }

  const money = (value: number) => formatMoney(value || 0);
  const pct = (value: number) => formatPercent(value || 0);

  const mainMetrics = [
    { label: 'Броней сегодня', value: String(report.today_bookings), note: 'Факт за текущий день' },
    { label: 'Гостей сегодня', value: String(report.today_guests), note: 'По бронированиям на сегодня' },
    { label: 'Средний чек', value: money(report.average_check), note: 'Текущая модель' },
    { label: 'No-show rate', value: pct(report.today_no_show_rate), note: 'Факт по последним данным' },
    { label: 'Выручка / мес.', value: money(report.forecast_revenue_per_month), note: 'Прогноз по настройкам' },
    { label: 'Валовая прибыль', value: money(report.forecast_gross_profit_per_month), note: 'После food cost' },
    { label: 'Операционная прибыль', value: money(report.forecast_operating_profit_per_month), note: 'После fixed + variable OPEX' },
    { label: 'Чистая прибыль', value: money(report.forecast_net_profit_per_month), note: 'После налога' },
  ];

  const secondaryMetrics = [
    { label: 'Break-even', value: money(report.break_even_revenue), note: `${report.break_even_guests.toFixed(0)} гостей в месяц` },
    { label: 'Прибыль на гостя', value: money(report.profit_per_guest), note: 'Net / гостей' },
    { label: 'Прибыль на бронь', value: money(report.profit_per_booking), note: 'Net / броней' },
    { label: 'No-show loss', value: money(report.no_show_lost_revenue), note: 'Потерянная выручка' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {mainMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-3xl font-bold leading-none">{metric.value}</div>
                <p className="text-xs text-muted-foreground">{metric.note}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {secondaryMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-semibold leading-none">{metric.value}</div>
                <p className="text-xs text-muted-foreground">{metric.note}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Бронирования за неделю</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.weekly_series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="reservations" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }} />
                  <Line type="monotone" dataKey="guests" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: 'hsl(var(--success))', strokeWidth: 0, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Выручка по месяцам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.monthly_forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Выручка']}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Модель расчёта</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Загрузка: {report.occupancy_rate_effective.toFixed(0)}%</p>
            <p>Броней в день: {report.bookings_per_day.toFixed(1)}</p>
            <p>Средний чек: {money(report.average_check)}</p>
            <p>No-show потери: {money(report.no_show_lost_revenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Чувствительность</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">+10% к среднему чеку</span>
              <span className="font-semibold">{money(report.sensitivities.average_check_plus_10)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">-10% к среднему чеку</span>
              <span className="font-semibold">{money(report.sensitivities.average_check_minus_10)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">No-show = 0%</span>
              <span className="font-semibold">{money(report.sensitivities.no_show_zero)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Загрузка +10 п.п.</span>
              <span className="font-semibold">{money(report.sensitivities.occupancy_plus_10)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Формулы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2 list-disc pl-5">
              {report.formula_notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}


function EconomicsView() {
  const { data: report } = useUnitEconomicsReport(6);
  const { data: settingsData } = useUnitEconomicsSettings();
  const updateSettings = useUpdateUnitEconomicsSettings();
  const [form, setForm] = useState<EconomicsFormState>(ECONOMICS_DEFAULT_FORM);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const source = settingsData ?? report?.settings;
    if (source) {
      // Intentional sync from server state into the editable form.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(settingsToForm(source));
    }
  }, [settingsData, report]);

  const sections: { title: string; description: string; fields: { key: keyof EconomicsFormState; label: string; helper: string; suffix?: string; step?: string }[] }[] = [
    {
      title: 'Спрос и загрузка',
      description: 'Эти параметры управляют прогнозом броней и выручки.',
      fields: [
        { key: 'average_check', label: 'Средний чек', helper: 'Средняя выручка на одного гостя', suffix: '₽', step: '50' },
        { key: 'average_guests_per_booking', label: 'Гостей на бронь', helper: 'Средний размер столика', suffix: 'чел.', step: '0.1' },
        { key: 'bookings_per_day', label: 'Броней в день', helper: 'Плановая или средняя частота броней', step: '0.1' },
        { key: 'occupancy_rate_percent', label: 'Загрузка', helper: 'Доля используемого спроса', suffix: '%', step: '1' },
        { key: 'no_show_rate_percent', label: 'No-show rate', helper: 'Доля неявок', suffix: '%', step: '0.1' },
        { key: 'days_open_per_month', label: 'Дней работы в месяц', helper: 'Сколько дней ресторан открыт', step: '1' },
      ],
    },
    {
      title: 'Переменные расходы',
      description: 'То, что растёт вместе с выручкой и количеством гостей.',
      fields: [
        { key: 'food_cost_percent', label: 'Food cost', helper: 'Себестоимость блюд', suffix: '%', step: '0.1' },
        { key: 'acquiring_percent', label: 'Эквайринг', helper: 'Комиссия платёжного провайдера', suffix: '%', step: '0.1' },
        { key: 'packaging_cost_per_guest', label: 'Упаковка на гостя', helper: 'Суточная / средняя упаковка', suffix: '₽', step: '1' },
        { key: 'other_variable_percent', label: 'Прочие переменные', helper: 'Прочие расходы от выручки', suffix: '%', step: '0.1' },
      ],
    },
    {
      title: 'Постоянные расходы',
      description: 'Фиксированные статьи, которые нужно покрывать каждый месяц.',
      fields: [
        { key: 'rent_monthly', label: 'Аренда', helper: 'Ежемесячная аренда помещения', suffix: '₽', step: '1000' },
        { key: 'electricity_monthly', label: 'Электричество', helper: 'Коммунальные расходы', suffix: '₽', step: '1000' },
        { key: 'water_monthly', label: 'Вода', helper: 'Коммунальные расходы', suffix: '₽', step: '100' },
        { key: 'salaries_monthly', label: 'ФОТ', helper: 'Фонд оплаты труда', suffix: '₽', step: '1000' },
        { key: 'marketing_monthly', label: 'Маркетинг', helper: 'Рекламный бюджет', suffix: '₽', step: '1000' },
        { key: 'delivery_monthly', label: 'Доставка', helper: 'Фиксированные расходы на доставку', suffix: '₽', step: '1000' },
        { key: 'other_fixed_monthly', label: 'Прочие постоянные', helper: 'Прочие фиксированные расходы', suffix: '₽', step: '1000' },
      ],
    },
    {
      title: 'Налоги и начисления',
      description: 'Используются для расчёта чистой прибыли.',
      fields: [
        { key: 'tax_rate_percent', label: 'Ставка налога', helper: 'Простой налоговый коэффициент', suffix: '%', step: '0.1' },
        { key: 'payroll_tax_percent', label: 'Налоги на ФОТ', helper: 'Начисления на зарплаты', suffix: '%', step: '0.1' },
      ],
    },
  ];

  const handleFieldChange = (field: keyof EconomicsFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveState('idle');
  };

  const handleReset = () => {
    setForm(settingsToForm(report?.settings ?? settingsData));
    setSaveState('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState('idle');
    try {
      await updateSettings.mutateAsync(formToSettings(form));
      setSaveState('saved');
    } catch (error) {
      console.error('Failed to save unit economics settings', error);
      setSaveState('error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Прогноз выручки / мес.</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{report ? formatMoney(report.forecast_revenue_per_month) : '—'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Break-even</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{report ? formatMoney(report.break_even_revenue) : '—'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Чистая прибыль / мес.</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{report ? formatMoney(report.forecast_net_profit_per_month) : '—'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">No-show потери</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{report ? formatMoney(report.no_show_lost_revenue) : '—'}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Настройки unit economics</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {sections.map((section) => (
              <div key={section.title} className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {section.fields.map((field) => (
                    <NumberField
                      key={String(field.key)}
                      label={field.label}
                      value={form[field.key]}
                      onChange={(value) => handleFieldChange(field.key, value)}
                      helper={field.helper}
                      suffix={field.suffix}
                      step={field.step}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-3 pt-4 border-t border-border sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {saveState === 'saved' && 'Настройки сохранены и сразу влияют на расчёты.'}
                {saveState === 'error' && 'Не удалось сохранить настройки. Проверь значения.'}
                {saveState === 'idle' && 'Сохранённые параметры используются в дашборде и прогнозах.'}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="button" variant="outline" onClick={handleReset}>
                  Сбросить к текущим
                </Button>
                <Button type="submit" disabled={updateSettings.isPending}>
                  {updateSettings.isPending ? 'Сохранение...' : 'Сохранить настройки'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-serif text-lg">Ключевые допущения</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Модель строится на среднем чеке, частоте броней, загрузке и no-show.</p>
            <p>Расчёт чистой прибыли включает фиксированные расходы, переменные затраты и налог.</p>
            <p>Break-even — ориентир для управленческого решения, а не бухгалтерский отчёт.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-serif text-lg">Текущие цифры</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Средний чек: {report ? formatMoney(report.average_check) : '—'}</p>
            <p>Броней в день: {report ? report.bookings_per_day.toFixed(1) : '—'}</p>
            <p>Загрузка: {report ? `${report.occupancy_rate_effective.toFixed(0)}%` : '—'}</p>
            <p>Нет прихода: {report ? `${report.today_no_show_rate.toFixed(1)}%` : '—'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MenuView() {


  const { data: categories } = useCategories();
  const { data: menuItems, isLoading } = useMenuItems();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // State for Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category_id: 1,
    price: 0,
    weight: '',
    description: '',
    composition: '',
    allergens: '',
    spice_level: 0,
    is_hit: false,
    is_new: false,
    is_available: true
  });

  const filteredItems = menuItems?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || String(item.category_id) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleAvailability = async (id: string, currentValue: boolean) => {
    try {
      await updateMenuItem.mutateAsync({ id, data: { is_available: !currentValue } });
    } catch (error) {
      console.error('Failed to update menu item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить блюдо?')) {
      await deleteMenuItem.mutateAsync(id);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await createMenuItem.mutateAsync(newItem);
    setIsAddModalOpen(false);
    setNewItem({ 
      name: '', category_id: 1, price: 0, weight: '', description: '', 
      composition: '', allergens: '', spice_level: 0, is_hit: false, is_new: false, is_available: true 
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск блюд..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-background text-sm"
        >
          <option value="all">Все категории</option>
          {categories?.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <Button onClick={() => setIsAddModalOpen(true)}>+ Добавить блюдо</Button>
      </div>

      {/* Dishes Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Блюдо</th>
                  <th>Категория</th>
                  <th>Цена</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : filteredItems?.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="text-lg">🍽️</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.weight}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {item.category?.name}
                    </td>
                    <td className="font-medium">{item.price.toLocaleString()} ₽</td>
                    <td>
                      <Badge variant={item.is_available ? 'default' : 'secondary'}>
                        {item.is_available ? 'В наличии' : 'Нет в наличии'}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_available}
                          onCheckedChange={() => toggleAvailability(String(item.id), item.is_available)}
                          disabled={updateMenuItem.isPending}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(String(item.id))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Modal Form (simplified) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-serif font-semibold mb-4">Новое блюдо</h2>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Название</label>
                  <Input required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Цена (₽)</label>
                    <Input type="number" required value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Вес/Объем</label>
                    <Input value={newItem.weight} onChange={e => setNewItem({...newItem, weight: e.target.value})} placeholder="300г" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Категория</label>
                  <select
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    value={newItem.category_id}
                    onChange={e => setNewItem({...newItem, category_id: parseInt(e.target.value)})}
                  >
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Описание</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm min-h-[60px]"
                    value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Состав</label>
                  <Input value={newItem.composition} onChange={e => setNewItem({...newItem, composition: e.target.value})} placeholder="Мука, яйца, молоко..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Аллергены</label>
                  <Input value={newItem.allergens} onChange={e => setNewItem({...newItem, allergens: e.target.value})} placeholder="Глютен, орехи..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={newItem.is_hit} onCheckedChange={v => setNewItem({...newItem, is_hit: v})} />
                    <label className="text-xs font-medium">Хит продаж</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={newItem.is_new} onCheckedChange={v => setNewItem({...newItem, is_new: v})} />
                    <label className="text-xs font-medium">Новинка</label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Отмена</Button>
                  <Button type="submit">Сохранить</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function ReservationsView() {
  const [filter, setFilter] = useState<string>('all');
  const { data: bookings, isLoading } = useBookings(
    filter !== 'all' ? { status: filter } : undefined
  );
  const updateBooking = useUpdateBooking();

  const updateStatus = async (id: number | string, status: BookingWithUser['status']) => {
    let spent_amount = 0;
    if (status === 'completed') {
      const val = prompt('Введите сумму чека (₽) для статистики LTV:', '0');
      spent_amount = parseFloat(val || '0');
    }

    try {
      await updateBooking.mutateAsync({ id: String(id), data: { status, spent_amount } });
    } catch (error) {
      console.error('Failed to update booking:', error);
    }
  };

  const getStatusBadge = (status: BookingWithUser['status']) => {
    switch (status) {
      case 'confirmed':
        return <span className="status-confirmed">Подтверждено</span>;
      case 'cancelled':
        return <span className="status-cancelled">Отменено</span>;
      case 'no_show':
        return <span className="status-noshow">No-show</span>;
      case 'completed':
        return <Badge variant="outline">Завершено</Badge>;
      case 'pending':
        return <Badge variant="outline">Ожидание</Badge>;
    }
  };

  const formatGuestCount = (count: number) => {
    if (count === 1) return '1 гость';
    if (count >= 2 && count <= 4) return `${count} гостя`;
    return `${count} гостей`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {['all', 'confirmed', 'pending', 'cancelled', 'no_show', 'completed'].map((status) => (
          <Button key={status} variant={filter === status ? 'default' : 'outline'} size="sm" onClick={() => setFilter(status)}>
            {status === 'all' && 'Все'}
            {status === 'confirmed' && 'Подтверждено'}
            {status === 'pending' && 'Ожидание'}
            {status === 'cancelled' && 'Отменено'}
            {status === 'no_show' && 'No-show'}
            {status === 'completed' && 'Завершено'}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Дата/Время</th>
                  <th>Гость</th>
                  <th>Статистика (CRM)</th>
                  <th>Гостей</th>
                  <th>Пожелания</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : bookings?.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div>
                        <p className="font-medium">{format(new Date(booking.start_at), 'dd.MM.yyyy')}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(booking.start_at), 'HH:mm')}</p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium">{booking.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{booking.phone}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        {booking.crm?.is_banned ? (
                          <Badge variant="destructive" className="text-[10px]">В бан-листе</Badge>
                        ) : (
                          booking.crm?.visits_count && booking.crm.visits_count > 0 ? (
                            <Badge variant="default" className="text-[10px] bg-primary/20 text-primary hover:bg-primary/30">Визитов: {booking.crm.visits_count}</Badge>
                          ) : <span className="text-xs text-muted-foreground">Новый гость</span>
                        )}
                        {booking.crm?.no_show_count && booking.crm.no_show_count > 0 ? (
                          <span className="text-[10px] text-destructive flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            No-shows: {booking.crm.no_show_count}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{formatGuestCount(booking.guests_count)}</td>
                    <td>
                      {booking.notes ? (
                        <span className="block max-w-[240px] truncate" title={booking.notes}>{booking.notes}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td>{getStatusBadge(booking.status)}</td>
                    <td>
                      <div className="flex gap-2">
                        {booking.status !== 'confirmed' && booking.status !== 'completed' && (
                          <Button size="icon" variant="ghost" className="text-success hover:text-success hover:bg-success/10" onClick={() => updateStatus(booking.id, 'confirmed')} disabled={updateBooking.isPending}>
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => updateStatus(booking.id, 'cancelled')} disabled={updateBooking.isPending}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        {booking.status !== 'no_show' && booking.status !== 'completed' && (
                          <Button size="icon" variant="ghost" className="text-warning hover:text-warning hover:bg-warning/10" onClick={() => updateStatus(booking.id, 'no_show')} disabled={updateBooking.isPending}>
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function MarketingView() {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ error?: string; message?: string; estimated_audience?: number } | null>(null);

  const handleSend = async () => {
    if (!message) return;
    setIsSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/marketing/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ text: message }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      setResult({ error: 'Ошибка отправки рассылки' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Массовая рассылка (Broadcast)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Текст сообщения</label>
            <textarea
              className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Введите текст об акции, новом блюде или мероприятии..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Сообщение отправится гостям с Telegram, у которых есть согласие на коммуникацию. Вы можете использовать HTML-теги для форматирования.
            </p>
          </div>
          <Button onClick={handleSend} disabled={isSending || !message} className="w-full sm:w-auto">
            {isSending ? 'Отправка...' : 'Отправить всем гостям'}
          </Button>

          {result && (
            <div className={`p-4 rounded-md mt-4 ${result.error ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
              {result.error ? (
                <p>⚠️ {result.error}</p>
              ) : (
                <p>✅ {result.message || 'Успешно!'} (Целевая аудитория: {result.estimated_audience} чел.)</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminPage() {

  const [authState, setAuthState] = useState<AuthState>('loading');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return;
        setAuthState(data?.authenticated ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => alive && setAuthState('unauthenticated'));
    return () => { alive = false; };
  }, []);

  if (authState === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  if (authState === 'unauthenticated') {
    return <AdminLoginScreen onSuccess={() => setAuthState('authenticated')} />;
  }

  return (
    <div className="min-h-screen bg-grain text-foreground flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-full">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/menu" className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <span className="font-serif font-semibold text-sm">Админ-панель</span>
          </Link>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar 
                activeTab={activeTab} 
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setMobileMenuOpen(false);
                }} 
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <main className="md:ml-64 pt-14 md:pt-0 min-h-screen w-full">
        <div className="p-6 md:p-12 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="font-serif text-2xl md:text-3xl font-semibold">
              {activeTab === 'dashboard' && 'Дашборд'}
              {activeTab === 'menu' && 'Управление меню'}
              {activeTab === 'reservations' && 'Бронирования'}
              {activeTab === 'economics' && 'Юнит-экономика'}
            </h1>
          </div>

          {/* Content */}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'menu' && <MenuView />}
          {activeTab === 'reservations' && <ReservationsView />}
          {activeTab === 'marketing' && <MarketingView />}
          {activeTab === 'economics' && <EconomicsView />}
        </div>
      </main>
    </div>
  );
}
