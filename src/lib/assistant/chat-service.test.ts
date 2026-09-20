import { describe, expect, it } from "vitest";

import { LogcomexMcpError } from "../logcomex/mcp";
import type { LogcomexChatReply } from "../logcomex/mcp";
import { handleChat, type AssistantAskResult, type AssistantPort } from "./chat-service";
import { ADMINISTRATIVE_NOTE, EXTERNAL_DISCLAIMER } from "./guardrails";

function portReturning(result: AssistantAskResult): AssistantPort {
  return { ask: async () => result };
}

function portThrowing(error: unknown): AssistantPort {
  return {
    ask: async () => {
      throw error;
    },
  };
}

const publicReply = (reply: LogcomexChatReply): AssistantAskResult => ({
  source: "LOGCOMEX_PUBLIC_AGENT",
  reply,
});

describe("handleChat — caminho feliz", () => {
  it("retorna a resposta do agente com origem e disclaimer", async () => {
    const response = await handleChat(
      { message: "O que é DTA?" },
      portReturning(
        publicReply({ status: "COMPLETED", reply: "DTA é trânsito aduaneiro." }),
      ),
    );

    expect(response.status).toBe("OK");
    expect(response.source).toBe("LOGCOMEX_PUBLIC_AGENT");
    expect(response.answer).toBe("DTA é trânsito aduaneiro.");
    expect(response.degraded).toBe(false);
    expect(response.disclaimer).toBe(EXTERNAL_DISCLAIMER);
  });

  it("adiciona ressalva administrativa para perguntas de anuência", async () => {
    const response = await handleChat(
      { message: "Meu produto passa por algum órgão anuente?" },
      portReturning(
        publicReply({ status: "COMPLETED", reply: "Depende da NCM..." }),
      ),
    );

    expect(response.warnings).toContain(ADMINISTRATIVE_NOTE);
    expect(response.status).toBe("OK");
  });
});

describe("handleChat — continuidade de conversa (conversationId)", () => {
  it("propaga o conversationId da resposta OK", async () => {
    const response = await handleChat(
      { message: "primeira" },
      portReturning(
        publicReply({
          status: "COMPLETED",
          reply: "resposta",
          conversationId: "conv-42",
        }),
      ),
    );
    expect(response.conversationId).toBe("conv-42");
  });

  it("preserva o conversationId mesmo quando não há resultado", async () => {
    const response = await handleChat(
      { message: "segunda", conversationId: "conv-42" },
      portReturning(
        publicReply({
          status: "COMPLETED",
          reply: null,
          conversationId: "conv-42",
        }),
      ),
    );
    expect(response.status).toBe("NO_RESULTS");
    expect(response.conversationId).toBe("conv-42");
  });

  it("resposta degradada não inventa conversationId", async () => {
    const response = await handleChat(
      { message: "terceira", conversationId: "conv-42" },
      portThrowing(new LogcomexMcpError("UNAVAILABLE", "off")),
    );
    expect(response.degraded).toBe(true);
    expect(response.conversationId).toBeUndefined();
  });
});

describe("handleChat — sem resultado", () => {
  it("distingue NO_RESULTS de indisponibilidade", async () => {
    const response = await handleChat(
      { message: "pergunta" },
      portReturning(publicReply({ status: "COMPLETED", reply: null })),
    );

    expect(response.status).toBe("NO_RESULTS");
    expect(response.degraded).toBe(false);
  });

  it("mapeia status ERROR do provedor para estado degradado", async () => {
    const response = await handleChat(
      { message: "pergunta" },
      portReturning(
        publicReply({ status: "ERROR", reply: null, errorMessage: "falhou" }),
      ),
    );

    expect(response.status).toBe("PROVIDER_ERROR");
    expect(response.degraded).toBe(true);
    expect(response.source).toBe("FALLBACK");
  });
});

describe("handleChat — falhas de integração não quebram o fluxo", () => {
  it.each([
    ["TIMEOUT", "TIMEOUT"],
    ["UNAUTHORIZED", "UNAUTHORIZED"],
    ["UNAVAILABLE", "UNAVAILABLE"],
    ["PROVIDER_ERROR", "PROVIDER_ERROR"],
  ] as const)("mapeia %s para resposta degradada", async (kind, expected) => {
    const response = await handleChat(
      { message: "pergunta" },
      portThrowing(new LogcomexMcpError(kind, "erro")),
    );

    expect(response.status).toBe(expected);
    expect(response.degraded).toBe(true);
    expect(response.source).toBe("FALLBACK");
    expect(response.answer).not.toBe("");
  });

  it("erro desconhecido vira PROVIDER_ERROR", async () => {
    const response = await handleChat(
      { message: "pergunta" },
      portThrowing(new Error("boom")),
    );
    expect(response.status).toBe("PROVIDER_ERROR");
    expect(response.degraded).toBe(true);
  });
});
