import type { Dish, Reservation, RestaurantInfo, DashboardMetrics } from '@/types';

// Mock categories (for fallback when API is not available)
export const categories = [
  { id: '1', name: 'Закуски', sort_order: 1, type: 'food' as const, description: null, image_url: null, created_at: new Date().toISOString(), updated_at: null },
  { id: '2', name: 'Горячее', sort_order: 2, type: 'food' as const, description: null, image_url: null, created_at: new Date().toISOString(), updated_at: null },
  { id: '3', name: 'Десерты', sort_order: 3, type: 'dessert' as const, description: null, image_url: null, created_at: new Date().toISOString(), updated_at: null },
  { id: '4', name: 'Напитки', sort_order: 4, type: 'drink' as const, description: null, image_url: null, created_at: new Date().toISOString(), updated_at: null },
  { id: '5', name: 'Вина', sort_order: 5, type: 'wine' as const, description: null, image_url: null, created_at: new Date().toISOString(), updated_at: null },
];

export const dishes: Dish[] = [
  // Закуски
  {
    id: '1',
    name: 'Брускетта с томатами',
    description: 'Хрустящий багет с свежими томатами, базиликом и оливковым маслом первого отжима',
    price: 450,
    weight: '180г',
    categoryId: '1',
    isHit: true,
    isAvailable: true,
    ingredients: ['Багет', 'Томаты', 'Базилик', 'Оливковое масло', 'Чеснок'],
    allergens: ['Глютен'],
  },
  {
    id: '2',
    name: 'Карпаччо из говядины',
    description: 'Тонко нарезанная мраморная говядина с рукколой, пармезаном и лимонной заправкой',
    price: 890,
    weight: '150г',
    categoryId: '1',
    isNew: true,
    isAvailable: true,
    ingredients: ['Говядина', 'Руккола', 'Пармезан', 'Лимон', 'Оливковое масло'],
    allergens: ['Молочные продукты'],
  },
  {
    id: '3',
    name: 'Тартар из лосося',
    description: 'Свежий лосось с авокадо, красным луком и лимонным соком',
    price: 780,
    weight: '200г',
    categoryId: '1',
    isAvailable: true,
    ingredients: ['Лосось', 'Авокадо', 'Красный лук', 'Лимон', 'Каперсы'],
    allergens: ['Рыба'],
  },
  {
    id: '4',
    name: 'Хумус с питой',
    description: 'Классический нутовый хумус с тахини, подаётся с тёплой питой',
    price: 520,
    weight: '250г',
    categoryId: '1',
    isAvailable: true,
    ingredients: ['Нут', 'Тахини', 'Лимон', 'Чеснок', 'Пита'],
    allergens: ['Глютен', 'Кунжут'],
  },
  
  // Горячее
  {
    id: '5',
    name: 'Стейк Рибай',
    description: 'Мраморная говядина на гриле с соусом из перечного дерева и овощами',
    price: 2450,
    weight: '350г',
    categoryId: '2',
    isHit: true,
    isAvailable: true,
    ingredients: ['Говядина Рибай', 'Перечный соус', 'Овощи гриль', 'Розмарин'],
    allergens: [],
  },
  {
    id: '6',
    name: 'Паста Карбонара',
    description: 'Классическая римская паста с гуанчиале, яйцом и пекорино романо',
    price: 680,
    weight: '320г',
    categoryId: '2',
    isAvailable: true,
    ingredients: ['Спагетти', 'Гуанчиале', 'Яйцо', 'Пекорино', 'Чёрный перец'],
    allergens: ['Глютен', 'Яйцо', 'Молочные продукты'],
  },
  {
    id: '7',
    name: 'Ризотто с грибами',
    description: 'Кремовое ризотто с белыми грибами, трюфельным маслом и пармезаном',
    price: 790,
    weight: '300г',
    categoryId: '2',
    isNew: true,
    isAvailable: true,
    ingredients: ['Рис Арборио', 'Белые грибы', 'Трюфельное масло', 'Пармезан', 'Белое вино'],
    allergens: ['Молочные продукты'],
  },
  {
    id: '8',
    name: 'Паэлья с морепродуктами',
    description: 'Испанская паэлья с креветками, мидиями, кальмарами и шафраном',
    price: 1200,
    weight: '400г',
    categoryId: '2',
    isSpicy: true,
    isAvailable: true,
    ingredients: ['Рис', 'Креветки', 'Мидии', 'Кальмары', 'Шафран', 'Паприка'],
    allergens: ['Моллюски', 'Ракообразные'],
  },
  
  // Десерты
  {
    id: '9',
    name: 'Тирамису',
    description: 'Классический итальянский десерт с маскарпоне, кофе и какао',
    price: 450,
    weight: '180г',
    categoryId: '3',
    isHit: true,
    isAvailable: true,
    ingredients: ['Маскарпоне', 'Печенье Савоярди', 'Кофе', 'Яйцо', 'Какао'],
    allergens: ['Молочные продукты', 'Яйцо', 'Глютен'],
  },
  {
    id: '10',
    name: 'Чизкейк Нью-Йорк',
    description: 'Нежный чизкейк с ягодным соусом и свежими ягодами',
    price: 520,
    weight: '200г',
    categoryId: '3',
    isAvailable: true,
    ingredients: ['Сливочный сыр', 'Сливки', 'Ягодный соус', 'Печенье'],
    allergens: ['Молочные продукты', 'Глютен'],
  },
  {
    id: '11',
    name: 'Шоколадный фондан',
    description: 'Тёплый шоколадный торт с жидкой сердцевиной и ванильным мороженым',
    price: 580,
    weight: '220г',
    categoryId: '3',
    isNew: true,
    isAvailable: true,
    ingredients: ['Тёмный шоколад', 'Масло', 'Яйцо', 'Мука', 'Ванильное мороженое'],
    allergens: ['Молочные продукты', 'Яйцо', 'Глютен'],
  },
  
  // Напитки
  {
    id: '12',
    name: 'Эспрессо',
    description: 'Крепкий итальянский кофе из свежеобжаренных зёрен',
    price: 180,
    weight: '30мл',
    categoryId: '4',
    isAvailable: true,
    ingredients: ['Кофе арабика'],
    allergens: [],
  },
  {
    id: '13',
    name: 'Капучино',
    description: 'Эспрессо с молочной пенкой и посыпкой из какао',
    price: 250,
    weight: '200мл',
    categoryId: '4',
    isAvailable: true,
    ingredients: ['Кофе', 'Молоко', 'Какао'],
    allergens: ['Молочные продукты'],
  },
  {
    id: '14',
    name: 'Домашний лимонад',
    description: 'Освежающий лимонад с мятой, лимоном и имбирём',
    price: 350,
    weight: '400мл',
    categoryId: '4',
    isHit: true,
    isAvailable: true,
    ingredients: ['Лимон', 'Мята', 'Имбирь', 'Сахар', 'Вода'],
    allergens: [],
  },
  {
    id: '15',
    name: 'Свежевыжатый апельсиновый сок',
    description: '100% натуральный сок из свежих апельсинов',
    price: 420,
    weight: '300мл',
    categoryId: '4',
    isAvailable: true,
    ingredients: ['Апельсины'],
    allergens: [],
  },
  
  // Вина
  {
    id: '16',
    name: 'Pinot Grigio, Veneto',
    description: 'Лёгкое сухое белое вино с нотками зелёного яблока и цитрусов',
    price: 2800,
    weight: '750мл',
    categoryId: '5',
    isAvailable: true,
    ingredients: ['Виноград Пино Гриджио'],
    allergens: ['Сульфиты'],
  },
  {
    id: '17',
    name: 'Chianti Classico, Tuscany',
    description: 'Классическое тосканское красное вино с нотками вишни и пряностей',
    price: 3200,
    weight: '750мл',
    categoryId: '5',
    isHit: true,
    isAvailable: true,
    ingredients: ['Санджовезе'],
    allergens: ['Сульфиты'],
  },
  {
    id: '18',
    name: 'Prosecco, Valdobbiadene',
    description: 'Игристое вино с тонкими пузырьками и фруктовыми нотками',
    price: 2400,
    weight: '750мл',
    categoryId: '5',
    isNew: true,
    isAvailable: true,
    ingredients: ['Глера'],
    allergens: ['Сульфиты'],
  },
];

export const reservations: Reservation[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    duration: 90,
    guestName: 'Александр Петров',
    guestPhone: '+7 (999) 123-45-67',
    guestCount: 2,
    comment: 'Столик у окна, пожалуйста',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0],
    time: '20:30',
    duration: 120,
    guestName: 'Мария Иванова',
    guestPhone: '+7 (999) 234-56-78',
    guestCount: 4,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '3',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    duration: 60,
    guestName: 'Дмитрий Сидоров',
    guestPhone: '+7 (999) 345-67-89',
    guestCount: 1,
    comment: 'Бизнес-ланч',
    status: 'noshow',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: '4',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '19:30',
    duration: 90,
    guestName: 'Елена Козлова',
    guestPhone: '+7 (999) 456-78-90',
    guestCount: 3,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

export const reviews = [
  {
    id: '1',
    user_id: null,
    booking_id: null,
    rating: 5,
    comment: 'Прекрасный ресторан! Обслуживание на высшем уровне, еда восхитительная. Особенно понравился стейк Рибай и тирамису. Обязательно придём ещё!',
    created_at: '2026-02-15T00:00:00Z',
  },
  {
    id: '2',
    user_id: null,
    booking_id: null,
    rating: 5,
    comment: 'Отмечали здесь день рождения. Персонал очень внимательный, помогли с выбором вина. Интерьер стильный, атмосфера уютная.',
    created_at: '2026-02-10T00:00:00Z',
  },
  {
    id: '3',
    user_id: null,
    booking_id: null,
    rating: 4,
    comment: 'Хорошая кухня, приятные цены. Иногда бывают очереди в выходные, лучше бронировать столик заранее.',
    created_at: '2026-02-05T00:00:00Z',
  },
];

export const restaurantInfo: RestaurantInfo = {
  name: 'Ресторан Вкус',
  description: 'Авторская кухня с средиземноморским акцентом',
  address: 'г. Москва, ул. Большая Дмитровка, 12',
  phone: '+7 (495) 123-45-67',
  email: 'info@vkus-restaurant.ru',
  workingHours: {
    '0': { open: '10:00', close: '23:00', isOpen: true }, // Воскресенье
    '1': { open: '10:00', close: '23:00', isOpen: true }, // Понедельник
    '2': { open: '10:00', close: '23:00', isOpen: true }, // Вторник
    '3': { open: '10:00', close: '23:00', isOpen: true }, // Среда
    '4': { open: '10:00', close: '23:00', isOpen: true }, // Четверг
    '5': { open: '10:00', close: '23:00', isOpen: true }, // Пятница
    '6': { open: '10:00', close: '23:00', isOpen: true }, // Суббота
  },
  socialLinks: {
    instagram: 'https://instagram.com/vkus_restaurant',
    telegram: 'https://t.me/vkus_restaurant',
  },
  coordinates: {
    lat: 55.7614,
    lng: 37.6126,
  },
};

export const currentUser = {
  id: '1',
  email: 'admin@restaurant-vkus.ru',
  role: 'admin' as const,
};

export const dashboardMetrics: DashboardMetrics = {
  totalReservationsToday: 12,
  averageCheck: 2850,
  noShowRate: 8.5,
  totalGuestsToday: 34,
};

// Helper functions
export function getDishesByCategory(categoryId: string): Dish[] {
  return dishes.filter(dish => dish.categoryId === categoryId);
}

export function getDishById(id: string): Dish | undefined {
  return dishes.find(dish => dish.id === id);
}

export function getCategoryById(id: string): any | undefined {
  return categories.find(cat => cat.id === id);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price);
}

export function formatGuestCount(count: number): string {
  if (count === 1) return '1 гость';
  if (count >= 2 && count <= 4) return `${count} гостя`;
  return `${count} гостей`;
}

export function getTodayWorkingHours(): { open: string; close: string; isOpen: boolean } {
  const day = new Date().getDay();
  return restaurantInfo.workingHours[day];
}

export function isRestaurantOpen(): boolean {
  const now = new Date();
  const day = now.getDay();
  const hours = restaurantInfo.workingHours[day];
  
  if (!hours.isOpen) return false;
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = hours.open.split(':').map(Number);
  const [closeHour, closeMin] = hours.close.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  return currentTime >= openTime && currentTime < closeTime;
}

// Generate time slots for booking
export function generateTimeSlots(_date: string): { time: string; available: boolean }[] {
  const slots = [];
  const startHour = 12;
  const endHour = 22;
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let min of ['00', '30']) {
      const time = `${hour}:${min}`;
      // Simulate some slots as unavailable
      const available = Math.random() > 0.3;
      slots.push({ time, available });
    }
  }
  
  return slots;
}
