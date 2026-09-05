/* eslint-disable @next/next/no-img-element -- generated assets are pre-sized and pre-compressed locally for Vinext */
import { MobileNavigation } from "../components/mobile-navigation";
import {
  getFitnessServiceStatus,
  getFitnessServiceUrl,
} from "../lib/fitness-service";
import { withSiteBasePath } from "../lib/site-paths";

const Arrow = () => <span aria-hidden="true">↗</span>;

const clientPortalUrl = getFitnessServiceUrl(
  process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL,
);
const clientPortalDestination = clientPortalUrl ?? "#service";
const fitnessServiceStatus = getFitnessServiceStatus(clientPortalUrl);

export const dynamic = "force-static";

const directions = [
  {
    number: "01",
    title: "Функцио\u00ADнальный тренинг",
    label: "Сила · координация",
    text: "Динамичный формат с адаптацией нагрузки под уровень подготовки.",
  },
  {
    number: "02",
    title: "Силовой тренинг",
    label: "Техника · прогресс",
    text: "Последовательная работа с силой, техникой и качеством движения.",
  },
  {
    number: "03",
    title: "Мобиль\u00ADность и растяжка",
    label: "Свобода · контроль",
    text: "Спокойная практика для подвижности, контроля и восстановления.",
  },
  {
    number: "04",
    title: "Пилатес",
    label: "Баланс · точность",
    text: "Одно из направлений студии — точная работа с телом и вниманием.",
  },
  {
    number: "05",
    title: "Персональ\u00ADные занятия",
    label: "Индивидуальный маршрут",
    text: "Формат один на один, собранный вокруг личной задачи и темпа.",
  },
  {
    number: "06",
    title: "Восстанови\u00ADтельные практики",
    label: "Переключение · ресурс",
    text: "Мягкие форматы нагрузки как часть цельной тренировочной системы.",
  },
];

const trainers = [
  { image: withSiteBasePath("/images/trainers/trainer-01-v3.webp"), number: "01", title: "Движение", label: "Техника и контроль" },
  { image: withSiteBasePath("/images/trainers/trainer-02-v3.webp"), number: "02", title: "Сила", label: "Уверенный прогресс" },
  { image: withSiteBasePath("/images/trainers/trainer-03-v3.webp"), number: "03", title: "Мобильность", label: "Свобода движения" },
  { image: withSiteBasePath("/images/trainers/trainer-04-v3.webp"), number: "04", title: "Точный контроль", label: "Баланс и координация" },
  { image: withSiteBasePath("/images/trainers/trainer-05-v3.webp"), number: "05", title: "Персонально", label: "Фокус на задаче" },
  { image: withSiteBasePath("/images/trainers/trainer-06-v3.webp"), number: "06", title: "Восстановление", label: "Работа с ресурсом" },
];

const bookingSteps = [
  { number: "01", title: "Выбрать формат", text: "Групповое или персональное занятие под вашу задачу." },
  { number: "02", title: "Найти время", text: "Актуальное расписание и свободные места в одном окне." },
  { number: "03", title: "Записаться", text: "Оплата и управление посещениями через личный кабинет." },
];

const faqs = [
  {
    question: "Можно ли прийти без опыта тренировок?",
    answer: "Такой сценарий предусмотрен в концепции. Точный порядок первого посещения и адаптации нагрузки появится после утверждения программы.",
  },
  {
    question: "Какие направления будут в расписании?",
    answer: "Функциональные и силовые тренировки, мобильность и растяжка, пилатес, персональные и восстановительные форматы.",
  },
  {
    question: "Как записываться и оплачивать занятия?",
    answer: "Через личный кабинет: в нём будут запись, перенос, отмена, оплата и остаток посещений.",
  },
  {
    question: "Что взять с собой?",
    answer: "Точный список вещей и требования к экипировке появятся после утверждения правил и оснащения студии.",
  },
  {
    question: "Можно ли заниматься персонально?",
    answer: "Да. Персональная работа заложена как отдельный формат с выбором задачи и специалиста.",
  },
  {
    question: "Где находится студия?",
    answer: "Адрес, схема проезда, парковка и режим работы будут опубликованы после подтверждения локации.",
  },
];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#content">Перейти к содержанию</a>

      <header className="site-header">
        <div className="header-inner shell">
          <a className="brand" href="#top" aria-label="На первый экран">
            <span className="brand-mark" aria-hidden="true">FS</span>
            <span className="brand-copy">Fitness<br />studio</span>
          </a>

          <nav className="nav-links" aria-label="Основная навигация">
            <a href="#about">О студии</a>
            <a href="#directions">Направления</a>
            <a href="#space">Пространство</a>
            <a href="#team">Тренеры</a>
            <a href="#faq">Вопросы</a>
          </nav>

          <div className="header-actions">
            <MobileNavigation clientPortalUrl={clientPortalUrl} />
            <a className="cabinet-link" href={clientPortalDestination}>Личный кабинет</a>
            <a className="header-cta" href="#directions">Выбрать занятие <Arrow /></a>
          </div>
        </div>
      </header>

      <main id="content" tabIndex={-1}>
        <section className="hero" id="top">
          <figure className="hero-media">
            <picture>
              <source media="(max-width: 700px)" srcSet={withSiteBasePath("/images/loft-hero-v2-mobile.webp")} />
              <img
                src={withSiteBasePath("/images/loft-hero-v2.webp")}
                alt="Визуальная концепция групповой тренировки в современной лофтовой фитнес-студии"
                width="1672"
                height="941"
                fetchPriority="high"
                decoding="async"
              />
            </picture>
          </figure>
          <div className="hero-overlay" aria-hidden="true" />
          <div className="hero-grid" aria-hidden="true" />

          <div className="hero-content shell">
            <div className="hero-topline">
              <p>Тренировки · движение · восстановление</p>
              <span>Группы · персонально</span>
            </div>

            <div className="hero-title-wrap">
              <span className="hero-number">01</span>
              <h1>
                <span>Сила</span>
                <span className="hero-line-two">в своём <em>ритме.</em></span>
              </h1>
            </div>

            <div className="hero-bottom">
              <p>Тренировки для силы, мобильности и восстановления — в спокойной среде, где внимание остаётся на движении.</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#directions">Выбрать направление <Arrow /></a>
                <a className="text-link" href="#space">Увидеть пространство <span aria-hidden="true">↓</span></a>
              </div>
            </div>
          </div>

          <div className="hero-ticker" aria-label="Основные форматы">
            <div className="ticker-track">
              <span>Функциональные</span><span>Силовые</span><span>Мобильность</span>
              <span>Пилатес</span><span>Персональные</span><span>Восстановление</span>
            </div>
          </div>
        </section>

        <section className="manifest section-light" id="about">
          <div className="shell">
            <header className="section-intro">
              <p className="eyebrow"><span>02</span> О студии</p>
              <p className="section-note">Сила без показного шума</p>
            </header>
            <div className="manifest-layout">
              <h2>Не конвейер.<br /><em>Точное движение</em><br />и сильная среда.</h2>
              <div className="manifest-copy">
                <p className="lead">Здесь качество тренировки начинается ещё до первого упражнения — с пространства, внимания и понятного процесса.</p>
                <p>Вы выбираете формат и двигаетесь в своём темпе. Тренер помогает сохранить технику, нагрузку и последовательность.</p>
              </div>
            </div>
            <div className="manifest-rail" aria-label="Принципы студии">
              <span>Сила</span><span>Координация</span><span>Мобильность</span><span>Восстановление</span>
            </div>
          </div>
        </section>

        <section className="directions-section" id="directions" aria-labelledby="directions-title">
          <div className="shell">
            <header className="editorial-heading">
              <p className="eyebrow"><span>03</span> Направления</p>
              <h2 id="directions-title">Разные задачи.<br /><em>Одна система движения.</em></h2>
              <p>Шесть форматов с разным темпом и нагрузкой. Выберите тот, который ближе к вашей задаче сейчас.</p>
            </header>

            <div className="directions-grid">
              {directions.map((direction) => (
                <a
                  className="direction-card"
                  href="#booking"
                  aria-label={`Как записаться на направление: ${direction.title}`}
                  key={direction.number}
                >
                  <div className="card-index"><span>{direction.number}</span></div>
                  <h3>{direction.title}</h3>
                  <p className="direction-copy">{direction.text}</p>
                  <span className="card-status">{direction.label}</span>
                  <span className="direction-arrow" aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="space-section" id="space" aria-labelledby="space-title">
          <figure className="space-media">
            <picture>
              <source media="(max-width: 700px)" srcSet={withSiteBasePath("/images/loft-space-v2-mobile.webp")} />
              <img src={withSiteBasePath("/images/loft-space-v2.webp")} alt="Визуальная концепция живого пространства будущей фитнес-студии" width="1536" height="1024" loading="lazy" decoding="async" />
            </picture>
          </figure>
          <div className="space-shade" aria-hidden="true" />
          <div className="space-content shell">
            <p className="eyebrow eyebrow-on-image"><span>04</span> Пространство</p>
            <div className="space-title-row">
              <h2 id="space-title">Материалы,<br />свет и <em>воздух.</em></h2>
              <p>Архитектурный лофт без фитнес-агрессии: тёмные фактуры, живой свет и достаточно воздуха, чтобы сосредоточиться на движении.</p>
            </div>
            <p className="space-note">Изображение показывает визуальную концепцию; готовое пространство может отличаться.</p>
            <div className="material-tags" aria-label="Материалы пространства">
              <span>Тёмный кирпич</span><span>Чёрный металл</span><span>Тёплый свет</span><span>Натуральные фактуры</span>
            </div>
          </div>
        </section>

        <section className="booking-section" id="booking" aria-labelledby="booking-title">
          <div className="shell booking-layout">
            <div className="booking-copy">
              <p className="eyebrow eyebrow-dark"><span>05</span> Запись</p>
              <h2 id="booking-title">Один маршрут.<br /><em>Без лишних действий.</em></h2>
              <p className="booking-lead">Выбор занятия, расписание, оплата и управление посещениями будут собраны в одном личном кабинете.</p>
              <a className="button button-light" href="#service">Перейти к сервису <Arrow /></a>
            </div>

            <div className="booking-flow" aria-label="Как будет устроена запись">
              {bookingSteps.map((step) => (
                <article key={step.number}>
                  <span>{step.number}</span>
                  <div><h3>{step.title}</h3><p>{step.text}</p></div>
                  <b aria-hidden="true">↗</b>
                </article>
              ))}
              <div className="booking-options">
                <p>Форматы покупки</p>
                <ul><li>Первое посещение</li><li>Разовое занятие</li><li>Пакет занятий</li><li>Персональный формат</li></ul>
              </div>

              <div className="service-access" id="service" aria-labelledby="service-title">
                <div className="service-access-heading">
                  <p>Будущий личный кабинет</p>
                  <h3 id="service-title">Запись и оплата.<br />В одном месте.</h3>
                </div>

                <div className="service-portals">
                  <article className="service-portal">
                    <span className="service-portal-role">Для посетителей</span>
                    <h4>Личный кабинет</h4>
                    <p>Расписание, запись, покупка и оплата занятий, переносы и остаток посещений.</p>
                    {clientPortalUrl ? (
                      <a className="service-portal-link" href={clientPortalUrl}>
                        Открыть личный кабинет <Arrow />
                      </a>
                    ) : (
                      <span className="service-portal-status">Появится после подключения сервиса</span>
                    )}
                  </article>
                </div>

                <p className="booking-note">{fitnessServiceStatus}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="team-section" id="team" aria-labelledby="team-title">
          <div className="shell">
            <header className="team-heading">
              <div><p className="eyebrow"><span>06</span> Команда</p><h2 id="team-title">Люди определяют<br /><em>качество движения.</em></h2></div>
              <p>Разные специализации, единый подход: внимание к технике, самочувствию и понятному прогрессу.</p>
            </header>
            <div className="team-grid">
              {trainers.map((trainer) => (
                <article className="trainer-card" key={trainer.number}>
                  <figure>
                    <img src={trainer.image} alt={`Визуальный пример специалиста: ${trainer.title}`} width="900" height="1200" loading="lazy" decoding="async" />
                    <span className="trainer-index">{trainer.number}</span>
                  </figure>
                  <div className="trainer-meta"><h3>{trainer.title}</h3><p>{trainer.label}</p></div>
                </article>
              ))}
            </div>
            <p className="team-note">Фотографии показывают стиль будущей команды. Персонажи вымышлены; имена и специализации появятся после её формирования.</p>
          </div>
        </section>

        <section className="faq-section" id="faq" aria-labelledby="faq-title">
          <div className="shell faq-layout">
            <header><p className="eyebrow"><span>07</span> Вопросы</p><h2 id="faq-title">Всё, что важно<br /><em>до визита.</em></h2></header>
            <div className="faq-list">
              {faqs.map((item, index) => (
                <details key={item.question}>
                  <summary><span>{String(index + 1).padStart(2, "0")}</span>{item.question}<b aria-hidden="true">+</b></summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="final-section" id="contacts" aria-labelledby="final-title">
          <div className="final-outline" aria-hidden="true">MOVE</div>
          <div className="shell final-content">
            <p className="eyebrow eyebrow-on-accent"><span>08</span> Первый шаг</p>
            <div className="final-grid">
              <h2 id="final-title">Начать<br /><em>со своего ритма.</em></h2>
              <div>
                <p>Познакомьтесь с направлениями сейчас. Адрес, расписание, стоимость и онлайн-запись появятся после утверждения данных студии.</p>
                <a className="button button-light" href="#directions">Выбрать направление <Arrow /></a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main shell">
          <a className="brand footer-brand" href="#top" aria-label="Вернуться на первый экран">
            <span className="brand-mark" aria-hidden="true">FS</span><span className="brand-copy">Fitness<br />studio</span>
          </a>
          <nav aria-label="Навигация в подвале">
            <a href="#about">О студии</a><a href="#directions">Направления</a><a href="#space">Пространство</a>
            <a href="#booking">Запись</a><a href="#team">Тренеры</a><a href="#faq">FAQ</a>
            <a href={clientPortalDestination}>Личный кабинет</a>
          </nav>
          <div className="footer-status"><span aria-hidden="true" /><p>Рабочая версия · название и данные студии будут добавлены после утверждения</p></div>
        </div>
        <div className="footer-legal shell">
          <span>© 2026 · Фитнес-студия</span>
          <span>Визуальные материалы — концепция; персонажи вымышлены</span>
          <a href="#top">Наверх ↑</a>
        </div>
      </footer>

      <a className="mobile-booking" href={clientPortalDestination}>Личный кабинет <Arrow /></a>
    </>
  );
}
