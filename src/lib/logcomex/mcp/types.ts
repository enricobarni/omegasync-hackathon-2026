/**
 * Tipos da borda MCP Logcomex (PLANEJAMENTO-MCP.md §14/§21).
 *
 * Refletem o FORMATO DO PROVEDOR (tools do MCP) e vivem FORA do domínio. O
 * núcleo determinístico do OmegaSync nunca depende destes tipos; o serviço de
 * chat converte-os no contrato interno.
 *
 * Observação factual: as tools `chat_free`/`chat_with_agent` devolvem
 * `structuredContent` no formato `{ status, reply, conversation_id }` — ou, em
 * execução assíncrona, `{ status: "pending", task_id }`. O `reply` é TEXTO
 * LIVRE (markdown), nunca fato determinístico.
 */

/** Descritor de tool retornado por `tools/list` (discovery real). */
export interface McpToolDescriptor {
  name: string;
  description?: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
}

/** Habilidade (skill) de um agente da empresa. */
export interface LogcomexAgentSkill {
  id: string;
  name: string;
}

/** Agente da empresa retornado por `list_agents`. */
export interface LogcomexAgent {
  id: string;
  name: string;
  description?: string;
  companyName?: string;
  skills: LogcomexAgentSkill[];
}

/**
 * Estado de uma resposta de agente (mapeado do `status` do provedor). Distingue
 * "sem resultado" de "indisponível" (PLANEJAMENTO-MCP §21).
 */
export type AgentReplyStatus =
  | "COMPLETED"
  | "PENDING"
  | "CANCELLED"
  | "ERROR";

/** Resposta normalizada de uma tool de chat do provedor. */
export interface LogcomexChatReply {
  status: AgentReplyStatus;
  /** Texto livre do agente; null quando ainda não há resposta. */
  reply: string | null;
  /** ID de conversa para continuidade (opcional). */
  conversationId?: string;
  /** ID da tarefa assíncrona quando `status === "PENDING"`. */
  taskId?: string;
  /** Quantidade de artefatos gerados (não renderizados neste protótipo). */
  artifactsCount?: number;
  /** Mensagem de erro do provedor quando `status === "ERROR"`. */
  errorMessage?: string;
}
