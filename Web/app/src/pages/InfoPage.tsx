import { MapPin, Phone, Mail, Clock, Navigation, Calendar } from 'lucide-react';
import { restaurantInfo, isRestaurantOpen, getTodayWorkingHours } from '@/data/mockData';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqItems = [
  {
    question: 'Как добраться до ресторана?',
    answer: 'Мы находимся в центре Москвы, в 5 минутах ходьбы от станции метро "Театральная". Вы можете воспользоваться общественным транспортом или такси. Рядом есть несколько платных парковок.',
  },
  {
    question: 'Есть ли парковка?',
    answer: 'У нас нет собственной парковки, но в шаговой доступности находятся несколько платных парковок: Парковка на Большой Дмитровке (50 м) и подземная парковка ТЦ "Охотный ряд" (200 м).',
  },
  {
    question: 'Работаете ли вы в праздники?',
    answer: 'В праздничные дни мы работаем по специальному расписанию. Рекомендуем уточнять часы работы по телефону или в наших социальных сетях. В Новый год и Рождество работаем по предварительному бронированию.',
  },
  {
    question: 'Можно ли прийти с детьми?',
    answer: 'Да, мы рады гостям с детьми любого возраста. У нас есть детское меню, высокие стульчики и возможность приготовить блюда с учётом детских предпочтений.',
  },
  {
    question: 'Есть ли у вас доставка?',
    answer: 'Да, мы осуществляем доставку через сервисы Яндекс.Еда и Delivery Club. Также вы можете сделать заказ самовывоза по телефону со скидкой 10%.',
  },
  {
    question: 'Какое время бронирования?',
    answer: 'Стандартное время бронирования — 1.5 часа для компании до 4 человек и 2 часа для больших компаний. Если вам нужно больше времени, укажите это в комментарии при бронировании.',
  },
];

const weekDays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export function InfoPage() {
  const today = new Date().getDay();
  const isOpen = isRestaurantOpen();
  const todayHours = getTodayWorkingHours();

  return (
    <div className="min-h-screen bg-background pt-20 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl md:text-3xl font-semibold mb-2">
            Информация о ресторане
          </h1>
          <p className="text-muted-foreground">
            Всё, что нужно знать о нашем ресторане
          </p>
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 ${
          isOpen ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
          {isOpen ? 'Сейчас открыто' : 'Сейчас закрыто'}
          <span className="text-muted-foreground">
            (сегодня до {todayHours.close})
          </span>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Address */}
          <a
            href={`https://yandex.ru/maps/?text=${encodeURIComponent(restaurantInfo.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-0.5">Адрес</p>
              <p className="font-medium text-sm truncate">{restaurantInfo.address}</p>
            </div>
            <Navigation className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </a>

          {/* Phone */}
          <a
            href={`tel:${restaurantInfo.phone.replace(/\s/g, '')}`}
            className="contact-card group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-0.5">Телефон</p>
              <p className="font-medium text-sm">{restaurantInfo.phone}</p>
            </div>
          </a>

          {/* Email */}
          <a
            href={`mailto:${restaurantInfo.email}`}
            className="contact-card group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-0.5">Email</p>
              <p className="font-medium text-sm truncate">{restaurantInfo.email}</p>
            </div>
          </a>

          {/* Working Hours */}
          <div className="contact-card">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-0.5">Часы работы</p>
              <p className="font-medium text-sm">
                {todayHours.open} — {todayHours.close}
              </p>
            </div>
          </div>
        </div>

        {/* Full Working Hours */}
        <div className="bg-card rounded-xl p-6 shadow-card mb-8">
          <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Режим работы
          </h3>
          <div className="space-y-2">
            {Object.entries(restaurantInfo.workingHours).map(([day, hours]) => {
              const dayIndex = parseInt(day);
              const isToday = dayIndex === today;
              
              return (
                <div
                  key={day}
                  className={`flex justify-between py-2 px-3 rounded-lg ${
                    isToday ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className={`text-sm ${isToday ? 'font-medium' : 'text-muted-foreground'}`}>
                    {weekDays[dayIndex]}
                    {isToday && <span className="ml-2 text-xs text-primary">(сегодня)</span>}
                  </span>
                  <span className={`text-sm ${isToday ? 'font-medium' : ''}`}>
                    {hours.isOpen ? `${hours.open} — ${hours.close}` : 'Выходной'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map */}
        <div className="mb-8">
          <h3 className="font-serif text-lg font-semibold mb-4">Как нас найти</h3>
          <div className="map-container">
            <iframe
              src={`https://yandex.ru/map-widget/v1/?ll=${restaurantInfo.coordinates.lng}%2C${restaurantInfo.coordinates.lat}&z=16&pt=${restaurantInfo.coordinates.lng}%2C${restaurantInfo.coordinates.lat}%2Ccomma`}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              title="Карта ресторана"
            />
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h3 className="font-serif text-lg font-semibold mb-4">Часто задаваемые вопросы</h3>
          <Accordion type="single" collapsible className="faq-accordion">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="faq-item">
                <AccordionTrigger className="faq-trigger text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="faq-content">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
