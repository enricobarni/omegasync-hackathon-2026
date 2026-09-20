/**
 * Serviço de agentes Logcomex sobre o MCP (PLANEJAMENTO-MCP.md §10/§11).
 *
 * Camada acima do `LogcomexMcpClient`: encapsula as tools reais descobertas
 * (`list_agents`, `chat_free`, `chat_with_agent`, `get_task_status`) em operações
 * de alto nível e resolve a execução ASSÍNCRONA (task_id → polling controlado).
 *
 * Fatos confirmados no MCP real (2026-09-20):
 *  - `chat_free` é PÚBLICO (sem token) — caminho confiável do protótipo;
 *  - `list_agents`/`chat_with_agent` exigem token OAuth (escopo mcp:chat:agents);
 *  - o `reply` é TEXTO LIVRE — nunca fato determinístico (não alimenta o motor).
 */

import type { LogcomexMcpConfig } from "./config";
import type { LogcomexMcpClient, McpCallResult } from "./client";
import { LogcomexMcpError } from "./client";
import type {
  AgentReplyStatus,
  LogcomexAgent,
  LogcomexChatReply,
} from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function mapStatus(raw: unknown): AgentReplyStatus {
  switch (typeof raw === "string" ? raw.toLowerCase() : "") {
    case "completed":
      return "COMPLETED";
    case "pending":
      return "PENDING";
    case "cancelled":
    case "canceled":
      return "CANCELLED";
    case "error":
      return "ERROR";
    default:
      // Sem status explícito, mas com texto → tratamos como concluído.
      return "COMPLETED";
  }
}

/** Extrai o texto concatenado dos blocos `content` como fallback. */
function textFromContent(result: McpCallResult): string | null {
  const text = result.content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("\n")
    .trim();
  return text !== "" ? text : null;
}

/**
 * Normaliza o resultado de uma tool de chat. Lê `structuredContent`
 * ({status, reply, conversation_id} | {status:"pending", task_id}); cai para o
 * texto de `content` quando necessário.
 */
function parseChatReply(result: McpCallResult): LogcomexChatReply {
  const structured = asRecord(result.structuredContent);

  if (structured) {
    const status = mapStatus(structured.status);
    return {
      status,
      reply: readString(structured.reply) ?? textFromContent(result),
      conversationId:
        readString(structured.conversation_id) ??
        readString(structured.conversationId),
      taskId: readString(structured.task_id) ?? readString(structured.taskId),
      artifactsCount:
        readNumber(structured.artifacts_count) ??
        readNumber(asRecord(structured._meta)?.artifacts_count),
      errorMessage: readString(structured.error) ?? readString(structured.message),
    };
  }

  // Sem structuredContent: usa o texto bruto como resposta concluída.
  return {
    status: result.isError ? "ERROR" : "COMPLETED",
    reply: textFromContent(result),
    errorMessage: result.isError
      ? (textFromContent(result) ?? "Erro do provedor.")
      : undefined,
  };
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class LogcomexAgentService {
  constructor(
    private readonly client: LogcomexMcpClient,
    private readonly config: LogcomexMcpConfig,
  ) {}

  /** Descobre os agentes da empresa (requer token). */
  async listAgents(): Promise<LogcomexAgent[]> {
    const result = await this.client.callTool("list_agents", {});
    const structured = asRecord(result.structuredContent);
    const rawAgents = Array.isArray(structured?.agents)
      ? (structured?.agents as unknown[])
      : parseAgentsFromText(result);

    return rawAgents.flatMap((entry) => {
      const rec = asRecord(entry);
      const id = readString(rec?.id);
      const name = readString(rec?.name);
      if (!id || !name) {
        return [];
      }
      const skills = Array.isArray(rec?.skills)
        ? (rec?.skills as unknown[]).flatMap((s) => {
            const sr = asRecord(s);
            const sid = readString(sr?.id);
            const sname = readString(sr?.name);
            return sid && sname ? [{ id: sid, name: sname }] : [];
          })
        : [];
      return [
        {
          id,
          name,
          description: readString(rec?.description),
          companyName: readString(rec?.company_name),
          skills,
        } satisfies LogcomexAgent,
      ];
    });
  }

  /** Pergunta ao agente público gratuito (`chat_free`, sem autenticação). */
  async askPublicAgent(
    message: string,
    conversationId?: string,
  ): Promise<LogcomexChatReply> {
    const result = await this.client.callTool("chat_free", {
      message,
      ...(conversationId ? { conversation_id: conversationId } : {}),
    });
    return this.resolve(parseChatReply(result));
  }

  /** Pergunta ao agente da empresa (`chat_with_agent`, requer token). */
  async askCompanyAgent(
    agentId: string,
    message: string,
    conversationId?: string,
  ): Promise<LogcomexChatReply> {
    const result = await this.client.callTool("chat_with_agent", {
      agent_id: agentId,
      message,
      ...(conversationId ? { conversation_id: conversationId } : {}),
    });
    return this.resolve(parseChatReply(result));
  }

  /** Consulta o status de uma tarefa assíncrona (`get_task_status`). */
  async getTaskStatus(taskId: string): Promise<LogcomexChatReply> {
    const result = await this.client.callTool("get_task_status", {
      task_id: taskId,
    });
    return parseChatReply(result);
  }

  /**
   * Resolve uma resposta possivelmente assíncrona: enquanto `PENDING` com
   * `taskId`, faz polling controlado até concluir ou estourar o timeout total.
   * Nunca faz loop infinito (PLANEJAMENTO-MCP §11).
   */
  private async resolve(reply: LogcomexChatReply): Promise<LogcomexChatReply> {
    if (reply.status !== "PENDING" || !reply.taskId) {
      return reply;
    }

    const taskId = reply.taskId;
    const deadline = Date.now() + this.config.pollTimeoutMs;

    while (Date.now() < deadline) {
      await sleep(this.config.pollIntervalMs);
      const status = await this.getTaskStatus(taskId);
      if (status.status !== "PENDING") {
        return { ...status, conversationId: status.conversationId ?? reply.conversationId };
      }
    }

    throw new LogcomexMcpError(
      "TIMEOUT",
      `A tarefa ${taskId} excedeu o tempo máximo de espera (${this.config.pollTimeoutMs}ms).`,
    );
  }
}

/** list_agents às vezes chega só como texto JSON no bloco `content`. */
function parseAgentsFromText(result: McpCallResult): unknown[] {
  const text = result.content.find(
    (b) => b.type === "text" && typeof b.text === "string",
  )?.text;
  if (!text) {
    return [];
  }
  try {
    const parsed = JSON.parse(text);
    const rec = asRecord(parsed);
    return Array.isArray(rec?.agents) ? (rec?.agents as unknown[]) : [];
  } catch {
    return [];
  }
}
