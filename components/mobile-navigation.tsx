"use client";

import { useRef, useState } from "react";

interface MobileNavigationProps {
  clientPortalUrl?: string;
}

export function MobileNavigation({ clientPortalUrl }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const links = [
    { href: "#about", label: "О студии" },
    { href: "#directions", label: "Направления" },
    { href: "#space", label: "Пространство" },
    { href: "#booking", label: "Как записаться" },
    { href: clientPortalUrl ?? "#service", label: "Личный кабинет" },
    { href: "#team", label: "Тренеры" },
    { href: "#faq", label: "FAQ" },
  ];

  function closeMenu() {
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || !isOpen) {
      return;
    }

    setIsOpen(false);
    toggleRef.current?.focus();
  }

  return (
    <div className={`mobile-nav${isOpen ? " is-open" : ""}`} onKeyDown={handleKeyDown}>
      <button
        ref={toggleRef}
        className="mobile-nav-toggle"
        type="button"
        aria-controls="mobile-navigation-panel"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        Меню <span aria-hidden="true">+</span>
      </button>
      <nav id="mobile-navigation-panel" aria-label="Мобильная навигация" hidden={!isOpen}>
        {links.map((link) => (
          <a href={link.href} key={link.href} onClick={closeMenu}>
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
