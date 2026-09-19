/**
 * Conceitos aduaneiros do domínio OmegaSync: zonas, recintos, anuência,
 * disponibilidade e necessidade de DTA.
 *
 * Estes são contratos de domínio. A resolução determinística (motor de
 * elegibilidade, tratamento administrativo) e os datasets (catálogo de
 * recintos, tarifas) pertencem a etapas posteriores do PLANEJAMENTO.md.
 */

import type { TrackedValue } from "./information";
import type { Evidence, SourceReference } from "./provenance";

/** Zona aduaneira (FONTES.md §18). */
export const CUSTOMS_ZONES = ["ZONA_PRIMARIA", "ZONA_SECUNDARIA"] as const;
export type CustomsZone = (typeof CUSTOMS_ZONES)[number];

/**
 * Tipo de estrutura FÍSICA/operacional do recinto (FONTES.md §19). São
 * conceitos distintos: retroporto != porto seco != recinto alfandegado.
 *
 * Entreposto aduaneiro NÃO é um tipo físico — é um REGIME (ver CUSTOMS_REGIMES
 * e o módulo `customs/entreposto`). Removido daqui na rodada de correção
 * (AJUSTE 1.3/3.3/15.3).
 */
export const FACILITY_TYPES = [
  "TERMINAL",
  "RECINTO_ALFANDEGADO",
  "PORTO_SECO",
  "RETROPORTO",
] as const;
export type FacilityType = (typeof FACILITY_TYPES)[number];

/**
 * Regimes aduaneiros aplicáveis a um recinto real (não são tipos físicos).
 * O entreposto aduaneiro é um regime cuja habilitação depende de validação em
 * fonte oficial (FONTES.md §19); ver `customs/entreposto`.
 */
export const CUSTOMS_REGIMES = ["ENTREPOSTO_ADUANEIRO"] as const;
export type CustomsRegime = (typeof CUSTOMS_REGIMES)[number];

/** Estado de anuência (motor anterior; FONTES.md §13.2). */
export const ANUENCIA_STATES = [
  "SEM_ANUENCIA",
  "AUTOMATICA",
  "NAO_AUTOMATICA_POSTERIOR",
  "PREVIA_AO_EMBARQUE",
  "IMPEDIMENTO",
] as const;
export type AnuenciaState = (typeof ANUENCIA_STATES)[number];

/** Órgãos anuentes modelados (FONTES.md §13.3). */
export const ANUENTE_ORGANS = [
  "ANVISA",
  "MAPA_VIGIAGRO",
  "INMETRO",
  "IBAMA",
  "ANP",
  "DECEX",
  "OUTRO",
] as const;
export type AnuenteOrgan = (typeof ANUENTE_ORGANS)[number];

/**
 * Anuência resolvida. Contrato de domínio; a resolução (NCM -> órgão) NÃO é
 * inventada aqui (FONTES.md §13.5/§13.6) e cabe a etapa futura com fonte
 * oficial (Portal Único/Siscomex).
 */
export interface ResolvedAnuencia {
  state: AnuenciaState;
  organs: AnuenteOrgan[];
  evidence: Evidence;
}

/**
 * Disponibilidade de uma rota/recinto.
 * Nunca inventar disponibilidade (PLANEJAMENTO.md ETAPA 2): o estado padrão
 * honesto é UNKNOWN. AVAILABLE/UNAVAILABLE exigem evidência.
 */
export type Availability =
  | { status: "AVAILABLE"; evidence: Evidence }
  | { status: "UNAVAILABLE"; evidence: Evidence; reason?: string }
  | { status: "UNKNOWN"; reason?: string };

/** Disponibilidade desconhecida — estado padrão quando não há fonte. */
export function availabilityUnknown(reason?: string): Availability {
  return { status: "UNKNOWN", reason };
}

/**
 * Necessidade de DTA para percorrer uma rota (FONTES.md §17).
 * A DTA é um instrumento do trânsito aduaneiro, não um operador nem um
 * recinto. Custo e tempo de DTA são modelados como valores rastreáveis
 * (componentes de custo / durações), separados desta necessidade.
 */
export type DtaRequirement =
  | { status: "REQUIRED"; evidence: Evidence }
  | { status: "NOT_REQUIRED"; evidence: Evidence }
  | { status: "UNKNOWN"; reason?: string };

/** Necessidade de DTA desconhecida — estado padrão quando não há fonte. */
export function dtaRequirementUnknown(reason?: string): DtaRequirement {
  return { status: "UNKNOWN", reason };
}

/**
 * Recinto/estrutura como nó de uma rota. Identidade e classificação física.
 *
 * Os tipos de carga aceitos são atributo da ROTA (autoridade única, ver
 * AJUSTE 1.1), não do recinto. Regimes habilitados (ex.: entreposto) são
 * rastreáveis e dependem de validação (AJUSTE 15.3).
 */
export interface Facility {
  id: string;
  name: string;
  zone: CustomsZone;
  type: FacilityType;
  /** Fonte que comprova a existência/identidade do recinto. */
  source?: SourceReference;
  /**
   * Fonte que comprova a CLASSIFICAÇÃO (zona/tipo), quando distinta da fonte de
   * existência (AJUSTE 2.5). Pode ser omitida quando ainda não verificada.
   */
  classificationSource?: SourceReference;
  /** Regimes aduaneiros para os quais o recinto está habilitado (rastreável). */
  enabledRegimes?: TrackedValue<CustomsRegime[]>;
}
