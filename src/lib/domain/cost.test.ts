import { describe, expect, it } from "vitest";

import { createCostComponent, summarizeCosts } from "./cost";
import {
  knownAmount,
  notApplicableAmount,
  unknownAmount,
} from "./money";
import { createEvidence } from "./provenance";

const EVIDENCIA = createEvidence("TABELA_PUBLICA", { confidence: "B" });

describe("summarizeCosts", () => {
  it("soma componentes conhecidos e trata zero conhecido como conhecido", () => {
    const resumo = summarizeCosts([
      createCostComponent("DESCARGA", "Descarga direta", knownAmount(1063.08, EVIDENCIA)),
      createCostComponent("SSE", "SSE", knownAmount(0, EVIDENCIA)),
      createCostComponent("TRANSPORTE", "Transporte", knownAmount(500, EVIDENCIA)),
    ]);

    expect(resumo.knownSubtotal).toBe(1563.08);
    expect(resumo.total).toBe(1563.08);
    expect(resumo.complete).toBe(true);
    expect(resumo.hasUnknown).toBe(false);
  });

  it("torna o total indeterminado quando há componente desconhecido (null != 0)", () => {
    const resumo = summarizeCosts([
      createCostComponent("ARMAZENAGEM", "Armazenagem", knownAmount(1200, EVIDENCIA)),
      createCostComponent("DTA", "DTA", unknownAmount("custo real de DTA não coletado")),
    ]);

    expect(resumo.hasUnknown).toBe(true);
    expect(resumo.complete).toBe(false);
    expect(resumo.total).toBeNull();
    // o que é conhecido continua somado, sem virar o total
    expect(resumo.knownSubtotal).toBe(1200);
  });

  it("não bloqueia o total quando um componente é não aplicável", () => {
    const resumo = summarizeCosts([
      createCostComponent("TRANSPORTE", "Transporte", knownAmount(800, EVIDENCIA)),
      createCostComponent("SSE", "SSE", notApplicableAmount("não incide nesta rota")),
    ]);

    expect(resumo.hasUnknown).toBe(false);
    expect(resumo.complete).toBe(true);
    expect(resumo.knownSubtotal).toBe(800);
    expect(resumo.total).toBe(800);
  });

  it("preserva a evidência dos componentes conhecidos", () => {
    const componente = createCostComponent(
      "DESCARGA",
      "Descarga direta",
      knownAmount(1063.08, EVIDENCIA),
    );

    expect(componente.amount.status).toBe("KNOWN");
    if (componente.amount.status === "KNOWN") {
      expect(componente.amount.evidence.origin).toBe("TABELA_PUBLICA");
      expect(componente.amount.evidence.confidence).toBe("B");
    }
  });
});
