"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MessageSquare, Plug, SendHorizontal, X } from "lucide-react";

import type { ChatResponse } from "@/lib/assistant";
import type { SimulationResponseDTO } from "@/lib/api";
import { ChatMessage, type ChatItem } from "./ChatMessage";
import styles from "./assistant.module.css";

interface ChatPanelProps {
  /** Resultado da simulação atual, enviado como contexto ao assistente. */
  simulation: SimulationResponseDTO | null;
}

/** Estado de conexão com a Logcomex (nunca inclui token — só o que a API expõe). */
interface ConnectionState {
  authenticated: boolean;
  agentName: string | null;
}

/** Lê o retorno do fluxo OAuth (?logcomex=connected|error) da URL atual. */
function readLogcomexFlag(): "connected" | "error" | null {
  if (typeof window === "undefined") {
    return null;
  }
  const flag = new URLSearchParams(window.location.search).get("logcomex");
  return flag === "connected" || flag === "error" ? flag : null;
}

/**
 * Painel do assistente (PLANEJAMENTO-MCP.md §16, DESIGN.md §10/§28).
 *
 * Drawer acessível: abre/fecha, foca o input ao abrir e restaura o foco ao
 * fechar, fecha com Escape, anuncia novas respostas via aria-live. Nunca acessa
 * o MCP diretamente — fala apenas com POST /api/assistant/chat.
 */
export function ChatPanel({ simulation }: ChatPanelProps) {
  // Estado inicial DETERMINÍSTICO (igual no SSR e no primeiro render do cliente):
  // nunca depende de window/URL aqui, para não causar mismatch de hidratação. O
  // retorno do OAuth (?logcomex=...) é lido só após o mount (useEffect abaixo),
  // que então abre o painel e mostra o aviso.
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
  // Conexão Logcomex (agente da empresa via OAuth). O componente só conhece
  // `{ authenticated, agentName }` — o token vive server-side.
  const [connection, setConnection] = useState<ConnectionState | null>(null);
  // Também determinístico: preenchido após o mount ao ler ?logcomex.
  const [connNotice, setConnNotice] = useState<"connected" | "error" | null>(
    null,
  );
  const [loggingOut, setLoggingOut] = useState(false);

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

  // Só após o mount (nunca no render): lê o retorno do OAuth (?logcomex=...),
  // limpa a URL e consulta o status. Como o estado inicial é determinístico, o
  // primeiro render do cliente é idêntico ao SSR — sem hydration mismatch. Todos
  // os setState ocorrem APÓS o await (nunca de forma síncrona no efeito).
  useEffect(() => {
    const flag = readLogcomexFlag();
    if (flag) {
      // Limpa o parâmetro da URL (efeito colateral; não é setState).
      const params = new URLSearchParams(window.location.search);
      params.delete("logcomex");
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}`,
      );
    }

    let cancelled = false;
    void (async () => {
      let next: ConnectionState | null = null;
      try {
        const response = await fetch("/api/logcomex/auth/status", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = (await response.json()) as ConnectionState;
          next = {
            authenticated: Boolean(data.authenticated),
            agentName: data.agentName ?? null,
          };
        }
      } catch {
        // Status indisponível: mantém o fallback público.
      }
      if (cancelled) {
        return;
      }
      if (next) {
        setConnection(next);
      }
      if (flag) {
        setConnNotice(flag);
        setOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function connect() {
    // Navegação de topo intencional: /start responde 302 para a autorização
    // EXTERNA da Logcomex (fora do Next). O router do cliente não segue esse
    // fluxo OAuth, então usamos location.assign.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/api/logcomex/auth/start");
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/logcomex/auth/logout", { method: "POST" });
      setConnection({ authenticated: false, agentName: null });
      setConnNotice(null);
    } catch {
      // Falha ao encerrar: mantém o estado; o usuário pode tentar de novo.
    } finally {
      setLoggingOut(false);
    }
  }

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

        <div className={styles.connbar}>
          <div className={styles.connInfo}>
            <span className={styles.connLabel}>Logcomex</span>
            <span className={styles.connAgent}>
              {connection?.authenticated
                ? (connection.agentName ?? "Agente da empresa")
                : "Agente público"}
            </span>
          </div>
          {connection?.authenticated ? (
            <div className={styles.connActions}>
              <span className={styles.connBadge}>Conectado</span>
              <button
                type="button"
                className={styles.connLogout}
                onClick={logout}
                disabled={loggingOut}
              >
                Sair
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.connConnect}
              onClick={connect}
            >
              <Plug size={14} strokeWidth={1.6} aria-hidden="true" />
              Conectar Logcomex
            </button>
          )}
        </div>

        {connNotice ? (
          <div
            className={
              connNotice === "connected" ? styles.connOk : styles.connErr
            }
            role="status"
          >
            {connNotice === "connected"
              ? "Conta Logcomex conectada. O assistente pode usar o agente da empresa."
              : "Não foi possível conectar à conta Logcomex. Continuando com orientação pública."}
          </div>
        ) : null}

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
