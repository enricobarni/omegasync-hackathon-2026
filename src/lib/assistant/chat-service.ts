/**
 * Serviço de chat do OmegaSync (PLANEJAMENTO-MCP.md §13).
 *
 * Orquestra: monta o contexto da simulação, aplica os guardrails, consulta o
 * agente (via uma PORTA injetável) e mapeia tudo para o contrato interno. Não
 * conhece detalhes do MCP nem faz rede diretamente — recebe uma `AssistantPort`.
 * Isso mantém o serviço puro e testável (a borda MCP é mockada nos testes).
 *
 * Falha de integração NUNCA vira resposta falsa: retorna estado degradado e
 * mensagem amigável. O texto do agente é sempre contexto — não altera o motor.
 */

import { LogcomexMcpError, type McpErrorKind } from "../logcomex/mcp";
import type { LogcomexChatReply } from "../logcomex/mcp";
import type { ChatRequest, ChatResponse, ChatSource, ChatStatus } from "./chat-types";
import { buildSimulationContext } from "./context-builder";
import {
  ADMINISTRATIVE_NOTE,
  EXTERNAL_DISCLAIMER,
  buildAgentPrompt,
  isAdministrativeQuestion,
} from "./guardrails";

/** Resultado de uma consulta ao agente, já com a origem escolhida. */
export interface AssistantAskResult {
  source: Extract<ChatSource, "LOGCOMEX_COMPANY_AGENT" | "LOGCOMEX_PUBLIC_AGENT">;
  reply: LogcomexChatReply;
}

/**
 * Porta do assistente. A implementação real (MCP) encapsula conectar, escolher
 * agente, polling e encerrar. Pode lançar `LogcomexMcpError`.
 */
export interface AssistantPort {
  ask(prompt: string, conversationId?: string): Promise<AssistantAskResult>;
}

function statusFromErrorKind(kind: McpErrorKind): ChatStatus {
  switch (kind) {
    case "TIMEOUT":
      return "TIMEOUT";
    case "UNAUTHORIZED":
      return "UNAUTHORIZED";
    case "UNAVAILABLE":
      return "UNAVAILABLE";
    case "PROVIDER_ERROR":
    default:
      return "PROVIDER_ERROR";
  }
}

function friendlyErrorAnswer(status: ChatStatus): string {
  switch (status) {
    case "TIMEOUT":
      return "A consulta à Logcomex demorou mais que o esperado. Tente novamente em instantes.";
    case "UNAUTHORIZED":
      return "O agente da empresa exige autenticação. Sem credencial válida, apenas a orientação pública está disponível.";
    case "UNAVAILABLE":
      return "A integração com a Logcomex está indisponível no momento. O diagnóstico do OmegaSync continua válido.";
    default:
      return "Não foi possível consultar a Logcomex agora. O diagnóstico do OmegaSync continua válido.";
  }
}

function degradedResponse(status: ChatStatus): ChatResponse {
  return {
    answer: friendlyErrorAnswer(status),
    source: "FALLBACK",
    degraded: true,
    status,
    warnings: [],
    disclaimer: EXTERNAL_DISCLAIMER,
  };
}

/**
 * Processa uma pergunta do chat. Sempre entrega o contexto da simulação ao
 * agente; a resposta externa é apresentada como contexto/orientação.
 */
export async function handleChat(
  request: ChatRequest,
  port: AssistantPort,
): Promise<ChatResponse> {
  const contextBlock = buildSimulationContext(request.simulation ?? null);
  const prompt = buildAgentPrompt(contextBlock, request.message);

  const warnings: string[] = [];
  if (isAdministrativeQuestion(request.message)) {
    warnings.push(ADMINISTRATIVE_NOTE);
  }

  try {
    const { source, reply } = await port.ask(prompt, request.conversationId);

    if (reply.status === "ERROR") {
      return {
        ...degradedResponse("PROVIDER_ERROR"),
        warnings,
      };
    }

    const answer = reply.reply?.trim();
    if (!answer) {
      // Distingue "sem resultado" de "indisponível" (§21).
      return {
        answer:
          "A Logcomex não retornou uma resposta para essa pergunta. Reformule ou tente novamente.",
        source,
        degraded: false,
        status: "NO_RESULTS",
        warnings,
        disclaimer: EXTERNAL_DISCLAIMER,
        conversationId: reply.conversationId,
      };
    }

    return {
      answer,
      source,
      degraded: false,
      status: "OK",
      warnings,
      disclaimer: EXTERNAL_DISCLAIMER,
      conversationId: reply.conversationId,
    };
  } catch (error) {
    const kind: McpErrorKind =
      error instanceof LogcomexMcpError ? error.kind : "PROVIDER_ERROR";
    return {
      ...degradedResponse(statusFromErrorKind(kind)),
      warnings,
    };
  }
}
