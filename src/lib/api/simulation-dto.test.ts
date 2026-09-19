import { describe, expect, it } from "vitest";

import {
  toSimulationResponse,
  validateSimulationRequest,
} from "./simulation-dto";
import { BASELINE_CATALOG } from "../catalog";
import { runSimulation } from "../application";

const CARGO_VALIDO = {
  ncm: "84713012",
  cargoType: "FCL",
  oeaStatus: "NAO_OEA",
  channel: "VERDE",
};

describe("validateSimulationRequest", () => {
  it("rejeita corpo sem cargo", () => {
    const r = validateSimulationRequest({});
    expect(r.ok).toBe(false);
  });

  it("rejeita NCM fora do formato de 8 dígitos", () => {
    const r = validateSimulationRequest({ cargo: { ...CARGO_VALIDO, ncm: "123" } });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.includes("ncm"))).toBe(true);
    }
  });

  it("rejeita enums inválidos e cif negativo", () => {
    const r = validateSimulationRequest({
      cargo: { ...CARGO_VALIDO, cargoType: "XPTO", channel: "ROXO", cif: -1 },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("normaliza cargo válido para o domínio", () => {
    const r = validateSimulationRequest({
      cargo: { ...CARGO_VALIDO, cif: 100_000 },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.cargo.ncm).toBe("84713012");
      expect(r.value.cargo.cif.status).toBe("KNOWN");
    }
  });

  it("CIF ausente vira valor desconhecido (não zero)", () => {
    const r = validateSimulationRequest({ cargo: CARGO_VALIDO });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.cargo.cif.status).toBe("UNKNOWN");
    }
  });

  it("normaliza sinais operacionais booleanos", () => {
    const r = validateSimulationRequest({
      cargo: CARGO_VALIDO,
      operation: { cargoYardWithdrawal: true, possuiEstruturaSincronizada: false },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.window48h?.cargoYardWithdrawal?.status).toBe("KNOWN");
      expect(r.value.behavioral?.possuiEstruturaSincronizada?.status).toBe("KNOWN");
      // não informado permanece indefinido
      expect(r.value.window48h?.withinBusinessWindow).toBeUndefined();
    }
  });
});

describe("toSimulationResponse", () => {
  it("mapeia o resultado interno para o contrato público", () => {
    const validation = validateSimulationRequest({ cargo: CARGO_VALIDO });
    if (!validation.ok) {
      throw new Error("esperava requisição válida");
    }
    const result = runSimulation({
      ...validation.value,
      routes: BASELINE_CATALOG.routes,
    });
    const dto = toSimulationResponse(result);

    expect(dto.clearance.status).toBe("INDETERMINADA");
    expect(dto.anuencia.status).toBe("NOT_FOUND");
    expect(dto.routes.length).toBe(BASELINE_CATALOG.routes.length);
    expect(dto.routes[0].cost.total).toBeNull();
    expect(Array.isArray(dto.comparison.viable)).toBe(true);
    expect(dto.window48h.applicability).toBe("INDETERMINADO");
  });
});
