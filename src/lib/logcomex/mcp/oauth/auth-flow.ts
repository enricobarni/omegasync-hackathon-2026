/**
 * Orquestração do fluxo OAuth server-side (ETAPA FINAL 3, §7/§11).
 *
 * Envelopa o orquestrador `auth()` do SDK oficial, que faz discovery real,
 * Dynamic Client Registration, PKCE e troca/renovação de tokens. As rotas
 * internas (`/api/logcomex/auth/*`) só chamam estas funções — não conhecem
 * detalhes do protocolo.
 */

import { auth } from "@modelcontextprotocol/sdk/client/auth.js";

import type { LogcomexOAuthSession } from "./session-store";
import { LogcomexOAuthProvider } from "./provider";

export interface StartResult {
  /** URL de autorização para redirecionar o navegador do usuário. */
  authorizationUrl: URL;
}

/**
 * Inicia o fluxo Authorization Code + PKCE: discovery, DCR (se necessário) e
 * construção da URL de autorização. Persiste code verifier, client info,
 * discovery e `state` na sessão. Devolve a URL para o handler redirecionar.
 */
export async function startLogcomexAuthorization(
  session: LogcomexOAuthSession,
  serverUrl: string,
  scope: string,
): Promise<StartResult> {
  const provider = new LogcomexOAuthProvider(session, scope);
  const result = await auth(provider, { serverUrl, scope });
  if (result !== "REDIRECT" || !provider.authorizationUrl) {
    throw new Error(
      "Fluxo OAuth não produziu uma URL de autorização (esperado REDIRECT).",
    );
  }
  return { authorizationUrl: provider.authorizationUrl };
}

/**
 * Conclui o fluxo trocando o `authorization_code` por tokens (PKCE). Persiste os
 * tokens na sessão. Retorna verdadeiro quando um access token foi obtido.
 */
export async function completeLogcomexAuthorization(
  session: LogcomexOAuthSession,
  authorizationCode: string,
  serverUrl: string,
  scope: string,
): Promise<boolean> {
  const provider = new LogcomexOAuthProvider(session, scope);
  const result = await auth(provider, {
    serverUrl,
    authorizationCode,
    scope,
  });
  return result === "AUTHORIZED" && Boolean(session.tokens?.access_token);
}
