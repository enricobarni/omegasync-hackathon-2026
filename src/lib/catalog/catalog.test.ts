import { describe, expect, it } from "vitest";

import type { Facility, Route } from "../domain";
import {
  acceptsCargoType,
  availabilityUnknown,
  createEvidence,
  dtaRequirementUnknown,
  known,
  unknown,
} from "../domain";
import {
  createCatalog,
  getFacility,
  getRoute,
  listFacilitiesByType,
  listFacilitiesByZone,
  listRoutesAcceptingCargo,
  listRoutesFrom,
  listRoutesTo,
  routeCrossesZones,
  validateCatalog,
} from "./catalog";

const EVIDENCIA = createEvidence("USUARIO");

const TERMINAL: Facility = {
  id: "terminal-zp",
  name: "Terminal — Zona Primária",
  zone: "ZONA_PRIMARIA",
  type: "TERMINAL",
};

const RECINTO_ZS: Facility = {
  id: "recinto-zs",
  name: "Recinto — Zona Secundária",
  zone: "ZONA_SECUNDARIA",
  type: "RETROPORTO",
};

function criarRota(overrides: Partial<Route> = {}): Route {
  return {
    id: "rota-zp-zs",
    label: "Terminal → Recinto (via DTA)",
    origin: TERMINAL,
    destination: RECINTO_ZS,
    requiresDta: dtaRequirementUnknown(),
    acceptedCargoTypes: ["FCL"],
    availability: availabilityUnknown(),
    distanceKm: unknown(),
    estimatedDurationHours: unknown(),
    restrictions: [],
    costComponents: [],
    ...overrides,
  };
}

describe("validateCatalog", () => {
  it("aceita um catálogo com integridade referencial", () => {
    const validation = validateCatalog([TERMINAL, RECINTO_ZS], [criarRota()]);
    expect(validation.valid).toBe(true);
  });

  it("detecta recinto com id duplicado", () => {
    const validation = validateCatalog([TERMINAL, TERMINAL], []);
    expect(validation.valid).toBe(false);
    if (!validation.valid) {
      expect(validation.issues.map((i) => i.kind)).toContain(
        "DUPLICATE_FACILITY_ID",
      );
    }
  });

  it("detecta rota que referencia recinto inexistente", () => {
    const validation = validateCatalog([TERMINAL], [criarRota()]);
    expect(validation.valid).toBe(false);
    if (!validation.valid) {
      expect(validation.issues.map((i) => i.kind)).toContain(
        "ROUTE_DESTINATION_NOT_FOUND",
      );
    }
  });

  it("detecta rota com id duplicado", () => {
    const validation = validateCatalog(
      [TERMINAL, RECINTO_ZS],
      [criarRota(), criarRota()],
    );
    expect(validation.valid).toBe(false);
    if (!validation.valid) {
      expect(validation.issues.map((i) => i.kind)).toContain(
        "DUPLICATE_ROUTE_ID",
      );
    }
  });
});

describe("createCatalog", () => {
  it("lança erro quando o catálogo é estruturalmente inválido", () => {
    expect(() => createCatalog([TERMINAL], [criarRota()])).toThrow();
  });
});

describe("consultas do catálogo", () => {
  const catalog = createCatalog([TERMINAL, RECINTO_ZS], [criarRota()]);

  it("encontra recintos por id, zona e tipo", () => {
    expect(getFacility(catalog, "terminal-zp")).toBe(TERMINAL);
    expect(getFacility(catalog, "inexistente")).toBeNull();

    expect(listFacilitiesByZone(catalog, "ZONA_PRIMARIA")).toEqual([TERMINAL]);
    expect(listFacilitiesByZone(catalog, "ZONA_SECUNDARIA")).toEqual([
      RECINTO_ZS,
    ]);
    expect(listFacilitiesByType(catalog, "RETROPORTO")).toEqual([RECINTO_ZS]);
  });

  it("encontra rotas por origem, destino e id", () => {
    expect(getRoute(catalog, "rota-zp-zs")?.id).toBe("rota-zp-zs");
    expect(listRoutesFrom(catalog, "terminal-zp")).toHaveLength(1);
    expect(listRoutesTo(catalog, "recinto-zs")).toHaveLength(1);
    expect(listRoutesFrom(catalog, "recinto-zs")).toHaveLength(0);
  });

  it("filtra rotas por tipo de carga aceito, sem assumir compatibilidade", () => {
    expect(listRoutesAcceptingCargo(catalog, "FCL")).toHaveLength(1);
    expect(listRoutesAcceptingCargo(catalog, "LCL")).toHaveLength(0);

    const semTipos = createCatalog(
      [TERMINAL, RECINTO_ZS],
      [criarRota({ acceptedCargoTypes: [] })],
    );
    expect(listRoutesAcceptingCargo(semTipos, "FCL")).toHaveLength(0);
  });

  it("reconhece rota que cruza zonas como fato estrutural", () => {
    expect(routeCrossesZones(criarRota())).toBe(true);
    expect(
      routeCrossesZones(criarRota({ destination: TERMINAL })),
    ).toBe(false);
  });
});

describe("representação de rota", () => {
  it("informa todos os campos exigidos sem inventar disponibilidade", () => {
    const rota = criarRota({
      requiresDta: {
        status: "REQUIRED",
        evidence: createEvidence("PREMISSA_SIMULACAO", { confidence: "B" }),
      },
      distanceKm: known(23, EVIDENCIA),
      restrictions: ["janela de retirada restrita"],
    });

    // origem, destino, DTA, aceita carga, disponibilidade, restrições, fonte
    expect(rota.origin.zone).toBe("ZONA_PRIMARIA");
    expect(rota.destination.zone).toBe("ZONA_SECUNDARIA");
    expect(rota.requiresDta.status).toBe("REQUIRED");
    expect(acceptsCargoType(rota, "FCL")).toBe(true);
    expect(rota.availability.status).toBe("UNKNOWN");
    expect(rota.restrictions).toContain("janela de retirada restrita");
  });
});
