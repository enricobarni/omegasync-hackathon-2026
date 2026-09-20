/**
 * Comparador de rotas (ETAPA 6 + rodada de correção).
 *
 * Compara apenas informação comparável e nunca inventa um score nem uma
 * preferência por ordem de lista. Correções:
 * - AJUSTE 6.1: escopo explícito da dimensão (COMPLETE/PARTIAL/UNAVAILABLE);
 *   não declara vencedor global quando a comparação é parcial;
 * - AJUSTE 6.2: menor subtotal conhecido separado do menor custo total;
 * - AJUSTE 6.3: empates explícitos (vários vencedores), sem favorecer o 1º;
 * - AJUSTE 6.4: distingue UNKNOWN de NOT_APPLICABLE na exclusão;
 * - AJUSTE 6.5: valida valores finitos e não negativos antes de comparar.
 *
 * Só rotas VIÁVEIS entram no ranking. Puro e determinístico.
 */

import type {
  CostSummary,
  RouteEligibilityStatus,
  TrackedValue,
} from "../domain";

export interface RouteComparisonCandidate {
  routeId: string;
  label: string;
  eligibility: RouteEligibilityStatus;
  cost: CostSummary;
  distanceKm: TrackedValue<number>;
  estimatedDurationHours: TrackedValue<number>;
}

export const DIMENSION_STATUSES = ["COMPLETE", "PARTIAL", "UNAVAILABLE"] as const;
export type DimensionStatus = (typeof DIMENSION_STATUSES)[number];

export const EXCLUSION_REASONS = ["UNKNOWN", "NOT_APPLICABLE", "INVALID"] as const;
export type ExclusionReason = (typeof EXCLUSION_REASONS)[number];

export interface ExcludedRoute {
  routeId: string;
  reason: ExclusionReason;
}

/** Vencedor(es) de uma dimensão; múltiplos ids representam empate (AJUSTE 6.3). */
export interface DimensionWinner {
  routeIds: string[];
  value: number;
}

export interface ComparableDimension {
  status: DimensionStatus;
  /** Menor valor entre as rotas comparáveis; empates trazem vários ids. */
  lowest: DimensionWinner | null;
  comparedRouteIds: string[];
  excluded: ExcludedRoute[];
  /** true só quando toda rota viável entrou na comparação. */
  fullyComparable: boolean;
}

export interface RouteComparison {
  viable: string[];
  indeterminate: string[];
  inviable: string[];
  /** Menor custo TOTAL (apenas rotas com custo completo). */
  costTotal: ComparableDimension;
  /** Menor SUBTOTAL conhecido (não é conclusão de custo total — AJUSTE 6.2). */
  costKnownSubtotal: ComparableDimension;
  distance: ComparableDimension;
  duration: ComparableDimension;
}

type DimensionValue =
  | { kind: "value"; value: number }
  | { kind: "excluded"; reason: ExclusionReason };

function isValidNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function buildDimension(
  candidates: RouteComparisonCandidate[],
  getValue: (candidate: RouteComparisonCandidate) => DimensionValue,
): ComparableDimension {
  const comparedRouteIds: string[] = [];
  const excluded: ExcludedRoute[] = [];
  const values: { routeId: string; value: number }[] = [];

  for (const candidate of candidates) {
    const result = getValue(candidate);
    if (result.kind === "excluded") {
      excluded.push({ routeId: candidate.routeId, reason: result.reason });
      continue;
    }
    comparedRouteIds.push(candidate.routeId);
    values.push({ routeId: candidate.routeId, value: result.value });
  }

  let lowest: DimensionWinner | null = null;
  if (values.length > 0) {
    const min = Math.min(...values.map((v) => v.value));
    lowest = {
      value: min,
      routeIds: values.filter((v) => v.value === min).map((v) => v.routeId),
    };
  }

  const fullyComparable = candidates.length > 0 && excluded.length === 0;
  const status: DimensionStatus =
    comparedRouteIds.length === 0
      ? "UNAVAILABLE"
      : fullyComparable
        ? "COMPLETE"
        : "PARTIAL";

  return { status, lowest, comparedRouteIds, excluded, fullyComparable };
}

function trackedDimensionValue(
  value: TrackedValue<number>,
): DimensionValue {
  switch (value.status) {
    case "KNOWN":
      return isValidNumber(value.value)
        ? { kind: "value", value: value.value }
        : { kind: "excluded", reason: "INVALID" };
    case "NOT_APPLICABLE":
      return { kind: "excluded", reason: "NOT_APPLICABLE" };
    default:
      return { kind: "excluded", reason: "UNKNOWN" };
  }
}

function costTotalValue(candidate: RouteComparisonCandidate): DimensionValue {
  if (!candidate.cost.complete || candidate.cost.total === null) {
    return { kind: "excluded", reason: "UNKNOWN" };
  }
  return isValidNumber(candidate.cost.total)
    ? { kind: "value", value: candidate.cost.total }
    : { kind: "excluded", reason: "INVALID" };
}

function costSubtotalValue(candidate: RouteComparisonCandidate): DimensionValue {
  if (!candidate.cost.hasComponents) {
    return { kind: "excluded", reason: "UNKNOWN" };
  }
  return isValidNumber(candidate.cost.knownSubtotal)
    ? { kind: "value", value: candidate.cost.knownSubtotal }
    : { kind: "excluded", reason: "INVALID" };
}

export function compareRoutes(
  candidates: RouteComparisonCandidate[],
): RouteComparison {
  const viableCandidates = candidates.filter(
    (candidate) => candidate.eligibility === "VIAVEL",
  );

  return {
    viable: viableCandidates.map((c) => c.routeId),
    indeterminate: candidates
      .filter((c) => c.eligibility === "INDETERMINADA")
      .map((c) => c.routeId),
    inviable: candidates
      .filter((c) => c.eligibility === "INVIAVEL")
      .map((c) => c.routeId),
    costTotal: buildDimension(viableCandidates, costTotalValue),
    costKnownSubtotal: buildDimension(viableCandidates, costSubtotalValue),
    distance: buildDimension(viableCandidates, (c) =>
      trackedDimensionValue(c.distanceKm),
    ),
    duration: buildDimension(viableCandidates, (c) =>
      trackedDimensionValue(c.estimatedDurationHours),
    ),
  };
}
