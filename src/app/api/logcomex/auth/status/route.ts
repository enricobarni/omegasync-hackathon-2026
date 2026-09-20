/**
 * GET /api/logcomex/auth/status (ETAPA FINAL 3, §10).
 *
 * Informa ao frontend APENAS o estado de conexão e o nome do agente — nunca o
 * token. Contrato mínimo: `{ authenticated, agentName }`.
 */

import { NextResponse, type NextRequest } from "next/server";

import {
  LOGCOMEX_SESSION_COOKIE,
  getSession,
  isAuthenticated,
} from "@/lib/logcomex/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const sessionId = request.cookies.get(LOGCOMEX_SESSION_COOKIE)?.value;
  const session = getSession(sessionId);
  const authenticated = isAuthenticated(session);

  return NextResponse.json({
    authenticated,
    agentName: authenticated ? (session.agentName ?? null) : null,
  });
}
