import { describe, expect, it } from "vitest";

import {
  LOGCOMEX_SESSION_COOKIE,
  createSession,
  deleteSession,
  getSession,
  getSessionFromCookieHeader,
  isAuthenticated,
} from "./session-store";

describe("session-store — ciclo de vida", () => {
  it("cria, recupera e remove a sessão por id", () => {
    const session = createSession("https://app/cb");
    expect(session.id).toBeTruthy();
    expect(getSession(session.id)?.redirectUri).toBe("https://app/cb");

    deleteSession(session.id);
    expect(getSession(session.id)).toBeUndefined();
  });

  it("expira a sessão sem uso além do TTL", () => {
    const session = createSession("https://app/cb");
    // Simula ausência de uso por 13h (> TTL de 12h).
    session.updatedAt = Date.now() - 13 * 60 * 60 * 1000;
    expect(getSession(session.id)).toBeUndefined();
  });

  it("getSession(undefined) devolve undefined", () => {
    expect(getSession(undefined)).toBeUndefined();
  });
});

describe("session-store — autenticação e cookie", () => {
  it("isAuthenticated exige access_token", () => {
    const session = createSession("https://app/cb");
    expect(isAuthenticated(session)).toBe(false);
    session.tokens = { access_token: "tok", token_type: "Bearer" };
    expect(isAuthenticated(session)).toBe(true);
    expect(isAuthenticated(undefined)).toBe(false);
  });

  it("lê a sessão a partir do header Cookie", () => {
    const session = createSession("https://app/cb");
    const header = `foo=bar; ${LOGCOMEX_SESSION_COOKIE}=${session.id}; baz=1`;
    expect(getSessionFromCookieHeader(header)?.id).toBe(session.id);
    expect(getSessionFromCookieHeader(null)).toBeUndefined();
    expect(getSessionFromCookieHeader("outro=1")).toBeUndefined();
  });
});
