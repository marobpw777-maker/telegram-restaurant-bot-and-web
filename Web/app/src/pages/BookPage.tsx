import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, Phone, User, MessageSquare, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StepIndicator } from '@/components/StepIndicator';
import { useCreateBooking, useAvailability } from '@/hooks/useBookings';
import { formatGuestCount } from '@/data/mockData';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const steps = [
  { label: 'Дата и время', description: 'Выберите удобное время' },
  { label: 'Данные', description: 'Введите контактные данные' },
  { label: 'Подтверждение', description: 'Проверьте детали' },
];

const durations = [
  { value: 45, label: '45 мин' },
  { value: 60, label: '1 час' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
];

export function BookPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>('');
  const [duration, setDuration] = useState(90);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [comment, setComment] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // API hooks
  const { 
    data: timeSlots, 
    isLoading: isLoadingSlots,
    isError: isSlotsError,
    error: slotsError 
  } = useAvailability(
    date ? format(date, 'yyyy-MM-dd') : '',
    duration
  );
  const createBooking = useCreateBooking();

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!date) newErrors.date = 'Выберите дату';
      if (!time) newErrors.time = 'Выберите время';
    }

    if (step === 1) {
      if (!guestName.trim()) newErrors.guestName = 'Введите имя';
      if (!guestPhone.trim()) {
        newErrors.guestPhone = 'Введите телефон';
      } else if (!/^\+?[\d\s()-]{10,}$/.test(guestPhone)) {
        newErrors.guestPhone = 'Введите корректный телефон';
      }
      if (guestCount < 1) newErrors.guestCount = 'Минимум 1 гость';
      if (guestCount > 20) newErrors.guestCount = 'Максимум 20 гостей';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep) || !date || !time) return;

    try {
      // Combine date and time
      const [hours, minutes] = time.split(':').map(Number);
      const startDate = new Date(date);
      startDate.setHours(hours, minutes, 0, 0);

      await createBooking.mutateAsync({
        start_at: startDate.toISOString(),
        duration_minutes: duration,
        guests_count: guestCount,
        customer_name: guestName,
        phone: guestPhone,
        notes: comment || null,
        status: 'pending' as const,
        user_id: null,
        attended: false,
      });

      toast.success('Бронирование успешно создано!');
      setCurrentStep(steps.length); // Show success view
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании бронирования');
    }
  };

  const generateICSFile = () => {
    if (!date || !time) return;

    const [hours, minutes] = time.split(':').map(Number);
    const startDate = new Date(date);
    startDate.setHours(hours, minutes);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${format(startDate, "yyyyMMdd'T'HHmmss")}
DTEND:${format(endDate, "yyyyMMdd'T'HHmmss")}
SUMMARY:Бронирование в Ресторане Вкус
DESCRIPTION:Столик на ${formatGuestCount(guestCount)}\\n${comment || 'Без комментария'}
LOCATION:г. Москва, ул. Большая Дмитровка, 12
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-vkus-restaurant.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Success View
  if (currentStep >= steps.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-24 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="max-w-xl w-full text-center"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-12">
            <Check className="w-12 h-12 text-primary" />
          </div>
          
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary mb-6 block">reservation confirmed</span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tighter mb-8 text-balance">
            МЫ ЖДЕМ ВАС В ГОСТИ
          </h1>
          
          <p className="text-muted-foreground mb-16 max-w-md mx-auto text-sm leading-relaxed">
            Подтверждение отправлено в Telegram. Пожалуйста, сохраните детали вашего визита.
          </p>

          <div className="bg-card border border-border/50 rounded-3xl p-12 text-left mb-16 shadow-2xl">
            <h3 className="text-xl font-serif font-bold mb-8 border-b border-border pb-6">Детали визита</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Дата и время</span>
                <span className="font-bold">{date && format(date, 'd MMMM', { locale: ru })}, {time}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Компания</span>
                <span className="font-bold">{formatGuestCount(guestCount)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Ваше имя</span>
                <span className="font-bold">{guestName}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <Button onClick={generateICSFile} variant="outline" className="btn-editorial-outline flex-1 py-8">
              <Download className="w-4 h-4 mr-3" />
              Календарь
            </Button>
            <Button onClick={() => navigate('/menu')} className="btn-editorial flex-1 py-8">
              В меню
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grain pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="text-3xl font-serif text-gradient no-underline">
            Ресторан Вкус
          </Link>
        </div>

        {/* Step Indicator */}
        <div className="mb-6">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        {/* Dynamic Breadcrumbs / Selection Summary */}
        {(date || time || guestCount > 0) && currentStep < steps.length && (
          <div className="flex flex-wrap items-center gap-3 mb-10 p-2 glass-nav rounded-2xl animate-fade-in text-sm group">
            {date && (
              <button 
                onClick={() => setCurrentStep(0)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary/15 text-primary rounded-xl hover:bg-primary/25 transition-all"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="font-semibold">{format(date, 'd MMM', { locale: ru })}</span>
              </button>
            )}
            {time && (
              <button 
                onClick={() => setCurrentStep(0)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary/15 text-primary rounded-xl hover:bg-primary/25 transition-all"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="font-semibold">{time}</span>
              </button>
            )}
            {currentStep > 0 && guestCount > 0 && (
              <button 
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary/15 text-primary rounded-xl hover:bg-primary/25 transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="font-semibold">{formatGuestCount(guestCount)}</span>
              </button>
            )}
          </div>
        )}

        {/* Form Content */}
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-card-premium border border-white/20 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
          {/* Step 1: Date and Time */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <Label className="text-base font-medium mb-3 block">
                  <CalendarIcon className="w-4 h-4 inline mr-2" />
                  Выберите дату
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal h-12',
                        !date && 'text-muted-foreground',
                        errors.date && 'border-destructive'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'd MMMM yyyy', { locale: ru }) : 'Выберите дату'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && <p className="text-sm text-destructive mt-1">{errors.date}</p>}
              </div>

              <div>
                <Label className="text-base font-medium mb-3 block">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Длительность
                </Label>
                <div className="flex flex-wrap gap-2">
                  {durations.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDuration(d.value)}
                      className={cn(
                        'px-5 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-300',
                        duration === d.value
                          ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                          : 'border-border hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-0.5'
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {date && (
                <div className="animate-fade-in">
                  <Label className="text-base font-medium mb-3 block">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Выберите время
                  </Label>
                  {isLoadingSlots ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : isSlotsError ? (
                    <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg text-destructive text-sm">
                      Ошибка загрузки времени: {(slotsError as any)?.message || 'Неизвестная ошибка'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {timeSlots && timeSlots.length > 0 ? (
                          timeSlots.map((slot) => (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => {
                                setTime(slot.time);
                                // Плавный скролл к кнопке Далее для UX
                                setTimeout(() => {
                                  const btn = document.getElementById('next-step-btn');
                                  btn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 100);
                              }}
                              className={cn(
                                'time-slot',
                                !slot.available && 'unavailable',
                                slot.available && time !== slot.time && 'available',
                                time === slot.time && 'selected'
                              )}
                            >
                              {slot.time}
                            </button>
                          ))
                        ) : (
                          <div className="col-span-full py-8 text-center border-2 border-dashed border-border rounded-lg">
                            <p className="text-muted-foreground">На выбранную дату нет доступного времени</p>
                            <p className="text-xs text-muted-foreground mt-1">Попробуйте выбрать другой день или длительность</p>
                          </div>
                        )}
                    </div>
                  )}
                  {errors.time && <p className="text-sm text-destructive mt-2">{errors.time}</p>}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Guest Data */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <Label htmlFor="guestName" className="text-base font-medium mb-2 block">
                  <User className="w-4 h-4 inline mr-2" />
                  Ваше имя
                </Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Иван Иванов"
                  className={cn('h-12', errors.guestName && 'border-destructive')}
                />
                {errors.guestName && <p className="text-sm text-destructive mt-1">{errors.guestName}</p>}
              </div>

              <div>
                <Label htmlFor="guestPhone" className="text-base font-medium mb-2 block">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Телефон
                </Label>
                <Input
                  id="guestPhone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  className={cn('h-12', errors.guestPhone && 'border-destructive')}
                />
                {errors.guestPhone && <p className="text-sm text-destructive mt-1">{errors.guestPhone}</p>}
              </div>

              <div>
                <Label htmlFor="guestCount" className="text-base font-medium mb-2 block">
                  <Users className="w-4 h-4 inline mr-2" />
                  Количество гостей
                </Label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setGuestCount((prev) => Math.max(1, prev - 1))}
                    className="w-14 h-14 rounded-2xl border-2 border-border flex items-center justify-center hover:border-primary hover:bg-primary/5 hover:text-primary transition-all active:scale-95 bg-card"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold min-w-[100px] text-center text-primary">
                    {formatGuestCount(guestCount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuestCount((prev) => Math.min(20, prev + 1))}
                    className="w-14 h-14 rounded-2xl border-2 border-border flex items-center justify-center hover:border-primary hover:bg-primary/5 hover:text-primary transition-all active:scale-95 bg-card"
                  >
                    +
                  </button>
                </div>
                {errors.guestCount && <p className="text-sm text-destructive mt-1">{errors.guestCount}</p>}
              </div>

              <div>
                <Label htmlFor="comment" className="text-base font-medium mb-2 block">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Комментарий (необязательно)
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Особые пожелания, аллергии и т.д."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="font-serif text-lg font-semibold">Проверьте данные</h3>
              
              <div className="bg-muted rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Дата</span>
                  <span className="font-medium">{date && format(date, 'd MMMM yyyy', { locale: ru })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Время</span>
                  <span className="font-medium">{time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Длительность</span>
                  <span className="font-medium">{duration} мин</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Гостей</span>
                  <span className="font-medium">{formatGuestCount(guestCount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Имя</span>
                  <span className="font-medium">{guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Телефон</span>
                  <span className="font-medium">{guestPhone}</span>
                </div>
                {comment && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-muted-foreground block mb-1">Комментарий</span>
                    <span className="font-medium">{comment}</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Нажимая "Подтвердить", вы соглашаетесь с{' '}
                <a href="https://example.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  правилами бронирования и политикой конфиденциальности
                </a>.
                В случае изменений мы свяжемся с вами по указанному телефону.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-12"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button
                id="next-step-btn"
                type="button"
                onClick={handleNext}
                className="flex-1 h-12 btn-primary"
              >
                Далее
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={createBooking.isPending}
                className="flex-1 h-12 bg-success hover:bg-success/90 text-success-foreground"
              >
                {createBooking.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Отправка...
                  </span>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Подтвердить
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
