"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import styles from "./BottomNav.module.css";

const TABS: readonly { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Hoje", icon: "home" },
  { href: "/semana", label: "Semana", icon: "calendar" },
  { href: "/cartoes", label: "Cartões", icon: "cards" },
  { href: "/conversa", label: "Conversa", icon: "chat" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Navegação">
      {TABS.map((tab) => {
        const current = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={styles.link}
            aria-current={current ? "page" : undefined}
          >
            <span className={styles.pill}>
              <Icon name={tab.icon} />
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
