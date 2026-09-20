import { describe, expect, it } from "vitest";

import {
  LogcomexAgentService,
  type LogcomexMcpClient,
  type LogcomexMcpConfig,
  type McpCallResult,
} from "../logcomex/mcp";
import { resolveCompanyAgent } from "./mcp-assistant";

const baseConfig: LogcomexMcpConfig = {
  url: "https://mcp.test/",
  requestTimeoutMs: 1_000,
  pollIntervalMs: 1,
  pollTimeoutMs: 100,
  preferredAgentName: "Agente PortoHackSantos26-GP07",
  oauthScope: "mcp:chat:free mcp:chat:agents offline_access",
};

function serviceWithAgents(
  agents: Array<{ id: string; name: string }>,
  config: LogcomexMcpConfig = baseConfig,
): LogcomexAgentService {
  const client = {
    callTool: async (): Promise<McpCallResult> => ({
      content: [],
      structuredContent: { agents },
      isError: false,
    }),
  } as unknown as LogcomexMcpClient;
  return new LogcomexAgentService(client, config);
}

describe("resolveCompanyAgent — seleção explícita (§13)", () => {
  it("seleciona o agente-alvo por NOME, nunca o primeiro da lista", async () => {
    const service = serviceWithAgents([
      { id: "outro", name: "Agente Genérico" },
      { id: "alvo", name: "Agente PortoHackSantos26-GP07" },
    ]);
    const agent = await resolveCompanyAgent(service, baseConfig);
    expect(agent).toEqual({
      id: "alvo",
      name: "Agente PortoHackSantos26-GP07",
    });
  });

  it("prioriza o id configurado quando presente", async () => {
    const config = { ...baseConfig, preferredAgentId: "outro" };
    const service = serviceWithAgents(
      [
        { id: "outro", name: "Agente Genérico" },
        { id: "alvo", name: "Agente PortoHackSantos26-GP07" },
      ],
      config,
    );
    const agent = await resolveCompanyAgent(service, config);
    expect(agent?.id).toBe("outro");
  });

  it("aceita correspondência parcial do nome-alvo", async () => {
    const service = serviceWithAgents([
      { id: "p", name: "Agente PortoHackSantos26-GP07 (produção)" },
    ]);
    const agent = await resolveCompanyAgent(service, baseConfig);
    expect(agent?.id).toBe("p");
  });

  it("retorna null quando o agente-alvo não existe (fallback público)", async () => {
    const service = serviceWithAgents([
      { id: "a", name: "Outro Agente Qualquer" },
    ]);
    const agent = await resolveCompanyAgent(service, baseConfig);
    expect(agent).toBeNull();
  });
});
