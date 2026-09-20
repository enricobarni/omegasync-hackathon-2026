"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MessageSquare, SendHorizontal, X } from "lucide-react";

import type { ChatResponse } from "@/lib/assistant";
import type { SimulationResponseDTO } from "@/lib/api";
import { ChatMessage, type ChatItem } from "./ChatMessage";
import styles from "./assistant.module.css";

interface ChatPanelProps {
  /** Resultado da simulação atual, enviado como contexto ao assistente. */
  simulation: SimulationResponseDTO | null;
}

/**
 * Painel do assistente (PLANEJAMENTO-MCP.md §16, DESIGN.md §10/§28).
 *
 * Drawer acessível: abre/fecha, foca o input ao abrir e restaura o foco ao
 * fechar, fecha com Escape, anuncia novas respostas via aria-live. Nunca acessa
 * o MCP diretamente — fala apenas com POST /api/assistant/chat.
 */
export function ChatPanel({ simulation }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [items, setItems] = useState<ChatItem[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  // Continuidade de conversa: preservado entre mensagens da sessão (não após
  // refresh). Nunca guarda token — apenas o id de conversa devolvido pela API.
  const [conversationId, setConversationId] = useState<string | undefined>(
    undefined,
  );

  const openButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  function closePanel() {
    setOpen(false);
    openButtonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    inputRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [items, pending]);

  async function send(question: string) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: question,
          simulation,
          ...(conversationId ? { conversationId } : {}),
        }),
      });
      const data = (await response.json()) as ChatResponse | { errors?: string[] };
      if (!response.ok || !("answer" in data)) {
        const errs =
          "errors" in data && Array.isArray(data.errors)
            ? data.errors.join(" ")
            : "Não foi possível consultar o assistente.";
        setError(errs);
        return;
      }
      // Preserva o id de conversa para manter contexto no follow-up. Só
      // sobrescreve quando a resposta traz um id (fallback degradado não traz).
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
      setItems((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: data.answer,
          source: data.source,
          degraded: data.degraded,
          warnings: data.warnings ?? [],
          disclaimer: data.disclaimer,
        },
      ]);
    } catch {
      setError("Falha de comunicação com o assistente.");
    } finally {
      setPending(false);
    }
  }

  function submit() {
    const question = input.trim();
    if (question === "" || pending) {
      return;
    }
    setItems((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: question },
    ]);
    setInput("");
    setLastQuestion(question);
    void send(question);
  }

  function retry() {
    if (lastQuestion) {
      void send(lastQuestion);
    }
  }

  return (
    <>
      <button
        type="button"
        ref={openButtonRef}
        className={styles.launcher}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="assistant-panel"
        onClick={() => setOpen(true)}
      >
        <MessageSquare size={16} strokeWidth={1.6} aria-hidden="true" />
        Assistente
      </button>

      <div
        className={open ? styles.overlayOpen : styles.overlay}
        onClick={closePanel}
        aria-hidden="true"
      />

      <aside
        id="assistant-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${styles.panel} ${open ? styles.panelOpen : ""}`}
      >
        <header className={styles.panelHeader}>
          <div>
            <p className={styles.panelEyebrow}>Assistente Logcomex</p>
            <h2 id={titleId} className={styles.panelTitle}>
              Contexto e orientação
            </h2>
          </div>
          <button
            type="button"
            ref={closeRef}
            className={styles.iconButton}
            aria-label="Fechar assistente"
            onClick={closePanel}
          >
            <X size={16} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.messages} ref={listRef} aria-live="polite">
          {items.length === 0 && !pending ? (
            <div className={styles.empty}>
              <p>
                Pergunte por que uma rota ficou indeterminada, o que significa
                DTA/OEA/anuência ou quais dados estão faltando.
              </p>
              <p className={styles.emptyNote}>
                {simulation
                  ? "A simulação atual é enviada como contexto."
                  : "Rode uma simulação para dar contexto ao assistente."}
              </p>
            </div>
          ) : null}

          {items.map((item) => (
            <ChatMessage key={item.id} item={item} />
          ))}

          {pending ? (
            <p className={styles.statusLine} role="status">
              Consultando a Logcomex…
            </p>
          ) : null}

          {error ? (
            <div className={styles.errorBox} role="alert">
              <span>{error}</span>
              {lastQuestion ? (
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={retry}
                >
                  Tentar novamente
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Não usar <form> aqui: o painel é renderizado dentro do formulário de
            diagnóstico e <form> aninhado é HTML inválido (erro de hidratação). */}
        <div className={styles.composer}>
          <label htmlFor="assistant-input" className="sr-only">
            Mensagem para o assistente
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Escreva sua pergunta…"
            rows={2}
            maxLength={2000}
          />
          <button
            type="button"
            className={styles.sendButton}
            disabled={pending || input.trim() === ""}
            onClick={submit}
            aria-label="Enviar mensagem"
          >
            <SendHorizontal size={16} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>
      </aside>
    </>
  );
}
