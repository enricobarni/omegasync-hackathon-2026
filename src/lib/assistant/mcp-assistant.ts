/**
 * Ponte entre o serviço de chat e a integração MCP Logcomex.
 *
 * Implementa a `AssistantPort` usando o `LogcomexMcpClient` + `LogcomexAgentService`.
 * Responsabilidades por chamada: conectar, escolher o agente, resolver execução
 * assíncrona e encerrar a conexão. Server-side apenas.
 *
 * Escolha de agente (ETAPA FINAL 3, §13 — fatos confirmados no MCP real):
 *  - com sessão OAuth (agente da empresa) → seleciona EXPLICITAMENTE o agente
 *    esperado por NOME (`config.preferredAgentName`); nunca "o primeiro agente";
 *  - com token estático (`LOGCOMEX_MCP_ACCESS_TOKEN`) → mesmo caminho da empresa;
 *  - agente-alvo não encontrado → fallback PÚBLICO (`chat_free`), sem usar outro
 *    agente silenciosamente;
 *  - 401/sem autenticação → agente público.
 */

import {
  LogcomexAgentService,
  LogcomexMcpClient,
  LogcomexMcpError,
  LogcomexOAuthProvider,
  isAuthenticated,
  loadLogcomexMcpConfig,
  type LogcomexMcpConfig,
  type LogcomexOAuthSession,
} from "../logcomex/mcp";
import type { AssistantAskResult, AssistantPort } from "./chat-service";

/** Agente da empresa selecionado explicitamente. */
export interface CompanyAgentSelection {
  id: string;
  name: string;
}

/**
 * Seleciona o agente da empresa por ID (se configurado) ou por NOME esperado —
 * nunca cegamente o primeiro (§13). Sem correspondência → `null`.
 */
export async function resolveCompanyAgent(
  service: LogcomexAgentService,
  config: LogcomexMcpConfig,
): Promise<CompanyAgentSelection | null> {
  const agents = await service.listAgents();

  if (config.preferredAgentId) {
    const byId = agents.find((a) => a.id === config.preferredAgentId);
    if (byId) {
      return { id: byId.id, name: byId.name };
    }
  }

  const target = config.preferredAgentName.trim().toLowerCase();
  const exact = agents.find((a) => a.name.trim().toLowerCase() === target);
  if (exact) {
    return { id: exact.id, name: exact.name };
  }

  const partial = agents.find((a) =>
    a.name.trim().toLowerCase().includes(target),
  );
  return partial ? { id: partial.id, name: partial.name } : null;
}

async function askViaConnection(
  config: LogcomexMcpConfig,
  authProvider: LogcomexOAuthProvider | undefined,
  prompt: string,
  conversationId: string | undefined,
): Promise<AssistantAskResult> {
  const client = new LogcomexMcpClient(config, authProvider);
  await client.connect();
  try {
    const service = new LogcomexAgentService(client, config);
    const authenticated = Boolean(authProvider) || Boolean(config.accessToken);

    if (authenticated) {
      try {
        const agent = await resolveCompanyAgent(service, config);
        if (agent) {
          const reply = await service.askCompanyAgent(
            agent.id,
            prompt,
            conversationId,
          );
          return { source: "LOGCOMEX_COMPANY_AGENT", reply };
        }
        // Agente-alvo não encontrado: NÃO usar outro agente (§13). Cai para o
        // público abaixo como fallback confiável.
      } catch (error) {
        // Só cai para o público quando o problema é de AUTENTICAÇÃO; outras
        // falhas (timeout/indisponível) devem propagar para o estado degradado.
        if (
          !(error instanceof LogcomexMcpError) ||
          error.kind !== "UNAUTHORIZED"
        ) {
          throw error;
        }
      }
    }

    // Divergência confirmada no MCP real (2026-09-20): o agente PÚBLICO
    // (chat_free) rejeita o reuso do próprio conversation_id
    // (403 ANONYMOUS_CONVERSATION_FORBIDDEN), mesmo na mesma sessão MCP. Logo,
    // NÃO reenviamos o conversationId ao agente público — cada mensagem inicia
    // uma conversa nova (sem regressão). A continuidade real depende do agente
    // da EMPRESA autenticado (a porta acima repassa o conversationId a ele).
    const reply = await service.askPublicAgent(prompt);
    return { source: "LOGCOMEX_PUBLIC_AGENT", reply };
  } finally {
    await client.close();
  }
}

/**
 * Cria a porta do assistente ligada ao MCP real.
 *
 * @param session  Sessão OAuth server-side (agente da empresa). Quando presente
 *   e autenticada, o transporte usa o token e o renova via refresh_token; caso
 *   contrário usa o token estático de ambiente ou o agente público.
 */
export function createMcpAssistantPort(
  session?: LogcomexOAuthSession | null,
  config: LogcomexMcpConfig = loadLogcomexMcpConfig(),
): AssistantPort {
  const authProvider = isAuthenticated(session ?? undefined)
    ? new LogcomexOAuthProvider(session as LogcomexOAuthSession, config.oauthScope)
    : undefined;

  return {
    ask: (prompt, conversationId) =>
      askViaConnection(config, authProvider, prompt, conversationId),
  };
}

/**
 * Resolve (best-effort) o agente da empresa para uma sessão autenticada, para
 * fins de EXIBIÇÃO no status/UI. Não altera o motor. Retorna `null` se o agente
 * esperado não for encontrado ou se a conexão falhar.
 */
export async function resolveCompanyAgentForSession(
  session: LogcomexOAuthSession,
  config: LogcomexMcpConfig = loadLogcomexMcpConfig(),
): Promise<CompanyAgentSelection | null> {
  if (!isAuthenticated(session)) {
    return null;
  }
  const provider = new LogcomexOAuthProvider(session, config.oauthScope);
  const client = new LogcomexMcpClient(config, provider);
  await client.connect();
  try {
    const service = new LogcomexAgentService(client, config);
    return await resolveCompanyAgent(service, config);
  } finally {
    await client.close();
  }
}
