import { describe, expect, it } from "vitest";

import { createCostComponent } from "./cost";
import {
  availabilityUnknown,
  dtaRequirementUnknown,
} from "./customs";
import type { Facility } from "./customs";
import { known, unknown } from "./information";
import { knownAmount, unknownAmount } from "./money";
import { createEvidence } from "./provenance";
import { assessRouteCost, cargoTypeAcceptance } from "./route";
import type { Route } from "./route";

const EVIDENCIA = createEvidence("USUARIO");

const TERMINAL: Facility = {
  id: "terminal-santos",
  name: "Terminal — Zona Primária",
  zone: "ZONA_PRIMARIA",
  type: "TERMINAL",
};

const RETROPORTO: Facility = {
  id: "retroporto-x",
  name: "Recinto — Zona Secundária",
  zone: "ZONA_SECUNDARIA",
  type: "RETROPORTO",
};

function criarRota(overrides: Partial<Route> = {}): Route {
  return {
    id: "rota-teste",
    label: "Terminal -> Retroporto via DTA",
    origin: TERMINAL,
    destination: RETROPORTO,
    requiresDta: dtaRequirementUnknown(),
    acceptedCargoTypes: known(["FCL"], EVIDENCIA),
    availability: availabilityUnknown(),
    distanceKm: known(17, EVIDENCIA),
    estimatedDurationHours: unknown(),
    restrictions: [],
    costComponents: [],
    ...overrides,
  };
}

describe("rota", () => {
  it("distingue aceito, rejeitado e desconhecido (unknown != rejeitado)", () => {
    const rota = criarRota({ acceptedCargoTypes: known(["FCL"], EVIDENCIA) });

    expect(cargoTypeAcceptance(rota, "FCL")).toBe("ACCEPTED");
    expect(cargoTypeAcceptance(rota, "LCL")).toBe("REJECTED");

    // KNOWN [] = confirmado que nenhum tipo é aceito => REJECTED
    const semTipos = criarRota({ acceptedCargoTypes: known([], EVIDENCIA) });
    expect(cargoTypeAcceptance(semTipos, "FCL")).toBe("REJECTED");

    // UNKNOWN = ainda não se sabe => nunca vira rejeitado
    const desconhecido = criarRota({ acceptedCargoTypes: unknown() });
    expect(cargoTypeAcceptance(desconhecido, "FCL")).toBe("UNKNOWN");
  });

  it("mantém disponibilidade e DTA como desconhecidos por padrão", () => {
    const rota = criarRota();

    expect(rota.availability.status).toBe("UNKNOWN");
    expect(rota.requiresDta.status).toBe("UNKNOWN");
  });

  it("rota sem dado suficiente produz custo total indeterminado", () => {
    const rota = criarRota({
      costComponents: [
        createCostComponent("TRANSPORTE", "Transporte", knownAmount(600, EVIDENCIA)),
        createCostComponent("DTA", "DTA", unknownAmount("custo de DTA não coletado")),
      ],
    });

    const resumo = assessRouteCost(rota);

    expect(resumo.complete).toBe(false);
    expect(resumo.total).toBeNull();
    expect(resumo.knownSubtotal).toBe(600);
  });

  it("rota com todos os custos conhecidos produz total completo", () => {
    const rota = criarRota({
      costComponents: [
        createCostComponent("TRANSPORTE", "Transporte", knownAmount(600, EVIDENCIA)),
        createCostComponent("ARMAZENAGEM", "Armazenagem", knownAmount(1200, EVIDENCIA)),
      ],
    });

    const resumo = assessRouteCost(rota);

    expect(resumo.complete).toBe(true);
    expect(resumo.total).toBe(1800);
  });
});
