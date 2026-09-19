"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Menu, Route, Wallet, X } from "lucide-react";

import { OmegaMark } from "./OmegaMark";
import styles from "./shell.module.css";

/**
 * Barra lateral do OmegaSync (DESIGN.md §10). Fixa no desktop; drawer no
 * mobile, com overlay, botão de fechar, tecla Escape e foco no fechar ao abrir.
 */
export function Sidebar() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Restaura o foco ao botão que abriu o drawer ao fechar (AJUSTE 12.8).
  function closeDrawer() {
    setOpen(false);
    menuButtonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDrawer();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={menuButtonRef}
        className={styles.menuButton}
        aria-label="Abrir navegação"
        aria-expanded={open}
        aria-controls="sidebar"
        onClick={() => setOpen(true)}
      >
        <Menu size={18} strokeWidth={1.5} aria-hidden="true" />
        Menu
      </button>

      <div
        className={open ? styles.overlayOpen : styles.overlay}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <nav
        id="sidebar"
        aria-label="Navegação principal"
        className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}
      >
        <button
          type="button"
          ref={closeRef}
          className={styles.closeButton}
          aria-label="Fechar navegação"
          onClick={closeDrawer}
        >
          <X size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>

        <div className={styles.brand}>
          <OmegaMark className={styles.brandMark} />
          <span className={styles.brandName}>
            Omega<b>Sync</b>
          </span>
        </div>

        <div>
          <p className={styles.navLabel}>Espaço de trabalho</p>
          <div className={styles.nav}>
            <Link
              href="/"
              className={`${styles.navItem} ${styles.navItemActive}`}
              aria-current="page"
            >
              <LayoutGrid size={18} strokeWidth={1.5} aria-hidden="true" />
              Diagnóstico
            </Link>
            <span
              className={`${styles.navItem} ${styles.navItemDisabled}`}
              aria-disabled="true"
            >
              <Route size={18} strokeWidth={1.5} aria-hidden="true" />
              Rotas
              <span className={styles.soon}>Em breve</span>
            </span>
            <span
              className={`${styles.navItem} ${styles.navItemDisabled}`}
              aria-disabled="true"
            >
              <Wallet size={18} strokeWidth={1.5} aria-hidden="true" />
              Carteira
              <span className={styles.soon}>Em breve</span>
            </span>
          </div>
        </div>

        <div className={styles.footer}>
          <span>Ambiente de demonstração</span>
          <span>Porto Hack Santos 2026</span>
        </div>
      </nav>
    </>
  );
}
