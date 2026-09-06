import { trainers, products, categories, dateAt, initialState, restoreState, buildSessions, activeBooking, eligiblePasses, buyDemoPass, bookDemoSession, cancelDemoSession, visitLabel } from './data.js';

const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18m-13 5h2m4 0h2"/>',
  bag: '<path d="M5 8h14l1 13H4L5 8Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>',
  people: '<circle cx="10" cy="8" r="3"/><path d="M4 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m3 10v-3a5 5 0 0 0-2-4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  install: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  leaf: '<path d="M20 3C7 2 1 9 7 16s14-1 13-13Z"/><path d="M4 21 16 8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  reset: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
  document: '<path d="M14 3H5v18h14V8l-5-5Zm0 0v6h5M8 13h8m-8 4h6"/>',
};
const icon = (name, className = '') => `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.info}</svg>`;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const money = (value) => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const dateText = (date, options = { day: 'numeric', month: 'long' }) => new Intl.DateTimeFormat('ru-RU', options).format(date);
const storageKey = 'fitness-club-prototype-v1';
let state;
let volatileStorage = false;
try { state = restoreState(localStorage.getItem(storageKey)); } catch { state = initialState(); volatileStorage = true; }
let sessions = buildSessions(state.anchor);
let day = 0;
let category = 'all';
let shopCategory = 'all';
let visitsTab = 'active';
let toastTimer;
let installPrompt;
let opener;
const main = document.querySelector('#main');
const dialog = document.querySelector('#sheet');
const sheet = document.querySelector('#sheet-content');
const notice = document.querySelector('#connection-notice');
const navItems = [['home', 'Главная', 'home'], ['schedule', 'Расписание', 'calendar'], ['shop', 'Магазин', 'bag'], ['trainers', 'Тренеры', 'people'], ['profile', 'Профиль', 'user']];
const validRoutes = new Set([...navItems.map(([key]) => key), 'profile/visits', 'profile/passes', 'profile/reminders', 'profile/help']);
const route = () => validRoutes.has(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
const trainerById = (id) => trainers.find((t) => t.id === id);
const picture = (trainer, className = 'avatar') => `<img class="${className}" src="../images/trainers/${trainer.image}" alt="" loading="lazy" width="${className === 'avatar' ? 28 : 400}" height="${className === 'avatar' ? 28 : 450}">`;
const go = (target) => { if (route() === target) render(true); else location.hash = target; };
function toast(message) {
  const target = document.querySelector('#toast');
  clearTimeout(toastTimer);
  target.textContent = message;
  target.classList.add('visible');
  toastTimer = setTimeout(() => target.classList.remove('visible'), 5000);
}
function updateNotice() {
  notice.hidden = navigator.onLine && !volatileStorage;
  notice.textContent = volatileStorage ? 'Браузер не разрешил сохранение. Демо-изменения будут доступны только до закрытия страницы.' : 'Нет сети. Вы просматриваете сохранённый прототип. Все действия остаются демонстрационными.';
}
function persist(next) {
  state = next;
  try { localStorage.setItem(storageKey, JSON.stringify(state)); volatileStorage = false; } catch { volatileStorage = true; }
  updateNotice();
}
function navigation() {
  const markup = `<nav aria-label="Основные разделы">${navItems.map(([key, name, glyph]) => `<a class="nav-item" href="#${key}" ${route().split('/')[0] === key ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${name}</span></a>`).join('')}</nav>`;
  document.querySelector('#desktop-nav').innerHTML = markup;
  document.querySelector('#mobile-nav').innerHTML = markup;
}
function heading(title, subtitle = '', eyebrow = 'Личный ритм') {
  return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1 tabindex="-1">${title}</h1>${subtitle ? `<p class="subtext">${subtitle}</p>` : ''}</div><span class="date-label">${dateText(new Date(), { day: 'numeric', month: 'long', weekday: 'short' })}</span></div>`;
}
function empty(title, text, label = 'Открыть расписание', destination = 'schedule') {
  return `<div class="empty">${icon('calendar')}<h3>${title}</h3><p>${text}</p><button class="secondary" data-route="${destination}">${label}</button></div>`;
}
function sessionCard(session, showDay = false) {
  const booked = Boolean(activeBooking(state, session.id));
  const seats = session.seats - (booked ? 1 : 0);
  const trainer = trainerById(session.trainer);
  return `<button class="session-card ${booked ? 'booked' : ''}" data-action="session" data-id="${session.id}" aria-label="${escapeHtml(session.title)}, ${session.time}, ${booked ? 'вы записаны' : `свободных мест: ${seats}`}">
    ${showDay ? `<p class="session-day">${dateText(dateAt(session.date), { day: 'numeric', month: 'long', weekday: 'short' })}</p>` : ''}
    <div class="session-top"><span class="session-time">${session.time}<small>${session.minutes} мин</small></span><span class="seat-pill ${booked ? 'booked' : seats === 0 ? 'full' : ''}">${booked ? 'Вы записаны' : seats === 0 ? 'Мест нет' : `${seats} ${seats === 1 ? 'место' : seats < 5 ? 'места' : 'мест'}`}</span></div>
    <h3>${session.title}</h3><div class="session-bottom">${picture(trainer)}<span>${trainer.name} · ${session.category === 'personal' ? 'индивидуально' : 'малая группа'}</span>${icon('arrow')}</div>
  </button>`;
}
function home() {
  const next = sessions.filter((s) => activeBooking(state, s.id)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  const count = state.bookings.filter((b) => b.status === 'active').length;
  return `${heading('Движение в <em>твоём ритме.</em>', '', 'Хороший день, чтобы начать')}
    <div class="hero-grid"><section class="hero-card"><img src="../images/loft-hero-v2-mobile.webp" alt="Визуальная концепция тренировки в лофтовой студии" width="780" height="1000"><div class="hero-copy"><p class="eyebrow">Сила · баланс · восстановление</p><h2>Время для себя.<br><em>Место для силы.</em></h2><p>Найди тренировку под своё настроение.</p><a class="primary light" href="#schedule">Выбрать занятие ${icon('arrow')}</a></div></section>
    <section class="next-card"><div><div class="next-icon">${icon(next ? 'check' : 'calendar')}</div><p class="eyebrow">${next ? 'Твоя демо-запись' : 'Следующий шаг'}</p><h3>${next ? next.title : 'Начни с одной<br>тренировки'}</h3><p>${next ? `${dateText(dateAt(next.date))} · ${next.time}<br>${trainerById(next.trainer).name} · ${next.minutes} минут` : 'Выбери удобный день.<br>Остальное — по ощущениям.'}</p></div><button class="text-button" data-route="${next ? 'profile/visits' : 'schedule'}">${next ? 'Мои записи' : 'Посмотреть расписание'} ${icon('arrow')}</button></section></div>
    <div class="quick-links"><button class="quick-link" data-route="profile/visits">${icon('calendar')}<span>Мои записи${count ? ` · ${count}` : ''}</span>${icon('chevron', 'chevron')}</button><button class="quick-link" data-route="profile/passes">${icon('bag')}<span>Мои абонементы</span>${icon('chevron', 'chevron')}</button><button class="quick-link" data-action="about">${icon('leaf')}<span>О пространстве</span>${icon('chevron', 'chevron')}</button></div>
    <div class="section-head"><h2>Найди своё занятие</h2><a class="text-button" href="#schedule">Всё расписание ${icon('arrow')}</a></div><div class="session-grid">${sessions.slice(0, 2).map((s) => sessionCard(s, true)).join('')}</div>
    <div class="editorial-card"><div><p class="eyebrow">Без спешки. Без соревнования.</p><h3>Сначала — познакомиться.</h3><p>Посмотри, как устроены пакеты тренировок.</p><a class="text-button" href="#shop">Выбрать свой формат ${icon('arrow')}</a></div>${icon('leaf')}</div>`;
}
function schedule() {
  const visible = sessions.filter((s) => s.day === day && (category === 'all' || s.category === category)).sort((a, b) => a.time.localeCompare(b.time));
  return `${heading('Расписание', 'Демонстрационная неделя. Выбери день и свой формат.', 'Твоё время для движения')}
  <section class="calendar" aria-label="Выбор дня"><div class="calendar-top"><h2>${dateText(dateAt(state.anchor), { month: 'long', year: 'numeric' })}</h2><span>Демо · 7 дней</span></div><div class="week">${Array.from({ length: 7 }, (_, index) => { const date = dateAt(state.anchor, index); return `<button class="day-button" data-action="day" data-day="${index}" aria-pressed="${day === index}" aria-label="${dateText(date, { weekday: 'long', day: 'numeric', month: 'long' })}"><span>${dateText(date, { weekday: 'short' })}</span>${date.getDate()}</button>`; }).join('')}</div></section>
  <div class="chips" aria-label="Фильтр направлений">${categories.map(([value, label]) => `<button class="chip" data-action="category" data-id="${value}" aria-pressed="${category === value}">${label}</button>`).join('')}</div>
  <p class="schedule-day-heading">${dateText(dateAt(state.anchor, day), { weekday: 'long', day: 'numeric', month: 'long' })} · Занятий: ${visible.length}</p>
  <div class="session-grid">${visible.length ? visible.map((s) => sessionCard(s)).join('') : `<div class="empty">${icon('leaf')}<h3>Здесь пока свободный день</h3><p>В этом демо нет занятий по выбранным условиям. Попробуй другой день или направление.</p><button class="secondary" data-action="reset-filters">Показать все занятия первого дня</button></div>`}</div>`;
}
function shop() {
  const visible = products.filter((p) => shopCategory === 'all' || p.category === shopCategory);
  return `${heading('Магазин', 'Примеры пакетов. Все цены условные, оплатить их нельзя.', 'Выбери свой формат')}
    <div class="chips" aria-label="Формат пакетов">${[['all', 'Все пакеты'], ['group', 'Групповые'], ['personal', 'Персональные']].map(([value, label]) => `<button class="chip" data-action="shop-category" data-id="${value}" aria-pressed="${shopCategory === value}">${label}</button>`).join('')}</div>
    <div class="shop-grid">${visible.map((product) => `<article class="product-card ${product.featured ? 'featured' : ''}"><p class="eyebrow">${product.category === 'group' ? 'Групповые тренировки' : 'Один на один'}</p><h2>${product.name}</h2><p class="product-caption">${product.caption}</p><div class="product-meta"><span>${visitLabel(product.visits)}</span><span>На ${product.days} дней</span></div><div class="product-price">${money(product.price)}<small>Демонстрационная цена · не оферта</small></div><button class="primary ${product.featured ? 'light' : ''}" data-action="product" data-id="${product.id}">Посмотреть пакет ${icon('arrow')}</button></article>`).join('')}</div>`;
}
function trainerCards(query = '') {
  const filtered = trainers.filter((trainer) => `${trainer.name} ${trainer.role}`.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')));
  return `<p class="search-count" role="status">Найдено специалистов: ${filtered.length}</p><div class="trainer-grid">${filtered.length ? filtered.map((trainer) => `<button class="trainer-card" data-action="trainer" data-id="${trainer.id}"><div class="trainer-photo">${picture(trainer, 'portrait')}</div><h3>${trainer.name}</h3><p>${trainer.role}</p></button>`).join('') : empty('Никого не нашли', 'Попробуй другое имя или направление.', 'Посмотреть расписание')}</div>`;
}
function team() {
  return `${heading('Тренеры', 'Знакомимся с форматом команды. Имена и фотографии — вымышленные примеры.', 'Люди, с которыми комфортно')}
  <label class="search-box">${icon('search')}<input id="trainer-search" type="search" placeholder="Имя или направление" aria-label="Поиск тренера по имени или направлению" maxlength="80" autocomplete="off"></label><div id="trainer-results">${trainerCards()}</div>`;
}
function menuButton(name, glyph, destination, count = 0) {
  return `<button class="menu-button" data-route="${destination}">${icon(glyph)}<span>${name}</span>${count ? `<span class="menu-count">${count}</span>` : ''}${icon('chevron')}</button>`;
}
function profile() {
  return `${heading('Твой профиль', '', 'Всё важное — рядом')}
    <div class="profile-grid"><section class="identity-card"><div class="identity-avatar">Г</div><h2>Гость студии</h2><p class="subtext">Демо-профиль без регистрации.<br>Настоящие личные данные не нужны.</p><span class="tag">Режим знакомства</span></section><div class="profile-menu">
    <button class="menu-button" data-action="personal">${icon('user')}<span>Личные данные</span>${icon('chevron')}</button>
    ${menuButton('Мои записи', 'calendar', 'profile/visits', state.bookings.filter((b) => b.status === 'active').length)}
    ${menuButton('Мои абонементы', 'bag', 'profile/passes', state.passes.length)}
    ${menuButton('Уведомления', 'bell', 'profile/reminders')}
    <button class="menu-button" data-action="rules">${icon('document')}<span>Правила и документы</span>${icon('chevron')}</button>
    ${menuButton('Как это работает', 'info', 'profile/help')}
    <button class="menu-button danger" data-action="reset">${icon('reset')}<span>Начать демо заново</span></button></div></div>`;
}
const profileBack = () => `<a class="back-link" href="#profile">${icon('back')} Назад в профиль</a>`;
function visits() {
  const bookings = state.bookings.filter((b) => b.status === visitsTab);
  return `${profileBack()}${heading('Мои записи', 'Только тестовые записи из этого браузера.')}
    <div class="chips" aria-label="Состояние записей">${[['active', 'Предстоящие'], ['cancelled', 'Отменённые']].map(([value, label]) => `<button class="chip" data-action="visits-tab" data-id="${value}" aria-pressed="${visitsTab === value}">${label}</button>`).join('')}</div>
    ${bookings.length ? bookings.map((booking) => { const s = sessions.find((item) => item.id === booking.session); return `<article class="visit-card"><div><p class="eyebrow">Демо · ${booking.status === 'active' ? 'запись создана' : 'отменено'}</p><h3>${s.title}</h3><p>${dateText(dateAt(s.date))} · ${s.time} · ${trainerById(s.trainer).name}</p><p>${booking.pass ? 'Посещение из демо-пакета' : 'Разовое посещение · без оплаты'}</p></div>${booking.status === 'active' ? `<button class="text-button" data-action="cancel" data-id="${s.id}">Отменить запись</button>` : ''}</article>`; }).join('') : empty(visitsTab === 'active' ? 'Здесь появится твоя тренировка' : 'Отменённых записей пока нет', 'Выбери занятие в расписании и пройди демонстрационную запись.')}`;
}
function passes() {
  return `${profileBack()}${heading('Мои абонементы', 'Демо-пакеты не дают права на посещение студии.')}
    ${state.passes.length ? state.passes.map((pass) => { const product = products.find((p) => p.id === pass.product); const expires = new Date(pass.created + product.days * 86400000); const expired = expires.getTime() < Date.now(); return `<article class="pass-card ${expired ? 'expired' : ''}"><p class="eyebrow">Демонстрационный пакет${expired ? ' · срок истёк' : ''}</p><h3>${product.name}</h3><div class="balance">${pass.remaining} <small>из ${product.visits} посещений</small></div><progress value="${pass.remaining}" max="${product.visits}" aria-label="Остаток посещений"></progress><p>Условный срок: до ${dateText(expires)}<br>${product.category === 'group' ? 'Групповые тренировки' : 'Персональные тренировки'}</p></article>`; }).join('') : empty('Найди свой ритм', 'Выбери пакет в магазине. Он появится здесь после демонстрационной покупки.', 'Посмотреть пакеты', 'shop')}
    ${state.passes.length ? '<a class="primary" href="#shop">Добавить демо-пакет</a>' : ''}`;
}
function reminders() {
  return `${profileBack()}${heading('Уведомления', 'Пример настройки — настоящие уведомления не отправляются.')}
    <div class="switch-row"><label for="reminders-toggle">Напоминания о тренировках<br><span class="subtext">Настройка только для демонстрации</span></label><input type="checkbox" id="reminders-toggle" ${state.reminders ? 'checked' : ''}></div><p class="toggle-status" id="reminders-status">${state.reminders ? 'Демо-настройка включена.' : 'Демо-настройка выключена.'} Доступ к уведомлениям телефона не запрашивается.</p>`;
}
function help() {
  return `${profileBack()}${heading('Как это работает', 'Короткий маршрут знакомства с прототипом.')}
  <div class="help-list"><section><h3>01 / Найди занятие</h3><p>В расписании можно выбрать день и направление. Нажми на карточку, чтобы увидеть детали. Пустой день и заполненная группа — тоже часть демо.</p></section><section><h3>02 / Попробуй запись</h3><p>Доступна разовая демо-запись либо списание посещения из подходящего демо-пакета. Никакие деньги не списываются.</p></section><section><h3>03 / Управляй своими занятиями</h3><p>В профиле можно отменить запись. Посещение вернётся в тот же демо-пакет. В прототипе нет ограничений по времени отмены; реальные правила ещё предстоит утвердить.</p></section><section><h3>04 / Сохрани на телефон</h3><p>После размещения на HTTPS-адресе прототип можно будет добавить на главный экран. Это не заменяет подключение настоящего сервиса записи.</p><button class="text-button" data-action="install">Как добавить на экран ${icon('arrow')}</button></section></div>`;
}
function render(moveFocus = false) {
  const views = { home, schedule, shop, trainers: team, profile, 'profile/visits': visits, 'profile/passes': passes, 'profile/reminders': reminders, 'profile/help': help };
  main.innerHTML = views[route()]();
  navigation();
  document.title = `${navItems.find(([key]) => key === route().split('/')[0])?.[1] || 'Кабинет'} · прототип студии`;
  if (moveFocus) { window.scrollTo({ top: 0, behavior: 'instant' }); main.querySelector('h1')?.focus({ preventScroll: true }); }
}
function openSheet(title, body, actions = '') {
  opener = document.activeElement;
  sheet.innerHTML = `<div class="sheet-inner"><div class="sheet-head"><div><p class="sheet-demo">Прототип студии</p><h2 id="dialog-title">${title}</h2></div><button class="icon-button" data-action="close" aria-label="Закрыть">${icon('close')}</button></div>${body}${actions ? `<div class="sheet-actions">${actions}</div>` : ''}</div>`;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
}
function closeSheet() { dialog.close(); }
function sessionSheet(id) {
  const session = sessions.find((s) => s.id === id);
  if (!session) return;
  const trainer = trainerById(session.trainer);
  const booked = activeBooking(state, id);
  const available = eligiblePasses(state, session);
  const payments = !booked && session.seats > 0 ? `<fieldset class="payment-options"><legend>Как попробовать запись</legend>${available.map((pass, index) => `<label class="payment-option"><input type="radio" name="payment" value="${escapeHtml(pass.id)}" ${index === 0 ? 'checked' : ''}><span>Из пакета «${products.find((p) => p.id === pass.product).name}»<small>Осталось ${pass.remaining} · спишется 1 демо-посещение</small></span></label>`).join('')}<label class="payment-option"><input type="radio" name="payment" value="single" ${available.length ? '' : 'checked'}><span>Разовое · ${money(session.price)}<small>Условная цена. Деньги не списываются.</small></span></label></fieldset>` : '';
  openSheet(session.title, `<div class="sheet-details"><div class="sheet-detail"><span>День и время</span><strong>${dateText(dateAt(session.date))} · ${session.time}</strong></div><div class="sheet-detail"><span>Продолжительность</span><strong>${session.minutes} минут</strong></div></div><div class="trainer-summary">${picture(trainer)}<div><h3>${trainer.name}</h3><p>${trainer.role} · демо-персонаж</p></div></div><p class="sheet-body">${session.category === 'personal' ? 'Индивидуальное занятие в удобном темпе.' : 'Небольшая группа и внимание к каждому движению.'} ${booked ? 'У тебя уже есть демо-запись.' : session.seats === 0 ? 'Эта демонстрационная группа заполнена. Выбери другое занятие.' : `Свободных мест в примере: ${session.seats}.`}</p>${payments}<p class="sheet-warning">Это демонстрация. Место в настоящей студии не бронируется, платёж не проводится.</p>`,
    booked ? `<button class="primary" data-action="open-visits">Открыть мои записи</button>` : session.seats === 0 ? '<button class="primary" disabled>Мест нет</button><button class="secondary" data-action="close">Вернуться к расписанию</button>' : `<button class="primary" data-action="confirm-booking" data-id="${id}">Подтвердить демо-запись</button>`);
}
function productSheet(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;
  openSheet(product.name, `<div class="sheet-body"><p>${product.caption}.</p><div class="sheet-details"><div class="sheet-detail"><span>Посещения</span><strong>${product.visits}</strong></div><div class="sheet-detail"><span>Условный срок</span><strong>${product.days} дней</strong></div></div><h3>${money(product.price)} · пример цены</h3><p>${product.category === 'group' ? 'Для групповых направлений, кроме персональных занятий.' : 'Для персональной тренировки.'}</p></div><p class="sheet-warning">Банковская карта не нужна. Кнопка добавит только демонстрационный пакет в этот браузер. Реальной покупки не будет.</p>`, `<button class="primary" data-action="buy-demo" data-id="${id}">Добавить демо-пакет · без оплаты</button>`);
}
function trainerSheet(id) {
  const trainer = trainerById(id);
  if (!trainer) return;
  openSheet(trainer.name, `<img class="sheet-portrait" src="../images/trainers/${trainer.image}" alt="Вымышленный пример специалиста"><div class="sheet-body"><h3>${trainer.role}</h3><p>${trainer.text}</p></div><p class="sheet-warning">Имя, описание и изображение — демонстрационные. Реальная команда ещё не утверждена.</p>`, `<button class="primary" data-action="trainer-schedule" data-id="${id}">Посмотреть занятия ${icon('arrow')}</button>`);
}
function installSheet() {
  const installed = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  openSheet(installed ? 'Уже на главном экране' : 'Всегда под рукой', `<div class="sheet-body"><p>${installed ? 'Прототип открыт в отдельном окне приложения.' : 'Сохрани кабинет на телефон и открывай одним нажатием.'}</p><h3>На iPhone</h3><p>Открой HTTPS-ссылку в Safari → «Поделиться» → «На экран Домой». Если есть переключатель «Открывать как веб-приложение», включи его.</p><h3>На Android</h3><p>В Chrome открой меню → «Добавить на главный экран» или «Установить приложение».</p><h3>Что важно</h3><p>На телефоне нужна доступная HTTPS-ссылка. Адрес 127.0.0.1 работает только на компьютере, где запущен просмотр. Установка не подключает реальную запись и оплату.</p></div>`, installPrompt && !installed ? '<button class="primary" data-action="install-native">Установить через браузер</button>' : '<button class="primary" data-action="close">Понятно</button>');
}
const actions = {
  close: closeSheet,
  install: installSheet,
  day: (button) => { day = Number(button.dataset.day); render(); main.querySelector(`[data-day="${day}"]`)?.focus({ preventScroll: true }); },
  category: (button) => { category = button.dataset.id; render(); main.querySelector(`[data-action="category"][data-id="${category}"]`)?.focus({ preventScroll: true }); },
  'shop-category': (button) => { shopCategory = button.dataset.id; render(); main.querySelector(`[data-action="shop-category"][data-id="${shopCategory}"]`)?.focus({ preventScroll: true }); },
  'visits-tab': (button) => { visitsTab = button.dataset.id; render(); main.querySelector(`[data-action="visits-tab"][data-id="${visitsTab}"]`)?.focus({ preventScroll: true }); },
  'reset-filters': () => { day = 0; category = 'all'; render(true); },
  session: (button) => sessionSheet(button.dataset.id),
  product: (button) => productSheet(button.dataset.id),
  trainer: (button) => trainerSheet(button.dataset.id),
  'trainer-schedule': (button) => {
    const session = sessions.find((s) => s.trainer === button.dataset.id);
    day = session?.day || 0; category = session?.category || 'all'; closeSheet(); go('schedule');
  },
  'open-visits': () => { closeSheet(); visitsTab = 'active'; go('profile/visits'); },
  'confirm-booking': (button) => {
    const selected = sheet.querySelector('input[name="payment"]:checked')?.value;
    const result = bookDemoSession(state, button.dataset.id, selected === 'single' ? null : selected);
    if (result.error) { toast(result.error); return; }
    persist(result.state); render();
    openSheet('До встречи в твоём ритме', `<div class="success-content"><div class="success-symbol">${icon('check')}</div><h3>Демо-запись создана</h3><p class="sheet-body">Она уже в разделе «Мои записи». Место в настоящей студии не занято, деньги не списаны.</p></div>`, '<button class="primary" data-action="open-visits">Посмотреть мою запись</button><button class="secondary" data-action="close">Продолжить знакомство</button>');
  },
  'buy-demo': (button) => {
    const result = buyDemoPass(state, button.dataset.id, crypto.randomUUID());
    if (result.error) { toast(result.error); return; }
    persist(result.state); closeSheet(); go('profile/passes'); toast('Демо-пакет добавлен. Оплаты не было.');
  },
  cancel: (button) => openSheet('Отменить демо-запись?', '<p class="sheet-body">Если использован демо-пакет, одно посещение вернётся на его баланс. Настоящую запись это действие не затрагивает.</p><p class="sheet-warning">В прототипе отмена без ограничений. Реальные правила студии ещё не утверждены.</p>', `<button class="primary" data-action="confirm-cancel" data-id="${button.dataset.id}">Да, отменить демо-запись</button><button class="secondary" data-action="close">Оставить запись</button>`),
  'confirm-cancel': (button) => { const result = cancelDemoSession(state, button.dataset.id); if (result.error) { toast(result.error); return; } persist(result.state); closeSheet(); render(true); toast('Демо-запись отменена. Посещение из пакета возвращено, если он использовался.'); },
  reset: () => openSheet('Начать знакомство заново?', '<p class="sheet-body">Будут сброшены только тестовые записи, пакеты и настройка напоминаний этого прототипа в текущем браузере. Другие данные не затрагиваются.</p>', '<button class="primary" data-action="confirm-reset">Сбросить демо-данные</button><button class="secondary" data-action="close">Продолжить без сброса</button>'),
  'confirm-reset': () => { persist(initialState()); sessions = buildSessions(state.anchor); day = 0; category = 'all'; shopCategory = 'all'; visitsTab = 'active'; closeSheet(); go('home'); toast('Демо начато заново.'); },
  personal: () => openSheet('Знакомимся без регистрации', '<div class="sheet-body"><p>Сейчас используется вымышленный профиль «Гость студии». Вводить имя, телефон или пароль не нужно.</p><h3>После подключения сервиса</h3><p>Здесь появятся данные клиента и защищённый вход. Это отдельный этап, не часть текущего прототипа.</p></div>', '<button class="primary" data-action="close">Понятно</button>'),
  rules: () => openSheet('Правила и документы', '<div class="sheet-body"><p>Это место для оферты, политики конфиденциальности и правил посещения. Действующие документы студии ещё не утверждены.</p><h3>Правила демо</h3><p>Запись не бронирует реальное место. Покупка добавляет условный пакет без оплаты. Отмена возвращает использованное демо-посещение.</p></div>', '<button class="primary" data-action="close">Понятно</button>'),
  about: () => openSheet('Пространство для себя', '<img class="sheet-portrait" src="../images/loft-space-v2-mobile.webp" alt="Визуальная концепция пространства студии"><div class="sheet-body"><p>Сила, мобильность и восстановление — в одном спокойном ритме. Тёплые материалы, небольшие группы и внимание к движению.</p><p class="subtext">Это визуальная концепция. Название, адрес и реальные данные студии будут добавлены после утверждения.</p></div>', '<a class="primary" href="../">Посмотреть сайт студии ↗</a>'),
  'install-native': async () => {
    if (!installPrompt) return;
    const prompt = installPrompt; installPrompt = null;
    try { await prompt.prompt(); const choice = await prompt.userChoice; closeSheet(); toast(choice.outcome === 'accepted' ? 'Установка подтверждена в браузере.' : 'Можно установить позже через меню браузера.'); } catch { toast('Открой меню браузера для установки.'); }
  },
};
document.addEventListener('click', (event) => {
  if (event.target.closest('.skip-link')) {
    event.preventDefault();
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: 'start', behavior: 'instant' });
    return;
  }
  const button = event.target.closest('[data-action], [data-route]');
  if (!button || button.disabled) return;
  if (button.dataset.route) { if (dialog.open) closeSheet(); go(button.dataset.route); }
  else actions[button.dataset.action]?.(button);
});
document.addEventListener('input', (event) => {
  if (event.target.id === 'trainer-search') document.querySelector('#trainer-results').innerHTML = trainerCards(event.target.value);
});
document.addEventListener('change', (event) => {
  if (event.target.id === 'reminders-toggle') {
    persist({ ...state, reminders: event.target.checked });
    document.querySelector('#reminders-status').textContent = `${state.reminders ? 'Демо-настройка включена.' : 'Демо-настройка выключена.'} Доступ к уведомлениям телефона не запрашивается.`;
  }
});
dialog.addEventListener('close', () => {
  if (opener?.isConnected && !dialog.contains(opener)) opener.focus({ preventScroll: true });
  else main.querySelector('h1')?.focus({ preventScroll: true });
});
window.addEventListener('hashchange', () => { if (dialog.open) closeSheet(); render(true); });
window.addEventListener('online', updateNotice);
window.addEventListener('offline', updateNotice);
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installPrompt = event; });
window.addEventListener('appinstalled', () => { installPrompt = null; toast('Прототип добавлен на устройство.'); });
window.addEventListener('storage', (event) => {
  if (event.key !== storageKey) return;
  state = restoreState(event.newValue); sessions = buildSessions(state.anchor);
  if (dialog.open) closeSheet(); render(); toast('Демо-данные обновлены из другой вкладки.');
});
document.querySelector('#install-entry').innerHTML = icon('install');
render();
updateNotice();
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
    toast('Офлайн-режим недоступен. Прототип можно использовать с подключением к сети.');
  });
}
