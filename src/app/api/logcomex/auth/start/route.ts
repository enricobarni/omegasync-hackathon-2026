/**
 * GET /api/logcomex/auth/start (ETAPA FINAL 3, §11).
 *
 * Inicia o fluxo OAuth 2.0 (Authorization Code + PKCE) do AGENTE DA EMPRESA:
 * cria uma sessão server-side, executa discovery real + DCR via SDK e redireciona
 * o navegador para a URL de autorização da Logcomex. O id da sessão vai em cookie
 * httpOnly; nenhum token trafega para o browser.
 */

import { NextResponse, type NextRequest } from "next/server";

import { loadLogcomexMcpConfig } from "@/lib/logcomex/mcp";
import {
  LOGCOMEX_SESSION_COOKIE,
  createSession,
  deleteSession,
  startLogcomexAuthorization,
} from "@/lib/logcomex/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveBaseUrl(request: NextRequest): string {
  const override = process.env.OMEGASYNC_BASE_URL?.trim();
  return override && override !== "" ? override : new URL(request.url).origin;
}

export async function GET(request: NextRequest): Promise<Response> {
  const config = loadLogcomexMcpConfig();
  const baseUrl = resolveBaseUrl(request);
  const redirectUri =
    process.env.LOGCOMEX_OAUTH_REDIRECT_URI?.trim() ||
    `${baseUrl}/api/logcomex/auth/callback`;

  const session = createSession(redirectUri);

  try {
    const { authorizationUrl } = await startLogcomexAuthorization(
      session,
      config.url,
      config.oauthScope,
    );

    const response = NextResponse.redirect(authorizationUrl.toString());
    response.cookies.set(LOGCOMEX_SESSION_COOKIE, session.id, {
      httpOnly: true,
      secure: baseUrl.startsWith("https"),
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60,
    });
    return response;
  } catch {
    // Discovery/registro indisponível: não expõe detalhe técnico ao usuário;
    // volta ao app sinalizando falha para manter o chat público utilizável.
    deleteSession(session.id);
    const back = new URL("/", baseUrl);
    back.searchParams.set("logcomex", "error");
    return NextResponse.redirect(back.toString());
  }
}
