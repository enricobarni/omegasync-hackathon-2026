/**
 * API pública da integração MCP Logcomex (PLANEJAMENTO-MCP.md).
 *
 * Adapter de infraestrutura server-side: cliente MCP, serviço de agentes,
 * configuração e tipos da borda. O domínio nunca importa estes módulos.
 */

export * from "./config";
export * from "./types";
export * from "./client";
export * from "./agent-service";
