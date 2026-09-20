/**
 * GET /api/logcomex/auth/callback (ETAPA FINAL 3, §11).
 *
 * Recebe o retorno do provedor OAuth. Valida o `state` (CSRF) contra a sessão,
 * troca o `code` por tokens (PKCE) via SDK e resolve o agente da empresa por
 * nome para exibição. Tokens ficam apenas na sessão server-side. Ao final,
 * redireciona de volta ao app sinalizando `connected` ou `error`.
 */

import { NextResponse, type NextRequest } from "next/server";

import { resolveCompanyAgentForSession } from "@/lib/assistant";
import { loadLogcomexMcpConfig } from "@/lib/logcomex/mcp";
import {
  LOGCOMEX_SESSION_COOKIE,
  completeLogcomexAuthorization,
  getSession,
  touchSession,
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
  const url = new URL(request.url);
  const back = new URL("/", baseUrl);

  const fail = (): Response => {
    back.searchParams.set("logcomex", "error");
    return NextResponse.redirect(back.toString());
  };

  const providerError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (providerError) {
    return fail();
  }

  const sessionId = request.cookies.get(LOGCOMEX_SESSION_COOKIE)?.value;
  const session = getSession(sessionId);
  if (!session || !code || !state || state !== session.state) {
    // state ausente/divergente → possível CSRF: aborta sem trocar o code.
    return fail();
  }

  try {
    const authorized = await completeLogcomexAuthorization(
      session,
      code,
      config.url,
      config.oauthScope,
    );
    if (!authorized) {
      return fail();
    }

    // Uso único: descarta o material transitório do fluxo após a troca.
    session.state = undefined;
    session.codeVerifier = undefined;
    touchSession(session);

    // Best-effort: resolve o agente esperado por nome para exibir no status.
    // Falha aqui não invalida a autenticação (o chat resolve por chamada).
    try {
      const agent = await resolveCompanyAgentForSession(session, config);
      if (agent) {
        session.agentId = agent.id;
        session.agentName = agent.name;
        touchSession(session);
      }
    } catch {
      // Resolução de exibição indisponível: segue autenticado.
    }

    back.searchParams.set("logcomex", "connected");
    return NextResponse.redirect(back.toString());
  } catch {
    return fail();
  }
}
