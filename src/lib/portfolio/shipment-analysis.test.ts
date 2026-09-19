import { describe, expect, it } from "vitest";

import { adaptShipmentAnalysis } from "./shipment-analysis";

describe("adaptShipmentAnalysis", () => {
  it("preserva a resposta como bruta, sem processar KPIs não confirmados", () => {
    const dto = { kpis: [{ teus: 100 }], insights: "texto" };
    const ctx = adaptShipmentAnalysis(dto, "2026-09-19");

    expect(ctx.structuredConfirmed).toBe(false);
    expect(ctx.raw).toBe(dto);
    expect(ctx.caveat).toContain("não confirmada");
    expect(ctx.scope).toBe("MARKET_AGGREGATE");
    expect(ctx.source.title).toContain("Análise de Embarques");
  });
});
