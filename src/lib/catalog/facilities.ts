/**
 * Recintos do catálogo baseline.
 *
 * Só entram recintos com origem rastreável. Atributos operacionais que
 * FONTES.md não sustenta — disponibilidade, tipos de carga aceitos,
 * distâncias — permanecem desconhecidos (não são inventados aqui).
 *
 * Zona Primária: terminais de cais do Porto de Santos citados no baseline
 * tarifário (FONTES.md §4/§6). A classificação como Zona Primária/Terminal
 * é a natureza conhecida desses terminais de cais; a fonte tarifária que os
 * nomeia acompanha cada recinto.
 *
 * Zona Secundária: representada por um recinto genérico de premissa
 * (mentoria — FONTES.md §30), pois FONTES.md não nomeia um recinto de Zona
 * Secundária específico com fonte. Serve para expressar a rota-modelo
 * Zona Primária → DTA → Zona Secundária, e deve ser substituído por um
 * recinto real assim que houver fonte.
 */

import type { Facility } from "../domain";
import {
  SOURCE_BTP_SANTOS,
  SOURCE_DPWORLD_SANTOS,
  SOURCE_MENTORIA_ZONAS,
} from "./sources";

export const DP_WORLD_SANTOS: Facility = {
  id: "dpworld-santos",
  name: "DP World Santos",
  zone: "ZONA_PRIMARIA",
  type: "TERMINAL",
  source: SOURCE_DPWORLD_SANTOS,
};

export const BTP_SANTOS: Facility = {
  id: "btp-santos",
  name: "BTP — Brasil Terminal Portuário",
  zone: "ZONA_PRIMARIA",
  type: "TERMINAL",
  source: SOURCE_BTP_SANTOS,
};

/**
 * Recinto genérico de Zona Secundária (premissa da mentoria).
 * Não representa uma empresa/recinto real: é um marcador conceitual para a
 * rota-modelo entre zonas. Disponibilidade e tipos de carga aceitos
 * permanecem desconhecidos.
 */
export const RECINTO_ZS_GENERICO: Facility = {
  id: "recinto-zs-generico",
  name: "Recinto alfandegado de Zona Secundária (genérico)",
  zone: "ZONA_SECUNDARIA",
  type: "RECINTO_ALFANDEGADO",
  source: SOURCE_MENTORIA_ZONAS,
};

/**
 * Recintos operacionais/verificados (entidades reais com fonte). O placeholder
 * de simulação é mantido em coleção separada (AJUSTE 2.3) para não ser tratado
 * como candidato operacional real.
 */
export const OPERATIONAL_FACILITIES: readonly Facility[] = [
  DP_WORLD_SANTOS,
  BTP_SANTOS,
];

/** Recintos sintéticos de simulação/demonstração (não operacionais). */
export const SIMULATION_FACILITIES: readonly Facility[] = [RECINTO_ZS_GENERICO];
