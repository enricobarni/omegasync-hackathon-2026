import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar";
import styles from "./shell.module.css";

interface AppShellProps {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
}

/**
 * Casca da aplicação (DESIGN.md §10/§12): sidebar + workspace com cabeçalho
 * (eyebrow / título / descrição / badge) e área principal.
 */
export function AppShell({
  eyebrow,
  title,
  description,
  badge,
  children,
}: AppShellProps) {
  return (
    <>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <Sidebar />
      <div className={styles.workspace}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{description}</p>
          </div>
          {badge ? <span className={styles.badge}>{badge}</span> : null}
        </header>
        <main id="conteudo" className={styles.main}>
          {children}
        </main>
      </div>
    </>
  );
}
