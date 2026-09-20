/**
 * Route Handler do assistente (PLANEJAMENTO-MCP.md §15): POST /api/assistant/chat.
 *
 * Fino por definição: valida JSON, valida/limita a mensagem, normaliza o
 * contexto, chama o `ChatService` e devolve o DTO interno. NÃO contém regra de
 * negócio, decisão de rota, parsing aduaneiro nem heurística de NCM. O token
 * Logcomex vive apenas no servidor e nunca é devolvido ao cliente.
 */

import type { SimulationResponseDTO } from "@/lib/api";
import { createMcpAssistantPort, handleChat } from "@/lib/assistant";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/logcomex/mcp";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { errors: ["Corpo da requisição não é JSON válido."] },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return Response.json(
      { errors: ["Corpo inválido: objeto esperado."] },
      { status: 400 },
    );
  }

  const message = body.message;
  if (typeof message !== "string" || message.trim() === "") {
    return Response.json(
      { errors: ["'message' é obrigatório e deve ser texto não vazio."] },
      { status: 400 },
    );
  }
  if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
    return Response.json(
      {
        errors: [
          `'message' excede o limite de ${MAX_CHAT_MESSAGE_LENGTH} caracteres.`,
        ],
      },
      { status: 400 },
    );
  }

  // O contexto é lido de forma defensiva pelo context-builder; aceitamos o
  // objeto do cliente como possivelmente parcial (validação de forma na borda).
  const simulation = isRecord(body.simulation)
    ? (body.simulation as unknown as SimulationResponseDTO)
    : null;
  const conversationId =
    typeof body.conversationId === "string" ? body.conversationId : undefined;

  const response = await handleChat(
    { message: message.trim(), simulation, conversationId },
    createMcpAssistantPort(),
  );

  return Response.json(response, { status: 200 });
}
