import { describe, expect, it } from "vitest";

import { createEvidence } from "./provenance";
import type { SourceReference } from "./provenance";

const TABELA_PUBLICA: SourceReference = {
  id: "dpworld-santos-armazenagem-2026-08-31",
  title: "Tabela pública DP World Santos",
  publisher: "DP World Santos",
  accessedAt: "2026-08-31",
  effectiveFrom: "2026-08-31",
  confidence: "B",
  kind: "OFFICIAL_TARIFF",
};

describe("createEvidence", () => {
  it("preserva a origem informada", () => {
    const evidence = createEvidence("USUARIO");

    expect(evidence.origin).toBe("USUARIO");
    expect(evidence.reference).toBeUndefined();
    expect(evidence.confidence).toBeUndefined();
    expect(evidence.source).toBeUndefined();
  });

  it("preserva referência, confiança e fonte estruturada", () => {
    const evidence = createEvidence("TABELA_PUBLICA", {
      reference: "1º período de 4 dias — 0,60% do CIF",
      confidence: "B",
      source: TABELA_PUBLICA,
    });

    expect(evidence.origin).toBe("TABELA_PUBLICA");
    expect(evidence.confidence).toBe("B");
    expect(evidence.source).toBe(TABELA_PUBLICA);
    expect(evidence.source?.kind).toBe("OFFICIAL_TARIFF");
    expect(evidence.source?.effectiveFrom).toBe("2026-08-31");
  });
});
