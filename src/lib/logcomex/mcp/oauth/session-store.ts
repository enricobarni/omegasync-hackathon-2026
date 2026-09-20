/**
 * Sessão OAuth Logcomex — armazenamento SERVER-SIDE (ETAPA FINAL 3, §10).
 *
 * Guarda o estado do fluxo OAuth 2.0 (Authorization Code + PKCE) e os tokens
 * resultantes. Regras obrigatórias (PLANEJAMENTO-FINALIZACAO §10, AGENTS.md):
 *  - tokens permanecem no servidor; NUNCA vão para o browser, localStorage,
 *    sessionStorage, NEXT_PUBLIC_* nem query string;
 *  - o browser recebe apenas um id de sessão opaco em cookie httpOnly.
 *
 * Persistência: em memória (Map de processo). É suficiente para o protótipo —
 * reinício do servidor encerra as sessões (o usuário reconecta). Não há segredo
 * versionado nem banco. Não usar em produção multi-instância sem um store real.
 */

import type {
  OAuthClientInformationFull,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { OAuthDiscoveryState } from "@modelcontextprotocol/sdk/client/auth.js";

/** Nome do cookie httpOnly que carrega apenas o id opaco da sessão. */
export const LOGCOMEX_SESSION_COOKIE = "omega_lcx_sid";

/** Tempo de vida máximo de uma sessão sem uso (ms). */
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

/** Estado completo de uma sessão OAuth (vive apenas no servidor). */
export interface LogcomexOAuthSession {
  id: string;
  /** URI de callback usado no fluxo (deve casar com o registro DCR). */
  redirectUri: string;
  /** Parâmetro `state` (CSRF) do fluxo em andamento. */
  state?: string;
  /** Verificador PKCE do fluxo em andamento (transitório). */
  codeVerifier?: string;
  /** Cliente registrado dinamicamente (DCR). */
  clientInformation?: OAuthClientInformationFull;
  /** Tokens obtidos (access/refresh). Nunca expostos ao cliente. */
  tokens?: OAuthTokens;
  /** Estado de discovery para reaproveitar entre start e callback. */
  discoveryState?: OAuthDiscoveryState;
  /** Instante de expiração absoluta do access token (ms epoch), se conhecido. */
  accessTokenExpiresAt?: number;
  /** Agente da empresa resolvido por nome após autenticar. */
  agentId?: string;
  agentName?: string;
  createdAt: number;
  updatedAt: number;
}

const sessions = new Map<string, LogcomexOAuthSession>();

function now(): number {
  return Date.now();
}

function isExpired(session: LogcomexOAuthSession): boolean {
  return now() - session.updatedAt > SESSION_TTL_MS;
}

/** Cria uma nova sessão vazia e devolve seu id opaco. */
export function createSession(redirectUri: string): LogcomexOAuthSession {
  const id =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${now()}-${Math.random().toString(36).slice(2)}`;
  const session: LogcomexOAuthSession = {
    id,
    redirectUri,
    createdAt: now(),
    updatedAt: now(),
  };
  sessions.set(id, session);
  return session;
}

/** Recupera uma sessão válida (não expirada) por id, ou `undefined`. */
export function getSession(id: string | undefined): LogcomexOAuthSession | undefined {
  if (!id) {
    return undefined;
  }
  const session = sessions.get(id);
  if (!session) {
    return undefined;
  }
  if (isExpired(session)) {
    sessions.delete(id);
    return undefined;
  }
  return session;
}

/** Marca a sessão como atualizada (chamado após mutações da borda OAuth). */
export function touchSession(session: LogcomexOAuthSession): void {
  session.updatedAt = now();
  sessions.set(session.id, session);
}

/** Remove uma sessão (logout). */
export function deleteSession(id: string | undefined): void {
  if (id) {
    sessions.delete(id);
  }
}

/** Verdadeiro quando a sessão tem tokens válidos (autenticada). */
export function isAuthenticated(
  session: LogcomexOAuthSession | undefined,
): session is LogcomexOAuthSession {
  return Boolean(session?.tokens?.access_token);
}

/**
 * Recupera a sessão a partir do header `Cookie` de uma Request. Mantém as rotas
 * agnósticas ao framework (não dependem de NextRequest).
 */
export function getSessionFromCookieHeader(
  cookieHeader: string | null,
): LogcomexOAuthSession | undefined {
  if (!cookieHeader) {
    return undefined;
  }
  const prefix = `${LOGCOMEX_SESSION_COOKIE}=`;
  const entry = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!entry) {
    return undefined;
  }
  return getSession(decodeURIComponent(entry.slice(prefix.length)));
}
