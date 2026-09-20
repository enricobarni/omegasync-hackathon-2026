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

/**
 * Agente da empresa esperado para a OMEGASYNC (FONTES.md §34 / PLANEJAMENTO-
 * FINALIZACAO §6/§13). É selecionado EXPLICITAMENTE por nome após `list_agents`
 * — nunca "o primeiro agente" cegamente. Configurável por ambiente.
 */
export const DEFAULT_LOGCOMEX_AGENT_NAME = "Agente PortoHackSantos26-GP07";

/**
 * Escopo OAuth documentado e confirmado pela discovery real (FONTES.md §34).
 * A discovery/metadata do servidor ainda tem precedência (SEP-835); este é
 * apenas o fallback configurável — não um endpoint/escopo inventado.
 */
export const DEFAULT_LOGCOMEX_OAUTH_SCOPE =
  "mcp:chat:free mcp:chat:agents offline_access";

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
  /**
   * Nome do agente da empresa a selecionar explicitamente após `list_agents`
   * (PLANEJAMENTO-FINALIZACAO §13). Sem correspondência → fallback público, nunca
   * escolher outro agente silenciosamente.
   */
  preferredAgentName: string;
  /** Escopo OAuth solicitado (fallback à discovery do servidor). */
  oauthScope: string;
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
    preferredAgentName:
      readString("LOGCOMEX_MCP_AGENT_NAME") ?? DEFAULT_LOGCOMEX_AGENT_NAME,
    oauthScope: readString("LOGCOMEX_OAUTH_SCOPE") ?? DEFAULT_LOGCOMEX_OAUTH_SCOPE,
  };
}

/** Limite de tamanho da mensagem do usuário no chat (borda da aplicação). */
export const MAX_CHAT_MESSAGE_LENGTH = 2_000;
