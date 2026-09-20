import { describe, expect, it } from "vitest";

import type { SimulationResponseDTO } from "../api";
import { buildSimulationContext } from "./context-builder";

const sample = {
  clearance: { status: "INDETERMINADA", reasons: [], missingData: [], evidences: [] },
  anuencia: { status: "NOT_FOUND", state: null },
  routes: [
    {
      routeId: "r1",
      label: "Retirada direta",
      movement: "RETIRADA_DIRETA",
      eligibility: { status: "INDETERMINADA", summary: "", missingData: [], reasons: [] },
      cost: { knownSubtotal: 1200, total: null, complete: false, missingKinds: ["DTA"] },
      distanceKm: { status: "UNKNOWN", value: null },
      estimatedDurationHours: { status: "UNKNOWN", value: null },
    },
  ],
  comparison: {
    viable: [],
    indeterminate: ["r1"],
    inviable: [],
    costTotal: { status: "UNAVAILABLE", lowestRouteIds: [], lowestValue: null, fullyComparable: false },
    costKnownSubtotal: { status: "PARTIAL", lowestRouteIds: [], lowestValue: null, fullyComparable: false },
    distance: { status: "UNAVAILABLE", lowestRouteIds: [], lowestValue: null, fullyComparable: false },
    duration: { status: "UNAVAILABLE", lowestRouteIds: [], lowestValue: null, fullyComparable: false },
  },
  window48h: { applicability: "INDETERMINADO", viability: null },
  behavioralFactors: [],
  evidences: [],
  missingData: ["Custo de DTA desconhecido", "Distância desconhecida"],
} as unknown as SimulationResponseDTO;

describe("buildSimulationContext", () => {
  it("retorna string vazia quando não há simulação", () => {
    expect(buildSimulationContext(null)).toBe("");
    expect(buildSimulationContext(undefined)).toBe("");
  });

  it("condensa o resultado preservando indeterminação (custo não vira zero)", () => {
    const context = buildSimulationContext(sample);
    expect(context).toContain("OMEGASYNC_RESULT");
    expect(context).toContain("Retirada direta");
    expect(context).toContain("INDETERMINADO");
    expect(context).toContain("INDETERMINADA");
    // total null nunca vira R$ 0
    expect(context).toContain("INDETERMINADO");
    expect(context).not.toContain("R$ 0");
    expect(context).toContain("Dados faltantes");
  });
});
