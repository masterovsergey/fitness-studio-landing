// All content in this module is fictional, for a local client-side prototype only.
export const trainers = [
  { id: 't1', name: 'Алексей', role: 'Силовой тренинг', image: 'trainer-01-v3.webp', text: 'Спокойный темп, понятная техника и постепенное развитие силы.' },
  { id: 't2', name: 'Анна', role: 'Мобильность и растяжка', image: 'trainer-02-v3.webp', text: 'Внимание к амплитуде, дыханию и свободе движения.' },
  { id: 't3', name: 'Михаил', role: 'Функциональные тренировки', image: 'trainer-03-v3.webp', text: 'Разнообразные движения и нагрузка, которую можно адаптировать.' },
  { id: 't4', name: 'Елена', role: 'Пилатес', image: 'trainer-04-v3.webp', text: 'Точный контроль движения, устойчивость и работа с балансом.' },
  { id: 't5', name: 'Денис', role: 'Персональные занятия', image: 'trainer-05-v3.webp', text: 'Индивидуальный формат с вниманием к вашим задачам.' },
  { id: 't6', name: 'Мария', role: 'Восстановительные практики', image: 'trainer-06-v3.webp', text: 'Мягкое движение и время, чтобы переключиться после рабочего дня.' },
];
export const products = [
  { id: 'intro', name: 'Знакомство', visits: 2, days: 14, price: 1400, category: 'group', caption: 'Найти своё направление', featured: false },
  { id: 'rhythm', name: 'Свой ритм', visits: 8, days: 45, price: 6400, category: 'group', caption: 'Когда движение становится привычкой', featured: true },
  { id: 'flow', name: 'Больше движения', visits: 12, days: 60, price: 9000, category: 'group', caption: 'Больше встреч с собой', featured: false },
  { id: 'personal', name: 'Персональный фокус', visits: 1, days: 30, price: 2500, category: 'personal', caption: 'Один на один с тренером', featured: false },
];
export const categories = [
  ['all', 'Все'], ['strength', 'Силовые'], ['functional', 'Функциональные'],
  ['mobility', 'Мобильность'], ['pilates', 'Пилатес'], ['personal', 'Персональные'], ['recovery', 'Восстановление'],
];
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dateAt(anchor, offset = 0) {
  const [year, month, day] = anchor.split('-').map(Number);
  return new Date(year, month - 1, day + offset, 12);
}
export function buildSessions(anchor) {
  const formats = [
    ['Силовой тренинг', 'strength', 't1', '09:00', 55, 4, 900],
    ['Мобильность и растяжка', 'mobility', 't2', '12:00', 50, 6, 900],
    ['Функциональный тренинг', 'functional', 't3', '18:30', 55, 3, 900],
    ['Пилатес', 'pilates', 't4', '19:30', 50, 0, 900],
    ['Персональная тренировка', 'personal', 't5', '16:00', 60, 1, 2500],
    ['Мягкое восстановление', 'recovery', 't6', '20:30', 45, 5, 900],
  ];
  return Array.from({ length: 6 }, (_, day) => formats
    .filter((_, index) => day % 2 === 0 || index !== 3)
    .map(([title, category, trainer, time, minutes, seats, price], index) => ({
      id: `day${day}-${category}`, title, category, trainer, time, minutes,
      seats: day === 0 ? seats : (index + day) % 7,
      price, day, date: localDate(dateAt(anchor, day)),
    }))).flat();
}
export function initialState(today = localDate()) {
  return { version: 1, anchor: today, bookings: [], passes: [], reminders: false };
}
export function restoreState(raw, today = localDate()) {
  const fresh = initialState(today);
  try {
    const candidate = JSON.parse(raw);
    if (!candidate || candidate.version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(candidate.anchor) || localDate(dateAt(candidate.anchor)) !== candidate.anchor) return fresh;
    const sessionIds = new Set(buildSessions(candidate.anchor).map((s) => s.id));
    const seenPasses = new Set();
    const passes = Array.isArray(candidate.passes) ? candidate.passes.slice(0, 100).filter((p) => {
      const product = products.find((item) => item.id === p.product);
      if (!product || typeof p.id !== 'string' || !/^[\w-]{1,80}$/.test(p.id) || seenPasses.has(p.id) || !Number.isInteger(p.remaining) || p.remaining < 0 || p.remaining > product.visits || !Number.isFinite(p.created) || p.created < 0 || !Number.isFinite(new Date(p.created).getTime()) || !Number.isFinite(new Date(p.created + product.days * 86400000).getTime())) return false;
      seenPasses.add(p.id);
      return true;
    }).map(({ id, product, remaining, created }) => ({ id, product, remaining, created })) : [];
    const seenBookings = new Set();
    const bookings = Array.isArray(candidate.bookings) ? candidate.bookings.slice(0, 100).filter((b) => {
      if (!sessionIds.has(b.session) || seenBookings.has(b.session) || !['active', 'cancelled'].includes(b.status) || (b.pass !== null && !seenPasses.has(b.pass))) return false;
      seenBookings.add(b.session);
      return true;
    }).map(({ session, status, pass }) => ({ session, status, pass })) : [];
    return { version: 1, anchor: candidate.anchor, passes, bookings, reminders: candidate.reminders === true };
  } catch { return fresh; }
}
export function activeBooking(state, id) {
  return state.bookings.find((b) => b.session === id && b.status === 'active');
}
export function visitLabel(count) {
  const rest = count % 100;
  return `${count} ${rest >= 11 && rest <= 14 ? 'посещений' : count % 10 === 1 ? 'посещение' : count % 10 >= 2 && count % 10 <= 4 ? 'посещения' : 'посещений'}`;
}
export function eligiblePasses(state, session, now = Date.now()) {
  return state.passes.filter((pass) => {
    const product = products.find((p) => p.id === pass.product);
    const end = pass.created + product.days * 86400000;
    return pass.remaining > 0 && end > now && dateAt(session.date).getTime() <= end &&
      product.category === (session.category === 'personal' ? 'personal' : 'group');
  });
}
export function buyDemoPass(state, productId, id, now = Date.now()) {
  const product = products.find((p) => p.id === productId);
  if (!product || state.passes.some((p) => p.id === id) || state.passes.length >= 100) return { state, error: 'Не удалось добавить пакет.' };
  return { state: { ...state, passes: [...state.passes, { id, product: productId, remaining: product.visits, created: now }] } };
}
export function bookDemoSession(state, sessionId, passId = null, now = Date.now()) {
  const session = buildSessions(state.anchor).find((s) => s.id === sessionId);
  if (!session || session.seats <= 0) return { state, error: 'В этой группе нет свободных мест.' };
  if (activeBooking(state, sessionId)) return { state, error: 'Вы уже записаны на это занятие.' };
  if (passId && !eligiblePasses(state, session, now).some((p) => p.id === passId)) return { state, error: 'Этот пакет нельзя использовать для занятия.' };
  return { state: { ...state,
    passes: state.passes.map((p) => p.id === passId ? { ...p, remaining: p.remaining - 1 } : p),
    bookings: [...state.bookings.filter((b) => b.session !== sessionId), { session: sessionId, status: 'active', pass: passId }],
  } };
}
export function cancelDemoSession(state, sessionId) {
  const booking = activeBooking(state, sessionId);
  if (!booking) return { state, error: 'Активная запись не найдена.' };
  return { state: { ...state,
    bookings: state.bookings.map((b) => b.session === sessionId ? { ...b, status: 'cancelled' } : b),
    passes: state.passes.map((p) => p.id === booking.pass ? { ...p, remaining: p.remaining + 1 } : p),
  } };
}
