/**
 * Cliente MCP Logcomex server-side (PLANEJAMENTO-MCP.md §8/§10).
 *
 * Encapsula o SDK oficial (`@modelcontextprotocol/sdk`) e o transporte
 * Streamable HTTP. Responsabilidades: conectar, executar handshake/discovery,
 * chamar tools e encerrar a conexão. NÃO contém regra de negócio nem parsing de
 * domínio — apenas a borda de infraestrutura.
 *
 * Segurança (PLANEJAMENTO-MCP §22): roda apenas no servidor; o token Bearer,
 * quando existe, vai no header `Authorization` e nunca é exposto ao browser.
 *
 * Nota de decisão: o PLANEJAMENTO-MCP citou `@modelcontextprotocol/client` (v2,
 * ainda recente). Usamos o pacote oficial estável e amplamente adotado
 * `@modelcontextprotocol/sdk` (>=1.30, Node >=18), compatível com o stack atual
 * (Node 24, TypeScript 5, Next 16) sem exigir upgrades — conforme o próprio
 * planejamento permite ("usar uma versão oficial compatível e registrar").
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import type { LogcomexMcpConfig } from "./config";
import type { McpToolDescriptor } from "./types";

export interface McpCallResult {
  /** Blocos de conteúdo (texto) devolvidos pela tool. */
  content: Array<{ type: string; text?: string }>;
  /** Saída estruturada quando a tool a fornece (ex.: {status, reply, ...}). */
  structuredContent?: unknown;
  isError: boolean;
}

/** Erro de integração MCP com categoria para o fallback (PLANEJAMENTO-MCP §21). */
export type McpErrorKind =
  | "UNAVAILABLE"
  | "TIMEOUT"
  | "UNAUTHORIZED"
  | "PROVIDER_ERROR";

export class LogcomexMcpError extends Error {
  constructor(
    readonly kind: McpErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "LogcomexMcpError";
  }
}

function classify(error: unknown): LogcomexMcpError {
  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();
  if (lowered.includes("401") || lowered.includes("unauthor")) {
    return new LogcomexMcpError("UNAUTHORIZED", message);
  }
  if (lowered.includes("timeout") || lowered.includes("aborted")) {
    return new LogcomexMcpError("TIMEOUT", message);
  }
  if (
    lowered.includes("fetch") ||
    lowered.includes("network") ||
    lowered.includes("econn") ||
    lowered.includes("enotfound")
  ) {
    return new LogcomexMcpError("UNAVAILABLE", message);
  }
  return new LogcomexMcpError("PROVIDER_ERROR", message);
}

export class LogcomexMcpClient {
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;

  constructor(private readonly config: LogcomexMcpConfig) {}

  /** Conecta e executa o handshake `initialize`. */
  async connect(): Promise<void> {
    const headers: Record<string, string> = {};
    if (this.config.accessToken) {
      headers.Authorization = `Bearer ${this.config.accessToken}`;
    }

    this.transport = new StreamableHTTPClientTransport(new URL(this.config.url), {
      requestInit: Object.keys(headers).length > 0 ? { headers } : undefined,
    });
    this.client = new Client(
      { name: "omegasync-assistant", version: "0.1.0" },
      { capabilities: {} },
    );

    try {
      await this.client.connect(this.transport);
    } catch (error) {
      await this.safeClose();
      throw classify(error);
    }
  }

  /** Lista as tools reais expostas pelo servidor (discovery). */
  async listTools(): Promise<McpToolDescriptor[]> {
    const client = this.requireClient();
    try {
      const result = await client.listTools();
      return result.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
      }));
    } catch (error) {
      throw classify(error);
    }
  }

  /** Chama uma tool com argumentos e timeout controlado. */
  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<McpCallResult> {
    const client = this.requireClient();
    try {
      const result = await client.callTool(
        { name, arguments: args },
        undefined,
        { timeout: this.config.requestTimeoutMs },
      );
      return {
        content: Array.isArray(result.content)
          ? (result.content as McpCallResult["content"])
          : [],
        structuredContent: result.structuredContent,
        isError: result.isError === true,
      };
    } catch (error) {
      throw classify(error);
    }
  }

  /** Encerra a conexão e limpa os recursos. */
  async close(): Promise<void> {
    await this.safeClose();
  }

  private async safeClose(): Promise<void> {
    try {
      await this.client?.close();
    } catch {
      // Encerramento best-effort: falha ao fechar não deve mascarar o resultado.
    }
    this.client = null;
    this.transport = null;
  }

  private requireClient(): Client {
    if (!this.client) {
      throw new LogcomexMcpError(
        "UNAVAILABLE",
        "Cliente MCP não conectado. Chame connect() antes.",
      );
    }
    return this.client;
  }
}
