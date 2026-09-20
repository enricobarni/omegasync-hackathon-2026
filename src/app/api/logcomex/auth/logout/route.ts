/**
 * POST /api/logcomex/auth/logout (ETAPA FINAL 3, §11/§15).
 *
 * Encerra a sessão OAuth server-side (descarta tokens) e limpa o cookie. O chat
 * volta ao agente público como fallback.
 */

import { NextResponse, type NextRequest } from "next/server";

import {
  LOGCOMEX_SESSION_COOKIE,
  deleteSession,
} from "@/lib/logcomex/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const sessionId = request.cookies.get(LOGCOMEX_SESSION_COOKIE)?.value;
  deleteSession(sessionId);

  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(LOGCOMEX_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
