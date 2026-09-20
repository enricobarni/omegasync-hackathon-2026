import { Bot, TriangleAlert, User } from "lucide-react";

import type { ChatSource } from "@/lib/assistant";
import styles from "./assistant.module.css";

export interface AssistantMessageData {
  text: string;
  source: ChatSource;
  degraded: boolean;
  warnings: string[];
  disclaimer: string;
}

export type ChatItem =
  | { id: string; role: "user"; text: string }
  | ({ id: string; role: "assistant" } & AssistantMessageData);

const SOURCE_LABEL: Record<ChatSource, string> = {
  OMEGASYNC: "OmegaSync",
  LOGCOMEX_COMPANY_AGENT: "Logcomex · agente da empresa",
  LOGCOMEX_PUBLIC_AGENT: "Logcomex · orientação geral",
  FALLBACK: "Integração indisponível",
};

function chipClass(source: ChatSource): string {
  if (source === "OMEGASYNC") return `${styles.chip} ${styles.chipOmega}`;
  if (source === "FALLBACK") return `${styles.chip} ${styles.chipMuted}`;
  return `${styles.chip} ${styles.chipLogcomex}`;
}

/** Renderiza uma mensagem do chat, distinguindo a origem da informação. */
export function ChatMessage({ item }: { item: ChatItem }) {
  if (item.role === "user") {
    return (
      <div className={`${styles.message} ${styles.messageUser}`}>
        <span className={styles.avatar} aria-hidden="true">
          <User size={14} strokeWidth={1.8} />
        </span>
        <div className={styles.bubble}>{item.text}</div>
      </div>
    );
  }

  return (
    <div className={`${styles.message} ${styles.messageAssistant}`}>
      <span className={styles.avatar} aria-hidden="true">
        <Bot size={14} strokeWidth={1.8} />
      </span>
      <div className={styles.bubble}>
        <span className={chipClass(item.source)}>{SOURCE_LABEL[item.source]}</span>
        <p className={styles.answer}>{item.text}</p>
        {item.warnings.map((warning) => (
          <p key={warning} className={styles.warning}>
            <TriangleAlert size={13} strokeWidth={1.8} aria-hidden="true" />
            {warning}
          </p>
        ))}
        {item.source === "LOGCOMEX_COMPANY_AGENT" ||
        item.source === "LOGCOMEX_PUBLIC_AGENT" ? (
          <p className={styles.disclaimer}>{item.disclaimer}</p>
        ) : null}
      </div>
    </div>
  );
}
