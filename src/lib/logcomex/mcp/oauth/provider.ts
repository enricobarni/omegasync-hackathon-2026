/**
 * Provedor OAuth do MCP Logcomex (ETAPA FINAL 3, §7/§8/§9).
 *
 * Implementa `OAuthClientProvider` do SDK oficial, delegando toda a descoberta
 * real (RFC 9728 metadata), o Dynamic Client Registration (RFC 7591), o PKCE
 * (S256) e a troca/renovação de tokens ao próprio SDK. NÃO hardcoda endpoints,
 * client_id, client_secret nem token/authorization URL — tudo vem da metadata
 * real do servidor (PLANEJAMENTO-FINALIZACAO §8).
 *
 * O estado do fluxo (client info, code verifier, state, discovery, tokens) é
 * persistido na `LogcomexOAuthSession` server-side. O provedor apenas muta a
 * sessão (o store guarda a mesma referência) e chama `touchSession`.
 */

import type {
  OAuthClientInformation,
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type {
  OAuthClientProvider,
  OAuthDiscoveryState,
} from "@modelcontextprotocol/sdk/client/auth.js";

import { touchSession, type LogcomexOAuthSession } from "./session-store";

/** Metadados do cliente OmegaSync para o registro dinâmico (DCR). */
function buildClientMetadata(
  redirectUri: string,
  scope: string,
): OAuthClientMetadata {
  return {
    client_name: "OmegaSync",
    redirect_uris: [redirectUri],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    // Cliente público com PKCE: sem client_secret.
    token_endpoint_auth_method: "none",
    scope,
  };
}

export class LogcomexOAuthProvider implements OAuthClientProvider {
  /** URL de autorização capturada durante o fluxo de início (para redirecionar). */
  authorizationUrl?: URL;

  constructor(
    private readonly session: LogcomexOAuthSession,
    private readonly scope: string,
  ) {}

  get redirectUrl(): string {
    return this.session.redirectUri;
  }

  get clientMetadata(): OAuthClientMetadata {
    return buildClientMetadata(this.session.redirectUri, this.scope);
  }

  /** Gera e persiste o `state` (CSRF), validado no callback. */
  state(): string {
    const value =
      typeof globalThis.crypto?.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    this.session.state = value;
    touchSession(this.session);
    return value;
  }

  clientInformation(): OAuthClientInformation | undefined {
    return this.session.clientInformation;
  }

  saveClientInformation(info: OAuthClientInformationFull): void {
    this.session.clientInformation = info;
    touchSession(this.session);
  }

  tokens(): OAuthTokens | undefined {
    return this.session.tokens;
  }

  saveTokens(tokens: OAuthTokens): void {
    this.session.tokens = tokens;
    this.session.accessTokenExpiresAt =
      typeof tokens.expires_in === "number"
        ? Date.now() + tokens.expires_in * 1000
        : undefined;
    touchSession(this.session);
  }

  redirectToAuthorization(authorizationUrl: URL): void {
    // Server-side: não navegamos aqui — apenas capturamos a URL para o handler
    // responder com um 302. O browser é redirecionado pela rota /auth/start.
    this.authorizationUrl = authorizationUrl;
  }

  saveCodeVerifier(codeVerifier: string): void {
    this.session.codeVerifier = codeVerifier;
    touchSession(this.session);
  }

  codeVerifier(): string {
    if (!this.session.codeVerifier) {
      throw new Error("Code verifier PKCE ausente na sessão.");
    }
    return this.session.codeVerifier;
  }

  saveDiscoveryState(state: OAuthDiscoveryState): void {
    this.session.discoveryState = state;
    touchSession(this.session);
  }

  discoveryState(): OAuthDiscoveryState | undefined {
    return this.session.discoveryState;
  }

  invalidateCredentials(scope: "all" | "client" | "tokens" | "verifier" | "discovery"): void {
    if (scope === "all" || scope === "tokens") {
      this.session.tokens = undefined;
      this.session.accessTokenExpiresAt = undefined;
    }
    if (scope === "all" || scope === "client") {
      this.session.clientInformation = undefined;
    }
    if (scope === "all" || scope === "verifier") {
      this.session.codeVerifier = undefined;
    }
    if (scope === "all" || scope === "discovery") {
      this.session.discoveryState = undefined;
    }
    touchSession(this.session);
  }
}
