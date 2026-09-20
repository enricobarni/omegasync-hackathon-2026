/**
 * Ponte entre o serviço de chat e a integração MCP Logcomex.
 *
 * Implementa a `AssistantPort` usando o `LogcomexMcpClient` + `LogcomexAgentService`.
 * Responsabilidades por chamada: conectar, escolher o agente, resolver execução
 * assíncrona e encerrar a conexão. Server-side apenas.
 *
 * Escolha de agente (fatos confirmados no MCP real):
 *  - com token OAuth (escopo mcp:chat:agents) → agente da EMPRESA;
 *  - se o agente da empresa exigir auth e o token faltar/for inválido (401) →
 *    fallback para o agente PÚBLICO (`chat_free`), que não requer autenticação;
 *  - sem token → direto no agente público.
 */

import {
  LogcomexAgentService,
  LogcomexMcpClient,
  LogcomexMcpError,
  loadLogcomexMcpConfig,
  type LogcomexMcpConfig,
} from "../logcomex/mcp";
import type { AssistantAskResult, AssistantPort } from "./chat-service";

async function askViaConnection(
  config: LogcomexMcpConfig,
  prompt: string,
  conversationId: string | undefined,
): Promise<AssistantAskResult> {
  const client = new LogcomexMcpClient(config);
  await client.connect();
  try {
    const service = new LogcomexAgentService(client, config);

    if (config.accessToken) {
      try {
        const agentId =
          config.preferredAgentId ?? (await service.listAgents())[0]?.id;
        if (agentId) {
          const reply = await service.askCompanyAgent(
            agentId,
            prompt,
            conversationId,
          );
          return { source: "LOGCOMEX_COMPANY_AGENT", reply };
        }
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

    const reply = await service.askPublicAgent(prompt, conversationId);
    return { source: "LOGCOMEX_PUBLIC_AGENT", reply };
  } finally {
    await client.close();
  }
}

/** Cria a porta do assistente ligada ao MCP real (config vinda do ambiente). */
export function createMcpAssistantPort(
  config: LogcomexMcpConfig = loadLogcomexMcpConfig(),
): AssistantPort {
  return {
    ask: (prompt, conversationId) =>
      askViaConnection(config, prompt, conversationId),
  };
}
