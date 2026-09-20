/**
 * Contrato de rota do domínio OmegaSync.
 *
 * A mentoria ampliou o produto de "Cenário A vs Cenário C" para um motor de
 * elegibilidade e comparação de N rotas (PLANEJAMENTO.md §2). Este módulo
 * define o contrato de uma rota operacional; o catálogo de rotas (ETAPA 2),
 * o motor de elegibilidade (ETAPA 3) e o motor de custos (ETAPA 5) constroem
 * sobre ele.
 */

import type { CargoType } from "./cargo";
import type { CostComponent, CostComponentKind, CostSummary } from "./cost";
import { summarizeCosts } from "./cost";
import type { Availability, DtaRequirement, Facility } from "./customs";
import { isKnown } from "./information";
import type { TrackedValue } from "./information";
import type { Evidence, SourceReference } from "./provenance";

/**
 * Restrição de rota com proveniência (AJUSTE 1.4). Uma restrição afirma um
 * fato operacional/documental e, portanto, deve ser rastreável.
 */
export interface RouteRestriction {
  code: string;
  description: string;
  evidence?: Evidence;
}

/** Aceitação de um tipo de carga por uma rota (AJUSTE 1.1). */
export const CARGO_ACCEPTANCE = ["ACCEPTED", "REJECTED", "UNKNOWN"] as const;
export type CargoAcceptance = (typeof CARGO_ACCEPTANCE)[number];

/**
 * Tipo de movimento/operação da rota (AJUSTE 9.2/9.3). Permite aplicar efeitos
 * por rota (ex.: retirada final exige liberação; permanência/trânsito têm
 * regras próprias) em vez de um status global.
 */
export const ROUTE_MOVEMENTS = [
  "RETIRADA_DIRETA",
  "PERMANENCIA_ZONA_PRIMARIA",
  "TRANSITO_DTA_ZONA_SECUNDARIA",
  "OUTRO",
] as const;
export type RouteMovement = (typeof ROUTE_MOVEMENTS)[number];

/**
 * Estado de elegibilidade de uma rota. Contrato compartilhado; a avaliação
 * determinística pertence ao motor de elegibilidade (ETAPA 3).
 */
export const ROUTE_ELIGIBILITY_STATUSES = [
  "VIAVEL",
  "INVIAVEL",
  "INDETERMINADA",
] as const;
export type RouteEligibilityStatus = (typeof ROUTE_ELIGIBILITY_STATUSES)[number];

/**
 * Rota operacional entre dois recintos.
 *
 * Uma rota informa origem, destino, necessidade de DTA, tipos de carga
 * aceitos, disponibilidade, distância, prazo estimado, restrições e os
 * componentes de custo conhecidos — cada um com seu estado de informação.
 * Distância e prazo são rastreáveis e podem ser desconhecidos.
 */
export interface Route {
  id: string;
  label: string;
  /** Tipo de movimento/operação; default OUTRO quando ausente. */
  movement?: RouteMovement;
  origin: Facility;
  destination: Facility;
  requiresDta: DtaRequirement;
  /**
   * Tipos de carga aceitos pela rota, rastreável (AJUSTE 1.1). A ROTA é a
   * autoridade única sobre isso (o recinto não guarda mais essa informação).
   * `UNKNOWN` = não se sabe; `KNOWN []` = confirmado que nenhum é aceito;
   * `KNOWN [...]` = tipos confirmados. Nunca confundir desconhecido com falso.
   */
  acceptedCargoTypes: TrackedValue<CargoType[]>;
  availability: Availability;
  distanceKm: TrackedValue<number>;
  estimatedDurationHours: TrackedValue<number>;
  restrictions: RouteRestriction[];
  costComponents: CostComponent[];
  /**
   * Componentes de custo esperados para esta rota (AJUSTE 5.1). O custo só é
   * "completo" quando todos foram avaliados (KNOWN ou NOT_APPLICABLE).
   */
  requiredCostKinds?: CostComponentKind[];
  source?: SourceReference;
}

/**
 * Aceitação de um tipo de carga pela rota, preservando o estado de informação
 * (AJUSTE 1.1): desconhecido nunca vira "rejeitado".
 */
export function cargoTypeAcceptance(
  route: Route,
  cargoType: CargoType,
): CargoAcceptance {
  const accepted = route.acceptedCargoTypes;
  if (!isKnown(accepted)) {
    return "UNKNOWN";
  }
  return accepted.value.includes(cargoType) ? "ACCEPTED" : "REJECTED";
}

/**
 * Resume o custo conhecido de uma rota preservando `null != 0`.
 * Uma rota com qualquer componente desconhecido produz `total = null` e
 * `complete = false` (rota sem dado suficiente para custo total).
 */
export function assessRouteCost(route: Route): CostSummary {
  return summarizeCosts(route.costComponents);
}
