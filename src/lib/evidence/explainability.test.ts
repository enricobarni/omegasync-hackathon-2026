import { describe, expect, it } from "vitest";

import { createEvidence } from "../domain";
import { toEvidenceView, toEvidenceViews } from "./explainability";

describe("toEvidenceView", () => {
  it("rotula origem e não marca premissa para usuário", () => {
    const view = toEvidenceView(createEvidence("USUARIO"));
    expect(view.originLabel).toBe("Usuário");
    expect(view.isPremise).toBe(false);
    expect(view.confidence).toBeUndefined();
  });

  it("marca premissa de simulação", () => {
    const view = toEvidenceView(createEvidence("PREMISSA_SIMULACAO"));
    expect(view.isPremise).toBe(true);
    expect(view.originLabel).toBe("Premissa de simulação");
  });

  it("rotula confiança e expõe fonte com vigência", () => {
    const view = toEvidenceView(
      createEvidence("TABELA_PUBLICA", {
        reference: "1º período — 0,60%",
        confidence: "B",
        source: {
          id: "s",
          title: "Tabela DP World",
          publisher: "DP World Santos",
          accessedAt: "2026-08-31",
          effectiveFrom: "2026-08-31",
          kind: "OFFICIAL_TARIFF",
        },
      }),
    );
    expect(view.confidenceLabel).toContain("Média");
    expect(view.reference).toContain("0,60%");
    expect(view.source?.publisher).toBe("DP World Santos");
    expect(view.source?.effectiveFrom).toBe("2026-08-31");
  });

  it("mapeia listas", () => {
    const views = toEvidenceViews([
      createEvidence("LOGCOMEX"),
      createEvidence("PESQUISA_CAMPO", { confidence: "N1" }),
    ]);
    expect(views).toHaveLength(2);
    expect(views[1].confidenceLabel).toContain("N=1");
  });
});
