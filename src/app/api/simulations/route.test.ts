import { describe, expect, it } from "vitest";

import { POST } from "./route";

function postRequest(body: string): Request {
  return new Request("http://localhost/api/simulations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("POST /api/simulations", () => {
  it("retorna 400 para JSON inválido", async () => {
    const res = await POST(postRequest("{ isso não é json"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.errors.length).toBeGreaterThan(0);
  });

  it("retorna 400 para requisição sem cargo válido", async () => {
    const res = await POST(postRequest(JSON.stringify({ cargo: { ncm: "1" } })));
    expect(res.status).toBe(400);
  });

  it("retorna 200 e o diagnóstico para requisição válida", async () => {
    const res = await POST(
      postRequest(
        JSON.stringify({
          cargo: {
            ncm: "84713012",
            cargoType: "FCL",
            oeaStatus: "NAO_OEA",
            channel: "VERDE",
          },
        }),
      ),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.clearance.status).toBeDefined();
    expect(Array.isArray(json.routes)).toBe(true);
    expect(json.comparison).toBeDefined();
  });

  it("fluxo essencial: baseline indeterminado com evidências e dados faltantes", async () => {
    const res = await POST(
      postRequest(
        JSON.stringify({
          cargo: { ncm: "84713012", cargoType: "FCL", oeaStatus: "NAO_OEA", channel: "VERDE" },
        }),
      ),
    );
    const json = await res.json();
    // registro de anuência vazio => liberação indeterminada; rota-modelo indeterminada
    expect(json.clearance.status).toBe("INDETERMINADA");
    expect(json.routes[0].eligibility.status).toBe("INDETERMINADA");
    // custo não informado nunca vira zero
    expect(json.routes[0].cost.total).toBeNull();
    // evidências e dados faltantes presentes (auditabilidade / estado parcial)
    expect(Array.isArray(json.evidences)).toBe(true);
    expect(json.missingData.length).toBeGreaterThan(0);
    // dimensão de custo não engana quando não há rota viável
    expect(json.comparison.costTotal.status).toBe("UNAVAILABLE");
  });

  it("rejeita tipo inválido em operation (AJUSTE 10.3)", async () => {
    const res = await POST(
      postRequest(
        JSON.stringify({
          cargo: { ncm: "84713012", cargoType: "FCL", oeaStatus: "NAO_OEA", channel: "VERDE" },
          operation: { cargoYardWithdrawal: "sim" },
        }),
      ),
    );
    expect(res.status).toBe(400);
  });
});
