import { describe, expect, it } from "vitest";

import { LogcomexAgentService } from "./agent-service";
import { LogcomexMcpClient, LogcomexMcpError, type McpCallResult } from "./client";
import type { LogcomexMcpConfig } from "./config";

const config: LogcomexMcpConfig = {
  url: "https://mcp.test/",
  requestTimeoutMs: 1_000,
  pollIntervalMs: 1,
  pollTimeoutMs: 100,
};

/** Cliente falso: responde por nome de tool a partir de uma fila/handler. */
function fakeClient(
  handler: (name: string, args: Record<string, unknown>) => McpCallResult,
): LogcomexMcpClient {
  return {
    callTool: async (name: string, args: Record<string, unknown>) =>
      handler(name, args),
  } as unknown as LogcomexMcpClient;
}

function structured(value: unknown, isError = false): McpCallResult {
  return { content: [], structuredContent: value, isError };
}

describe("LogcomexAgentService — parsing de resposta", () => {
  it("resolve resposta síncrona concluída do agente público", async () => {
    const service = new LogcomexAgentService(
      fakeClient(() =>
        structured({
          status: "completed",
          reply: "OEA é a certificação de Operador Econômico Autorizado.",
          conversation_id: "conv-1",
        }),
      ),
      config,
    );

    const reply = await service.askPublicAgent("O que é OEA?");
    expect(reply.status).toBe("COMPLETED");
    expect(reply.reply).toContain("Operador Econômico");
    expect(reply.conversationId).toBe("conv-1");
  });

  it("usa o texto de content quando não há structuredContent", async () => {
    const service = new LogcomexAgentService(
      fakeClient(() => ({
        content: [{ type: "text", text: "Resposta em texto puro." }],
        isError: false,
      })),
      config,
    );

    const reply = await service.askPublicAgent("pergunta");
    expect(reply.status).toBe("COMPLETED");
    expect(reply.reply).toBe("Resposta em texto puro.");
  });
});

describe("LogcomexAgentService — execução assíncrona (task_id)", () => {
  it("faz polling de get_task_status até concluir", async () => {
    let polls = 0;
    const service = new LogcomexAgentService(
      fakeClient((name) => {
        if (name === "chat_with_agent") {
          return structured({ status: "pending", task_id: "task-9" });
        }
        // get_task_status: pending nas duas primeiras, depois completed.
        polls += 1;
        if (polls < 2) {
          return structured({ status: "pending" });
        }
        return structured({
          status: "completed",
          reply: "Resultado final da tarefa.",
        });
      }),
      config,
    );

    const reply = await service.askCompanyAgent("agent-1", "consulta pesada");
    expect(reply.status).toBe("COMPLETED");
    expect(reply.reply).toBe("Resultado final da tarefa.");
    expect(polls).toBeGreaterThanOrEqual(2);
  });

  it("estoura TIMEOUT quando a tarefa nunca conclui", async () => {
    const service = new LogcomexAgentService(
      fakeClient((name) =>
        name === "chat_with_agent"
          ? structured({ status: "pending", task_id: "task-x" })
          : structured({ status: "pending" }),
      ),
      config,
    );

    await expect(service.askCompanyAgent("agent-1", "consulta")).rejects.toThrow(
      LogcomexMcpError,
    );
  });
});

describe("LogcomexAgentService — list_agents", () => {
  it("normaliza agentes de structuredContent", async () => {
    const service = new LogcomexAgentService(
      fakeClient(() =>
        structured({
          agents: [
            {
              id: "a1",
              name: "Agente Empresa",
              company_name: "OMEGASYNC",
              skills: [{ id: "s1", name: "Supply Chain" }],
            },
            { id: null, name: "inválido" },
          ],
        }),
      ),
      config,
    );

    const agents = await service.listAgents();
    expect(agents).toHaveLength(1);
    expect(agents[0]).toMatchObject({
      id: "a1",
      name: "Agente Empresa",
      companyName: "OMEGASYNC",
    });
    expect(agents[0].skills[0].name).toBe("Supply Chain");
  });
});
