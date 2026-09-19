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
import type { CostComponent, CostSummary } from "./cost";
import { summarizeCosts } from "./cost";
import type { Availability, DtaRequirement, Facility } from "./customs";
import type { TrackedValue } from "./information";
import type { SourceReference } from "./provenance";

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
  origin: Facility;
  destination: Facility;
  requiresDta: DtaRequirement;
  /** Tipos de carga aceitos pela rota; lista vazia => nenhum confirmado. */
  acceptedCargoTypes: CargoType[];
  availability: Availability;
  distanceKm: TrackedValue<number>;
  estimatedDurationHours: TrackedValue<number>;
  restrictions: string[];
  costComponents: CostComponent[];
  source?: SourceReference;
}

/**
 * Indica se a rota aceita, de forma explícita, um tipo de carga.
 * Uma lista de tipos aceitos vazia significa "nenhum tipo confirmado" e
 * portanto retorna `false` — não se assume aceitação.
 */
export function acceptsCargoType(route: Route, cargoType: CargoType): boolean {
  return route.acceptedCargoTypes.includes(cargoType);
}

/**
 * Resume o custo conhecido de uma rota preservando `null != 0`.
 * Uma rota com qualquer componente desconhecido produz `total = null` e
 * `complete = false` (rota sem dado suficiente para custo total).
 */
export function assessRouteCost(route: Route): CostSummary {
  return summarizeCosts(route.costComponents);
}
