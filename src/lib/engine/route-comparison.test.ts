import { describe, expect, it } from "vitest";

import type { CostSummary, RouteEligibilityStatus, TrackedValue } from "../domain";
import { createEvidence, known, unknown } from "../domain";
import { compareRoutes } from "./route-comparison";
import type { RouteComparisonCandidate } from "./route-comparison";

const EVID = createEvidence("USUARIO");

function completeCost(total: number): CostSummary {
  return { knownSubtotal: total, total, complete: true, hasUnknown: false };
}

function incompleteCost(subtotal: number): CostSummary {
  return { knownSubtotal: subtotal, total: null, complete: false, hasUnknown: true };
}

function candidate(
  routeId: string,
  eligibility: RouteEligibilityStatus,
  cost: CostSummary,
  distanceKm: TrackedValue<number> = known(20, EVID),
  estimatedDurationHours: TrackedValue<number> = known(8, EVID),
): RouteComparisonCandidate {
  return {
    routeId,
    label: routeId,
    eligibility,
    cost,
    distanceKm,
    estimatedDurationHours,
  };
}

describe("compareRoutes", () => {
  it("separa rotas viáveis, indeterminadas e inviáveis", () => {
    const result = compareRoutes([
      candidate("v", "VIAVEL", completeCost(1000)),
      candidate("i", "INDETERMINADA", incompleteCost(0)),
      candidate("x", "INVIAVEL", completeCost(500)),
    ]);

    expect(result.viable).toEqual(["v"]);
    expect(result.indeterminate).toEqual(["i"]);
    expect(result.inviable).toEqual(["x"]);
  });

  it("elege o menor custo total quando todas as viáveis estão completas", () => {
    const result = compareRoutes([
      candidate("a", "VIAVEL", completeCost(2000)),
      candidate("b", "VIAVEL", completeCost(1500)),
    ]);

    expect(result.cost.lowest).toEqual({ routeId: "b", value: 1500 });
    expect(result.cost.fullyComparable).toBe(true);
    expect(result.cost.missingRouteIds).toEqual([]);
  });

  it("não esconde custo incompleto: compara só o subconjunto completo", () => {
    const result = compareRoutes([
      candidate("a", "VIAVEL", completeCost(2000)),
      candidate("b", "VIAVEL", incompleteCost(1500)),
    ]);

    expect(result.cost.lowest).toEqual({ routeId: "a", value: 2000 });
    expect(result.cost.fullyComparable).toBe(false);
    expect(result.cost.missingRouteIds).toEqual(["b"]);
    expect(result.cost.comparedRouteIds).toEqual(["a"]);
  });

  it("compara distância só entre rotas com valor conhecido", () => {
    const result = compareRoutes([
      candidate("a", "VIAVEL", completeCost(1000), known(30, EVID)),
      candidate("b", "VIAVEL", completeCost(1000), unknown()),
      candidate("c", "VIAVEL", completeCost(1000), known(17, EVID)),
    ]);

    expect(result.distance.lowest).toEqual({ routeId: "c", value: 17 });
    expect(result.distance.missingRouteIds).toEqual(["b"]);
    expect(result.distance.fullyComparable).toBe(false);
  });

  it("compara prazo entre rotas viáveis", () => {
    const result = compareRoutes([
      candidate("a", "VIAVEL", completeCost(1000), known(20, EVID), known(12, EVID)),
      candidate("b", "VIAVEL", completeCost(1000), known(20, EVID), known(4, EVID)),
    ]);

    expect(result.duration.lowest).toEqual({ routeId: "b", value: 4 });
    expect(result.duration.fullyComparable).toBe(true);
  });

  it("não rankeia rotas não viáveis", () => {
    const result = compareRoutes([
      candidate("i", "INDETERMINADA", completeCost(100)),
      candidate("x", "INVIAVEL", completeCost(50)),
    ]);

    expect(result.cost.lowest).toBeNull();
    expect(result.cost.comparedRouteIds).toEqual([]);
    expect(result.cost.fullyComparable).toBe(false);
    expect(result.distance.lowest).toBeNull();
  });
});
