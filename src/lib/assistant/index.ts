/**
 * API pública da camada de assistente (PLANEJAMENTO-MCP.md §13/§14).
 *
 * Serviço de chat com contexto da simulação. Orquestra a borda MCP Logcomex sem
 * mover regra de negócio para cá: o motor determinístico continua soberano.
 */

export * from "./chat-types";
export * from "./context-builder";
export * from "./guardrails";
export * from "./chat-service";
export * from "./mcp-assistant";
