import { describe, expect, it } from "vitest";

import { DEMO_CATALOG } from "../catalog";
import type { Cargo, Facility, Route } from "../domain";
import { createEvidence, known } from "../domain";
import { buildStorageComponent } from "../engine";
import type { AnuenciaRegistryEntry } from "../customs";
import { runSimulation } from "./simulation-service";

const EVID = createEvidence("USUARIO");

const CARGA: Cargo = {
  ncm: "84713012",
  cif: known(100_000, EVID),
  cargoType: "FCL",
  oeaStatus: "NAO_OEA",
  channel: "VERDE",
};

const TERMINAL: Facility = {
  id: "terminal-zp",
  name: "Terminal",
  zone: "ZONA_PRIMARIA",
  type: "TERMINAL",
};
const RECINTO: Facility = {
  id: "recinto-zs",
  name: "Recinto ZS",
  zone: "ZONA_SECUNDARIA",
  type: "RETROPORTO",
};

const ROTA_VIAVEL: Route = {
  id: "rota-viavel",
  label: "Terminal → Recinto",
  origin: TERMINAL,
  destination: RECINTO,
  requiresDta: { status: "REQUIRED", evidence: EVID },
  acceptedCargoTypes: known(["FCL"], EVID),
  availability: { status: "AVAILABLE", evidence: EVID },
  distanceKm: known(20, EVID),
  estimatedDurationHours: known(8, EVID),
  restrictions: [],
  costComponents: [],
};

const REGISTRO_LIVRE: AnuenciaRegistryEntry[] = [
  { ncm: "84713012", state: "AUTOMATICA", organs: [], evidence: EVID },
];

const DP_WORLD_RATES = {
  daysPerPeriod: 4,
  firstPeriodRate: 0.006,
  secondPeriodRate: 0.013,
  subsequentRate: 0.02,
};

describe("runSimulation — baseline honesto", () => {
  it("com registro vazio, anuência não resolvida e liberação indeterminada", () => {
    const result = runSimulation({
      cargo: CARGA,
      routes: DEMO_CATALOG.routes,
    });

    expect(result.anuencia.status).toBe("NOT_FOUND");
    expect(result.clearance.status).toBe("INDETERMINADA");
    // rota-modelo do baseline não tem tipos de carga/disponibilidade => indeterminada
    expect(result.routes[0].eligibility.status).toBe("INDETERMINADA");
    // sem custo informado => total desconhecido, não zero
    expect(result.routes[0].cost.summary.total).toBeNull();
    expect(result.comparison.viable).toEqual([]);
    expect(result.missingData.length).toBeGreaterThan(0);
  });
});

describe("runSimulation — rota viável com dados", () => {
  it("resolve anuência, libera, torna a rota viável e calcula custo completo", () => {
    const result = runSimulation({
      cargo: CARGA,
      routes: [ROTA_VIAVEL],
      anuenciaRegistry: REGISTRO_LIVRE,
      routeCostComponents: {
        "rota-viavel": [
          buildStorageComponent({
            cif: 100_000,
            daysOfStay: 5,
            rates: DP_WORLD_RATES,
            evidence: createEvidence("TABELA_PUBLICA", { confidence: "A" }),
          }),
        ],
      },
      window48h: {
        cargoYardWithdrawal: known(true, EVID),
        withinBusinessWindow: known(true, EVID),
      },
    });

    expect(result.anuencia.status).toBe("RESOLVED");
    expect(result.clearance.status).toBe("LIBERADA");
    expect(result.routes[0].eligibility.status).toBe("VIAVEL");
    expect(result.routes[0].cost.summary.complete).toBe(true);
    expect(result.routes[0].cost.summary.total).toBe(1900);
    expect(result.comparison.viable).toEqual(["rota-viavel"]);
    expect(result.comparison.cost.lowest).toEqual({ routeId: "rota-viavel", value: 1900 });
    expect(result.window48h.viability).toBe("VIAVEL");
  });

  it("agrega evidências e fatores comportamentais", () => {
    const result = runSimulation({
      cargo: CARGA,
      routes: [ROTA_VIAVEL],
      anuenciaRegistry: REGISTRO_LIVRE,
      behavioral: { possuiEstruturaSincronizada: known(false, EVID) },
    });

    expect(result.behavioralFactors.length).toBeGreaterThan(0);
    const estrutura = result.behavioralFactors.find((f) => f.kind === "ESTRUTURA");
    expect(estrutura?.present).toBe(true);
    expect(result.evidences.length).toBeGreaterThan(0);
  });
});

describe("runSimulation — canal verde não basta", () => {
  it("verde + anuência não automática posterior => liberação PENDENTE", () => {
    const registry: AnuenciaRegistryEntry[] = [
      { ncm: "84713012", state: "NAO_AUTOMATICA_POSTERIOR", organs: ["ANVISA"], evidence: EVID },
    ];
    const result = runSimulation({
      cargo: CARGA,
      routes: [ROTA_VIAVEL],
      anuenciaRegistry: registry,
    });
    expect(result.clearance.status).toBe("PENDENTE");
  });

  it("custo não informado nunca vira zero", () => {
    const result = runSimulation({ cargo: CARGA, routes: [ROTA_VIAVEL], anuenciaRegistry: REGISTRO_LIVRE });
    expect(result.routes[0].cost.summary.total).toBeNull();
    expect(result.routes[0].cost.summary.complete).toBe(false);
  });
});
