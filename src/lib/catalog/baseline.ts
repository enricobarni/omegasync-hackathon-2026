/**
 * Catálogo baseline do OmegaSync.
 *
 * Contém os recintos com fonte rastreável e uma rota-modelo que expressa o
 * padrão Zona Primária → DTA → Zona Secundária (FONTES.md §17, mentoria §30).
 *
 * Regra desta etapa (PLANEJAMENTO.md ETAPA 2): não inventar disponibilidade.
 * Todos os atributos operacionais não sustentados por fonte permanecem
 * desconhecidos: disponibilidade, distância, prazo, tipos de carga aceitos e
 * componentes de custo. A necessidade de DTA da rota-modelo é uma premissa
 * ancorada no conceito oficial de trânsito aduaneiro, e não um número.
 */

import type { Route } from "../domain";
import { availabilityUnknown, createEvidence, unknown } from "../domain";
import { createCatalog } from "./catalog";
import type { Catalog } from "./catalog";
import {
  DP_WORLD_SANTOS,
  OPERATIONAL_FACILITIES,
  RECINTO_ZS_GENERICO,
  SIMULATION_FACILITIES,
} from "./facilities";
import { SOURCE_DTA_MANUAL, SOURCE_MENTORIA_ZONAS } from "./sources";

/**
 * Rota-modelo: transferência de carga sob controle aduaneiro de um terminal
 * de Zona Primária para um recinto de Zona Secundária via DTA. Serve para
 * exercitar a comparação entre zonas; seus números virão de etapas futuras.
 */
export const ROTA_MODELO_PRIMARIA_SECUNDARIA: Route = {
  id: "dpworld-santos__recinto-zs-generico__dta",
  label: "DP World Santos → Recinto de Zona Secundária (via DTA)",
  movement: "TRANSITO_DTA_ZONA_SECUNDARIA",
  origin: DP_WORLD_SANTOS,
  destination: RECINTO_ZS_GENERICO,
  requiresDta: {
    status: "REQUIRED",
    evidence: createEvidence("PREMISSA_SIMULACAO", {
      reference:
        "Transferência Zona Primária → Zona Secundária sob controle aduaneiro usa trânsito aduaneiro (DTA) — FONTES.md §17",
      confidence: "B",
      source: SOURCE_DTA_MANUAL,
    }),
  },
  acceptedCargoTypes: unknown("Tipos de carga aceitos não coletados para esta rota"),
  availability: availabilityUnknown(
    "Disponibilidade do recinto de Zona Secundária não informada (sem fonte)",
  ),
  distanceKm: unknown("Distância não coletada para esta rota"),
  estimatedDurationHours: unknown("Prazo não coletado para esta rota"),
  restrictions: [],
  costComponents: [],
  source: SOURCE_MENTORIA_ZONAS,
};

/**
 * Rota-modelo de RETIRADA DIRETA na própria Zona Primária (sem transferência
 * entre recintos). Serve para contrastar, na demo, dois movimentos conceituais:
 * retirada direta (sem DTA, mas dependente de liberação) × transferência via
 * DTA para a Zona Secundária. É uma PREMISSA_SIMULACAO: a existência conceitual
 * do movimento é sustentada, mas nenhum número operacional é inventado —
 * disponibilidade, distância, prazo, tipos de carga e custos ficam desconhecidos.
 */
export const ROTA_RETIRADA_DIRETA: Route = {
  id: "dpworld-santos__retirada-direta",
  label: "DP World Santos → Retirada direta (Zona Primária)",
  movement: "RETIRADA_DIRETA",
  origin: DP_WORLD_SANTOS,
  destination: DP_WORLD_SANTOS,
  requiresDta: {
    status: "NOT_REQUIRED",
    evidence: createEvidence("PREMISSA_SIMULACAO", {
      reference:
        "Retirada direta no próprio terminal de Zona Primária não usa trânsito aduaneiro (DTA) — premissa conceitual da demo",
      confidence: "C",
      source: SOURCE_MENTORIA_ZONAS,
    }),
  },
  acceptedCargoTypes: unknown("Tipos de carga aceitos não coletados para esta rota"),
  availability: availabilityUnknown(
    "Disponibilidade da retirada direta não informada (sem fonte)",
  ),
  distanceKm: unknown("Distância não coletada para esta rota"),
  estimatedDurationHours: unknown("Prazo não coletado para esta rota"),
  restrictions: [],
  costComponents: [],
  source: SOURCE_MENTORIA_ZONAS,
};

/**
 * Catálogo OPERACIONAL: apenas recintos reais/verificados, sem rotas
 * fabricadas (AJUSTE 2.3). Não contém a rota-modelo sintética.
 */
export const OPERATIONAL_CATALOG: Catalog = createCatalog(
  OPERATIONAL_FACILITIES,
  [],
);

/**
 * Catálogo de DEMONSTRAÇÃO: acrescenta o recinto sintético de Zona Secundária
 * e a rota-modelo entre zonas, claramente marcados como simulação. É o
 * catálogo usado pela demo enquanto não há recintos/rotas reais de Zona
 * Secundária com fonte.
 */
export const DEMO_CATALOG: Catalog = createCatalog(
  [...OPERATIONAL_FACILITIES, ...SIMULATION_FACILITIES],
  [ROTA_RETIRADA_DIRETA, ROTA_MODELO_PRIMARIA_SECUNDARIA],
);
