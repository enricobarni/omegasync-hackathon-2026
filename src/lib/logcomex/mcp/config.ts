/**
 * Configuração da integração MCP Logcomex (PLANEJAMENTO-MCP.md §23).
 *
 * Lê variáveis de ambiente SERVER-SIDE. Regras (AGENTS.md / PLANEJAMENTO-MCP §22):
 *  - nunca usar NEXT_PUBLIC_* para segredos;
 *  - não inventar credenciais fictícias: o token é OPCIONAL e só existe quando
 *    obtido pelo fluxo real de OAuth do provedor;
 *  - valores de timeout/polling ficam em config, não espalhados no código.
 *
 * Endpoint efetivamente validado em 2026-09-20: https://mcp.logcomex.ai/
 * (handshake `initialize` e `chat_free` funcionam sem autenticação; os agentes
 * da empresa — `list_agents`/`chat_with_agent` — exigem OAuth 2.0, escopo
 * `mcp:chat:agents`).
 */

export const DEFAULT_LOGCOMEX_MCP_URL = "https://mcp.logcomex.ai/";

export interface LogcomexMcpConfig {
  /** URL do servidor MCP (o endpoint entregue pela plataforma). */
  url: string;
  /** Timeout de uma chamada de tool individual (ms). */
  requestTimeoutMs: number;
  /** Intervalo entre polls de `get_task_status` (ms). */
  pollIntervalMs: number;
  /** Timeout total do polling assíncrono (ms). */
  pollTimeoutMs: number;
  /**
   * Token Bearer de acesso obtido pelo fluxo OAuth real do provedor. Opcional:
   * quando ausente, só o agente PÚBLICO (`chat_free`) está disponível. NUNCA é
   * inventado nem exposto ao browser.
   */
  accessToken?: string;
  /** ID do agente da empresa a preferir (opcional; descoberto via list_agents). */
  preferredAgentId?: string;
}

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function readString(name: string): string | undefined {
  const raw = process.env[name];
  return raw !== undefined && raw.trim() !== "" ? raw.trim() : undefined;
}

/** Monta a configuração a partir do ambiente, com defaults seguros. */
export function loadLogcomexMcpConfig(): LogcomexMcpConfig {
  return {
    url: readString("LOGCOMEX_MCP_URL") ?? DEFAULT_LOGCOMEX_MCP_URL,
    requestTimeoutMs: readInt("LOGCOMEX_MCP_TIMEOUT_MS", 90_000),
    pollIntervalMs: readInt("LOGCOMEX_MCP_POLL_INTERVAL_MS", 5_000),
    pollTimeoutMs: readInt("LOGCOMEX_MCP_POLL_TIMEOUT_MS", 120_000),
    accessToken: readString("LOGCOMEX_MCP_ACCESS_TOKEN"),
    preferredAgentId: readString("LOGCOMEX_MCP_AGENT_ID"),
  };
}

/** Limite de tamanho da mensagem do usuário no chat (borda da aplicação). */
export const MAX_CHAT_MESSAGE_LENGTH = 2_000;
