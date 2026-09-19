import { describe, expect, it } from "vitest";

import type { Cargo, Facility, ResolvedAnuencia, Route } from "../domain";
import {
  availabilityUnknown,
  createEvidence,
  dtaRequirementUnknown,
  known,
  unknown,
  unknownAmount,
} from "../domain";
import {
  evaluateEligibility,
  evaluateRouteEligibility,
} from "./eligibility";
import type { EligibilityInput } from "./eligibility";

const EVIDENCIA = createEvidence("USUARIO");

const CARGA: Cargo = {
  ncm: "84713012",
  cif: unknownAmount(),
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

const RECINTO_ZS: Facility = {
  id: "recinto-zs",
  name: "Recinto ZS",
  zone: "ZONA_SECUNDARIA",
  type: "RETROPORTO",
};

const ENTREPOSTO: Facility = {
  id: "entreposto",
  name: "Entreposto",
  zone: "ZONA_SECUNDARIA",
  type: "ENTREPOSTO_ADUANEIRO",
};

function rota(overrides: Partial<Route> = {}): Route {
  return {
    id: "rota-1",
    label: "Terminal → Recinto",
    origin: TERMINAL,
    destination: RECINTO_ZS,
    requiresDta: dtaRequirementUnknown(),
    acceptedCargoTypes: ["FCL"],
    availability: { status: "AVAILABLE", evidence: EVIDENCIA },
    distanceKm: known(20, EVIDENCIA),
    estimatedDurationHours: unknown(),
    restrictions: [],
    costComponents: [],
    ...overrides,
  };
}

const ANUENCIA_LIVRE: ResolvedAnuencia = {
  state: "SEM_ANUENCIA",
  organs: [],
  evidence: createEvidence("USUARIO"),
};

function input(overrides: Partial<EligibilityInput> = {}): EligibilityInput {
  return { cargo: CARGA, anuencia: ANUENCIA_LIVRE, ...overrides };
}

describe("evaluateRouteEligibility", () => {
  it("VIAVEL quando todas as restrições passam", () => {
    const result = evaluateRouteEligibility(input(), rota());
    expect(result.status).toBe("VIAVEL");
    expect(result.missingData).toEqual([]);
  });

  it("INVIAVEL quando a rota não aceita o tipo de carga", () => {
    const result = evaluateRouteEligibility(
      input({ cargo: { ...CARGA, cargoType: "LCL" } }),
      rota({ acceptedCargoTypes: ["FCL"] }),
    );
    expect(result.status).toBe("INVIAVEL");
    expect(result.reasons.some((r) => r.rule === "CARGO_TYPE" && r.outcome === "BLOCK")).toBe(true);
  });

  it("INVIAVEL quando a anuência impede a operação", () => {
    const anuencia: ResolvedAnuencia = {
      state: "IMPEDIMENTO",
      organs: ["ANVISA"],
      evidence: createEvidence("USUARIO"),
    };
    const result = evaluateRouteEligibility(input({ anuencia }), rota());
    expect(result.status).toBe("INVIAVEL");
    expect(result.summary).toContain("anuência");
  });

  it("INVIAVEL quando a anuência é prévia ao embarque", () => {
    const anuencia: ResolvedAnuencia = {
      state: "PREVIA_AO_EMBARQUE",
      organs: ["MAPA_VIGIAGRO"],
      evidence: createEvidence("USUARIO"),
    };
    expect(evaluateRouteEligibility(input({ anuencia }), rota()).status).toBe(
      "INVIAVEL",
    );
  });

  it("INVIAVEL quando a rota está indisponível", () => {
    const result = evaluateRouteEligibility(
      input(),
      rota({
        availability: {
          status: "UNAVAILABLE",
          evidence: EVIDENCIA,
          reason: "recinto sem capacidade",
        },
      }),
    );
    expect(result.status).toBe("INVIAVEL");
  });

  it("INVIAVEL quando exige entrepostagem e a rota não termina em entreposto", () => {
    const result = evaluateRouteEligibility(
      input({ necessitaEntrepostagem: known(true, EVIDENCIA) }),
      rota({ destination: RECINTO_ZS }),
    );
    expect(result.status).toBe("INVIAVEL");
  });

  it("VIAVEL quando exige entrepostagem e a rota termina em entreposto", () => {
    const result = evaluateRouteEligibility(
      input({ necessitaEntrepostagem: known(true, EVIDENCIA) }),
      rota({ destination: ENTREPOSTO }),
    );
    expect(result.status).toBe("VIAVEL");
  });

  it("INDETERMINADA quando a anuência não está resolvida", () => {
    const result = evaluateRouteEligibility(input({ anuencia: undefined }), rota());
    expect(result.status).toBe("INDETERMINADA");
    expect(result.missingData.length).toBeGreaterThan(0);
  });

  it("INDETERMINADA quando a disponibilidade é desconhecida", () => {
    const result = evaluateRouteEligibility(
      input(),
      rota({ availability: availabilityUnknown() }),
    );
    expect(result.status).toBe("INDETERMINADA");
    expect(result.missingData.some((m) => m.includes("Disponibilidade"))).toBe(true);
  });

  it("INDETERMINADA quando os tipos de carga aceitos não são informados", () => {
    const result = evaluateRouteEligibility(input(), rota({ acceptedCargoTypes: [] }));
    expect(result.status).toBe("INDETERMINADA");
  });

  it("BLOCK tem precedência sobre INDETERMINATE", () => {
    // disponibilidade desconhecida (INDETERMINATE) + tipo não aceito (BLOCK)
    const result = evaluateRouteEligibility(
      input({ cargo: { ...CARGA, cargoType: "LCL" } }),
      rota({ acceptedCargoTypes: ["FCL"], availability: availabilityUnknown() }),
    );
    expect(result.status).toBe("INVIAVEL");
  });
});

describe("evaluateEligibility", () => {
  it("avalia várias rotas sem colapsar em um único cenário", () => {
    const viavel = rota({ id: "viavel", acceptedCargoTypes: ["FCL"] });
    const inviavel = rota({ id: "inviavel", acceptedCargoTypes: ["LCL"] });
    const indeterminada = rota({ id: "indeterminada", availability: availabilityUnknown() });

    const results = evaluateEligibility(input(), [viavel, inviavel, indeterminada]);

    expect(results.map((r) => r.status)).toEqual([
      "VIAVEL",
      "INVIAVEL",
      "INDETERMINADA",
    ]);
  });
});
