import { describe, expect, it } from "vitest";

import type { CostSummary, RouteEligibilityStatus, TrackedValue } from "../domain";
import { createEvidence, known, notApplicable, unknown } from "../domain";
import { compareRoutes } from "./route-comparison";
import type { RouteComparisonCandidate } from "./route-comparison";

const EVID = createEvidence("USUARIO");

function completeCost(total: number): CostSummary {
  return { knownSubtotal: total, total, complete: true, hasUnknown: false, hasComponents: true };
}

function incompleteCost(subtotal: number): CostSummary {
  return { knownSubtotal: subtotal, total: null, complete: false, hasUnknown: true, hasComponents: true };
}

function candidate(
  routeId: string,
  eligibility: RouteEligibilityStatus,
  cost: CostSummary,
  distanceKm: TrackedValue<number> = known(20, EVID),
  estimatedDurationHours: TrackedValue<number> = known(8, EVID),
): RouteComparisonCandidate {
  return { routeId, label: routeId, eligibility, cost, distanceKm, estimatedDurationHours };
}

describe("compareRoutes", () => {
  it("separa viáveis, indeterminadas e inviáveis", () => {
    const result = compareRoutes([
      candidate("v", "VIAVEL", completeCost(1000)),
      candidate("i", "INDETERMINADA", incompleteCost(0)),
      candidate("x", "INVIAVEL", completeCost(500)),
    ]);
    expect(result.viable).toEqual(["v"]);
    expect(result.indeterminate).toEqual(["i"]);
    expect(result.inviable).toEqual(["x"]);
  });

  it("custo total COMPLETE quando todas as viáveis estão completas", () => {
    const result = compareRoutes([
      candidate("a", "VIAVEL", completeCost(2000)),
      candidate("b", "VIAVEL", completeCost(1500)),
    ]);
    expect(result.costTotal.status).toBe("COMPLETE");
    expect(result.costTotal.lowest).toEqual({ routeIds: ["b"], value: 1500 });
  });

  it("comparação parcial não é vencedor global (AJUSTE 6.1)", () => {
    const result = compareRoutes([
      candidate("a", "VIAVEL", completeCost(2000)),
      candidate("b", "VIAVEL", incompleteCost(1500)),
    ]);
    expect(result.costTotal.status).toBe("PARTIAL");
    expect(result.costTotal.fullyComparable).toBe(false);
    expect(result.costTotal.excluded).toEqual([{ routeId: "b", reason: "UNKNOWN" }]);
    // menor subtotal conhecido é uma dimensão separada (AJUSTE 6.2)
    expect(result.costKnownSubtotal.lowest?.value).toBe(1500);
  });

  it("empate traz vários vencedores, sem favorecer o primeiro (AJUSTE 6.3)", () => {
    const result = compareRoutes([
      candidate("a", "VIAVEL", completeCost(1500)),
      candidate("b", "VIAVEL", completeCost(1500)),
    ]);
    expect(result.costTotal.lowest?.routeIds.sort()).toEqual(["a", "b"]);
  });

  it("distância distingue UNKNOWN de NOT_APPLICABLE (AJUSTE 6.4)", () => {
    const result = compareRoutes([
      candidate("a", "VIAVEL", completeCost(1000), known(30, EVID)),
      candidate("b", "VIAVEL", completeCost(1000), unknown()),
      candidate("c", "VIAVEL", completeCost(1000), notApplicable()),
      candidate("d", "VIAVEL", completeCost(1000), known(17, EVID)),
    ]);
    expect(result.distance.lowest).toEqual({ routeIds: ["d"], value: 17 });
    const reasons = Object.fromEntries(
      result.distance.excluded.map((e) => [e.routeId, e.reason]),
    );
    expect(reasons.b).toBe("UNKNOWN");
    expect(reasons.c).toBe("NOT_APPLICABLE");
  });

  it("rejeita valores não finitos/negativos (AJUSTE 6.5)", () => {
    const result = compareRoutes([
      candidate("a", "VIAVEL", completeCost(1000), known(Number.NaN, EVID)),
      candidate("b", "VIAVEL", completeCost(1000), known(-5, EVID)),
      candidate("c", "VIAVEL", completeCost(1000), known(12, EVID)),
    ]);
    expect(result.distance.lowest).toEqual({ routeIds: ["c"], value: 12 });
    expect(result.distance.excluded.map((e) => e.reason)).toEqual(["INVALID", "INVALID"]);
  });

  it("não rankeia rotas não viáveis; dimensão fica UNAVAILABLE", () => {
    const result = compareRoutes([
      candidate("i", "INDETERMINADA", completeCost(100)),
      candidate("x", "INVIAVEL", completeCost(50)),
    ]);
    expect(result.costTotal.status).toBe("UNAVAILABLE");
    expect(result.costTotal.lowest).toBeNull();
  });
});
