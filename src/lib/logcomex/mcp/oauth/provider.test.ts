import { describe, expect, it } from "vitest";

import { LogcomexOAuthProvider } from "./provider";
import { createSession } from "./session-store";

const SCOPE = "mcp:chat:free mcp:chat:agents offline_access";

describe("LogcomexOAuthProvider", () => {
  it("expõe metadados de cliente público com PKCE e redirect da sessão", () => {
    const session = createSession("https://app/api/logcomex/auth/callback");
    const provider = new LogcomexOAuthProvider(session, SCOPE);

    expect(provider.redirectUrl).toBe(session.redirectUri);
    const meta = provider.clientMetadata;
    expect(meta.redirect_uris).toEqual([session.redirectUri]);
    expect(meta.token_endpoint_auth_method).toBe("none");
    expect(meta.grant_types).toContain("authorization_code");
    expect(meta.grant_types).toContain("refresh_token");
    expect(meta.scope).toBe(SCOPE);
  });

  it("gera e persiste o state (CSRF) na sessão", () => {
    const session = createSession("https://app/cb");
    const provider = new LogcomexOAuthProvider(session, SCOPE);
    const state = provider.state();
    expect(state).toBeTruthy();
    expect(session.state).toBe(state);
  });

  it("persiste code verifier e falha ao lê-lo quando ausente", () => {
    const session = createSession("https://app/cb");
    const provider = new LogcomexOAuthProvider(session, SCOPE);
    expect(() => provider.codeVerifier()).toThrow();
    provider.saveCodeVerifier("verifier-123");
    expect(provider.codeVerifier()).toBe("verifier-123");
    expect(session.codeVerifier).toBe("verifier-123");
  });

  it("salva tokens e calcula a expiração absoluta", () => {
    const session = createSession("https://app/cb");
    const provider = new LogcomexOAuthProvider(session, SCOPE);
    const before = Date.now();
    provider.saveTokens({
      access_token: "acc",
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: "ref",
    });
    expect(session.tokens?.access_token).toBe("acc");
    expect(session.accessTokenExpiresAt).toBeGreaterThanOrEqual(before + 3600_000);
    expect(provider.tokens()?.refresh_token).toBe("ref");
  });

  it("invalida credenciais por escopo", () => {
    const session = createSession("https://app/cb");
    const provider = new LogcomexOAuthProvider(session, SCOPE);
    provider.saveTokens({ access_token: "acc", token_type: "Bearer" });
    provider.saveCodeVerifier("v");
    provider.saveClientInformation({
      client_id: "c1",
      redirect_uris: [session.redirectUri],
    });

    provider.invalidateCredentials("tokens");
    expect(session.tokens).toBeUndefined();
    expect(session.clientInformation).toBeDefined();

    provider.invalidateCredentials("all");
    expect(session.clientInformation).toBeUndefined();
    expect(session.codeVerifier).toBeUndefined();
  });
});
