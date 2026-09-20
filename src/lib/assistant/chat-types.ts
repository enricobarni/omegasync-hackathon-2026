/**
 * Contrato interno do assistente OmegaSync (PLANEJAMENTO-MCP.md §14).
 *
 * Contrato PRÓPRIO do OmegaSync — nunca o payload bruto do MCP. Distingue
 * claramente a origem da informação (resultado do motor × contexto Logcomex ×
 * orientação geral) e o estado degradado, sem falsa certeza.
 */

import type { SimulationResponseDTO } from "../api";

/** Origem da resposta apresentada ao usuário (PLANEJAMENTO-MCP §14/§17). */
export type ChatSource =
  | "OMEGASYNC"
  | "LOGCOMEX_COMPANY_AGENT"
  | "LOGCOMEX_PUBLIC_AGENT"
  | "FALLBACK";

/**
 * Estado do resultado do chat. Distingue "sem resultado" de "integração
 * indisponível" (PLANEJAMENTO-MCP §21) — nunca converte falha em resposta falsa.
 */
export type ChatStatus =
  | "OK"
  | "NO_RESULTS"
  | "UNAVAILABLE"
  | "TIMEOUT"
  | "UNAUTHORIZED"
  | "PROVIDER_ERROR"
  | "INVALID_RESPONSE";

export interface ChatRequest {
  message: string;
  /** Resultado da simulação atual (contexto), quando houver. */
  simulation?: SimulationResponseDTO | null;
  /** Continuidade de conversa (opcional). */
  conversationId?: string;
}

export interface ChatResponse {
  answer: string;
  source: ChatSource;
  /** Verdadeiro quando houve falha/timeout de integração. */
  degraded: boolean;
  status: ChatStatus;
  /** Avisos/ressalvas exibidos junto à resposta (nunca falsa certeza). */
  warnings: string[];
  /**
   * Ressalva fixa quando a resposta vem de fora do motor: contexto consultivo,
   * não altera automaticamente a decisão determinística.
   */
  disclaimer: string;
  conversationId?: string;
}
