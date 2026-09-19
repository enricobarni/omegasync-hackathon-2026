import { describe, expect, it } from "vitest";

import { createEvidence } from "../domain";
import {
  TARIFF_BTP_SANTOS_STORAGE,
  TARIFF_DPWORLD_SANTOS_STORAGE,
} from "../tariffs";
import {
  buildCapitalComponent,
  buildDirectDischargeComponent,
  buildSseComponent,
  buildStorageComponent,
  buildTransportComponent,
  calculateCapitalCost,
  calculateDirectDischarge,
  calculateStorageAdValorem,
  calculateTransportCost,
  computeRouteCost,
} from "./route-cost";

const EVID = createEvidence("TABELA_PUBLICA", { confidence: "A" });

const DP_WORLD_RATES = {
  daysPerPeriod: 4,
  firstPeriodRate: 0.006,
  secondPeriodRate: 0.013,
  subsequentRate: 0.02,
};

describe("calculadoras de custo", () => {
  it("armazenagem ad valorem acumula por período", () => {
    expect(calculateStorageAdValorem(100_000, 4, DP_WORLD_RATES)).toBe(600); // 1 período
    expect(calculateStorageAdValorem(100_000, 5, DP_WORLD_RATES)).toBe(1900); // 2 períodos
    expect(calculateStorageAdValorem(100_000, 9, DP_WORLD_RATES)).toBe(3900); // 3 períodos
  });

  it("armazenagem: dias 0 ou CIF 0 => 0 conhecido", () => {
    expect(calculateStorageAdValorem(100_000, 0, DP_WORLD_RATES)).toBe(0);
    expect(calculateStorageAdValorem(0, 5, DP_WORLD_RATES)).toBe(0);
  });

  it("armazenagem: alíquota necessária desconhecida => null (unknown != 0)", () => {
    const semSubsequente = { ...DP_WORLD_RATES, subsequentRate: null };
    expect(calculateStorageAdValorem(100_000, 9, semSubsequente)).toBeNull();
    const semPrimeira = { ...DP_WORLD_RATES, firstPeriodRate: null };
    expect(calculateStorageAdValorem(100_000, 4, semPrimeira)).toBeNull();
  });

  it("descarga direta respeita o mínimo", () => {
    expect(calculateDirectDischarge(100_000, 0.0054, 1063.08)).toBe(1063.08);
    expect(calculateDirectDischarge(300_000, 0.0054, 1063.08)).toBe(1620);
  });

  it("transporte e custo de capital", () => {
    expect(calculateTransportCost(100, 5)).toBe(500);
    // 50.000 × 10 × (0,01 / 30) = 166,67
    expect(calculateCapitalCost(50_000, 10, 0.01, 30)).toBe(166.67);
  });
});

describe("construtores de componente", () => {
  it("armazenagem conhecida com proveniência", () => {
    const c = buildStorageComponent({
      cif: 100_000,
      daysOfStay: 5,
      rates: DP_WORLD_RATES,
      evidence: EVID,
    });
    expect(c.kind).toBe("ARMAZENAGEM");
    expect(c.amount.status).toBe("KNOWN");
    if (c.amount.status === "KNOWN") {
      expect(c.amount.value).toBe(1900);
      expect(c.amount.evidence.origin).toBe("TABELA_PUBLICA");
    }
  });

  it("armazenagem desconhecida quando CIF ausente ou tarifa não consolidada", () => {
    expect(
      buildStorageComponent({ cif: null, daysOfStay: 5, rates: DP_WORLD_RATES, evidence: EVID })
        .amount.status,
    ).toBe("UNKNOWN");
    expect(
      buildStorageComponent({
        cif: 100_000,
        daysOfStay: 5,
        rates: DP_WORLD_RATES,
        evidence: EVID,
        consolidated: false,
      }).amount.status,
    ).toBe("UNKNOWN");
  });

  it("descarga direta, transporte e capital como componentes", () => {
    expect(
      buildDirectDischargeComponent({ cif: 300_000, rate: 0.0054, minimumValue: 1063.08, evidence: EVID })
        .amount.status,
    ).toBe("KNOWN");
    expect(
      buildTransportComponent({ distanceKm: null, costPerKm: 5, reference: "x" }).amount.status,
    ).toBe("UNKNOWN");
    const capital = buildCapitalComponent({
      taxableAmount: 50_000,
      daysAnticipated: 10,
      monthlyRate: 0.01,
      monthDays: 30,
      reference: "premissa de capital",
    });
    expect(capital.amount.status).toBe("KNOWN");
  });

  it("SSE: OFF => não aplicável; ON sem valor => desconhecido", () => {
    expect(buildSseComponent({ active: false, amountWhenActive: null }).amount.status).toBe(
      "NOT_APPLICABLE",
    );
    expect(buildSseComponent({ active: true, amountWhenActive: null }).amount.status).toBe(
      "UNKNOWN",
    );
    expect(buildSseComponent({ active: true, amountWhenActive: 200 }).amount.status).toBe("KNOWN");
  });
});

describe("invariantes numéricas dos construtores (AJUSTE 5.5)", () => {
  it("entradas inválidas (negativo/Infinity/NaN) viram desconhecido, não NaN/negativo", () => {
    expect(
      buildStorageComponent({ cif: -1, daysOfStay: 5, rates: DP_WORLD_RATES, evidence: EVID })
        .amount.status,
    ).toBe("UNKNOWN");
    expect(
      buildTransportComponent({ distanceKm: Infinity, costPerKm: 5, reference: "x" })
        .amount.status,
    ).toBe("UNKNOWN");
    expect(
      buildDirectDischargeComponent({ cif: Number.NaN, rate: 0.0054, minimumValue: null, evidence: EVID })
        .amount.status,
    ).toBe("UNKNOWN");
    expect(
      buildCapitalComponent({
        taxableAmount: 1000,
        daysAnticipated: 10,
        monthlyRate: 0.01,
        monthDays: 0,
        reference: "x",
      }).amount.status,
    ).toBe("UNKNOWN");
    expect(
      buildSseComponent({ active: true, amountWhenActive: -5 }).amount.status,
    ).toBe("UNKNOWN");
  });
});

describe("computeRouteCost", () => {
  it("soma componentes conhecidos e não bloqueia com não aplicável", () => {
    const result = computeRouteCost("rota-a", [
      buildStorageComponent({ cif: 100_000, daysOfStay: 5, rates: DP_WORLD_RATES, evidence: EVID }),
      buildSseComponent({ active: false, amountWhenActive: null }),
    ]);
    expect(result.summary.complete).toBe(true);
    expect(result.summary.total).toBe(1900);
  });

  it("torna o total indeterminado quando há componente desconhecido", () => {
    const result = computeRouteCost("rota-c", [
      buildStorageComponent({ cif: 100_000, daysOfStay: 5, rates: DP_WORLD_RATES, evidence: EVID }),
      buildTransportComponent({ distanceKm: null, costPerKm: null, reference: "sem premissa" }),
    ]);
    expect(result.summary.complete).toBe(false);
    expect(result.summary.total).toBeNull();
    expect(result.summary.knownSubtotal).toBe(1900);
  });
});

describe("integração com o dataset tarifário (ETAPA 4)", () => {
  it("usa a tarifa consolidada do DP World preservando a fonte", () => {
    const c = buildStorageComponent({
      cif: 100_000,
      daysOfStay: 5,
      rates: TARIFF_DPWORLD_SANTOS_STORAGE.rates,
      consolidated: TARIFF_DPWORLD_SANTOS_STORAGE.consolidated,
      evidence: createEvidence("TABELA_PUBLICA", {
        confidence: TARIFF_DPWORLD_SANTOS_STORAGE.confidence,
        source: TARIFF_DPWORLD_SANTOS_STORAGE.source,
      }),
    });
    expect(c.amount.status).toBe("KNOWN");
    if (c.amount.status === "KNOWN") {
      expect(c.amount.value).toBe(1900);
      expect(c.amount.evidence.source?.publisher).toBe("DP World Santos");
    }
  });

  it("não usa a tarifa não consolidada da BTP", () => {
    const c = buildStorageComponent({
      cif: 100_000,
      daysOfStay: 5,
      rates: TARIFF_BTP_SANTOS_STORAGE.rates,
      consolidated: TARIFF_BTP_SANTOS_STORAGE.consolidated,
      evidence: createEvidence("TABELA_PUBLICA", {
        confidence: TARIFF_BTP_SANTOS_STORAGE.confidence,
        source: TARIFF_BTP_SANTOS_STORAGE.source,
      }),
    });
    expect(c.amount.status).toBe("UNKNOWN");
  });
});
