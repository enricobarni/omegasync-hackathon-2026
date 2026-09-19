/**
 * Comparador de rotas (ETAPA 6).
 *
 * Compara apenas informação comparável e nunca inventa um score. Para cada
 * dimensão (custo total, distância, prazo) o comparador só rankeia rotas com
 * valor conhecido e reporta explicitamente quais ficaram de fora — não
 * esconde custo incompleto (PLANEJAMENTO.md ETAPA 6, FONTES.md §8/§18).
 *
 * Só rotas VIÁVEIS entram no ranking. Rotas indeterminadas e inviáveis são
 * listadas à parte. O motor é puro e determinístico (importa só o domínio).
 */

import type {
  CostSummary,
  RouteEligibilityStatus,
  TrackedValue,
} from "../domain";
import { isKnown } from "../domain";

/** Candidata à comparação: elegibilidade + custo + dimensões da rota. */
export interface RouteComparisonCandidate {
  routeId: string;
  label: string;
  eligibility: RouteEligibilityStatus;
  cost: CostSummary;
  distanceKm: TrackedValue<number>;
  estimatedDurationHours: TrackedValue<number>;
}

export interface DimensionWinner {
  routeId: string;
  value: number;
}

/**
 * Resultado da comparação de uma dimensão entre as rotas viáveis.
 * `fullyComparable` é verdadeiro apenas quando toda rota viável tinha valor
 * conhecido nessa dimensão.
 */
export interface ComparableDimension {
  lowest: DimensionWinner | null;
  comparedRouteIds: string[];
  missingRouteIds: string[];
  fullyComparable: boolean;
}

export interface RouteComparison {
  viable: string[];
  indeterminate: string[];
  inviable: string[];
  cost: ComparableDimension;
  distance: ComparableDimension;
  duration: ComparableDimension;
}

function buildDimension(
  candidates: RouteComparisonCandidate[],
  getValue: (candidate: RouteComparisonCandidate) => number | null,
): ComparableDimension {
  const comparedRouteIds: string[] = [];
  const missingRouteIds: string[] = [];
  let lowest: DimensionWinner | null = null;

  for (const candidate of candidates) {
    const value = getValue(candidate);
    if (value === null) {
      missingRouteIds.push(candidate.routeId);
      continue;
    }
    comparedRouteIds.push(candidate.routeId);
    if (lowest === null || value < lowest.value) {
      lowest = { routeId: candidate.routeId, value };
    }
  }

  return {
    lowest,
    comparedRouteIds,
    missingRouteIds,
    fullyComparable: candidates.length > 0 && missingRouteIds.length === 0,
  };
}

/** Custo total só é comparável quando o resumo está completo. */
function costValue(candidate: RouteComparisonCandidate): number | null {
  return candidate.cost.complete ? candidate.cost.total : null;
}

function trackedValue(value: TrackedValue<number>): number | null {
  return isKnown(value) ? value.value : null;
}

/**
 * Compara um conjunto de rotas. Rankeia apenas as viáveis, por dimensões
 * comparáveis, sem produzir score arbitrário.
 */
export function compareRoutes(
  candidates: RouteComparisonCandidate[],
): RouteComparison {
  const viableCandidates = candidates.filter(
    (candidate) => candidate.eligibility === "VIAVEL",
  );

  return {
    viable: viableCandidates.map((candidate) => candidate.routeId),
    indeterminate: candidates
      .filter((candidate) => candidate.eligibility === "INDETERMINADA")
      .map((candidate) => candidate.routeId),
    inviable: candidates
      .filter((candidate) => candidate.eligibility === "INVIAVEL")
      .map((candidate) => candidate.routeId),
    cost: buildDimension(viableCandidates, costValue),
    distance: buildDimension(viableCandidates, (candidate) =>
      trackedValue(candidate.distanceKm),
    ),
    duration: buildDimension(viableCandidates, (candidate) =>
      trackedValue(candidate.estimatedDurationHours),
    ),
  };
}
