import { describe, expect, it } from "vitest";

import {
  TARIFF_BTP_SANTOS_STORAGE,
  TARIFF_DATASET,
  TARIFF_DPWORLD_SANTOS_STORAGE,
  TARIFF_ECOPORTO_SANTOS_STORAGE,
  TARIFF_RECORDS,
  TARIFF_SANTOS_BRASIL_DIRECT_DISCHARGE,
  findTariff,
  listConsolidatedTariffs,
} from "./dataset";

describe("dataset tarifário", () => {
  it("é versionado e datado", () => {
    expect(TARIFF_DATASET.version).toBe("2026-08-31");
    expect(TARIFF_DATASET.revisedAt).toBeTruthy();
    expect(TARIFF_DATASET.records.length).toBeGreaterThan(0);
  });

  it("todo registro guarda proveniência além da alíquota", () => {
    for (const record of TARIFF_RECORDS) {
      expect(record.terminal).toBeTruthy();
      expect(record.capturedAt).toBeTruthy();
      expect(record.confidence).toBeTruthy();
      expect(record.source.id).toBeTruthy();
      expect(record.source.kind).toBe("OFFICIAL_TARIFF");
      expect(Array.isArray(record.caveats)).toBe(true);
      expect(record.rates.base).toBe("CIF");
    }
  });

  it("DP World tem alíquotas consolidadas e confiança A", () => {
    const r = TARIFF_DPWORLD_SANTOS_STORAGE;
    expect(r.confidence).toBe("A");
    expect(r.consolidated).toBe(true);
    expect(r.rates.daysPerPeriod).toBe(4);
    expect(r.rates.firstPeriodRate).toBe(0.006);
    expect(r.rates.subsequentRate).toBe(0.02);
  });

  it("Ecoporto registra vigência e a ressalva do SSE suspenso", () => {
    const r = TARIFF_ECOPORTO_SANTOS_STORAGE;
    expect(r.effectiveFrom).toBe("2026-01-10");
    expect(r.rates.daysPerPeriod).toBe(8);
    expect(r.caveats.join(" ")).toContain("SSE");
  });

  it("Descarga Direta Santos Brasil preserva a ressalva de Imbituba e não é confiança A", () => {
    const r = TARIFF_SANTOS_BRASIL_DIRECT_DISCHARGE;
    expect(r.confidence).not.toBe("A");
    expect(r.confidence).toBe("C");
    expect(r.rates.rate).toBe(0.0054);
    expect(r.rates.minimumValue).toBe(1063.08);
    expect(r.caveats.join(" ")).toContain("Imbituba");
  });

  it("BTP não é consolidado e mantém alíquotas null (unknown != 0)", () => {
    const r = TARIFF_BTP_SANTOS_STORAGE;
    expect(r.consolidated).toBe(false);
    expect(r.rates.firstPeriodRate).toBeNull();
    expect(r.rates.firstPeriodRate).not.toBe(0);
    expect(r.caveats.join(" ")).toContain("0,65–0,90%");
  });

  it("consultas: findTariff e apenas consolidados", () => {
    expect(findTariff("dpworld-santos-storage")?.terminal).toBe("DP World Santos");
    expect(findTariff("inexistente")).toBeNull();

    const consolidados = listConsolidatedTariffs();
    expect(consolidados.map((r) => r.id)).not.toContain("btp-santos-storage");
    expect(consolidados.map((r) => r.id)).toContain("dpworld-santos-storage");
  });

  it("todo registro caveado mantém pelo menos uma ressalva", () => {
    expect(TARIFF_SANTOS_BRASIL_DIRECT_DISCHARGE.caveats.length).toBeGreaterThan(0);
    expect(TARIFF_BTP_SANTOS_STORAGE.caveats.length).toBeGreaterThan(0);
  });
});
