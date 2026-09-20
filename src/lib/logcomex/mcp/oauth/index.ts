/**
 * Borda OAuth do MCP Logcomex (ETAPA FINAL 3). Server-side apenas.
 *
 * Autenticação do AGENTE DA EMPRESA via OAuth 2.0 Authorization Code + PKCE,
 * usando o orquestrador oficial do SDK (discovery real + DCR). Tokens ficam em
 * sessão server-side e nunca chegam ao browser.
 */

export * from "./session-store";
export * from "./provider";
export * from "./auth-flow";
