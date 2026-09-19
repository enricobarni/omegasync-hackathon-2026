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

/** Recinto habilitado ao regime de entreposto (habilitação rastreável). */
const RECINTO_HABILITADO_ENTREPOSTO: Facility = {
  id: "recinto-entreposto",
  name: "Recinto habilitado a entreposto",
  zone: "ZONA_SECUNDARIA",
  type: "RECINTO_ALFANDEGADO",
  enabledRegimes: known(["ENTREPOSTO_ADUANEIRO"], EVIDENCIA),
};

/** Recinto com habilitação conhecida e SEM entreposto. */
const RECINTO_SEM_ENTREPOSTO: Facility = {
  id: "recinto-sem-entreposto",
  name: "Recinto sem entreposto",
  zone: "ZONA_SECUNDARIA",
  type: "RETROPORTO",
  enabledRegimes: known([], EVIDENCIA),
};

function rota(overrides: Partial<Route> = {}): Route {
  return {
    id: "rota-1",
    label: "Terminal → Recinto",
    origin: TERMINAL,
    destination: RECINTO_ZS,
    requiresDta: dtaRequirementUnknown(),
    acceptedCargoTypes: known(["FCL"], EVIDENCIA),
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
      rota({ acceptedCargoTypes: known(["FCL"], EVIDENCIA) }),
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

  it("INVIAVEL quando exige entrepostagem e o recinto não é habilitado", () => {
    const result = evaluateRouteEligibility(
      input({ necessitaEntrepostagem: known(true, EVIDENCIA) }),
      rota({ destination: RECINTO_SEM_ENTREPOSTO }),
    );
    expect(result.status).toBe("INVIAVEL");
  });

  it("INDETERMINADA quando exige entrepostagem e a habilitação é desconhecida", () => {
    const result = evaluateRouteEligibility(
      input({ necessitaEntrepostagem: known(true, EVIDENCIA) }),
      rota({ destination: RECINTO_ZS }),
    );
    expect(result.status).toBe("INDETERMINADA");
  });

  it("VIAVEL quando exige entrepostagem e o recinto é habilitado ao regime", () => {
    const result = evaluateRouteEligibility(
      input({ necessitaEntrepostagem: known(true, EVIDENCIA) }),
      rota({ destination: RECINTO_HABILITADO_ENTREPOSTO }),
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
    const result = evaluateRouteEligibility(input(), rota({ acceptedCargoTypes: unknown() }));
    expect(result.status).toBe("INDETERMINADA");
  });

  it("INVIAVEL quando KNOWN [] confirma que nenhum tipo é aceito", () => {
    const result = evaluateRouteEligibility(
      input(),
      rota({ acceptedCargoTypes: known([], EVIDENCIA) }),
    );
    expect(result.status).toBe("INVIAVEL");
  });

  it("BLOCK tem precedência sobre INDETERMINATE", () => {
    // disponibilidade desconhecida (INDETERMINATE) + tipo não aceito (BLOCK)
    const result = evaluateRouteEligibility(
      input({ cargo: { ...CARGA, cargoType: "LCL" } }),
      rota({ acceptedCargoTypes: known(["FCL"], EVIDENCIA), availability: availabilityUnknown() }),
    );
    expect(result.status).toBe("INVIAVEL");
  });
});

describe("evaluateEligibility", () => {
  it("avalia várias rotas sem colapsar em um único cenário", () => {
    const viavel = rota({ id: "viavel", acceptedCargoTypes: known(["FCL"], EVIDENCIA) });
    const inviavel = rota({ id: "inviavel", acceptedCargoTypes: known(["LCL"], EVIDENCIA) });
    const indeterminada = rota({ id: "indeterminada", availability: availabilityUnknown() });

    const results = evaluateEligibility(input(), [viavel, inviavel, indeterminada]);

    expect(results.map((r) => r.status)).toEqual([
      "VIAVEL",
      "INVIAVEL",
      "INDETERMINADA",
    ]);
  });
});
